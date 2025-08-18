
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockQuotations } from '../../utilidades/mockCrudData';
import type { Quotation } from '../../tipos';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Quotation>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'vehicleId', header: 'Vehículo' },
  { accessorKey: 'total', header: 'Total' },
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
    <Card title="Gestión de Cotizaciones" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default QuotationsPage;
