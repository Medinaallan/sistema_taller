import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import quotationsService, { type QuotationData } from '../../servicios/quotationsService';
import { appointmentsService, servicesService } from '../../servicios/apiService';
import { obtenerClientes } from '../../servicios/clientesApiService';

const QuotationsPage = () => {
  const [data, setData] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Funciones de mapeo
  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.name : clienteId?.substring(0, 12) + '...';
  };

  const getServiceName = (servicioId: string) => {
    const servicio = servicios.find(s => s.id === servicioId);
    return servicio ? servicio.name || servicio.nombre : servicioId;
  };

  const getAppointmentName = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    return appointment ? `Cita ${appointment.date} ${appointment.time}` : appointmentId?.substring(0, 12) + '...';
  };

  // Función para cargar clientes
  const loadClientes = async () => {
    try {
      const clientesData = await obtenerClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
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
      await Promise.all([
        loadQuotations(),
        loadClientes(),
        loadServicios(),
        loadAppointments()
      ]);
    };
    
    loadAllData();
  }, []);

  const handleEdit = (item: QuotationData) => {
    // TODO: Implementar modal de edición
    alert('Editar cotización: ' + item.id);
  };
  
  const handleDelete = async (item: QuotationData) => {
    if (!confirm(`¿Está seguro de eliminar la cotización ${item.id}?`)) {
      return;
    }
    
    try {
      await quotationsService.deleteQuotation(item.id!);
      await loadQuotations(); // Recargar datos
    } catch (err) {
      alert('Error eliminando cotización: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleApprove = async (item: QuotationData) => {
    if (!confirm(`¿Está seguro de aprobar la cotización ${item.id?.substring(0, 12)}? Esto creará automáticamente una orden de trabajo.`)) {
      return;
    }
    
    try {
      // Paso 1: Aprobar la cotización
      await quotationsService.approveQuotation(item.id!);
      
      // Paso 2: Crear orden de trabajo automáticamente
      const { workOrdersService } = await import('../../servicios/workOrdersService');
      const workOrder = await workOrdersService.createWorkOrderFromQuotation(item);
      
      alert(`Cotización aprobada exitosamente y orden de trabajo #${workOrder.id?.substring(0, 12)} creada automáticamente.`);
      await loadQuotations(); // Recargar datos
    } catch (err) {
      alert('Error en el proceso de aprobación: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleReject = async (item: QuotationData) => {
    if (!confirm(`¿Está seguro de rechazar la cotización ${item.id?.substring(0, 12)}?`)) {
      return;
    }
    
    try {
      await quotationsService.rejectQuotation(item.id!);
      alert('Cotización rechazada exitosamente');
      await loadQuotations(); // Recargar datos
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
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Cita</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Servicio</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3">Precio</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  No hay cotizaciones disponibles
                </td>
              </tr>
            ) : (
              data.map((quotation) => (
                <tr key={quotation.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">
                    COT-{quotation.id?.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    {getAppointmentName(quotation.appointmentId || '')}
                  </td>
                  <td className="px-6 py-4">
                    {getClienteName(quotation.clienteId || '')}
                  </td>
                  <td className="px-6 py-4">
                    {getServiceName(quotation.servicioId || '')}
                  </td>
                  <td className="px-6 py-4">
                    {quotation.descripcion?.length > 30 
                      ? `${quotation.descripcion.substring(0, 30)}...` 
                      : quotation.descripcion}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    L{quotation.precio.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      quotation.estado === 'draft' ? 'bg-gray-100 text-gray-800' :
                      quotation.estado === 'sent' ? 'bg-blue-100 text-blue-800' :
                      quotation.estado === 'approved' ? 'bg-green-100 text-green-800' :
                      quotation.estado === 'rejected' ? 'bg-red-100 text-red-800' :
                      quotation.estado === 'completed' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quotationsService.formatStatus(quotation.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(quotation.fechaCreacion || '').toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {/* Botones según el estado de la cotización */}
                      {quotation.estado === 'sent' && (
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
                      
                      {quotation.estado === 'approved' && (
                        <span className="text-green-600 text-sm font-medium px-2 py-1">
                          ✅ Aprobada
                        </span>
                      )}
                      
                      {quotation.estado === 'rejected' && (
                        <span className="text-red-600 text-sm font-medium px-2 py-1">
                          ❌ Rechazada
                        </span>
                      )}
                      
                      {quotation.estado === 'completed' && (
                        <span className="text-purple-600 text-sm font-medium px-2 py-1">
                          🏁 Completada
                        </span>
                      )}
                      
                      {quotation.estado === 'draft' && (
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
