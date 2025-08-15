
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockServices } from '../../utilidades/mockCrudData';
import type { Service } from '../../tipos/service';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Service>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'basePrice', header: 'Precio Base' },
  { accessorKey: 'estimatedTime', header: 'Tiempo Est.' },
];

const ServicesPage = () => {
  const [data, setData] = useState<Service[]>(mockServices);

  const handleEdit = (item: Service) => {
    alert('Editar servicio: ' + item.id);
  };
  const handleDelete = (item: Service) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Servicios" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default ServicesPage;
