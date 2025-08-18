
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockPayments } from '../../utilidades/mockCrudData';
import type { Payment } from '../../tipos';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Payment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'invoiceId', header: 'Factura' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'amount', header: 'Monto' },
  { accessorKey: 'method', header: 'Método' },
  { accessorKey: 'status', header: 'Estado' },
];

const PaymentsPage = () => {
  const [data, setData] = useState<Payment[]>(mockPayments);

  const handleEdit = (item: Payment) => {
    alert('Editar pago: ' + item.id);
  };
  const handleDelete = (item: Payment) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Gestión de Pagos" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default PaymentsPage;
