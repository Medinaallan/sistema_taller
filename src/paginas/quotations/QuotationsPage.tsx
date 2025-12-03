import { useState, useEffect } from 'react';
import { Card, Button, Select } from '../../componentes/comunes/UI';
import quotationsService, { type QuotationData } from '../../servicios/quotationsService';
import { appointmentsService } from '../../servicios/apiService';
import CreateQuotationModal from '../../componentes/quotations/CreateQuotationModal';
import ViewQuotationModal from '../../componentes/quotations/ViewQuotationModal';
import type { Appointment } from '../../tipos';

const QuotationsPage = () => {
  const [data, setData] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

  // Los datos ya vienen mapeados desde el SP, no se requieren funciones de mapeo legacy

  // Cargar cotizaciones
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

  // Cargar citas disponibles
  const loadAppointments = async () => {
    try {
      const response = await appointmentsService.getAll();
      if (response.success && Array.isArray(response.data)) {
        setAppointments(response.data);
      }
    } catch (err) {
      console.error('Error cargando citas:', err);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await loadQuotations();
      await loadAppointments();
    };
    loadAllData();
  }, []);

  const handleEdit = (item: QuotationData) => {
    alert('Editar cotización: ' + item.numero_cotizacion);
  };

  const handleView = (item: QuotationData) => {
    setSelectedQuotationId(item.cotizacion_id.toString());
    setShowViewModal(true);
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
      await loadQuotations();
      const { workOrdersService } = await import('../../servicios/workOrdersService');
      const workOrder = await workOrdersService.createWorkOrderFromQuotation(item);
      alert(`Cotización aprobada exitosamente y orden de trabajo #${workOrder.id?.substring(0, 12)} creada automáticamente.`);
    } catch (err) {
      alert('Error en el proceso de aprobación: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      // Recargar para deshacer cambios en la UI si es necesario
      await loadQuotations();
    }
  };

  const handleReject = async (item: QuotationData) => {
    if (!confirm(`¿Está seguro de rechazar la cotización ${item.numero_cotizacion}?`)) {
      return;
    }
    try {
      await quotationsService.rejectQuotation(item.cotizacion_id.toString());
      await loadQuotations();
      alert('Cotización rechazada exitosamente');
    } catch (err) {
      alert('Error rechazando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      // Recargar para deshacer cambios en la UI si es necesario
      await loadQuotations();
    }
  };

  const handleMarkAsSent = async (item: QuotationData) => {
    try {
      // Actualizar estado localmente para mostrar botones Aprobar/Rechazar
      setData(prevData => 
        prevData.map(q => 
          q.cotizacion_id === item.cotizacion_id 
            ? { ...q, estado_cotizacion: 'Enviada' }
            : q
        )
      );
      alert('Cotización marcada como enviada. Ahora puede ser aprobada o rechazada.');
    } catch (err) {
      alert('Error marcando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
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

  const handleOpenCreateModal = () => {
    if (appointments.length === 0) {
      alert('No hay citas disponibles. Cree una cita primero.');
      return;
    }
    setShowCreateModal(true);
  };

  const selectedAppointment = selectedAppointmentId 
    ? appointments.find(a => a.id === selectedAppointmentId) 
    : null;

  return (
    <>
      <Card 
        title="Cotizaciones" 
        actions={
          <div className="flex gap-2">
            <Select
              value={selectedAppointmentId}
              onChange={(e) => setSelectedAppointmentId(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar cita...' },
                ...appointments.map((apt) => ({
                  value: apt.id,
                  label: `Cita #${String(apt.id).substring(0, 8)}`
                }))
              ]}
              style={{ minWidth: '250px' }}
            />
            <Button 
              onClick={handleOpenCreateModal}
              disabled={!selectedAppointmentId}
            >
              Nueva Cotización
            </Button>
          </div>
        }
      >
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
                      quotation.estado_cotizacion === 'Pendiente' ? 'bg-gray-100 text-gray-800' :
                      quotation.estado_cotizacion === 'Enviada' ? 'bg-blue-100 text-blue-800' :
                      quotation.estado_cotizacion === 'Aprobada' ? 'bg-green-100 text-green-800' :
                      quotation.estado_cotizacion === 'Rechazada' ? 'bg-red-100 text-red-800' :
                      quotation.estado_cotizacion === 'Completada' ? 'bg-purple-100 text-purple-800' :
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
                      {/* Botón universal Ver */}
                      <Button 
                        size="sm" 
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                        onClick={() => handleView(quotation)}
                      >
                         Ver
                      </Button>
                      
                      {/* Botones según estado: Pendiente */}
                      {quotation.estado_cotizacion === 'Pendiente' && (
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
                             Rechazar
                          </Button>
                        </>
                      )}
                      
                      {/* Botones según estado: Enviada */}
                      {quotation.estado_cotizacion === 'Enviada' && (
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
                             Rechazar
                          </Button>
                        </>
                      )}
                      
                      {/* Estados terminales - Solo botones de lectura */}
                      {quotation.estado_cotizacion === 'Aprobada' && (
                        <span className="text-green-600 text-sm font-medium px-2 py-1 bg-green-50 rounded">
                           Aprobada
                        </span>
                      )}
                      {quotation.estado_cotizacion === 'Rechazada' && (
                        <span className="text-red-600 text-sm font-medium px-2 py-1 bg-red-50 rounded">
                           Rechazada
                        </span>
                      )}
                      {quotation.estado_cotizacion === 'Completada' && (
                        <span className="text-purple-600 text-sm font-medium px-2 py-1 bg-purple-50 rounded">
                           Completada
                        </span>
                      )}
                      
                      {/* Botón universal Eliminar */}
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
      {/* Modal para crear cotización */}
      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedAppointmentId('');
        }}
        appointment={selectedAppointment || null}
        onSuccess={() => {
          loadQuotations();
          setShowCreateModal(false);
          setSelectedAppointmentId('');
        }}
      />
      
      {/* Modal para ver detalles de cotización */}
      <ViewQuotationModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedQuotationId(null);
        }}
        quotationId={selectedQuotationId}
      />
    </>
  );
};

export default QuotationsPage;
