import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import type { ServiceType } from '../../tipos';
import { generateId } from '../../utilidades/mockData';

export function ServiceTypesPanel() {
  const { state, dispatch } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedDuration: '',
    basePrice: '',
  });

  const openCreateModal = () => {
    setSelectedServiceType(null);
    setFormData({ name: '', description: '', estimatedDuration: '', basePrice: '' });
    setModalType('create');
    setIsModalOpen(true);
  };

  const openEditModal = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setFormData({
      name: serviceType.name,
      description: serviceType.description || '',
      estimatedDuration: serviceType.estimatedDuration?.toString() || '',
      basePrice: serviceType.basePrice?.toString() || '',
    });
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Eliminar este tipo de servicio?')) {
      dispatch({ type: 'DELETE_SERVICE_TYPE', payload: id });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.estimatedDuration || !formData.basePrice) return;
    const duration = parseInt(formData.estimatedDuration);
    const price = parseFloat(formData.basePrice);
    if (isNaN(duration) || isNaN(price)) return;
    if (modalType === 'create') {
      const newServiceType: ServiceType = {
        id: generateId(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        estimatedDuration: duration,
        basePrice: price,
      };
      dispatch({ type: 'ADD_SERVICE_TYPE', payload: newServiceType });
    } else if (modalType === 'edit' && selectedServiceType) {
      const updatedServiceType: ServiceType = {
        ...selectedServiceType,
        name: formData.name.trim(),
        description: formData.description.trim(),
        estimatedDuration: duration,
        basePrice: price,
      };
      dispatch({ type: 'UPDATE_SERVICE_TYPE', payload: updatedServiceType });
    }
    setIsModalOpen(false);
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tipos de Servicio</h2>
        <Button onClick={openCreateModal}>Agregar Tipo</Button>
      </div>
      <div className="space-y-2">
        {state.serviceTypes.length === 0 ? (
          <p className="text-gray-500">No hay tipos de servicio registrados.</p>
        ) : (
          state.serviceTypes.map(st => (
            <div key={st.id} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
              <div>
                <span className="font-medium text-gray-900">{st.name}</span>
                {st.description && <span className="ml-2 text-gray-500">- {st.description}</span>}
              </div>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => openEditModal(st)}>Editar</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(st.id)}>Eliminar</Button>
              </div>
            </div>
          ))
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'create' ? 'Agregar Tipo de Servicio' : 'Editar Tipo de Servicio'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Mantenimiento Preventivo"
          />
          <Input
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Opcional"
          />
          <Input
            label="Duración Estimada (minutos)"
            name="estimatedDuration"
            type="number"
            min="1"
            value={formData.estimatedDuration}
            onChange={handleChange}
            required
            placeholder="Ej: 60"
          />
          <Input
            label="Precio Base (Lempiras)"
            name="basePrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.basePrice}
            onChange={handleChange}
            required
            placeholder="Ej: 500"
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{modalType === 'create' ? 'Agregar' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
