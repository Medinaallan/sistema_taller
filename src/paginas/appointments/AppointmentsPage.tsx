import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import NewAppointmentModal from '../../componentes/appointments/NewAppointmentModal';
import { mockAppointments } from '../../utilidades/globalMockDatabase';
import type { Appointment } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Appointment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { 
    accessorKey: 'date', 
    header: 'Fecha',
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-ES')
  },
  { accessorKey: 'time', header: 'Hora' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'vehicleId', header: 'Vehículo' },
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

const AppointmentsPage = () => {
  const [data, setData] = useState<Appointment[]>(mockAppointments);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);

  const handleEdit = (item: Appointment) => {
    alert('Editar cita: ' + item.id);
  };
  
  const handleDelete = (item: Appointment) => {
    setData(data.filter(d => d.id !== item.id));
  };

  const handleCreateAppointment = (newAppointment: Omit<Appointment, 'id'>) => {
    const appointmentWithId: Appointment = {
      ...newAppointment,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setData(prevData => [...prevData, appointmentWithId]);
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
        <TanStackCrudTable 
          columns={columns} 
          data={data} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      </Card>

      <NewAppointmentModal
        isOpen={isNewAppointmentModalOpen}
        onClose={() => setIsNewAppointmentModalOpen(false)}
        onSubmit={handleCreateAppointment}
      />
    </>
  );
};

export default AppointmentsPage;
