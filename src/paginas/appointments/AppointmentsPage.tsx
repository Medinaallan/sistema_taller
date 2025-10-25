import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import NewAppointmentModal from '../../componentes/appointments/NewAppointmentModal';
import EditAppointmentModal from '../../componentes/appointments/EditAppointmentModal';
import CreateQuotationModal from '../../componentes/quotations/CreateQuotationModal';
import { appointmentsService, servicesService } from '../../servicios/apiService';
import { obtenerClientes } from '../../servicios/clientesApiService';
import type { Appointment } from '../../tipos';

const AppointmentsPage = () => {
  const [data, setData] = useState<Appointment[]>([]);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isEditAppointmentModalOpen, setIsEditAppointmentModalOpen] = useState(false);
  const [isCreateQuotationModalOpen, setIsCreateQuotationModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);

  // Función para buscar el nombre del cliente por ID
  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.name : clienteId;
  };

  // Función para buscar el nombre del servicio por ID
  const getServiceName = (servicioId: string) => {
    const servicio = servicios.find(s => s.id === servicioId);
    return servicio ? servicio.name || servicio.nombre : servicioId;
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

  // Función para cargar citas desde el backend
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsService.getAll();
      
      if (response.success) {
        // Convertir los datos del CSV al formato esperado por el frontend
        const appointmentsData = response.data.map((csvAppointment: any) => ({
          id: csvAppointment.id,
          date: new Date(csvAppointment.fecha),
          time: csvAppointment.hora,
          clientId: csvAppointment.clienteId,
          vehicleId: csvAppointment.vehiculoId,
          serviceTypeId: csvAppointment.servicio,
          status: csvAppointment.estado,
          notes: (csvAppointment.notas || '').replace(/^"|"$/g, ''), // Remover comillas extras
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        
        setData(appointmentsData);
      } else {
        setError('Error al cargar las citas');
        console.error('Error cargando citas:', response.message);
      }
    } catch (error) {
      setError('Error al conectar con el servidor');
      console.error('Error cargando citas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadAppointments(),
        loadClientes(),
        loadServicios()
      ]);
    };
    
    loadAllData();
  }, []);

  const handleEdit = (item: Appointment) => {
    setSelectedAppointment(item);
    setIsEditAppointmentModalOpen(true);
  };

  const handleCreateQuotation = (item: Appointment) => {
    setSelectedAppointment(item);
    setIsCreateQuotationModalOpen(true);
  };

  const handleQuotationSuccess = async () => {
    // Marcar la cita como completada después de crear cotización
    if (selectedAppointment) {
      try {
        await appointmentsService.update(selectedAppointment.id, {
          clienteId: selectedAppointment.clientId,
          vehiculoId: selectedAppointment.vehicleId,
          fecha: selectedAppointment.date.toISOString().split('T')[0],
          hora: selectedAppointment.time,
          servicio: selectedAppointment.serviceTypeId,
          estado: 'completed',
          notas: selectedAppointment.notes || ''
        });
      } catch (error) {
        console.error('Error actualizando estado de cita:', error);
      }
    }
    
    // Recargar citas después de crear cotización
    loadAppointments();
  };

  const handleApproveAppointment = async (appointment: Appointment) => {
    if (!confirm('¿Está seguro de aprobar esta cita?')) {
      return;
    }
    
    try {
      const response = await appointmentsService.update(appointment.id, {
        clienteId: appointment.clientId,
        vehiculoId: appointment.vehicleId,
        fecha: appointment.date.toISOString().split('T')[0],
        hora: appointment.time,
        servicio: appointment.serviceTypeId,
        estado: 'confirmed',
        notas: appointment.notes || ''
      });
      
      if (response.success) {
        alert('Cita aprobada exitosamente');
        loadAppointments(); // Recargar datos
      } else {
        alert('Error aprobando cita: ' + response.message);
      }
    } catch (error) {
      console.error('Error aprobando cita:', error);
      alert('Error aprobando cita');
    }
  };

  const handleRejectAppointment = async (appointment: Appointment) => {
    if (!confirm('¿Está seguro de rechazar esta cita?')) {
      return;
    }
    
    try {
      const response = await appointmentsService.update(appointment.id, {
        clienteId: appointment.clientId,
        vehiculoId: appointment.vehicleId,
        fecha: appointment.date.toISOString().split('T')[0],
        hora: appointment.time,
        servicio: appointment.serviceTypeId,
        estado: 'cancelled',
        notas: appointment.notes || ''
      });
      
      if (response.success) {
        alert('Cita rechazada exitosamente');
        loadAppointments(); // Recargar datos
      } else {
        alert('Error rechazando cita: ' + response.message);
      }
    } catch (error) {
      console.error('Error rechazando cita:', error);
      alert('Error rechazando cita');
    }
  };
  
  const handleDelete = async (item: Appointment) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la cita ${item.id}?`)) {
      try {
        const response = await appointmentsService.delete(item.id);
        if (response.success) {
          // Recargar la lista después de eliminar
          await loadAppointments();
        } else {
          alert('Error al eliminar la cita: ' + response.message);
        }
      } catch (error) {
        console.error('Error eliminando cita:', error);
        alert('Error al eliminar la cita');
      }
    }
  };

  const handleCreateAppointment = async (_newAppointment: Omit<Appointment, 'id'>) => {
    // La cita ya se creó en el backend desde el modal
    // Solo necesitamos recargar la lista para mostrar la nueva cita
    await loadAppointments();
  };

  const handleEditAppointment = async () => {
    // La cita ya se actualizó en el backend desde el modal
    // Solo necesitamos recargar la lista para mostrar los cambios
    await loadAppointments();
  };

  const handleCloseEditModal = () => {
    setIsEditAppointmentModalOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <>
      <Card 
        title="Citas" 
        actions={
          <Button onClick={() => setIsNewAppointmentModalOpen(true)}>
            Nueva Cita
          </Button>
        }
      >
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-600">Cargando citas...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={loadAppointments}
              className="ml-2 underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}
        
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Hora</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Vehículo</th>
                  <th className="px-6 py-3">Servicio</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No hay citas disponibles
                    </td>
                  </tr>
                ) : (
                  data.map((appointment) => (
                    <tr key={appointment.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {appointment.date.toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">{appointment.time}</td>
                      <td className="px-6 py-4">{getClienteName(appointment.clientId)}</td>
                      <td className="px-6 py-4">{appointment.vehicleId}</td>
                      <td className="px-6 py-4">{getServiceName(appointment.serviceTypeId)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status === 'pending' ? 'Pendiente' :
                           appointment.status === 'confirmed' ? 'Confirmada' :
                           appointment.status === 'completed' ? 'Completada' :
                           appointment.status === 'cancelled' ? 'Cancelada' :
                           appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {/* Botones según el estado de la cita */}
                          {appointment.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApproveAppointment(appointment)}
                              >
                                ✅ Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleRejectAppointment(appointment)}
                              >
                                ❌ Rechazar
                              </Button>
                            </>
                          )}
                          
                          {appointment.status === 'confirmed' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleCreateQuotation(appointment)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                💰 Cotizar
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleRejectAppointment(appointment)}
                              >
                                ❌ Cancelar
                              </Button>
                            </>
                          )}
                          
                          {appointment.status === 'completed' && (
                            <span className="text-green-600 text-sm font-medium">
                              ✅ Completada
                            </span>
                          )}
                          
                          {appointment.status === 'cancelled' && (
                            <span className="text-red-600 text-sm font-medium">
                              ❌ Cancelada
                            </span>
                          )}
                          
                          {/* Botones universales */}
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleEdit(appointment)}
                          >
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleDelete(appointment)}
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
        )}
      </Card>

      <NewAppointmentModal
        isOpen={isNewAppointmentModalOpen}
        onClose={() => setIsNewAppointmentModalOpen(false)}
        onSubmit={handleCreateAppointment}
      />

      <EditAppointmentModal
        isOpen={isEditAppointmentModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditAppointment}
        appointment={selectedAppointment}
      />

      <CreateQuotationModal
        isOpen={isCreateQuotationModalOpen}
        onClose={() => setIsCreateQuotationModalOpen(false)}
        appointment={selectedAppointment}
        onSuccess={handleQuotationSuccess}
      />
    </>
  );
};

export default AppointmentsPage;
