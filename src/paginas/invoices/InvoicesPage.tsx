import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockInvoices } from '../../utilidades/globalMockDatabase';
import type { Invoice } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'workOrderId', header: 'Orden de Trabajo' },
  { 
    accessorKey: 'date', 
    header: 'Fecha',
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-ES')
  },
  { 
    accessorKey: 'total', 
    header: 'Total',
    cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`
  },
  { accessorKey: 'status', header: 'Estado' },
];

const InvoicesPage = () => {
  const [data, setData] = useState<Invoice[]>(mockInvoices);

  const handleEdit = (item: Invoice) => {
    alert('Editar factura: ' + item.id);
  };
  
  const handleDelete = (item: Invoice) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Facturas" actions={<Button onClick={() => alert('Nueva factura')}>Nueva Factura</Button>}>
      <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default InvoicesPage;
