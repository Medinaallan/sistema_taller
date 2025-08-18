
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockProducts } from '../../utilidades/mockCrudData';
import type { Product } from '../../tipos';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'brand', header: 'Marca' },
  { accessorKey: 'model', header: 'Modelo' },
  { accessorKey: 'price', header: 'Precio' },
  { accessorKey: 'stock', header: 'Stock' },
];

const ProductsPage = () => {
  const [data, setData] = useState<Product[]>(mockProducts);

  const handleEdit = (item: Product) => {
    alert('Editar producto: ' + item.id);
  };
  const handleDelete = (item: Product) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Productos" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default ProductsPage;
