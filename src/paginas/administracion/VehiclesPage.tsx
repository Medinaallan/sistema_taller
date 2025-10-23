import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import useInterconnectedData from '../../contexto/useInterconnectedData';
import { mockVehicles, mockClients, formatDate } from '../../utilidades/globalMockDatabase';
import { vehiclesService } from '../../servicios/apiService';
import type { Vehicle, Client } from '../../tipos';

interface VehicleFormProps {
  vehicle?: Vehicle;
  clients: Client[];
  onSubmit: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'workOrders' | 'reminders'>) => void;
  onCancel: () => void;
}

function VehicleForm({ vehicle, clients, onSubmit, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    clientId: vehicle?.clientId || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    licensePlate: vehicle?.licensePlate || '',
    color: vehicle?.color || '',
    mileage: vehicle?.mileage || 0,
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      clientId: formData.clientId,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: formData.year,
      licensePlate: formData.licensePlate.trim(),
      color: formData.color.trim(),
      mileage: formData.mileage > 0 ? formData.mileage : undefined,
      serviceType: {
        id: 'default',
        name: 'Servicio General',
        description: 'Servicio general',
        basePrice: 0,
        estimatedDuration: 1,
      },
    });
  };

  const clientOptions = [
    { value: '', label: 'Selecciona un cliente...' },
    ...clients.map(client => ({
      value: client.id,
      label: client.name
    }))
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          placeholder="ABC123"
          required
        />

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
  const data = useInterconnectedData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);

  // Cargar vehículos desde la API
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehiclesService.getAll();
      if (response.success) {
        // Map CSV data to Vehicle format
        const mappedVehicles = response.data.map((csvVehicle: any) => ({
          id: csvVehicle.id,
          clientId: csvVehicle.clienteId,
          brand: csvVehicle.marca,
          model: csvVehicle.modelo,
          year: parseInt(csvVehicle.año),
          licensePlate: csvVehicle.placa,
          color: csvVehicle.color,
          mileage: parseInt(csvVehicle.mileage) || 0,
          vin: csvVehicle.vin || '',
          serviceType: {
            id: 'default',
            name: 'Servicio General',
            description: 'Servicio general',
            basePrice: 0,
            estimatedDuration: 1,
          },
          workOrders: [],
          reminders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        dispatch({ type: 'SET_VEHICLES', payload: mappedVehicles });
      } else {
        // Use mock data if API fails
        dispatch({ type: 'SET_VEHICLES', payload: mockVehicles });
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      dispatch({ type: 'SET_VEHICLES', payload: mockVehicles });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load data on component mount
    loadVehicles();
    
    // Load clients if not already loaded
    if (!state.clients || state.clients.length === 0) {
      dispatch({ type: 'SET_CLIENTS', payload: mockClients });
    }
  }, [dispatch, state.clients]);

  const filteredVehicles = state.vehicles.filter(vehicle => {
    const client = data.getClientById(vehicle.clientId);
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

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el vehículo ${vehicle.brand} ${vehicle.model}?`)) {
      try {
        setLoading(true);
        const response = await vehiclesService.delete(vehicle.id);
        
        if (response.success) {
          data.deleteVehicleWithRelations(vehicle.id);
          alert('Vehículo eliminado exitosamente');
        } else {
          alert('Error al eliminar el vehículo: ' + response.message);
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Error al eliminar el vehículo');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'workOrders' | 'reminders'>) => {
    try {
      setLoading(true);
      
      if (modalType === 'edit' && selectedVehicle) {
        // Update vehicle via API
        const updateData = {
          clienteId: vehicleData.clientId,
          marca: vehicleData.brand,
          modelo: vehicleData.model,
          año: vehicleData.year,
          placa: vehicleData.licensePlate,
          color: vehicleData.color,
          vin: vehicleData.vin || '',
          mileage: vehicleData.mileage || 0,
        };
        
        const response = await vehiclesService.update(selectedVehicle.id, updateData);
        
        if (response.success) {
          // Update local state
          const updatedVehicle: Vehicle = {
            ...selectedVehicle,
            ...vehicleData,
            updatedAt: new Date(),
          };
          dispatch({ type: 'UPDATE_VEHICLE', payload: updatedVehicle });
          setIsModalOpen(false);
          alert('Vehículo actualizado exitosamente');
        } else {
          alert('Error al actualizar el vehículo: ' + response.message);
        }
      } else {
        // Create new vehicle via API
        const createData = {
          clienteId: vehicleData.clientId,
          marca: vehicleData.brand,
          modelo: vehicleData.model,
          año: vehicleData.year,
          placa: vehicleData.licensePlate,
          color: vehicleData.color,
          vin: vehicleData.vin || '',
          mileage: vehicleData.mileage || 0,
        };
        
        const response = await vehiclesService.create(createData);
        
        if (response.success) {
          // Add to local state
          const newVehicle: Vehicle = {
            id: response.data.id,
            clientId: response.data.clienteId,
            brand: response.data.marca,
            model: response.data.modelo,
            year: parseInt(response.data.año),
            licensePlate: response.data.placa,
            color: response.data.color,
            vin: response.data.vin || '',
            mileage: parseInt(response.data.mileage) || 0,
            serviceType: vehicleData.serviceType,
            workOrders: [],
            reminders: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dispatch({ type: 'ADD_VEHICLE', payload: newVehicle });
          setIsModalOpen(false);
          alert('Vehículo creado exitosamente');
        } else {
          alert('Error al crear el vehículo: ' + response.message);
        }
      }
    } catch (error) {
      console.error('Error in vehicle operation:', error);
      alert('Error al procesar la operación');
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    ...state.clients.map(client => ({
      value: client.id,
      label: client.name
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Vehículos</h1>
          <p className="text-gray-600">Administra todos los vehículos registrados</p>
        </div>
        <Button onClick={handleCreateVehicle} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Agregar Vehículo</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Buscar vehículos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por marca, modelo, placa, color o propietario..."
          />
          
          <Select
            label="Filtrar por cliente"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            options={clientOptions}
          />
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{state.vehicles.length}</div>
            <div className="text-sm text-gray-500">Total Vehículos</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.workOrders.filter(wo => wo.status !== 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Órdenes Activas</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.appointments.filter(app => app.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-500">Citas Confirmadas</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {filteredVehicles.length}
            </div>
            <div className="text-sm text-gray-500">Vehículos Filtrados</div>
          </div>
        </Card>
      </div>

      {/* Tabla de Vehículos */}
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
                  Órdenes de Trabajo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citas
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
              {filteredVehicles.map((vehicle) => {
                const client = data.getClientById(vehicle.clientId);
                const workOrders = data.getWorkOrdersByVehicle(vehicle.id);
                const appointments = data.getAppointmentsByVehicle(vehicle.id);
                const activeWorkOrders = workOrders.filter(wo => wo.status !== 'completed');
                const upcomingAppointments = appointments.filter(app => app.status === 'confirmed');
                
                return (
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
                      <div className="text-sm text-gray-900">{client?.name || 'Cliente no encontrado'}</div>
                      {client && (
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Año {vehicle.year}</div>
                      {vehicle.mileage && (
                        <div className="text-sm text-gray-500">{vehicle.mileage.toLocaleString()} km</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Total: {workOrders.length}
                      </div>
                      {activeWorkOrders.length > 0 && (
                        <div className="text-sm text-orange-600">
                          Activas: {activeWorkOrders.length}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Total: {appointments.length}
                      </div>
                      {upcomingAppointments.length > 0 && (
                        <div className="text-sm text-blue-600">
                          Próximas: {upcomingAppointments.length}
                        </div>
                      )}
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
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron vehículos que coincidan con los filtros.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'create' ? 'Agregar Vehículo' :
          modalType === 'edit' ? 'Editar Vehículo' :
          'Detalles del Vehículo'
        }
      >
        {modalType === 'view' && selectedVehicle ? (
          <VehicleDetails 
            vehicle={selectedVehicle} 
            client={data.getClientById(selectedVehicle.clientId)}
            workOrders={data.getWorkOrdersByVehicle(selectedVehicle.id)}
            appointments={data.getAppointmentsByVehicle(selectedVehicle.id)}
          />
        ) : (
          <VehicleForm
            vehicle={modalType === 'edit' ? selectedVehicle || undefined : undefined}
            clients={state.clients}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

// Componente para mostrar detalles del vehículo con información interconectada
interface VehicleDetailsProps {
  vehicle: Vehicle;
  client: Client | undefined;
  workOrders: any[];
  appointments: any[];
}

function VehicleDetails({ vehicle, client, workOrders, appointments }: VehicleDetailsProps) {
  const activeWorkOrders = workOrders.filter(wo => wo.status !== 'completed');
  const completedWorkOrders = workOrders.filter(wo => wo.status === 'completed');
  const upcomingAppointments = appointments.filter(app => app.status === 'confirmed');

  return (
    <div className="space-y-6">
      {/* Información básica del vehículo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Vehículo</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Marca y Modelo</dt>
              <dd className="text-sm text-gray-900">{vehicle.brand} {vehicle.model}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Año</dt>
              <dd className="text-sm text-gray-900">{vehicle.year}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Placa</dt>
              <dd className="text-sm text-gray-900">{vehicle.licensePlate}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Color</dt>
              <dd className="text-sm text-gray-900">{vehicle.color}</dd>
            </div>
            {vehicle.mileage && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Kilometraje</dt>
                <dd className="text-sm text-gray-900">{vehicle.mileage.toLocaleString()} km</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Propietario</h3>
          {client ? (
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="text-sm text-gray-900">{client.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="text-sm text-gray-900">{client.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{client.email}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Cliente no encontrado</p>
          )}
        </div>
      </div>

      {/* Estadísticas del vehículo */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{workOrders.length}</div>
          <div className="text-sm text-blue-500">Total Órdenes</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{activeWorkOrders.length}</div>
          <div className="text-sm text-orange-500">Órdenes Activas</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{completedWorkOrders.length}</div>
          <div className="text-sm text-green-500">Completadas</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{appointments.length}</div>
          <div className="text-sm text-purple-500">Total Citas</div>
        </div>
      </div>

      {/* Órdenes de trabajo recientes */}
      {workOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Órdenes de Trabajo Recientes</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {workOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{order.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <Badge 
                    variant={order.status === 'completed' ? 'success' : 
                            order.status === 'in-progress' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citas próximas */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Próximas Citas</h3>
          <div className="space-y-2">
            {upcomingAppointments.slice(0, 3).map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {formatDate(appointment.date)} - {appointment.time}
                    </p>
                    {appointment.notes && (
                      <p className="text-xs text-gray-500">{appointment.notes}</p>
                    )}
                  </div>
                  <Badge variant="primary" size="sm">
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VehiclesPage;
