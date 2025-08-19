import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockQuotations } from '../../utilidades/globalMockDatabase';
import type { Quotation } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Quotation>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'vehicleId', header: 'Vehículo' },
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

const QuotationsPage = () => {
  const [data, setData] = useState<Quotation[]>(mockQuotations);

  const handleEdit = (item: Quotation) => {
    alert('Editar cotización: ' + item.id);
  };
  
  const handleDelete = (item: Quotation) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Cotizaciones" actions={<Button onClick={() => alert('Nueva cotización')}>Nueva Cotización</Button>}>
      <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default QuotationsPage;
