
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockInventory } from '../../utilidades/mockCrudData';
import type { InventoryItem } from '../../tipos';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<InventoryItem>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'productId', header: 'Producto' },
  { accessorKey: 'quantity', header: 'Cantidad' },
  { accessorKey: 'minStock', header: 'Stock Mín.' },
  { accessorKey: 'maxStock', header: 'Stock Máx.' },
  { accessorKey: 'location', header: 'Ubicación' },
];

const InventoryPage = () => {
  const [data, setData] = useState<InventoryItem[]>(mockInventory);

  const handleEdit = (item: InventoryItem) => {
    alert('Editar inventario: ' + item.id);
  };
  const handleDelete = (item: InventoryItem) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Inventario" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default InventoryPage;
