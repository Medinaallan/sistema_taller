import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import useInterconnectedData from '../../contexto/useInterconnectedData';
import { useBusinessLogs } from '../../hooks/useBusinessLogs';
import { mockVehicles, formatDate } from '../../utilidades/globalMockDatabase';
import { vehiclesService, clientService } from '../../servicios/apiService';
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
    vin: vehicle?.vin || '',
    numeroMotor: vehicle?.numeroMotor || '', // Campo nuevo del SP
    fotoUrl: vehicle?.fotoUrl || '', // Campo nuevo del SP
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

    // Solo validar campos obligatorios según el SP
    if (!formData.clientId) {
      newErrors.clientId = 'Debe ingresar el ID del cliente';
    } else {
      const clientIdNum = parseInt(formData.clientId.toString());
      if (isNaN(clientIdNum) || clientIdNum <= 0) {
        newErrors.clientId = 'El ID del cliente debe ser un número positivo';
      }
    }
    if (!formData.brand.trim()) newErrors.brand = 'La marca es requerida';
    if (!formData.model.trim()) newErrors.model = 'El modelo es requerido';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'El año debe estar entre 1900 y el próximo año';
    }
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'La placa es requerida';
    // Color es opcional según el SP - no validar como obligatorio

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
      vin: formData.vin.trim(),
      numeroMotor: formData.numeroMotor.trim(),
      fotoUrl: formData.fotoUrl.trim(),
      serviceType: {
        id: 'default',
        name: 'Servicio General',
        description: 'Servicio general',
        basePrice: 0,
        estimatedDuration: 1,
      },
    });
  };

  // Filtrar solo clientes con ID numérico (de la base de datos)
  const numericClients = clients.filter(client => {
    const numericId = parseInt(client.id);
    return !isNaN(numericId);
  });
  
  const clientOptions = [
    { value: '', label: 'Selecciona un cliente...' },
    ...numericClients.map(client => ({
      value: client.id,
      label: `${client.name} (ID: ${client.id})`
    }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        {clientOptions.length > 1 ? (
          <Select
            label="Cliente"
            name="clientId"
            value={formData.clientId}
            onChange={handleInputChange}
            options={clientOptions}
            error={errors.clientId}
            required
          />
        ) : (
          <div>
            <Input
              label="ID del Cliente"
              name="clientId"
              type="number"
              value={formData.clientId}
              onChange={handleInputChange}
              error={errors.clientId}
              placeholder="Ej: 1, 2, 3..."
              required
            />
            <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400">
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">\ud83d\udcdd Instrucciones:</p>
                <p>\u2022 Ingresa el ID num\u00e9rico del cliente de la base de datos</p>
                <p>\u2022 Los clientes registrados tienen IDs como: 1, 2, 3, 4, 5...</p>
                <p>\u2022 Si el ID no existe, aparecer\u00e1 un error de clave for\u00e1nea</p>
              </div>
            </div>
          </div>
        )}
        
        {clientOptions.length <= 1 && (
          <p className="text-sm text-amber-600 mt-1">
            \u26a0\ufe0f No se pudieron cargar clientes de la BD. Usar ID manual.
          </p>
        )}
      </div>

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
          label="Color (opcional)"
          name="color"
          value={formData.color}
          onChange={handleInputChange}
          error={errors.color}
          placeholder="Blanco"
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

        <Input
          label="VIN (opcional)"
          name="vin"
          value={formData.vin}
          onChange={handleInputChange}
          error={errors.vin}
          placeholder="1HGBH41JXMN109186"
          maxLength={17}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Número de Motor (opcional)"
          name="numeroMotor"
          value={formData.numeroMotor}
          onChange={handleInputChange}
          error={errors.numeroMotor}
          placeholder="ABC123456789"
        />

        <Input
          label="URL de Foto (opcional)"
          name="fotoUrl"
          value={formData.fotoUrl}
          onChange={handleInputChange}
          error={errors.fotoUrl}
          placeholder="https://ejemplo.com/foto.jpg"
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
  const businessLogs = useBusinessLogs();
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
        // Map stored procedure data to Vehicle format
        const mappedVehicles = response.data.map((spVehicle: any) => ({
          id: spVehicle.vehiculo_id?.toString() || spVehicle.id,
          clientId: spVehicle.cliente_id?.toString() || spVehicle.clientId,
          brand: spVehicle.marca,
          model: spVehicle.modelo,
          year: parseInt(spVehicle.anio),
          licensePlate: spVehicle.placa,
          color: spVehicle.color,
          mileage: parseInt(spVehicle.kilometraje) || 0,
          vin: spVehicle.vin || '',
          numeroMotor: spVehicle.numero_motor || '',
          fotoUrl: spVehicle.foto_url || '',
          serviceType: {
            id: 'default',
            name: 'Servicio General',
            description: 'Servicio general',
            basePrice: 0,
            estimatedDuration: 1,
          },
          workOrders: [],
          reminders: [],
          createdAt: new Date(spVehicle.fecha_creacion || Date.now()),
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

  // Cargar clientes desde la API
  const loadClients = async () => {
    try {
      console.log('\ud83d\udccb Cargando clientes desde API...');
      const response = await clientService.getRegisteredClients();
      if (response.success && response.data && response.data.length > 0) {
        const clients: Client[] = response.data.map((apiClient: any) => ({
          id: apiClient.id?.toString(),
          name: apiClient.name || apiClient.fullName || 'Cliente',
          phone: apiClient.phone || '',
          email: apiClient.email || '',
          address: apiClient.address || '',
          password: '', // No necesario para la interfaz
          vehicles: [], // Se cargan por separado
          createdAt: new Date(apiClient.createdAt || Date.now()),
          updatedAt: new Date()
        }));
        console.log('\u2705 Clientes cargados:', clients.length);
        dispatch({ type: 'SET_CLIENTS', payload: clients });
      } else {
        console.log('\u26a0\ufe0f No se obtuvieron clientes de la API, usando fallback vac\u00edo');
        dispatch({ type: 'SET_CLIENTS', payload: [] });
      }
    } catch (error) {
      console.error('\u274c Error loading clients:', error);
      dispatch({ type: 'SET_CLIENTS', payload: [] });
    }
  };

  useEffect(() => {
    // Load data on component mount
    loadVehicles();
    loadClients(); // Cargar clientes desde API
  }, [dispatch]);

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
        
        // Obtener información del cliente para el log
        const client = data.getClientById(vehicle.clientId);
        const clientName = client ? client.name : `Cliente ID: ${vehicle.clientId}`;
        
        const response = await vehiclesService.delete(vehicle.id);
        
        if (response.success) {
          // Generar log de negocio con datos reales
          await businessLogs.logCustomAction(
            'DELETE',
            'vehicle',
            vehicle.id,
            `Vehículo eliminado: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) - Cliente: ${clientName}`,
            {
              brand: vehicle.brand,
              model: vehicle.model,
              licensePlate: vehicle.licensePlate,
              clientId: vehicle.clientId,
              clientName: clientName
            }
          );
          
          data.deleteVehicleWithRelations(vehicle.id);
          
          // Forzar actualización de estadísticas del dashboard
          dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
          
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
        // Update vehicle via API using SP fields
        const updateData = {
          marca: vehicleData.brand,
          modelo: vehicleData.model,
          anio: vehicleData.year,
          placa: vehicleData.licensePlate,
          color: vehicleData.color,
          vin: vehicleData.vin || null,
          numero_motor: vehicleData.numeroMotor || null,
          kilometraje: vehicleData.mileage || null,
          foto_url: vehicleData.fotoUrl || null,
        };
        
        const response = await vehiclesService.update(selectedVehicle.id, updateData);
        
        if (response.success) {
          // Update local state
          const updatedVehicle: Vehicle = {
            ...selectedVehicle,
            ...vehicleData,
            updatedAt: new Date(),
          };
          
          // Detectar cambios para el log
          const changes: any = {};
          if (selectedVehicle.brand !== vehicleData.brand) changes.brand = { old: selectedVehicle.brand, new: vehicleData.brand };
          if (selectedVehicle.model !== vehicleData.model) changes.model = { old: selectedVehicle.model, new: vehicleData.model };
          if (selectedVehicle.licensePlate !== vehicleData.licensePlate) changes.licensePlate = { old: selectedVehicle.licensePlate, new: vehicleData.licensePlate };
          if (selectedVehicle.color !== vehicleData.color) changes.color = { old: selectedVehicle.color, new: vehicleData.color };
          if (selectedVehicle.mileage !== vehicleData.mileage) changes.mileage = { old: selectedVehicle.mileage, new: vehicleData.mileage };
          
          // Generar log de negocio con datos reales
          await businessLogs.logVehicleUpdated(updatedVehicle, changes);
          
          dispatch({ type: 'UPDATE_VEHICLE', payload: updatedVehicle });
          
          // Actualizar estadísticas del dashboard
          dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
          
          setIsModalOpen(false);
          alert('Vehículo actualizado exitosamente');
        } else {
          alert('Error al actualizar el vehículo: ' + response.message);
        }
      } else {
        // Create new vehicle - USA EXACTAMENTE EL MISMO ENDPOINT DEL TEST QUE FUNCIONÓ
        console.log('🚗 Creando vehículo desde formulario...');
        
        // Convertir clientId a número exactamente como en el test
        const clienteIdNumerico = parseInt(vehicleData.clientId);
        if (isNaN(clienteIdNumerico)) {
          alert('Error: Solo se pueden asignar clientes con ID numérico válido');
          return;
        }
        
        // Usar exactamente la misma estructura de datos que en el test exitoso
        const vehiclePayload = {
          cliente_id: clienteIdNumerico,
          marca: vehicleData.brand,
          modelo: vehicleData.model,
          anio: vehicleData.year,
          placa: vehicleData.licensePlate,
          color: vehicleData.color || '',
          vin: vehicleData.vin || '',
          numero_motor: vehicleData.numeroMotor || '',
          kilometraje: vehicleData.mileage || 0,
          foto_url: vehicleData.fotoUrl || ''
        };
        
        console.log('📤 Enviando payload:', vehiclePayload);
        
        // USAR EL MISMO ENDPOINT DIRECTO QUE EN EL TEST
        const response = await fetch('http://localhost:3001/api/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehiclePayload)
        });
        
        const result = await response.json();
        console.log('📥 Respuesta del servidor:', result);
        
        if (response.ok && result.success) {
          console.log('✅ Vehículo creado exitosamente:', result.data);
          
          // Mapear respuesta del SP a formato Vehicle
          const newVehicle: Vehicle = {
            id: result.data.vehiculo_id?.toString() || result.data.id,
            clientId: result.data.cliente_id?.toString() || vehicleData.clientId,
            brand: result.data.marca,
            model: result.data.modelo,
            year: parseInt(result.data.anio),
            licensePlate: result.data.placa,
            color: result.data.color || '',
            vin: result.data.vin || '',
            numeroMotor: result.data.numero_motor || '',
            fotoUrl: result.data.foto_url || '',
            mileage: parseInt(result.data.kilometraje) || 0,
            serviceType: vehicleData.serviceType,
            workOrders: [],
            reminders: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Obtener información del cliente para el log
          const client = data.getClientById(newVehicle.clientId);
          const clientName = client ? client.name : `Cliente ID: ${newVehicle.clientId}`;
          
          // Generar log de negocio con datos reales
          await businessLogs.logVehicleCreated(newVehicle, clientName);
          
          dispatch({ type: 'ADD_VEHICLE', payload: newVehicle });
          
          // Actualizar estadísticas del dashboard
          dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
          
          setIsModalOpen(false);
          alert(`✅ Vehículo creado exitosamente: ${result.data.marca} ${result.data.modelo} (ID: ${result.data.vehiculo_id})`);
          
          // Recargar vehículos para mostrar el nuevo
          loadVehicles();
        } else {
          console.error('❌ Error al crear vehículo:', result);
          alert(`Error al crear el vehículo: ${result.message || 'Error desconocido'}`);
        }
      }
    } catch (error) {
      console.error('❌ Error en operación de vehículo:', error);
      alert('Error de conexión al procesar la operación');
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
            {vehicle.vin && (
              <div>
                <dt className="text-sm font-medium text-gray-500">VIN</dt>
                <dd className="text-sm text-gray-900 font-mono">{vehicle.vin}</dd>
              </div>
            )}
            {vehicle.numeroMotor && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Número de Motor</dt>
                <dd className="text-sm text-gray-900 font-mono">{vehicle.numeroMotor}</dd>
              </div>
            )}
            {vehicle.fotoUrl && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Foto</dt>
                <dd className="text-sm text-gray-900">
                  <img 
                    src={vehicle.fotoUrl} 
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                  />
                </dd>
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
