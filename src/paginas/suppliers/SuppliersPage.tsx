
import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockSuppliers } from '../../utilidades/mockCrudData';
import type { Supplier } from '../../tipos/supplier';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Supplier>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'contactName', header: 'Contacto' },
  { accessorKey: 'phone', header: 'Teléfono' },
  { accessorKey: 'email', header: 'Email' },
];

const SuppliersPage = () => {
  const [data, setData] = useState<Supplier[]>(mockSuppliers);

  const handleEdit = (item: Supplier) => {
    alert('Editar proveedor: ' + item.id);
  };
  const handleDelete = (item: Supplier) => {
    setData(data.filter(d => d.id !== item.id));
  };

  return (
    <Card title="Proveedores" actions={<Button onClick={() => alert('Nuevo registro')}>Nuevo</Button>}>
  <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

export default SuppliersPage;
