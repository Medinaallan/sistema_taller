import { useState, useEffect } from 'react';
import { Reminder, Vehicle } from '../../tipos';
import { mockReminders } from '../../utilidades/globalMockDatabase';
import { useApp } from '../../contexto/useApp';
import useInterconnectedData from '../../contexto/useInterconnectedData';

interface ReminderFormData {
  title: string;
  description: string;
  type: 'date' | 'mileage';
  triggerValue: string;
  vehicleId: string;
  clientId: string;
  services: string[];
}

export default function RemindersPage() {
  const { state, dispatch } = useApp();
  const data = useInterconnectedData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [selectedClientVehicles, setSelectedClientVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    type: 'date',
    triggerValue: '',
    vehicleId: '',
    clientId: '',
    services: []
  });

  useEffect(() => {
    // Cargar datos iniciales si no están cargados
    if (!state.reminders || state.reminders.length === 0) {
      dispatch({ type: 'SET_REMINDERS', payload: mockReminders });
    }
  }, [dispatch, state.reminders]);

  useEffect(() => {
    // Actualizar vehículos cuando se selecciona un cliente
    if (formData.clientId) {
      const clientVehicles = data.getVehiclesByClient(formData.clientId);
      setSelectedClientVehicles(clientVehicles);
      
      // Limpiar vehículo seleccionado si no pertenece al cliente
      if (!clientVehicles.find(v => v.id === formData.vehicleId)) {
        setFormData(prev => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setSelectedClientVehicles([]);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.clientId, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReminder: Reminder = {
      id: selectedReminder?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      triggerValue: formData.type === 'date' 
        ? new Date(formData.triggerValue) 
        : parseInt(formData.triggerValue),
      vehicleId: formData.vehicleId,
      clientId: formData.clientId,
      services: formData.services,
      isActive: true,
      isCompleted: false,
      createdAt: selectedReminder?.createdAt || new Date()
    };

    if (selectedReminder) {
      dispatch({ type: 'UPDATE_REMINDER', payload: newReminder });
    } else {
      dispatch({ type: 'ADD_REMINDER', payload: newReminder });
    }

    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReminder(null);
    setSelectedClientVehicles([]);
    setFormData({
      title: '',
      description: '',
      type: 'date',
      triggerValue: '',
      vehicleId: '',
      clientId: '',
      services: []
    });
  };

  const handleEdit = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      type: reminder.type,
      triggerValue: reminder.type === 'date' 
        ? reminder.triggerValue instanceof Date 
          ? reminder.triggerValue.toISOString().split('T')[0]
          : new Date(reminder.triggerValue).toISOString().split('T')[0]
        : reminder.triggerValue.toString(),
      vehicleId: reminder.vehicleId,
      clientId: reminder.clientId,
      services: reminder.services
    });
    setIsModalOpen(true);
  };

  const toggleReminder = (id: string) => {
    const reminder = state.reminders?.find(r => r.id === id);
    if (reminder) {
      dispatch({ 
        type: 'UPDATE_REMINDER', 
        payload: { ...reminder, isActive: !reminder.isActive }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) {
      dispatch({ type: 'DELETE_REMINDER', payload: id });
    }
  };

  const handleComplete = (id: string) => {
    const reminder = state.reminders?.find(r => r.id === id);
    if (reminder) {
      dispatch({ 
        type: 'UPDATE_REMINDER', 
        payload: { ...reminder, isCompleted: true }
      });
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const reminders = state.reminders || [];
  const clients = state.clients || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recordatorios</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5z"/>
          </svg>
          Nuevo Recordatorio
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">{reminders.length}</p>
            </div>
            <div className="flex items-center justify-center h-12 w-12 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {reminders.filter(r => r.isActive && !r.isCompleted).length}
              </p>
            </div>
            <div className="flex items-center justify-center h-12 w-12 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-lg font-semibold text-blue-600">
                {reminders.filter(r => r.isCompleted).length}
              </p>
            </div>
            <div className="flex items-center justify-center h-12 w-12 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-lg font-semibold text-gray-600">
                {reminders.filter(r => !r.isActive).length}
              </p>
            </div>
            <div className="flex items-center justify-center h-12 w-12 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de recordatorios */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay recordatorios creados.</p>
            </div>
          ) : (
            reminders.map(reminder => (
              <div
                key={reminder.id}
                className={`p-4 border rounded-lg mb-4 ${
                  reminder.isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : reminder.isActive 
                      ? 'bg-white border-gray-200' 
                      : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {reminder.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{reminder.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>
                        Tipo: {reminder.type === 'date' ? 'Fecha' : 'Kilometraje'}
                      </span>
                      <span>
                        Activador: {reminder.type === 'date' 
                          ? (reminder.triggerValue instanceof Date 
                              ? formatDate(reminder.triggerValue)
                              : formatDate(new Date(reminder.triggerValue)))
                          : `${reminder.triggerValue} km`
                        }
                      </span>
                      {reminder.clientId && (
                        <span>
                          Cliente: {data.getClientById(reminder.clientId)?.name || 'No encontrado'}
                        </span>
                      )}
                      {reminder.vehicleId && (
                        <span>
                          Vehículo: {data.getVehicleById(reminder.vehicleId)?.licensePlate || 'No encontrado'}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Creado: {formatDate(reminder.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!reminder.isCompleted && reminder.isActive && (
                      <button
                        onClick={() => handleComplete(reminder.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Marcar como completado"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`${
                        reminder.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                      }`}
                      title={reminder.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {reminder.isActive ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01"/>
                        )}
                      </svg>
                    </button>

                    <button
                      onClick={() => handleEdit(reminder)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 5 4 4-8 8H7v-4z"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedReminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'date' | 'mileage' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="date">Fecha</option>
                      <option value="mileage">Kilometraje</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="triggerValue" className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.type === 'date' ? 'Fecha *' : 'Kilometraje *'}
                    </label>
                    <input
                      type={formData.type === 'date' ? 'date' : 'number'}
                      id="triggerValue"
                      value={formData.triggerValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, triggerValue: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente
                    </label>
                    <select
                      id="clientId"
                      value={formData.clientId}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-2">
                      Vehículo
                    </label>
                    <select
                      id="vehicleId"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.clientId}
                    >
                      <option value="">Seleccionar vehículo</option>
                      {selectedClientVehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {selectedReminder ? 'Actualizar' : 'Crear'} Recordatorio
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
