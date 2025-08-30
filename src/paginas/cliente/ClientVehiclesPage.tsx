import { useState } from 'react';
import {
  TruckIcon,
  PlusIcon,
  PhotoIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  licensePlate: string;
  mileage: number;
  photo?: string;
  nextService?: string;
  lastServiceDate?: string;
}

interface VehicleForm {
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  licensePlate: string;
  mileage: number;
}

export function ClientVehiclesPage() {
  const { state } = useApp();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vin: '',
    licensePlate: '',
    mileage: 0
  });

  // Datos de ejemplo con servicios
  const clientVehicles: Vehicle[] = [
    {
      id: '1',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Blanco',
      vin: '1HGBH41JXMN109186',
      licensePlate: 'HTN-0123',
      mileage: 45000,
      nextService: '2025-09-15',
      lastServiceDate: '2025-07-15'
    },
    {
      id: '2',
      brand: 'Honda',
      model: 'Civic',
      year: 2019,
      color: 'Negro',
      vin: '2HGFC2F59HH123456',
      licensePlate: 'HTN-4567',
      mileage: 38000,
      nextService: '2025-10-01',
      lastServiceDate: '2025-06-10'
    },
    {
      id: '3',
      brand: 'Nissan',
      model: 'Sentra',
      year: 2021,
      color: 'Rojo',
      vin: '3N1AB7AP8HY123456',
      licensePlate: 'HTN-8910',
      mileage: 25000,
      nextService: '2025-11-20',
      lastServiceDate: '2025-08-20'
    }
  ];

  const workOrders = [
    { id: 'OT-001', vehicleId: '1', service: 'Mantenimiento General', status: 'in-progress', date: '2025-08-25' },
    { id: 'OT-002', vehicleId: '2', service: 'Reparación de frenos', status: 'pending-parts', date: '2025-08-28' },
    { id: 'OT-003', vehicleId: '1', service: 'Cambio de aceite', status: 'completed', date: '2025-07-15' }
  ];

  const filteredVehicles = clientVehicles.filter(vehicle =>
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVehicleActiveOrders = (vehicleId: string) => {
    return workOrders.filter(order => 
      order.vehicleId === vehicleId && 
      !['completed', 'cancelled'].includes(order.status)
    );
  };

  const getServiceStatus = (vehicle: Vehicle) => {
    const activeOrders = getVehicleActiveOrders(vehicle.id);
    if (activeOrders.length > 0) {
      return { type: 'active', text: 'Servicio en proceso', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (vehicle.nextService) {
      const nextServiceDate = new Date(vehicle.nextService);
      const today = new Date();
      const daysUntil = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (daysUntil <= 7) {
        return { type: 'due-soon', text: 'Servicio próximo', color: 'bg-yellow-100 text-yellow-800' };
      } else if (daysUntil <= 30) {
        return { type: 'scheduled', text: 'Servicio programado', color: 'bg-green-100 text-green-800' };
      }
    }
    
    return { type: 'up-to-date', text: 'Al día', color: 'bg-gray-100 text-gray-800' };
  };

  const handleAddVehicle = () => {
    // Aquí iría la lógica para agregar el vehículo
    console.log('Agregando vehículo:', vehicleForm);
    setShowAddModal(false);
    setVehicleForm({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      vin: '',
      licensePlate: '',
      mileage: 0
    });
  };

  const handleEditVehicle = () => {
    console.log('Editando vehículo:', selectedVehicle);
    setShowEditModal(false);
  };

  const renderVehicleCard = (vehicle: Vehicle) => {
    const serviceStatus = getServiceStatus(vehicle);
    const activeOrders = getVehicleActiveOrders(vehicle.id);

    return (
      <div key={vehicle.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Header con foto */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100">
          {vehicle.photo ? (
            <img src={vehicle.photo} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TruckIcon className="h-16 w-16 text-blue-300 mx-auto mb-2" />
                <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                  <CameraIcon className="h-4 w-4 mr-2" />
                  Agregar Foto
                </button>
              </div>
            </div>
          )}
          
          {/* Badge de estado */}
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${serviceStatus.color} backdrop-blur-sm`}>
              {serviceStatus.text}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-500">Año {vehicle.year} • {vehicle.color}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setShowDetailModal(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalles"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setShowEditModal(true);
                }}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Editar"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Información principal */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Placa</p>
              <p className="text-sm font-semibold text-gray-900">{vehicle.licensePlate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Kilometraje</p>
              <p className="text-sm font-semibold text-gray-900">{vehicle.mileage?.toLocaleString()} km</p>
            </div>
          </div>

          {/* Próximo servicio o servicios activos */}
          {activeOrders.length > 0 ? (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-center mb-2">
                <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600 mr-2" />
                <p className="text-sm font-medium text-blue-900">Servicios Activos</p>
              </div>
              {activeOrders.slice(0, 2).map(order => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">{order.service}</span>
                  <span className="text-blue-600 font-medium">{order.status === 'in-progress' ? 'En proceso' : 'Esperando'}</span>
                </div>
              ))}
            </div>
          ) : vehicle.nextService && (
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-900">Próximo servicio</span>
                </div>
                <span className="text-sm text-green-700">{vehicle.nextService}</span>
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="flex space-x-2">
            <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Agendar Cita
            </button>
            <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <ClockIcon className="h-4 w-4 mr-2" />
              Ver Historial
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddVehicleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Agregar Nuevo Vehículo</h3>
                <p className="text-blue-100 text-sm">Registra tu vehículo en el sistema</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marca *
              </label>
              <input
                type="text"
                value={vehicleForm.brand}
                onChange={(e) => setVehicleForm({...vehicleForm, brand: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Toyota, Honda, Nissan..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Corolla, Civic, Sentra..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm({...vehicleForm, year: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1980"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color *
              </label>
              <input
                type="text"
                value={vehicleForm.color}
                onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Blanco, Negro, Rojo..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Placa *
              </label>
              <input
                type="text"
                value={vehicleForm.licensePlate}
                onChange={(e) => setVehicleForm({...vehicleForm, licensePlate: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="HTN-1234"
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kilometraje Actual
              </label>
              <input
                type="number"
                value={vehicleForm.mileage}
                onChange={(e) => setVehicleForm({...vehicleForm, mileage: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="45000"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              VIN (Número de Identificación) *
            </label>
            <input
              type="text"
              value={vehicleForm.vin}
              onChange={(e) => setVehicleForm({...vehicleForm, vin: e.target.value.toUpperCase()})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
            />
            <p className="text-xs text-gray-500 mt-1">
              El VIN es un código único de 17 caracteres que identifica tu vehículo
            </p>
          </div>

          {/* Foto del vehículo */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Foto del Vehículo (Opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Arrastra una foto aquí o haz clic para seleccionar</p>
              <button className="text-blue-600 font-medium hover:text-blue-500">
                Seleccionar archivo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddVehicle}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Registrar Vehículo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <TruckIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Mis Vehículos</h1>
                  <p className="text-blue-100 text-lg">Gestiona tu flota personal</p>
                </div>
              </div>
              
              {/* Stats rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{clientVehicles.length}</div>
                  <div className="text-blue-100 text-sm">Vehículos Registrados</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">
                    {clientVehicles.filter(v => getVehicleActiveOrders(v.id).length > 0).length}
                  </div>
                  <div className="text-blue-100 text-sm">En Servicio</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">
                    {clientVehicles.filter(v => {
                      const status = getServiceStatus(v);
                      return status.type === 'due-soon';
                    }).length}
                  </div>
                  <div className="text-blue-100 text-sm">Servicios Próximos</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Agregar Vehículo
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo o placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <TruckIcon className="h-5 w-5 text-gray-400 absolute left-3 top-4" />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('grid')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeView === 'grid' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Vista Grid
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeView === 'list' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Vista Lista
              </button>
            </div>
          </div>
        </div>

        {/* Grid de vehículos */}
        {filteredVehicles.length > 0 ? (
          <div className={`grid gap-6 ${
            activeView === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredVehicles.map(renderVehicleCard)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <TruckIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron vehículos' : 'No tienes vehículos registrados'}
            </h3>
            <p className="text-gray-500 mb-8">
              {searchTerm 
                ? `No hay vehículos que coincidan con "${searchTerm}"`
                : 'Comienza agregando tu primer vehículo al sistema'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Agregar Mi Primer Vehículo
              </button>
            )}
          </div>
        )}

        {/* Modales */}
        {showAddModal && renderAddVehicleModal()}
      </div>
    </div>
  );
}
