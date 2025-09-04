import { useState, useEffect } from 'react';
import { useApp } from '../../contexto/useApp';
import { Reminder } from '../../tipos';
import { getClientReminders } from '../../utilidades/mockData';
import useInterconnectedData from '../../contexto/useInterconnectedData';

export default function ClientRemindersPage() {
  const { state } = useApp();
  const data = useInterconnectedData();
  const [clientReminders, setClientReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    // Solo cargar recordatorios si el usuario está autenticado y es cliente
    if (state.user && state.user.role === 'client') {
      // Buscar el cliente que corresponde al usuario autenticado
      const client = state.clients.find(c => c.email === state.user?.email);
      let reminders: Reminder[] = [];
      if (client) {
        reminders = getClientReminders(client.id);
      } else {
        reminders = getClientReminders(state.user.id);
      }
      // Si no hay recordatorios, mostrar dos ejemplos mock
      if (reminders.length === 0) {
        reminders = [
          {
            id: 'mock-1',
            vehicleId: 'vehicle-mock-1',
            clientId: client?.id || state.user.id,
            type: 'date',
            title: 'Mantenimiento Toyota Corolla',
            description: 'Cambio de aceite y revisión general.',
            triggerValue: new Date('2025-10-01'),
            isActive: true,
            isCompleted: false,
            services: ['Cambio de aceite', 'Revisión de frenos'],
            createdAt: new Date('2024-09-01'),
            triggerDate: new Date('2025-09-04'),
          },
          {
            id: 'mock-2',
            vehicleId: 'vehicle-mock-2',
            clientId: client?.id || state.user.id,
            type: 'mileage',
            title: 'Servicio mayor Honda CRV',
            description: 'Reemplazo de banda de distribución y revisión completa.',
            triggerValue: 125000,
            currentValue: 120000,
            isActive: true,
            isCompleted: false,
            services: ['Banda de distribución', 'Revisión general'],
            createdAt: new Date('2025-09-04'),
          },
        ];
      }
      setClientReminders(reminders);
    }
  }, [state.user, state.clients]);

  const formatDate = (date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTriggerValue = (reminder: Reminder): string => {
    if (reminder.type === 'date') {
      return formatDate(reminder.triggerValue as Date);
    } else {
      return `${(reminder.triggerValue as number).toLocaleString()} km`;
    }
  };

  const getReminderStatus = (reminder: Reminder): { text: string; color: string; bgColor: string } => {
    if (reminder.isCompleted) {
      return { text: 'Completado', color: 'text-green-800', bgColor: 'bg-green-100' };
    }
    
    if (!reminder.isActive) {
      return { text: 'Inactivo', color: 'text-gray-800', bgColor: 'bg-gray-100' };
    }

    if (reminder.type === 'date') {
      const triggerDate = new Date(reminder.triggerValue);
      const today = new Date();
      const diffTime = triggerDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: 'Vencido', color: 'text-red-800', bgColor: 'bg-red-100' };
      } else if (diffDays <= 7) {
        return { text: 'Próximo', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
      } else {
        return { text: 'Programado', color: 'text-blue-800', bgColor: 'bg-blue-100' };
      }
    } else {
      // Para recordatorios por kilometraje, necesitamos el kilometraje actual del vehículo
      const vehicle = data.getVehicleById(reminder.vehicleId);
      if (vehicle && vehicle.mileage) {
        const remaining = (reminder.triggerValue as number) - vehicle.mileage;
        if (remaining <= 0) {
          return { text: 'Vencido', color: 'text-red-800', bgColor: 'bg-red-100' };
        } else if (remaining <= 1000) {
          return { text: 'Próximo', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
        } else {
          return { text: 'Programado', color: 'text-blue-800', bgColor: 'bg-blue-100' };
        }
      }
      return { text: 'Programado', color: 'text-blue-800', bgColor: 'bg-blue-100' };
    }
  };

  const getTypeIcon = (type: 'date' | 'mileage') => {
    if (type === 'date') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      );
    }
  };

  if (!state.user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Debe iniciar sesión para ver sus recordatorios.</p>
        </div>
      </div>
    );
  }

  if (state.user.role !== 'client') {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Esta página es solo para clientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Encabezado responsivo */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8 shadow-xl">
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Mis Recordatorios</h1>
              <p className="text-purple-100 text-sm sm:text-base lg:text-lg">Recordatorios de mantenimiento para tus vehículos</p>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas responsivas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-semibold text-gray-900">{clientReminders.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full self-end sm:self-auto">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Activos</p>
                <p className="text-lg font-semibold text-green-600">
                  {clientReminders.filter(r => r.isActive && !r.isCompleted).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full self-end sm:self-auto">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-lg font-semibold text-red-600">
                  {clientReminders.filter(r => {
                    if (!r.isActive || r.isCompleted) return false;
                    if (r.type === 'date') {
                      return new Date(r.triggerValue) < new Date();
                    }
                    return false;
                  }).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-full self-end sm:self-auto">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completados</p>
                <p className="text-lg font-semibold text-gray-600">
                  {clientReminders.filter(r => r.isCompleted).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gray-100 rounded-full self-end sm:self-auto">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de recordatorios responsiva */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 sm:p-6 lg:p-8">
            {clientReminders.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="p-3 sm:p-4 bg-gray-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5z"/>
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tienes recordatorios</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Los recordatorios de mantenimiento creados por el taller aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Todos los recordatorios</h2>
                {clientReminders.map(reminder => {
                  const status = getReminderStatus(reminder);
                  const vehicle = data.getVehicleById(reminder.vehicleId);
                  
                  return (
                    <div
                      key={reminder.id}
                      className={`p-3 sm:p-4 lg:p-6 border rounded-lg sm:rounded-xl transition-all duration-200 ${
                        reminder.isCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : reminder.isActive
                          ? 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-start space-x-3 mb-2 sm:mb-3">
                            <div className={`p-2 rounded-full flex-shrink-0 ${status.bgColor}`}>
                              {getTypeIcon(reminder.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words">
                                {reminder.title}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600 mt-1">
                                <span className="break-words">
                                  Programado: {formatTriggerValue(reminder)}
                                </span>
                                {vehicle && (
                                  <span className="break-words">
                                    {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {reminder.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 ml-10 sm:ml-14 break-words">
                              {reminder.description}
                            </p>
                          )}

                          {reminder.services && reminder.services.length > 0 && (
                            <div className="ml-10 sm:ml-14">
                              <p className="text-xs sm:text-sm text-gray-600 break-words">
                                Servicios: {reminder.services.join(', ')}
                              </p>
                            </div>
                          )}

                          <div className="mt-2 text-xs text-gray-400 ml-10 sm:ml-14">
                            Creado: {formatDate(reminder.createdAt)}
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-2">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${status.color} ${status.bgColor} whitespace-nowrap`}>
                            {status.text}
                          </span>
                          
                          {reminder.type === 'mileage' && vehicle?.mileage && (
                            <div className="text-xs text-gray-500 text-right">
                              <div className="hidden sm:block">Kilometraje actual: {vehicle.mileage.toLocaleString()} km</div>
                              <div className="sm:hidden">Actual: {vehicle.mileage.toLocaleString()} km</div>
                              <div className="hidden sm:block">
                                Faltan: {Math.max(0, (reminder.triggerValue as number) - vehicle.mileage).toLocaleString()} km
                              </div>
                              <div className="sm:hidden">
                                Faltan: {Math.max(0, (reminder.triggerValue as number) - vehicle.mileage).toLocaleString()} km
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
