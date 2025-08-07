import { useEffect } from 'react';
import {
  TruckIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/AppContext';
import { mockWorkOrders, mockVehicles, mockReminders, formatCurrency, getStatusColor, getStatusText, formatDate } from '../../utilidades/mockData';

export function ClientDashboardPage() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    // Cargar datos del cliente
    dispatch({ type: 'SET_WORK_ORDERS', payload: mockWorkOrders });
    dispatch({ type: 'SET_VEHICLES', payload: mockVehicles });
    dispatch({ type: 'SET_REMINDERS', payload: mockReminders });
  }, [dispatch]);

  // Filtrar datos por el cliente actual
  const clientId = state.user?.id;
  const clientVehicles = state.vehicles.filter(vehicle => vehicle.clientId === clientId);
  const clientWorkOrders = state.workOrders.filter(order => order.clientId === clientId);
  const clientReminders = state.reminders.filter(reminder => reminder.clientId === clientId);
  
  // Estadísticas del cliente
  const activeOrders = clientWorkOrders.filter(order => ['pending', 'in-progress'].includes(order.status));
  const completedOrders = clientWorkOrders.filter(order => order.status === 'completed');
  const totalSpent = completedOrders.reduce((sum, order) => sum + (order.finalCost || order.estimatedCost), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Panel de Control</h1>
        <p className="text-gray-600">Bienvenido, {state.user?.name}</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mis Vehículos</p>
              <p className="text-2xl font-bold text-gray-900">{clientVehicles.length}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-500">
              <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Órdenes Activas</p>
              <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-500">
              <BellIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recordatorios</p>
              <p className="text-2xl font-bold text-gray-900">{clientReminders.length}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invertido</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mis Vehículos */}
        <Card title="Mis Vehículos" subtitle="Estado actual de tus vehículos">
          <div className="space-y-3">
            {clientVehicles.length > 0 ? (
              clientVehicles.map((vehicle) => {
                const lastOrder = clientWorkOrders
                  .filter(order => order.vehicleId === vehicle.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                
                return (
                  <div key={vehicle.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </h4>
                        <p className="text-sm text-gray-500">
                          Placa: {vehicle.licensePlate} • Color: {vehicle.color}
                        </p>
                        {vehicle.mileage && (
                          <p className="text-sm text-gray-500">
                            Kilometraje: {vehicle.mileage.toLocaleString()} km
                          </p>
                        )}
                      </div>
                      {lastOrder && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lastOrder.status)}`}>
                          {getStatusText(lastOrder.status)}
                        </span>
                      )}
                    </div>
                    {lastOrder && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Último servicio: {lastOrder.description} - {formatDate(lastOrder.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No tienes vehículos registrados</p>
            )}
          </div>
        </Card>

        {/* Órdenes de Trabajo Activas */}
        <Card title="Mis Servicios en Proceso" subtitle="Órdenes de trabajo actuales">
          <div className="space-y-3">
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => {
                const vehicle = clientVehicles.find(v => v.id === order.vehicleId);
                return (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.description}</h4>
                        <p className="text-sm text-gray-500">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'} • {vehicle?.licensePlate}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{order.problem}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        Creado: {formatDate(order.createdAt)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(order.estimatedCost)}
                      </span>
                    </div>
                    {order.notes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <strong>Notas del técnico:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No tienes servicios en proceso</p>
            )}
          </div>
        </Card>

        {/* Recordatorios Activos */}
        <Card title="Recordatorios de Mantenimiento" subtitle="Servicios próximos a vencer">
          <div className="space-y-3">
            {clientReminders.filter(r => r.isActive && !r.isCompleted).length > 0 ? (
              clientReminders.filter(r => r.isActive && !r.isCompleted).map((reminder) => {
                const vehicle = clientVehicles.find(v => v.id === reminder.vehicleId);
                const isOverdue = reminder.type === 'date' && new Date(reminder.triggerValue as Date) < new Date();
                const isDueSoon = reminder.type === 'mileage' && vehicle?.mileage && 
                  (reminder.triggerValue as number) - vehicle.mileage <= 2000;
                
                return (
                  <div key={reminder.id} className={`p-4 rounded-lg border ${
                    isOverdue ? 'bg-red-50 border-red-200' : 
                    isDueSoon ? 'bg-yellow-50 border-yellow-200' : 
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        {isOverdue || isDueSoon ? (
                          <BellIcon className={`h-5 w-5 mr-2 ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} />
                        ) : (
                          <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{reminder.title}</h4>
                          <p className="text-sm text-gray-600">
                            {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'} • {vehicle?.licensePlate}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isOverdue ? 'bg-red-100 text-red-800' :
                        isDueSoon ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {isOverdue ? 'Vencido' : isDueSoon ? 'Próximo' : 'Programado'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {reminder.type === 'date' ? 
                        `Fecha: ${formatDate(reminder.triggerValue as Date)}` :
                        `Kilometraje: ${(reminder.triggerValue as number).toLocaleString()} km`
                      }
                    </div>
                    {reminder.services.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Servicios sugeridos:</p>
                        <p className="text-xs text-gray-600">{reminder.services.join(', ')}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No tienes recordatorios activos</p>
            )}
          </div>
        </Card>

        {/* Historial Reciente */}
        <Card title="Historial Reciente" subtitle="Últimos servicios completados">
          <div className="space-y-3">
            {completedOrders.slice(0, 3).length > 0 ? (
              completedOrders.slice(0, 3).map((order) => {
                const vehicle = clientVehicles.find(v => v.id === order.vehicleId);
                return (
                  <div key={order.id} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{order.description}</p>
                      <p className="text-sm text-gray-500">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'} • 
                        {order.completedDate && ` ${formatDate(order.completedDate)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.finalCost || order.estimatedCost)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No hay servicios completados</p>
            )}
          </div>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card title="Acciones Rápidas">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
            <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Solicitar Servicio</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
            <ClockIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Agendar Cita</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200">
            <TruckIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Mis Vehículos</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200">
            <BellIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">Recordatorios</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
