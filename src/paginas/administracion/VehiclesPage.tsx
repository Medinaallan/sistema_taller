import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { mockVehicles, mockClients, mockServiceTypes, generateId, formatDate } from '../../utilidades/mockData';
import type { Vehicle, Client, ServiceType } from '../../tipos';


interface VehicleFormProps {
  vehicle?: Vehicle;
  clients: Client[];
  serviceTypes: ServiceType[];
  onSubmit: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'workOrders' | 'reminders'>) => void;
  onCancel: () => void;
}

function VehicleForm({ vehicle, clients, serviceTypes, onSubmit, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    clientId: vehicle?.clientId || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    licensePlate: vehicle?.licensePlate || '',
    color: vehicle?.color || '',
    mileage: vehicle?.mileage || 0,
    serviceTypeId: vehicle?.serviceType.id || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'year' || name === 'mileage' ? parseInt(value) || 0 : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) newErrors.clientId = 'Debe seleccionar un cliente';
    if (!formData.brand.trim()) newErrors.brand = 'La marca es requerida';
    if (!formData.model.trim()) newErrors.model = 'El modelo es requerido';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'El año debe estar entre 1900 y el próximo año';
    }
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'La placa es requerida';
    if (!formData.color.trim()) newErrors.color = 'El color es requerido';
    if (!formData.serviceTypeId) newErrors.serviceTypeId = 'Debe seleccionar un tipo de servicio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceTypeId);
      if (selectedServiceType) {
        onSubmit({
          clientId: formData.clientId,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          licensePlate: formData.licensePlate,
          color: formData.color,
          mileage: formData.mileage,
          serviceType: selectedServiceType,
        });
      }
    }
  };

  const clientOptions = [
    { value: '', label: 'Seleccionar cliente...' },
    ...clients.map(client => ({ value: client.id, label: client.name }))
  ];

  const serviceTypeOptions = [
    { value: '', label: 'Seleccionar tipo de servicio...' },
    ...serviceTypes.map(st => ({ value: st.id, label: st.name }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Cliente"
        name="clientId"
        value={formData.clientId}
        onChange={handleInputChange}
        options={clientOptions}
        error={errors.clientId}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Marca"
          name="brand"
          value={formData.brand}
          onChange={handleInputChange}
          error={errors.brand}
          placeholder="Toyota"
          required
        />

        <Input
          label="Modelo"
          name="model"
          value={formData.model}
          onChange={handleInputChange}
          error={errors.model}
          placeholder="Corolla"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Año"
          name="year"
          type="number"
          min="1900"
          max={new Date().getFullYear() + 1}
          value={formData.year}
          onChange={handleInputChange}
          error={errors.year}
          required
        />

        <Input
          label="Placa"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleInputChange}
          error={errors.licensePlate}
          placeholder="ABC-123"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Color"
          name="color"
          value={formData.color}
          onChange={handleInputChange}
          error={errors.color}
          placeholder="Blanco"
          required
        />

        <Input
          label="Kilometraje (opcional)"
          name="mileage"
          type="number"
          min="0"
          value={formData.mileage}
          onChange={handleInputChange}
          error={errors.mileage}
          placeholder="50000"
        />
      </div>

      <Select
        label="Tipo de Servicio"
        name="serviceTypeId"
        value={formData.serviceTypeId}
        onChange={handleInputChange}
        options={serviceTypeOptions}
        error={errors.serviceTypeId}
        required
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {vehicle ? 'Actualizar' : 'Crear'} Vehículo
        </Button>
      </div>
    </form>
  );
}

export function VehiclesPage() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');

  useEffect(() => {
    // Cargar datos mock solo si no hay datos persistidos
    dispatch({ type: 'SET_VEHICLES', payload: mockVehicles });
    if (!state.clients || state.clients.length === 0) {
      dispatch({ type: 'SET_CLIENTS', payload: mockClients });
    }
    dispatch({ type: 'SET_SERVICE_TYPES', payload: mockServiceTypes });
  }, [dispatch, state.clients]);

  const filteredVehicles = state.vehicles.filter(vehicle => {
    const client = state.clients.find(c => c.id === vehicle.clientId);
    const matchesSearch = 
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClient = !selectedClient || vehicle.clientId === selectedClient;
    
    return matchesSearch && matchesClient;
  });

  const handleCreateVehicle = () => {
    setSelectedVehicle(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setModalType('view');
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      dispatch({ type: 'DELETE_VEHICLE', payload: vehicleId });
    }
  };

  const handleFormSubmit = (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'workOrders' | 'reminders'>) => {
    if (modalType === 'create') {
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: generateId(),
        workOrders: [],
        reminders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch({ type: 'ADD_VEHICLE', payload: newVehicle });
    } else if (modalType === 'edit' && selectedVehicle) {
      const updatedVehicle: Vehicle = {
        ...selectedVehicle,
        ...vehicleData,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_VEHICLE', payload: updatedVehicle });
    }
    setIsModalOpen(false);
  };

  const getClientName = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    return client?.name || 'Cliente no encontrado';
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'create': return 'Registrar Nuevo Vehículo';
      case 'edit': return 'Editar Vehículo';
      case 'view': return 'Detalles del Vehículo';
      default: return '';
    }
  };

  const clientFilterOptions = [
    { value: '', label: 'Todos los clientes' },
    ...state.clients.map(client => ({ value: client.id, label: client.name }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Vehículos</h1>
          <p className="text-gray-600">Administra la flota de vehículos de los clientes</p>
        </div>
        <Button onClick={handleCreateVehicle}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por marca, modelo, placa o propietario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            options={clientFilterOptions}
          />
        </div>
      </Card>

      {/* Lista de vehículos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propietario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vehicle.licensePlate} • {vehicle.color}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getClientName(vehicle.clientId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Año {vehicle.year}</div>
                    {vehicle.mileage && (
                      <div className="text-sm text-gray-500">{vehicle.mileage.toLocaleString()} km</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="primary" size="sm">
                      {vehicle.serviceType.name}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(vehicle.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewVehicle(vehicle)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditVehicle(vehicle)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || selectedClient 
                  ? 'No se encontraron vehículos que coincidan con los filtros.' 
                  : 'No hay vehículos registrados.'
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getModalTitle()}
        size="lg"
      >
        {modalType === 'view' && selectedVehicle ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <p className="mt-1 text-sm text-gray-900">{selectedVehicle.brand}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Modelo</label>
                <p className="mt-1 text-sm text-gray-900">{selectedVehicle.model}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Año</label>
                <p className="mt-1 text-sm text-gray-900">{selectedVehicle.year}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Placa</label>
                <p className="mt-1 text-sm text-gray-900">{selectedVehicle.licensePlate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <p className="mt-1 text-sm text-gray-900">{selectedVehicle.color}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kilometraje</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedVehicle.mileage ? `${selectedVehicle.mileage.toLocaleString()} km` : 'No especificado'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Propietario</label>
              <p className="mt-1 text-sm text-gray-900">{getClientName(selectedVehicle.clientId)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Servicio</label>
              <p className="mt-1 text-sm text-gray-900">{selectedVehicle.serviceType.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(selectedVehicle.createdAt)}</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <VehicleForm
            vehicle={selectedVehicle || undefined}
            clients={state.clients}
            serviceTypes={state.serviceTypes}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>

    </div>
  );
}
