import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Modal } from '../../componentes/comunes/UI';
import { CSVDataManager } from '../../componentes/administracion/CSVDataManager';
import { useApp } from '../../contexto/useApp';
import useInterconnectedData from '../../contexto/useInterconnectedData';
import { generateId, formatDate, formatCurrency } from '../../utilidades/globalMockDatabase';
import type { Client, User } from '../../tipos';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || '',
    password: client?.password || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!client && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        vehicles: client?.vehicles || [],
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre completo"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        error={errors.name}
        placeholder="Juan Pérez"
        required
      />

      <Input
        label="Teléfono"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleInputChange}
        error={errors.phone}
        placeholder="555-1234"
        required
      />

      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
        placeholder="juan@email.com"
        required
      />

      <Input
        label="Dirección (opcional)"
        name="address"
        value={formData.address}
        onChange={handleInputChange}
        error={errors.address}
        placeholder="Calle 123 #45-67"
      />

      <Input
        label={client ? "Nueva contraseña (opcional)" : "Contraseña"}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleInputChange}
        error={errors.password}
        placeholder="••••••••"
        required={!client}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {client ? 'Actualizar' : 'Crear'} Cliente
        </Button>
      </div>
    </form>
  );
}

export function ClientsPage() {
  const { dispatch } = useApp();
  const data = useInterconnectedData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');

  useEffect(() => {
    // Los datos ya están disponibles a través del contexto interconectado
    // No necesitamos cargar mock data aquí
    console.log('👥 ClientsPage: Clientes disponibles:', data.clients.length);
    console.log('📋 ClientsPage: Lista de clientes:', data.clients.map(c => ({ id: c.id, name: c.name, email: c.email })));
  }, [data.clients]);

  const filteredClients = data.clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleCreateClient = () => {
    setSelectedClient(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setModalType('view');
    setIsModalOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    const client = data.getClientById(clientId);
    if (!client) return;

    const vehicleCount = data.getVehiclesByClient(clientId).length;
    const workOrderCount = data.getWorkOrdersByClient(clientId).length;

    const confirmMessage = vehicleCount > 0 || workOrderCount > 0
      ? `Este cliente tiene ${vehicleCount} vehículo(s) y ${workOrderCount} orden(es) de trabajo. ¿Estás seguro de que deseas eliminar el cliente y todos sus datos relacionados?`
      : '¿Estás seguro de que deseas eliminar este cliente?';

    if (window.confirm(confirmMessage)) {
      // Usar la función interconectada que elimina todo automáticamente
      data.deleteClientWithRelations(clientId);
    }
  };

  const handleFormSubmit = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modalType === 'create') {
      const clientId = generateId();
      const newClient: Client = {
        ...clientData,
        id: clientId,
        vehicles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Crear también el usuario para login del cliente
      const newUser: User = {
        id: generateId(),
        email: clientData.email,
        password: clientData.password,
        role: 'client',
        name: clientData.name,
        phone: clientData.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Usar la función interconectada que crea cliente con log automático (ahora async)
      await data.createClientWithLog(newClient);
      dispatch({ type: 'ADD_USER', payload: newUser });
      
    } else if (modalType === 'edit' && selectedClient) {
      const updatedClient: Client = {
        ...selectedClient,
        ...clientData,
        updatedAt: new Date(),
      };
      
      // Buscar y actualizar también el usuario correspondiente
      const userToUpdate = data.users.find(u => u.email === selectedClient.email && u.role === 'client');
      if (userToUpdate) {
        const updatedUser: User = {
          ...userToUpdate,
          email: clientData.email,
          password: clientData.password,
          name: clientData.name,
          phone: clientData.phone,
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }
      
      // Usar la función interconectada que actualiza cliente con log automático
      data.updateClientWithLog(updatedClient);
    }
    setIsModalOpen(false);
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'create': return 'Crear Nuevo Cliente';
      case 'edit': return 'Editar Cliente';
      case 'view': return 'Detalles del Cliente';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra la información de los clientes</p>
        </div>
        <Button onClick={handleCreateClient}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Gestor de datos CSV */}
      <CSVDataManager />

      {/* Filtros y búsqueda */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Lista de clientes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actividad & Estado
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
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{client.name}</span>
                        {client.id.startsWith('client-') && client.email.includes('@taller.com') && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            CSV
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.phone}</div>
                    {client.address && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{client.address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const vehicleCount = data.getVehiclesByClient(client.id).length;
                      const workOrderCount = data.getWorkOrdersByClient(client.id).length;
                      const financialStatus = data.getClientFinancialStatus(client.id);
                      
                      return (
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {vehicleCount} vehículo{vehicleCount !== 1 ? 's' : ''}
                          </div>
                          <div className="text-gray-500">
                            {workOrderCount} orden{workOrderCount !== 1 ? 'es' : ''}
                          </div>
                          <div className={`text-xs ${financialStatus.pendingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {financialStatus.pendingDebt > 0 
                              ? `Debe: ${formatCurrency(financialStatus.pendingDebt)}`
                              : 'Al día'
                            }
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewClient(client)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditClient(client)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados.'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getModalTitle()}
        size="md"
      >
        {modalType === 'view' && selectedClient ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="mt-1 text-sm text-gray-900">{selectedClient.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{selectedClient.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <p className="mt-1 text-sm text-gray-900">{selectedClient.phone}</p>
            </div>
            {selectedClient.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <p className="mt-1 text-sm text-gray-900">{selectedClient.address}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(selectedClient.createdAt)}</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <ClientForm
            client={selectedClient || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
