import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { showError, showSuccess, showConfirm } from '../../utilidades/sweetAlertHelpers';
import quotationsService, { type QuotationData } from '../../servicios/quotationsService';
import ViewQuotationModal from '../../componentes/quotations/ViewQuotationModal';

const ClientQuotationsPage = () => {
  const { state } = useApp();
  const user = state.user;
  const [data, setData] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

  const loadClientQuotations = async () => {
    try {
      if (!user?.id) return;
      
      setLoading(true);
      const quotations = await quotationsService.getQuotationsByClient(user.id);
      setData(quotations);
    } catch (err) {
      console.error('Error cargando cotizaciones del cliente:', err);
      showError('Error cargando cotizaciones: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientQuotations();
  }, [user?.id]);

  const handleApprove = async (quotation: QuotationData) => {
    if (!await showConfirm(`¿Desea aprobar la cotización por L${quotation.total?.toFixed(2)}?`)) {
      return;
    }
    
    try {
      await quotationsService.approveQuotation(quotation.cotizacion_id.toString());
      await loadClientQuotations(); // Recargar datos
      showSuccess('Cotización aprobada exitosamente. Se convertirá en orden de trabajo.');
    } catch (err) {
      showError('Error aprobando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleReject = async (quotation: QuotationData) => {
    if (!await showConfirm('¿Está seguro de rechazar esta cotización?')) {
      return;
    }
    
    try {
      await quotationsService.rejectQuotation(quotation.cotizacion_id.toString());
      await loadClientQuotations(); // Recargar datos
      showSuccess('Cotización rechazada.');
    } catch (err) {
      showError('Error rechazando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <Card title="Mis Cotizaciones">
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Cargando cotizaciones...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Mis Cotizaciones">
        {data.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500 mb-4">No tienes cotizaciones disponibles</div>
            <p className="text-sm text-gray-400">
              Las cotizaciones aparecerán aquí después de que el taller revise tus citas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3"># Cotización</th>
                  <th className="px-6 py-3">Vehículo</th>
                  <th className="px-6 py-3">Cita</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Fecha Creación</th>
                  <th className="px-6 py-3">Vencimiento</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((quotation) => (
                  <tr key={quotation.cotizacion_id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">
                      {quotation.numero_cotizacion}
                    </td>
                    <td className="px-6 py-4">
                      {quotation.placa_vehiculo}
                    </td>
                    <td className="px-6 py-4">
                      {quotation.numero_cita}
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
                        {/* Botón Ver Detalles - Siempre disponible */}
                        <Button 
                          size="sm" 
                          className="bg-gray-600 hover:bg-gray-700 text-white"
                          onClick={() => {
                            setSelectedQuotationId(quotation.cotizacion_id.toString());
                            setShowViewModal(true);
                          }}
                        >
                          👁️ Ver
                        </Button>
                        
                        {/* Botones según estado: Pendiente o Enviada */}
                        {(quotation.estado_cotizacion === 'Pendiente' || quotation.estado_cotizacion === 'Enviada') && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprove(quotation)}
                            >
                               Aprobar
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
                        
                        {/* Estados terminales - Solo indicadores */}
                        {quotation.estado_cotizacion === 'Aprobada' && (
                          <span className="text-green-600 text-sm font-medium px-3 py-1 bg-green-50 rounded">
                             Aprobada{quotation.numero_ot ? ` - OT: ${quotation.numero_ot}` : ''}
                          </span>
                        )}
                        
                        {quotation.estado_cotizacion === 'Rechazada' && (
                          <span className="text-red-600 text-sm font-medium px-3 py-1 bg-red-50 rounded">
                            ❌ Rechazada
                          </span>
                        )}
                        
                        {quotation.estado_cotizacion === 'Completada' && (
                          <span className="text-purple-600 text-sm font-medium px-3 py-1 bg-purple-50 rounded">
                            🏁 Completada
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal para ver detalles de cotización */}
      <ViewQuotationModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedQuotationId(null);
        }}
        quotationId={selectedQuotationId}
      />
    </div>
  );
};

export default ClientQuotationsPage;