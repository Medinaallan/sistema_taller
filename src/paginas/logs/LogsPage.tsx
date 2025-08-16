
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockLogs } from '../../utilidades/mockCrudData';
import type { Log } from '../../tipos/log';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Log>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'userId', header: 'Usuario' },
  { accessorKey: 'action', header: 'Acción' },
  { accessorKey: 'entity', header: 'Entidad' },
  { accessorKey: 'description', header: 'Descripción' },
  { accessorKey: 'timestamp', header: 'Fecha/Hora', cell: info => String(info.getValue()) },
];

export const LogsPage = () => {
  const [data, setData] = useState<Log[]>(mockLogs);

  const handleEdit = (item: Log) => {
    alert('Editar log: ' + item.id);
  };
  const handleDelete = (item: Log) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Bitácora de Acciones" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};


