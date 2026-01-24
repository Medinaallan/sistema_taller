import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockInventory, formatCurrency } from '../../utilidades/globalMockDatabase';import { showAlert } from '../../utilidades/sweetAlertHelpers';import type { InventoryItem } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<InventoryItem>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'category', header: 'Categoría' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'quantity', header: 'Cantidad' },
  { accessorKey: 'minQuantity', header: 'Min. Stock' },
  { 
    accessorKey: 'unitPrice', 
    header: 'Precio',
    cell: ({ getValue }) => formatCurrency(getValue() as number)
  },
  { accessorKey: 'supplier', header: 'Proveedor' },
];

const InventoryPage = () => {
  const [data, setData] = useState<InventoryItem[]>(mockInventory);

  const handleEdit = (item: InventoryItem) => {
    showAlert('Editar inventario: ' + item.id);
  };
  
  const handleDelete = (item: InventoryItem) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Inventario" actions={<Button onClick={() => showAlert('Nuevo item')}>Nuevo Item</Button>}>
      <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default InventoryPage;
