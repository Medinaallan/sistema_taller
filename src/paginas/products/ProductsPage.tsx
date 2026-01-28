import { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, Select, TextArea } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { showAlert, showPrompt, showSuccess, showError } from '../../utilidades/sweetAlertHelpers';
import type { Product } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'brand', header: 'Marca' },
  { accessorKey: 'model', header: 'Modelo' },
  { accessorKey: 'price', header: 'Precio' },
  { accessorKey: 'stock', header: 'Stock' },
];

const ProductsPage = () => {
  const [data, setData] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<any>({
    name: '',
    code: '',
    brand: '',
    model: '',
    description: '',
    price: 0,
    cost: 0,
    image: '',
    isTaxed: true,
    exento: false,
    exonerado: false,
    category: 'GENERAL',
    stock: 0,
    stockMin: 0
  });

  const openNewModal = () => {
    setEditing(null);
    setForm({
      name: '', code: '', brand: '', model: '', description: '', price: 0, cost: 0,
      image: '', isTaxed: true, exento: false, exonerado: false, category: 'GENERAL', stock: 0, stockMin: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Product) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      code: (item as any).code || '',
      brand: (item as any).brand || '',
      model: (item as any).model || '',
      description: (item as any).description || '',
      price: (item as any).price || 0,
      cost: (item as any).cost || 0,
      image: (item as any).image || '',
      isTaxed: !!(item as any).isTaxed,
      exento: !!(item as any).exento,
      exonerado: !!(item as any).exonerado,
      category: (item as any).category || 'GENERAL',
      stock: (item as any).stock || 0,
      stockMin: (item as any).stockMin || 0
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const base = API_BASE.replace(/\/$/, '');
        const url = base.endsWith('/api') ? `${base}/products` : `${base}/api/products`;
        const res = await fetch(url);
        const json = await res.json();
        setData((json.data || []) as Product[]);
      } catch (err) {
        console.error('Error cargando productos', err);
      }
    };
    load();
  }, []);

  const handleEdit = (item: Product) => openEditModal(item);
  
  const handleDelete = (item: Product) => {
    setData(data.filter(d => d.id !== item.id));
  };

  const handleNew = () => openNewModal();

  const handleSave = async () => {
    try {
      const payload = { ...form };
      const base = API_BASE.replace(/\/$/, '');
      if (editing) {
        const url = base.endsWith('/api') ? `${base}/products/${editing.id}` : `${base}/api/products/${editing.id}`;
        const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!json.success) return showError('Error actualizando producto');
        setData(prev => prev.map(d => d.id === editing.id ? json.data : d));
        showSuccess('Producto actualizado correctamente');
        // notifica a otras vistas que el producto fue actualizado
        try { window.dispatchEvent(new CustomEvent('products:updated', { detail: json.data })); } catch (e) {}
      } else {
        const url = base.endsWith('/api') ? `${base}/products` : `${base}/api/products`;
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!json.success) return showError('Error creando producto');
        setData(prev => [...prev, json.data]);
        showSuccess('Producto creado correctamente');
        try { window.dispatchEvent(new CustomEvent('products:updated', { detail: json.data })); } catch (e) {}
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando producto', err);
      showError('Error guardando producto');
    }
  };

  return (
    <>
      <Card title="Productos" actions={<Button onClick={handleNew}>Nuevo</Button>}>
        <TanStackCrudTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar Producto' : 'Registrar Producto'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Producto" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <Input label="Código" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          <Input label="Categoría" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          <Input label="Marca" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
          <Input label="Modelo" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
          <Input label="Unidad/Tipo" value={form.type} onChange={e => setForm({...form, type: e.target.value})} />
          <Input label="Precio Venta" value={String(form.price)} onChange={e => setForm({...form, price: Number(e.target.value)})} />
          <Input label="Precio Compra" value={String(form.cost)} onChange={e => setForm({...form, cost: Number(e.target.value)})} />
          <Input label="Imagen (URL)" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
          <Input label="Stock" value={String(form.stock)} onChange={e => setForm({...form, stock: Number(e.target.value)})} />
          <Input label="Stock Mínimo" value={String(form.stockMin)} onChange={e => setForm({...form, stockMin: Number(e.target.value)})} />
          <div>
            <label className="label">Impuestos</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center"><input type="checkbox" checked={form.isTaxed} onChange={e => setForm({...form, isTaxed: e.target.checked})} className="mr-2" /> ISV 15%</label>
              <label className="flex items-center"><input type="checkbox" checked={form.exento} onChange={e => setForm({...form, exento: e.target.checked})} className="mr-2" /> Exento</label>
              <label className="flex items-center"><input type="checkbox" checked={form.exonerado} onChange={e => setForm({...form, exonerado: e.target.checked})} className="mr-2" /> Exonerado</label>
            </div>
          </div>
          <div className="col-span-2">
            <TextArea label="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </Modal>
    </>
  );
};

export default ProductsPage;
