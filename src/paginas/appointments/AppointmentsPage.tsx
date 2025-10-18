import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import NewAppointmentModal from '../../componentes/appointments/NewAppointmentModal';
import EditAppointmentModal from '../../componentes/appointments/EditAppointmentModal';
import { appointmentsService, servicesService } from '../../servicios/apiService';
import { obtenerClientes } from '../../servicios/clientesApiService';
import type { Appointment } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const AppointmentsPage = () => {
  const [data, setData] = useState<Appointment[]>([]);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isEditAppointmentModalOpen, setIsEditAppointmentModalOpen] = useState(false);
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

  // Definir columnas dentro del componente para acceder a las funciones
  const columns: ColumnDef<Appointment>[] = [
    { accessorKey: 'id', header: 'ID' },
    { 
      accessorKey: 'date', 
      header: 'Fecha',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-ES')
    },
    { accessorKey: 'time', header: 'Hora' },
    { 
      accessorKey: 'clientId', 
      header: 'Cliente',
      cell: ({ getValue }) => getClienteName(getValue() as string)
    },
    { accessorKey: 'vehicleId', header: 'Vehículo' },
    { 
      accessorKey: 'serviceTypeId', 
      header: 'Servicio',
      cell: ({ getValue }) => getServiceName(getValue() as string)
    },
    { 
      accessorKey: 'status', 
      header: 'Estado',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const statusMap = {
          pending: 'Pendiente',
          confirmed: 'Confirmada',
          cancelled: 'Cancelada',
          completed: 'Completada'
        };
        return statusMap[status as keyof typeof statusMap] || status;
      }
    },
  ];

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
          <TanStackCrudTable 
            columns={columns} 
            data={data} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
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
    </>
  );
};

export default AppointmentsPage;
