import type { Appointment } from '../../tipos';
import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import NewAppointmentModal from '../../componentes/appointments/NewAppointmentModal';
import EditAppointmentModal from '../../componentes/appointments/EditAppointmentModal';
import AppointmentDetailsModal from '../../componentes/appointments/AppointmentDetailsModal';
import CreateQuotationModal from '../../componentes/quotations/CreateQuotationModal';
import AppointmentActions from '../../componentes/appointments/AppointmentActions';
import { appointmentsService, servicesService, vehiclesService } from '../../servicios/apiService';
import { useClientesFromAPI } from '../../hooks/useClientesFromAPI';
import { showError, showConfirm } from '../../utilidades/sweetAlertHelpers';
import { useBusinessLogs } from '../../hooks/useBusinessLogs';
type AppointmentWithNames = Appointment & {
  clientName?: string;
  vehicleName?: string;
};

const AppointmentsPage = () => {
  const businessLogs = useBusinessLogs();
  const [data, setData] = useState<AppointmentWithNames[]>([]);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isEditAppointmentModalOpen, setIsEditAppointmentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateQuotationModalOpen, setIsCreateQuotationModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clientes: clientesAPI } = useClientesFromAPI();
  const [servicios, setServicios] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);

  // Función para buscar el nombre del servicio por ID
  const getServiceName = (servicioId: string) => {
    const servicio = servicios.find(s => s.tipo_servicio_id?.toString() === servicioId?.toString());
    return servicio ? servicio.nombre : `ID: ${servicioId}`;
  };





  // Función para cargar servicios
  const loadServicios = async () => {
    try {
      const response = await servicesService.getAll();
      if (response.success) {
        const mappedServices = response.data.map((service: any) => ({
          tipo_servicio_id: service.tipo_servicio_id,
          nombre: service.nombre,
          descripcion: service.descripcion || '',
        }));
        setServicios(mappedServices);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  // Función para cargar vehículos
  const loadVehiculos = async () => {
    try {
      const response = await vehiclesService.getAll();
      if (response.success) {
        setVehiculos(response.data);
      }
    } catch (error) {
      console.error('Error cargando vehículos:', error);
    }
  };

  // Función para cargar citas desde el backend y enriquecer con nombres


  // Función para cargar citas y dependencias
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Cargar vehículos
      const vehiculosRes = await vehiclesService.getAll();
      if (vehiculosRes.success) {
        // Mapear igual que en VehiclesPage 
        const mappedVehicles = vehiculosRes.data.map((spVehicle: any) => ({
          id: spVehicle.vehiculo_id?.toString() || spVehicle.id,
          clientId: spVehicle.cliente_id?.toString() || spVehicle.clientId,
          brand: spVehicle.marca,
          model: spVehicle.modelo,
          year: parseInt(spVehicle.anio),
          licensePlate: spVehicle.placa,
          color: spVehicle.color,
          mileage: parseInt(spVehicle.kilometraje) || 0,
          vin: spVehicle.vin || '',
          numeroMotor: spVehicle.numero_motor || '',
          fotoUrl: spVehicle.foto_url || '',
          createdAt: new Date(spVehicle.fecha_creacion || Date.now()),
          updatedAt: new Date(),
        }));
        setVehiculos(mappedVehicles);
      } else {
        setVehiculos([]);
      }

      // 2. Cargar servicios
      await loadServicios();

      // 3. Cargar citas y enriquecer con nombres usando clientesAPI
      const response = await appointmentsService.getAll();
      if (response.success) {
        const mapEstado = (estado: string) => {
          switch (estado?.toLowerCase()) {
            case 'pendiente': return 'pending';
            case 'confirmada': return 'confirmed';
            case 'aprobada': return 'approved';
            case 'cancelada': return 'cancelled';
            case 'completada': return 'completed';
            default: return estado;
          }
        };
        const appointmentsData = response.data.map((spAppointment: any) => {
          const clientIdStr = String(spAppointment.cliente_id).trim();
          const vehicleIdStr = String(spAppointment.vehiculo_id).trim();
          const cliente = clientesAPI.find((c: any) => String(c.id || c.usuario_id).trim() === clientIdStr);
          const vehiculo = vehiculos.find((v: any) => String(v.id).trim() === vehicleIdStr);
          return {
            id: spAppointment.cita_id,
            date: new Date(spAppointment.fecha_inicio),
            time: spAppointment.fecha_inicio ? new Date(spAppointment.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
            clientId: clientIdStr,
            clientName: spAppointment.nombre_cliente || (cliente ? cliente.nombre_completo : `ID sin coincidencia: ${clientIdStr}`),
            vehicleId: vehicleIdStr,
            vehicleName: spAppointment.vehiculo_info || (vehiculo ? `${vehiculo.brand} ${vehiculo.model} (${vehiculo.licensePlate})` : `ID sin coincidencia: ${vehicleIdStr}`),
            serviceTypeId: spAppointment.tipo_servicio_id,
            status: mapEstado(spAppointment.estado),
            notes: (spAppointment.notas_cliente || '').replace(/^"|"$/g, ''),
            createdAt: spAppointment.fecha_creacion ? new Date(spAppointment.fecha_creacion) : new Date(),
            updatedAt: new Date(),
          };
        });
        setData(appointmentsData);
      } else {
        setError('Error al cargar las citas');
      }
    } catch (error) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [clientesAPI]);

  const handleEdit = (item: Appointment) => {
    setSelectedAppointment(item);
    setIsEditAppointmentModalOpen(true);
  };

  const handleViewDetails = (item: AppointmentWithNames) => {
    setSelectedAppointment(item);
    setIsDetailsModalOpen(true);
  };

  const handleQuotationSuccess = async () => {
    // NO cambiar el estado de la cita al crear la cotización
    // La cita seguirá en "pending" hasta que la cotización sea aprobada o rechazada
    
    // Solo recargar citas después de crear cotización
    await loadAppointments();
  };;
  
  const handleDelete = async (item: Appointment) => {
    if (await showConfirm(`¿Está seguro de que desea eliminar la cita ${item.id}?`)) {
      try {
        // Obtener información para el log antes de eliminar
        const cliente = clientesAPI.find((c: any) => String(c.id || c.usuario_id) === String(item.clientId));
        const vehiculo = vehiculos.find(v => v.id === item.vehicleId);
        const clientName = cliente ? cliente.nombre_completo : `Cliente ID: ${item.clientId}`;
        const vehicleInfo = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})` : `Vehículo ID: ${item.vehicleId}`;
        
        const response = await appointmentsService.delete(typeof item.id === 'string' ? parseInt(item.id, 10) : item.id);
        if (response.success) {
          // Generar log de negocio con datos reales
          await businessLogs.logCustomAction(
            'DELETE',
            'appointment',
            item.id,
            `Cita eliminada: ${clientName} - ${item.date.toLocaleDateString()} ${item.time} - ${vehicleInfo}`,
            {
              clientId: item.clientId,
              clientName: clientName,
              vehicleId: item.vehicleId,
              vehicleInfo: vehicleInfo,
              date: item.date.toISOString().split('T')[0],
              time: item.time,
              status: item.status
            }
          );
          
          // Recargar la lista después de eliminar
          await loadAppointments();
        } else {
          showError('Error al eliminar la cita: ' + response.message);
        }
      } catch (error) {
        console.error('Error eliminando cita:', error);
        showError('Error al eliminar la cita');
      }
    }
  };

  const handleCreateAppointment = async (_newAppointment: Omit<Appointment, 'id'>) => {
    // La cita ya se creó en el backend desde el modal
    // Recargar todos los datos para asegurar que los nombres estén disponibles
    await Promise.all([
      loadAppointments(),
      loadVehiculos(),
      loadServicios()
    ]);
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
                  data.map((appointment: AppointmentWithNames) => (
                    <tr key={appointment.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {appointment.date.toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">{appointment.time}</td>
                      <td className="px-6 py-4">{appointment.clientName}</td>
                      <td className="px-6 py-4">{appointment.vehicleName}</td>
                      <td className="px-6 py-4">{getServiceName(appointment.serviceTypeId)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          appointment.status === 'approved' || appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status === 'pending' ? 'Pendiente' :
                           appointment.status === 'confirmed' ? 'Confirmada' :
                           appointment.status === 'cancelled' ? 'Cancelada' :
                           appointment.status === 'approved' ? 'Aprobada' :
                           appointment.status === 'completed' ? 'Completada' :
                           appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {/* Centralizar acciones en AppointmentActions */}
                          <AppointmentActions
                            appointment={appointment}
                            clientName={appointment.clientName || ''}
                            serviceName={getServiceName(appointment.serviceTypeId)}
                            onUpdate={loadAppointments}
                          />
                          
                          {/* Mostrar Editar/Eliminar solo si la cita está en estado editable */}
                          {appointment.status !== 'approved' && appointment.status !== 'completed' && appointment.status !== 'cancelled' ? (
                            <>
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
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleViewDetails(appointment)}
                              title="Ver detalles de la cita"
                            >
                              Ver Detalles
                            </Button>
                          )}
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

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
        clientName={selectedAppointment ? (data.find(a => a.id === selectedAppointment.id)?.clientName || 'Cargando...') : 'Cargando...'}
        vehicleName={selectedAppointment ? (data.find(a => a.id === selectedAppointment.id)?.vehicleName || 'Cargando...') : 'Cargando...'}
        serviceName={selectedAppointment ? getServiceName(selectedAppointment.serviceTypeId) : 'Cargando...'}
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
