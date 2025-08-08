import { useEffect, useState } from 'react';
import {
  TruckIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Card, Badge } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import type { Vehicle, WorkOrder, Part } from '../../tipos/index';
import { mockWorkOrders, mockVehicles, formatCurrency, getStatusText, formatDate } from '../../utilidades/mockData';

export function ClientVehiclesPage() {
  const { state, dispatch } = useApp();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    dispatch({ type: 'SET_WORK_ORDERS', payload: mockWorkOrders });
    dispatch({ type: 'SET_VEHICLES', payload: mockVehicles });
  }, [dispatch]);

  const clientId = state.user?.id;
  const clientVehicles = state.vehicles.filter(vehicle => vehicle.clientId === clientId);
  const clientWorkOrders = state.workOrders.filter(order => order.clientId === clientId);

  const getVehicleWorkOrders = (vehicleId: string) => {
    return clientWorkOrders
      .filter(order => order.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getVehicleStats = (vehicleId: string) => {
    const orders = getVehicleWorkOrders(vehicleId);
    return {
      totalServices: orders.length,
      completedServices: orders.filter(o => o.status === 'completed').length,
      totalSpent: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.finalCost || o.estimatedCost), 0),
      lastService: orders[0],
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Vehículos</h1>
        <p className="text-gray-600">Gestiona y monitorea el historial de tus vehículos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Vehículos */}
        <div className="lg:col-span-1">
          <Card title="Mis Vehículos" subtitle={`${clientVehicles.length} vehículo${clientVehicles.length !== 1 ? 's' : ''} registrado${clientVehicles.length !== 1 ? 's' : ''}`}>
            <div className="space-y-3">
              {clientVehicles.map((vehicle) => {
                const stats = getVehicleStats(vehicle.id);
                const isSelected = selectedVehicle === vehicle.id;
                
                return (
                  <div
                    key={vehicle.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <TruckIcon className={`h-5 w-5 mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-sm text-gray-500">{vehicle.year} • {vehicle.licensePlate}</p>
                        </div>
                      </div>
                      {stats.lastService && (
                        <Badge variant={stats.lastService.status === 'completed' ? 'success' : 'warning'} size="sm">
                          {getStatusText(stats.lastService.status)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Servicios: {stats.totalServices}</div>
                      <div>Invertido: {formatCurrency(stats.totalSpent)}</div>
                    </div>
                    
                    {vehicle.mileage && (
                      <div className="mt-2 text-xs text-gray-500">
                        Kilometraje: {vehicle.mileage.toLocaleString()} km
                      </div>
                    )}
                  </div>
                );
              })}
              
              {clientVehicles.length === 0 && (
                <div className="text-center py-8">
                  <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tienes vehículos registrados</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Contactar al taller para registrar un vehículo
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Detalles del Vehículo Seleccionado */}
        <div className="lg:col-span-2">
          {selectedVehicle ? (
            <VehicleDetails 
              vehicle={clientVehicles.find(v => v.id === selectedVehicle)!}
              workOrders={getVehicleWorkOrders(selectedVehicle)}
            />
          ) : (
            <Card>
              <div className="text-center py-12">
                <TruckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un Vehículo
                </h3>
                <p className="text-gray-500">
                  Haz clic en uno de tus vehículos para ver su historial completo de servicios
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function VehicleDetails({ vehicle, workOrders }: { vehicle: Vehicle; workOrders: WorkOrder[] }) {
  const stats = {
    totalServices: workOrders.length,
    completedServices: workOrders.filter(o => o.status === 'completed').length,
    pendingServices: workOrders.filter(o => ['pending', 'in-progress'].includes(o.status)).length,
    totalSpent: workOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.finalCost || o.estimatedCost), 0),
  };

  return (
    <div className="space-y-6">
      {/* Información del Vehículo */}
      <Card title={`${vehicle.brand} ${vehicle.model} (${vehicle.year})`} subtitle={`Placa: ${vehicle.licensePlate}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalServices}</div>
            <div className="text-sm text-gray-600">Total Servicios</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.completedServices}</div>
            <div className="text-sm text-gray-600">Completados</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.pendingServices}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <CurrencyDollarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</div>
            <div className="text-sm text-gray-600">Invertido</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-700">Color:</span>
            <p className="text-sm text-gray-900">{vehicle.color}</p>
          </div>
          {vehicle.mileage && (
            <div>
              <span className="text-sm font-medium text-gray-700">Kilometraje:</span>
              <p className="text-sm text-gray-900">{vehicle.mileage.toLocaleString()} km</p>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-gray-700">Tipo de Servicio:</span>
            <p className="text-sm text-gray-900">{vehicle.serviceType.name}</p>
          </div>
        </div>
      </Card>

      {/* Historial de Servicios */}
      <Card title="Historial de Servicios" subtitle="Cronología completa de mantenimientos">
        <div className="space-y-4">
          {workOrders.length > 0 ? (
            workOrders.map((order, index) => (
              <div key={order.id} className="relative">
                {/* Línea de tiempo */}
                {index < workOrders.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    order.status === 'completed' 
                      ? 'bg-green-100 border-green-500' 
                      : order.status === 'in-progress'
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-yellow-100 border-yellow-500'
                  }`}>
                    {order.status === 'completed' ? (
                      <WrenchScrewdriverIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <ClockIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{order.description}</h4>
                          <p className="text-sm text-gray-600">{order.problem}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={order.status === 'completed' ? 'success' : order.status === 'in-progress' ? 'primary' : 'warning'}
                            size="sm"
                          >
                            {getStatusText(order.status)}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">
                          Tipo: {getStatusText(order.serviceType)}
                        </span>
                        <span className="text-lg font-medium text-gray-900">
                          {formatCurrency(order.finalCost || order.estimatedCost)}
                        </span>
                      </div>
                      
                      {order.parts && order.parts.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Repuestos utilizados:</h5>
                          <div className="space-y-1">
                            {order.parts.map((part: Part) => (
                              <div key={part.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {part.name} (x{part.quantity})
                                </span>
                                <span className="text-gray-900">
                                  {formatCurrency(part.cost * part.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {order.notes && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start">
                            <DocumentTextIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">Notas del técnico:</p>
                              <p className="text-sm text-blue-700">{order.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {order.recommendations && (
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-start">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Recomendaciones:</p>
                              <p className="text-sm text-yellow-700">{order.recommendations}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <span className={`text-sm font-medium ${
                          order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Estado de pago: {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                        {order.completedDate && (
                          <span className="text-sm text-gray-500">
                            Completado: {formatDate(order.completedDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <WrenchScrewdriverIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay servicios registrados para este vehículo</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
