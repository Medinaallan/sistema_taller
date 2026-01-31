import { useState, useEffect } from 'react';
import { Reminder, Vehicle } from '../../tipos';
import { useApp } from '../../contexto/useApp';
import useInterconnectedData from '../../contexto/useInterconnectedData';
import remindersService from '../../servicios/remindersService';
import clientesService, { Cliente } from '../../servicios/clientesService';
import { showError, showSuccess, showConfirm } from '../../utilidades/sweetAlertHelpers';

interface ReminderFormData {
  title: string;
  description: string;
  triggerValue: string;
  vehicleId: string;
  clientId: string;
  type?: 'date' | 'mileage';
  priority?: number;
  services: string[];
}

export default function RemindersPage() {
  const { state, dispatch } = useApp();
  const data = useInterconnectedData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [selectedClientVehicles, setSelectedClientVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    type: 'date',
    triggerValue: '',
    vehicleId: '',
    clientId: '',
    priority: 3,
    services: []
  });

  const getUserId = () => {
    const u = (state as any).user;
    if (!u) return null;
    return u.id ?? u.usuario_id ?? u.user_id ?? u.uid ?? u.id_usuario ?? null;
  };

  // Cargar clientes desde la API
  const loadClients = async () => {
    try {
      const response = await clientesService.obtenerClientes();
      if (response.success && response.data) {
        const clientsArray = Array.isArray(response.data) ? response.data : [response.data];
        setClients(clientsArray);
        console.log('✅ Clientes cargados:', clientsArray.length);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  // Cargar recordatorios desde la API
  const loadReminders = async () => {
    setLoading(true);
    try {
      const response = await remindersService.obtenerRecordatorios();
      if (response.success && response.data) {
        const remindersArray = Array.isArray(response.data) ? response.data : [response.data];
        setReminders(remindersArray as Reminder[]);
        dispatch({ type: 'SET_REMINDERS', payload: remindersArray as Reminder[] });
      }
    } catch (error) {
      console.error('Error al cargar recordatorios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
    loadReminders();
  }, []);

  // Cargar vehículos de un cliente desde la API
  const loadClientVehicles = async (clientId: string) => {
    try {
      console.log('🚗 Cargando vehículos del cliente:', clientId);
      const response = await fetch(`http://localhost:8080/api/vehicles/client/${clientId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const vehiclesArray = Array.isArray(data.data) ? data.data : [data.data];
        // Mapear los vehículos a la estructura esperada
        const mappedVehicles = vehiclesArray.map((v: any) => ({
          id: v.vehiculo_id?.toString() || v.id?.toString(),
          brand: v.marca || '',
          model: v.modelo || '',
          year: v.anio || 0,
          licensePlate: v.placa || '',
          color: v.color || '',
          clientId: v.cliente_id?.toString() || clientId
        }));
        setSelectedClientVehicles(mappedVehicles);
        console.log('✅ Vehículos cargados:', mappedVehicles.length);
      } else {
        setSelectedClientVehicles([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar vehículos:', error);
      setSelectedClientVehicles([]);
    }
  };

  useEffect(() => {
    // Actualizar vehículos cuando se selecciona un cliente
    if (formData.clientId) {
      loadClientVehicles(formData.clientId);
      
      // Limpiar vehículo seleccionado
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    } else {
      setSelectedClientVehicles([]);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const reminderData = {
        title: formData.title,
        description: formData.description,
        // Only date reminders supported: send full datetime string
        triggerValue: formData.triggerValue && formData.triggerValue.length === 10 ? `${formData.triggerValue}T00:00:00` : formData.triggerValue,
        vehicleId: formData.vehicleId || null,
        clientId: formData.clientId,
        priority: formData.priority || 3,
        createdBy: getUserId(),
        services: formData.services
      };

      if (selectedReminder) {
        // Actualizar recordatorio existente
        const response = await remindersService.actualizarRecordatorio(
          selectedReminder.id,
          { ...reminderData, isActive: selectedReminder.isActive, isCompleted: selectedReminder.isCompleted, editado_por: Number(getUserId()) }
        );

        if (!response || !response.success) {
          console.debug('Actualizar recordatorio - respuesta del servidor:', response);
        }

        if (response && response.success) {
          showSuccess('Recordatorio actualizado correctamente');
          await loadReminders();
          handleCloseModal();
        } else {
          showError('Error al actualizar recordatorio: ' + (response?.message || 'Error desconocido'));
        }
      } else {
        // Crear nuevo recordatorio
        const response = await remindersService.crearRecordatorio(reminderData);
        if (response && response.success) {
          showSuccess('Recordatorio creado correctamente');
          await loadReminders();
          handleCloseModal();
        } else {
          showError('Error al crear recordatorio: ' + (response?.message || response?.msg || 'Error desconocido'));
        }
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      showError('Error al guardar el recordatorio');
    } finally {
      setLoading(false);
    }
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
      priority: 3,
      services: []
    });
  };

  const handleEdit = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      triggerValue: reminder.triggerValue instanceof Date
        ? reminder.triggerValue.toISOString().split('T')[0]
        : new Date(reminder.triggerValue).toISOString().split('T')[0],
      vehicleId: reminder.vehicleId,
      clientId: reminder.clientId,
      priority: (reminder as any).prioridad || (reminder as any).priority || 3,
      services: reminder.services
    });
    setIsModalOpen(true);
  };

  const toggleReminder = async (reminder: Reminder) => {
    setLoading(true);
    try {
      const nuevo_estado = reminder.isActive ? 'Cancelado' : 'Pendiente';
      const response = await remindersService.alternarEstadoRecordatorioWithPayload(reminder.id, nuevo_estado, Number(getUserId()));
      if (response.success) {
        await loadReminders();
      } else {
        showError('Error al cambiar estado: ' + response.message);
      }
    } catch (error) {
      console.error('Error al alternar estado:', error);
      showError('Error al cambiar el estado del recordatorio');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm('¿Estás seguro de que quieres eliminar este recordatorio?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await remindersService.eliminarRecordatorio(id);
      if (response.success) {
        await loadReminders();
      } else {
        showError('Error al eliminar: ' + response.message);
      }
    } catch (error) {
      console.error('Error al eliminar recordatorio:', error);
      showError('Error al eliminar el recordatorio');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    setLoading(true);
    try {
      const response = await remindersService.completarRecordatorio(id, getUserId());
      if (response.success) {
        await loadReminders();
      } else {
        showError('Error al completar: ' + response.message);
      }
    } catch (error) {
      console.error('Error al completar recordatorio:', error);
      showError('Error al marcar como completado');
    } finally {
      setLoading(false);
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

  // Agregar función para enviar notificación
  const handleSendNotification = async (id: string) => {
    setLoading(true);
    try {
      const response = await remindersService.enviarNotificacion(id);
      if (response.success) {
        showSuccess('Notificación enviada correctamente al cliente');
        await loadReminders();
      } else {
        showError('Error al enviar notificación: ' + response.message);
      }
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      showError('Error al enviar la notificación');
    } finally {
      setLoading(false);
    }
  };

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
                          Cliente: {data.getClientById(reminder.clientId)?.name || (reminder as any).nombre_cliente || 'No encontrado'}
                        </span>
                      )}
                      {reminder.vehicleId && (
                        <span>
                          Vehículo: {data.getVehicleById(reminder.vehicleId)?.licensePlate || (reminder as any).info_vehiculo || 'No encontrado'}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Creado: {formatDate(reminder.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!reminder.isCompleted && reminder.isActive && (
                      <>
                        <button
                          onClick={() => handleSendNotification(reminder.id)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Enviar notificación al cliente"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleComplete(reminder.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Marcar como completado"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                          </svg>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => toggleReminder(reminder)}
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
                    <label htmlFor="triggerValue" className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
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
                        <option key={String(client.usuario_id)} value={String(client.usuario_id)}>
                          {client.nombre_completo} - {client.correo}
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

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={3}>Alta</option>
                      <option value={2}>Media</option>
                      <option value={1}>Baja</option>
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
