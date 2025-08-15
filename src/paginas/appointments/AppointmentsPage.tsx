
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockAppointments } from '../../utilidades/mockCrudData';
import type { Appointment } from '../../tipos/appointment';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Appointment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'vehicleId', header: 'Vehículo' },
  { accessorKey: 'serviceTypeId', header: 'Servicio' },
  { accessorKey: 'date', header: 'Fecha', cell: info => String(info.getValue()) },
  { accessorKey: 'time', header: 'Hora' },
  { accessorKey: 'status', header: 'Estado' },
];

const AppointmentsPage = () => {
  const [data, setData] = useState<Appointment[]>(mockAppointments);

  const handleEdit = (item: Appointment) => {
    alert('Editar cita: ' + item.id);
  };
  const handleDelete = (item: Appointment) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Gestión de Citas" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default AppointmentsPage;
