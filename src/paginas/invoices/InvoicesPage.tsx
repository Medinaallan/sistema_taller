
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockInvoices } from '../../utilidades/mockCrudData';
import type { Invoice } from '../../tipos/invoice';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'invoiceNumber', header: 'Factura' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'total', header: 'Total' },
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
    <Card title="Gestión de Facturas" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default InvoicesPage;
