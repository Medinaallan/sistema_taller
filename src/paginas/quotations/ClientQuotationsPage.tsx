import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import quotationsService, { type QuotationData } from '../../servicios/quotationsService';
import { appointmentsService, servicesService } from '../../servicios/apiService';

const ClientQuotationsPage = () => {
  const { state } = useApp();
  const user = state.user;
  const [data, setData] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicios, setServicios] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Funciones de mapeo
  const getServiceName = (servicioId: string) => {
    const servicio = servicios.find(s => s.id === servicioId);
    return servicio ? servicio.name || servicio.nombre : servicioId;
  };

  const getAppointmentInfo = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    return appointment ? `Cita ${appointment.date} ${appointment.time}` : `Cita #${appointmentId?.substring(0, 8)}`;
  };

  // Función para cargar servicios
  const loadServicios = async () => {
    try {
      const response = await servicesService.getAll();
      if (response.success) {
        const mappedServices = response.data.map((csvService: any) => ({
          id: csvService.id,
          name: csvService.nombre,
          nombre: csvService.nombre,
        }));
        setServicios(mappedServices);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  // Función para cargar citas
  const loadAppointments = async () => {
    try {
      const response = await appointmentsService.getAll();
      if (response.success) {
        const appointmentsData = response.data.map((csvAppointment: any) => ({
          id: csvAppointment.id,
          date: new Date(csvAppointment.fecha).toLocaleDateString('es-ES'),
          time: csvAppointment.hora,
        }));
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  };

  const loadClientQuotations = async () => {
    try {
      if (!user?.id) return;
      
      setLoading(true);
      const quotations = await quotationsService.getQuotationsByClient(user.id);
      setData(quotations);
    } catch (err) {
      console.error('Error cargando cotizaciones del cliente:', err);
      alert('Error cargando cotizaciones: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadClientQuotations(),
        loadServicios(),
        loadAppointments()
      ]);
    };
    
    loadAllData();
  }, [user?.id]);

  const handleApprove = async (quotation: QuotationData) => {
    if (!confirm(`¿Desea aprobar la cotización por L${quotation.precio.toFixed(2)}?`)) {
      return;
    }
    
    try {
      await quotationsService.approveQuotation(quotation.id!);
      await loadClientQuotations(); // Recargar datos
      alert('Cotización aprobada exitosamente. Se convertirá en orden de trabajo.');
    } catch (err) {
      alert('Error aprobando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleReject = async (quotation: QuotationData) => {
    if (!confirm('¿Está seguro de rechazar esta cotización?')) {
      return;
    }
    
    try {
      await quotationsService.rejectQuotation(quotation.id!);
      await loadClientQuotations(); // Recargar datos
      alert('Cotización rechazada.');
    } catch (err) {
      alert('Error rechazando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
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
          <div className="space-y-4">
            {data.map((quotation) => (
              <div key={quotation.id} className="border rounded-lg p-6 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cotización #{quotation.id?.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getAppointmentInfo(quotation.appointmentId || '')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Servicio: {getServiceName(quotation.servicioId || '')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      L{quotation.precio.toFixed(2)}
                    </div>
                    <div className={`inline-block px-3 py-1 text-sm rounded-full mt-2 ${
                      quotation.estado === 'draft' ? 'bg-gray-100 text-gray-800' :
                      quotation.estado === 'sent' ? 'bg-blue-100 text-blue-800' :
                      quotation.estado === 'approved' ? 'bg-green-100 text-green-800' :
                      quotation.estado === 'rejected' ? 'bg-red-100 text-red-800' :
                      quotation.estado === 'completed' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quotationsService.formatStatus(quotation.estado)}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Descripción del trabajo:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">
                    {quotation.descripcion}
                  </p>
                </div>

                {quotation.notas && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Notas adicionales:</h4>
                    <p className="text-gray-600 text-sm">
                      {quotation.notas}
                    </p>
                  </div>
                )}

                <div className="text-sm text-gray-500 mb-4">
                  <p>Fecha de creación: {new Date(quotation.fechaCreacion || '').toLocaleDateString('es-ES')}</p>
                  {quotation.fechaActualizacion !== quotation.fechaCreacion && (
                    <p>Última actualización: {new Date(quotation.fechaActualizacion || '').toLocaleDateString('es-ES')}</p>
                  )}
                </div>

                {/* Acciones según el estado */}
                <div className="flex space-x-3 pt-4 border-t">
                  {quotation.estado === 'sent' && (
                    <>
                      <Button 
                        onClick={() => handleApprove(quotation)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        ✅ Aprobar Cotización
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => handleReject(quotation)}
                      >
                        ❌ Rechazar
                      </Button>
                    </>
                  )}
                  
                  {quotation.estado === 'draft' && (
                    <div className="text-sm text-gray-500 italic">
                      En revisión por el taller
                    </div>
                  )}
                  
                  {quotation.estado === 'approved' && (
                    <div className="text-sm text-green-600 font-medium">
                      ✅ Cotización aprobada - Se convertirá en orden de trabajo
                    </div>
                  )}
                  
                  {quotation.estado === 'rejected' && (
                    <div className="text-sm text-red-600">
                      ❌ Cotización rechazada
                    </div>
                  )}
                  
                  {quotation.estado === 'completed' && (
                    <div className="text-sm text-purple-600 font-medium">
                      🏁 Trabajo completado
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClientQuotationsPage;