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
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Recordatorios</h1>
        <p className="text-gray-600">Recordatorios de mantenimiento para tus vehículos</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">{clientReminders.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-lg font-semibold text-green-600">
                {clientReminders.filter(r => r.isActive && !r.isCompleted).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
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
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-lg font-semibold text-gray-600">
                {clientReminders.filter(r => r.isCompleted).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de recordatorios */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {clientReminders.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes recordatorios</h3>
              <p className="text-gray-500">
                Los recordatorios de mantenimiento creados por el taller aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Todos los recordatorios</h2>
              {clientReminders.map(reminder => {
                const status = getReminderStatus(reminder);
                const vehicle = data.getVehicleById(reminder.vehicleId);
                
                return (
                  <div
                    key={reminder.id}
                    className={`p-4 border rounded-lg ${
                      reminder.isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : reminder.isActive
                        ? 'bg-white border-gray-200 hover:border-gray-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-full ${status.bgColor}`}>
                            {getTypeIcon(reminder.type)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {reminder.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>
                                Programado: {formatTriggerValue(reminder)}
                              </span>
                              {vehicle && (
                                <span>
                                  {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {reminder.description && (
                          <p className="text-gray-600 mb-2 ml-14">
                            {reminder.description}
                          </p>
                        )}

                        {reminder.services && reminder.services.length > 0 && (
                          <div className="ml-14">
                            <p className="text-sm text-gray-600">
                              Servicios: {reminder.services.join(', ')}
                            </p>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-400 ml-14">
                          Creado: {formatDate(reminder.createdAt)}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
                          {status.text}
                        </span>
                        
                        {reminder.type === 'mileage' && vehicle?.mileage && (
                          <div className="text-xs text-gray-500 text-right">
                            <div>Kilometraje actual: {vehicle.mileage.toLocaleString()} km</div>
                            <div>
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
  );
}
