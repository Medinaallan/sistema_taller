import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import quotationsService, { type QuotationData } from '../../servicios/quotationsService';
import { appointmentsService, servicesService } from '../../servicios/apiService';
import { obtenerClientes } from '../../servicios/clientesApiService';

const QuotationsPage = () => {
  const [data, setData] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);
  // Eliminados: clientes, servicios y appointments (no se usan con el nuevo SP)

  // Los datos ya vienen mapeados desde el SP, no se requieren funciones de mapeo legacy

  // Eliminadas funciones de carga de clientes, servicios y citas

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const quotations = await quotationsService.getAllQuotations();
      setData(quotations);
    } catch (err) {
      console.error('Error cargando cotizaciones:', err);
      alert('Error cargando cotizaciones: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await loadQuotations();
    };
    loadAllData();
  }, []);

  const handleEdit = (item: QuotationData) => {
    alert('Editar cotización: ' + item.numero_cotizacion);
  };

  const handleDelete = async (item: QuotationData) => {
    if (!confirm(`¿Está seguro de eliminar la cotización ${item.numero_cotizacion}?`)) {
      return;
    }
    try {
      await quotationsService.deleteQuotation(item.cotizacion_id.toString());
      await loadQuotations();
    } catch (err) {
      alert('Error eliminando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleApprove = async (item: QuotationData) => {
    if (!confirm(`¿Está seguro de aprobar la cotización ${item.numero_cotizacion}? Esto creará automáticamente una orden de trabajo.`)) {
      return;
    }
    try {
      await quotationsService.approveQuotation(item.cotizacion_id.toString());
      const { workOrdersService } = await import('../../servicios/workOrdersService');
      const workOrder = await workOrdersService.createWorkOrderFromQuotation(item);
      alert(`Cotización aprobada exitosamente y orden de trabajo #${workOrder.id?.substring(0, 12)} creada automáticamente.`);
      await loadQuotations();
    } catch (err) {
      alert('Error en el proceso de aprobación: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleReject = async (item: QuotationData) => {
    if (!confirm(`¿Está seguro de rechazar la cotización ${item.numero_cotizacion}?`)) {
      return;
    }
    try {
      await quotationsService.rejectQuotation(item.cotizacion_id.toString());
      alert('Cotización rechazada exitosamente');
      await loadQuotations();
    } catch (err) {
      alert('Error rechazando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <Card title="Cotizaciones">
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Cargando cotizaciones...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Cotizaciones" actions={<Button onClick={() => alert('Nueva cotización')}>Nueva Cotización</Button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3"># Cotización</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Placa</th>
              <th className="px-6 py-3">Cita</th>
              <th className="px-6 py-3">OT</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Creación</th>
              <th className="px-6 py-3">Vencimiento</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                  No hay cotizaciones disponibles
                </td>
              </tr>
            ) : (
              data.map((quotation) => (
                <tr key={quotation.cotizacion_id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">
                    {quotation.numero_cotizacion}
                  </td>
                  <td className="px-6 py-4">
                    {quotation.nombre_cliente}
                  </td>
                  <td className="px-6 py-4">
                    {quotation.placa_vehiculo}
                  </td>
                  <td className="px-6 py-4">
                    {quotation.numero_cita}
                  </td>
                  <td className="px-6 py-4">
                    {quotation.numero_ot || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      quotation.estado_cotizacion === 'draft' ? 'bg-gray-100 text-gray-800' :
                      quotation.estado_cotizacion === 'sent' ? 'bg-blue-100 text-blue-800' :
                      quotation.estado_cotizacion === 'approved' ? 'bg-green-100 text-green-800' :
                      quotation.estado_cotizacion === 'rejected' ? 'bg-red-100 text-red-800' :
                      quotation.estado_cotizacion === 'completed' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quotationsService.formatStatus(quotation.estado_cotizacion)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    L{quotation.total?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(quotation.fecha_creacion).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4">
                    {quotation.fecha_vencimiento ? new Date(quotation.fecha_vencimiento).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {/* Botones según el estado de la cotización */}
                      {quotation.estado_cotizacion === 'sent' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(quotation)}
                          >
                            ✅ Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleReject(quotation)}
                          >
                            ❌ Rechazar
                          </Button>
                        </>
                      )}
                      {quotation.estado_cotizacion === 'approved' && (
                        <span className="text-green-600 text-sm font-medium px-2 py-1">
                          ✅ Aprobada
                        </span>
                      )}
                      {quotation.estado_cotizacion === 'rejected' && (
                        <span className="text-red-600 text-sm font-medium px-2 py-1">
                          ❌ Rechazada
                        </span>
                      )}
                      {quotation.estado_cotizacion === 'completed' && (
                        <span className="text-purple-600 text-sm font-medium px-2 py-1">
                          🏁 Completada
                        </span>
                      )}
                      {quotation.estado_cotizacion === 'draft' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleApprove(quotation)}
                          >
                            ✅ Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleReject(quotation)}
                          >
                            ❌ Rechazar
                          </Button>
                        </>
                      )}
                      {/* Botones universales */}
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleEdit(quotation)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleDelete(quotation)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default QuotationsPage;
