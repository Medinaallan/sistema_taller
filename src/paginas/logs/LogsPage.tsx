import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockLogs } from '../../utilidades/globalMockDatabase';
import type { Log } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Log>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'userId', header: 'Usuario' },
  { accessorKey: 'action', header: 'Acción' },
  { accessorKey: 'entity', header: 'Entidad' },
  { 
    accessorKey: 'timestamp', 
    header: 'Fecha/Hora',
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleString('es-ES')
  },
  { accessorKey: 'details', header: 'Detalles' },
];

const LogsPage = () => {
  const [data, setData] = useState<Log[]>(mockLogs);

  const handleEdit = (item: Log) => {
    alert('Ver detalles del log: ' + item.id);
  };
  
  const handleDelete = (item: Log) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Logs de Actividad" actions={<Button onClick={() => alert('Exportar logs')}>Exportar</Button>}>
      <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default LogsPage;


