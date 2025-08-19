import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockServices } from '../../utilidades/globalMockDatabase';
import type { Service } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Service>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'description', header: 'Descripción' },
  { 
    accessorKey: 'basePrice', 
    header: 'Precio Base',
    cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`
  },
  { accessorKey: 'estimatedTime', header: 'Tiempo Estimado' },
  { 
    accessorKey: 'createdAt', 
    header: 'Fecha Creación',
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-ES')
  },
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
    <Card title="Servicios" actions={<Button onClick={() => alert('Nuevo servicio')}>Nuevo Servicio</Button>}>
      <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default ServicesPage;
