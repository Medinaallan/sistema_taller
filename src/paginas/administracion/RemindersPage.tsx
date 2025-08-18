import { useState, useEffect } from 'react';
import { Reminder, Client, Vehicle } from '../../tipos';
import { formatDate } from '../../utilidades/mockData';
import { mockClients, mockVehicles, mockReminders } from '../../utilidades/mockData';
import { CalendarIcon, BellIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button, Modal, Card } from '../../componentes/comunes/UI';

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
    // Cargar datos iniciales
    setClients(mockClients);
    setVehicles(mockVehicles);
    setReminders(mockReminders);
  }, []);

  useEffect(() => {
    // Actualizar vehículos cuando se selecciona un cliente
    if (formData.clientId) {
      const clientVehicles = vehicles.filter(v => v.clientId === formData.clientId);
      setSelectedClientVehicles(clientVehicles);
      
      // Limpiar vehículo seleccionado si no pertenece al cliente
      if (!clientVehicles.find(v => v.id === formData.vehicleId)) {
        setFormData(prev => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setSelectedClientVehicles([]);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.clientId, vehicles]);

  const handleCreateReminder = () => {
    setSelectedReminder(null);
    setFormData({
      title: '',
      description: '',
      type: 'date',
      triggerValue: '',
      vehicleId: '',
      clientId: '',
      services: []
    });
    setIsModalOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      type: reminder.type,
      triggerValue: reminder.type === 'date' 
        ? (reminder.triggerValue as Date).toISOString().split('T')[0]
        : reminder.triggerValue.toString(),
      vehicleId: reminder.vehicleId,
      clientId: reminder.clientId,
      services: reminder.services
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReminder: Reminder = {
      id: selectedReminder?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      triggerValue: formData.type === 'date' 
        ? new Date(formData.triggerValue) 
        : parseInt(formData.triggerValue),
      isActive: true,
      isCompleted: false,
      createdAt: new Date(),
      triggerDate: formData.type === 'date' ? new Date(formData.triggerValue) : undefined
    };

    if (selectedReminder) {
      setReminders(reminders.map(r => r.id === selectedReminder.id ? newReminder : r));
    } else {
      setReminders([...reminders, newReminder]);
    }

    setIsModalOpen(false);
  };

  const handleComplete = (id: string) => {
    setReminders(reminders.map(reminder => 
      reminder.id === id 
        ? { ...reminder, isCompleted: true, isActive: false } 
        : reminder
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este recordatorio?')) {
      setReminders(reminders.filter(reminder => reminder.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordatorios</h1>
          <p className="text-gray-600">Gestiona los recordatorios de mantenimiento para vehículos</p>
        </div>
        <Button onClick={handleCreateReminder}>
          <BellIcon className="h-5 w-5 mr-2" />
          Nuevo Recordatorio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <BellIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total</h3>
              <p className="text-lg font-semibold text-gray-900">{reminders.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
              <p className="text-lg font-semibold text-gray-900">
                {reminders.filter(r => r.isActive && !r.isCompleted).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Completados</h3>
              <p className="text-lg font-semibold text-gray-900">
                {reminders.filter(r => r.isCompleted).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Inactivos</h3>
              <p className="text-lg font-semibold text-gray-900">
                {reminders.filter(r => !r.isActive).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reminders List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="grid divide-y divide-gray-200">
          {reminders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay recordatorios registrados
            </div>
          ) : (
            reminders.map(reminder => (
              <div key={reminder.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      reminder.isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : reminder.isActive 
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {reminder.type === 'date' ? (
                        <CalendarIcon className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">KM</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{reminder.title}</h3>
                      <p className="text-sm text-gray-500">{reminder.description}</p>
                      <div className="mt-1">
                        <span className="text-xs text-gray-600">
                          Cliente: {clients.find(c => c.id === reminder.clientId)?.name || 'No encontrado'}
                        </span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-xs text-gray-600">
                          Vehículo: {vehicles.find(v => v.id === reminder.vehicleId)?.licensePlate || 'No encontrado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {reminder.type === 'date' 
                          ? formatDate(reminder.triggerValue as Date)
                          : `${reminder.triggerValue} km`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reminder.isCompleted 
                          ? 'Completado' 
                          : reminder.isActive 
                            ? 'Activo' 
                            : 'Inactivo'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {!reminder.isCompleted && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleComplete(reminder.id)}
                        >
                          Completar
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditReminder(reminder)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(reminder.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedReminder ? "Editar Recordatorio" : "Nuevo Recordatorio"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Recordatorio
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as 'date' | 'mileage' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="date">Por Fecha</option>
                <option value="mileage">Por Kilometraje</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formData.type === 'date' ? 'Fecha Objetivo' : 'Kilometraje Objetivo'}
              </label>
              {formData.type === 'date' ? (
                <input
                  type="date"
                  required
                  value={formData.triggerValue}
                  onChange={e => setFormData({ ...formData, triggerValue: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <input
                  type="number"
                  required
                  value={formData.triggerValue}
                  onChange={e => setFormData({ ...formData, triggerValue: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: 10000"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cliente
              </label>
              <select
                required
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vehículo
              </label>
              <select
                required
                value={formData.vehicleId}
                onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={!formData.clientId}
              >
                <option value="">Seleccionar vehículo...</option>
                {selectedClientVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Servicios Relacionados
            </label>
            <input
              type="text"
              value={formData.services.join(', ')}
              onChange={e => setFormData({ ...formData, services: e.target.value.split(',').map(s => s.trim()) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Separar servicios por comas"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {selectedReminder ? 'Guardar Cambios' : 'Crear Recordatorio'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
