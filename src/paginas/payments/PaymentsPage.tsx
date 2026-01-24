import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockPayments, formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import { showAlert } from '../../utilidades/sweetAlertHelpers';
import type { Payment } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Payment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'invoiceId', header: 'Factura' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { 
    accessorKey: 'amount', 
    header: 'Monto',
    cell: ({ getValue }) => formatCurrency(getValue() as number)
  },
  { accessorKey: 'method', header: 'Método' },
  { 
    accessorKey: 'date', 
    header: 'Fecha',
    cell: ({ getValue }) => formatDate(getValue() as string)
  },
];

const PaymentsPage = () => {
  const [data, setData] = useState<Payment[]>(mockPayments);

  const handleEdit = (item: Payment) => {
    showAlert('Editar pago: ' + item.id);
  };
  
  const handleDelete = (item: Payment) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Pagos" actions={<Button onClick={() => showAlert('Nuevo pago')}>Nuevo Pago</Button>}>
      <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default PaymentsPage;
