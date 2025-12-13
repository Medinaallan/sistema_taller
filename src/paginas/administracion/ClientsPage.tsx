import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Modal } from '../../componentes/comunes/UI';

import ExcelImportModal from '../../componentes/gestion/ExcelImportModal';
import { useApp } from '../../contexto/useApp';
import { useClientesFromAPI } from '../../hooks/useClientesFromAPI';
import { useBusinessLogs } from '../../hooks/useBusinessLogs';
import { formatDate } from '../../utilidades/globalMockDatabase';
import type { Client } from '../../tipos';

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
  console.log(' ClientsPage: Iniciando componente...');
  
  const { dispatch } = useApp();
  console.log(' ClientsPage: useApp hook ejecutado');
  
  // Usar el nuevo hook para cargar clientes desde API
  const { 
    clientes, 
    clientesLegacy, 
    loading, 
    error, 
    recargarClientes, 
    count 
  } = useClientesFromAPI();
  
  console.log(' ClientsPage: useClientesFromAPI ejecutado, clientes:', count);
  
  const businessLogs = useBusinessLogs();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  console.log(' ClientsPage: Estados inicializados');

  useEffect(() => {
    console.log(' ClientsPage useEffect: Ejecutando...');
    try {
      console.log(' ClientsPage: Clientes disponibles:', count);
      if (clientesLegacy && clientesLegacy.length > 0) {
        console.log(' ClientsPage: Lista de clientes:', clientesLegacy.map((c: any) => ({ id: c.id, name: c.name, email: c.email })));
      }
    } catch (effectError) {
      console.error(' ClientsPage useEffect error:', effectError);
    }
  }, [clientesLegacy, count, forceRefresh]);

  console.log(' ClientsPage: useEffect configurado');

  //  AGREGADO: Función para forzar recarga
  const handleForceRefresh = async () => {
    console.log(' Forzando recarga de clientes...');
    try {
      // Usar la función de recarga del hook
      await recargarClientes();
      
      // Incrementar contador para forzar re-render
      setForceRefresh(prev => prev + 1);
      
      // Mostrar mensaje temporal
      const tempMsg = document.createElement('div');
      tempMsg.textContent = ' Datos recargados desde API';
      tempMsg.style.cssText = 'position:fixed; top:20px; right:20px; background:#10b981; color:white; padding:10px 20px; border-radius:8px; z-index:9999;';
      document.body.appendChild(tempMsg);
      
      setTimeout(() => {
        document.body.removeChild(tempMsg);
      }, 2000);
      
    } catch (error) {
      console.error(' Error forzando recarga:', error);
    }
  };

  //  PROTEGIDO: Verificar que clientesLegacy exista antes de filtrar
  const filteredClients = (clientesLegacy || []).filter((client: any) =>
    client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client?.phone?.includes(searchTerm)
  );

  console.log(' ClientsPage: Clientes filtrados:', filteredClients.length);

  //  PROTECCIÓN: Verificar estados de carga
  if (loading) {
    console.log(' ClientsPage: Cargando clientes desde API...');
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando clientes...</p>
              <Button 
                onClick={handleForceRefresh}
                variant="outline"
                className="mt-4"
              >
                 Recargar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log(' ClientsPage: Error cargando clientes:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error cargando clientes</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button 
                  onClick={handleForceRefresh}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reintentar carga desde API
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log(' ClientsPage: Datos disponibles, renderizando componente completo...');

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

  const handleDeleteClient = async (clientId: string) => {
    // Por ahora, comentamos la funcionalidad de eliminación hasta implementar el endpoint
    /*
    const client = data.getClientById(clientId);
    if (!client) return;

    const vehicleCount = data.getVehiclesByClient(clientId).length;
    const workOrderCount = data.getWorkOrdersByClient(clientId).length;

    const confirmMessage = vehicleCount > 0 || workOrderCount > 0
      ? `Este cliente tiene ${vehicleCount} vehículo(s) y ${workOrderCount} orden(es) de trabajo. ¿Estás seguro de que deseas eliminar el cliente y todos sus datos relacionados?`
      : '¿Estás seguro de que deseas eliminar este cliente?';

    if (window.confirm(confirmMessage)) {
      // Generar log de negocio con datos reales antes de eliminar
      await businessLogs.logClientDeleted(client.id, client.name);
      
      // Usar la función interconectada que elimina todo automáticamente
      data.deleteClientWithRelations(clientId);
    }
    */
    
    alert('Funcionalidad de eliminación en desarrollo. Los clientes ahora se gestionan desde la base de datos.');
  };

  const handleFormSubmit = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (modalType === 'create') {
        console.log('➕ Creando cliente usando stored procedures...');
        
        // Obtener usuario_id del localStorage
        const usuario_id = localStorage.getItem('usuario_id');
        
        // Usar el endpoint que utiliza SP_REGISTRAR_USUARIO_CLIENTE
        const response = await fetch('http://localhost:8080/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            usuario_id: usuario_id ? parseInt(usuario_id) : undefined
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log(' Cliente creado desde BD:', result.data);
          
          const newClient: Client = {
            id: result.data.id,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            address: '',
            password: '',
            vehicles: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Agregar al contexto local
          dispatch({ type: 'ADD_CLIENT', payload: newClient });
          
          // Generar log de negocio
          await businessLogs.logClientCreated(newClient);
          
          alert('Cliente creado exitosamente usando la base de datos');
        } else {
          alert(`Error al crear cliente: ${result.error || 'Error desconocido'}`);
          return;
        }
        
      } else if (modalType === 'edit' && selectedClient) {
        console.log('✏️ Editando cliente usando stored procedures...');
        
        // Usar el endpoint que utiliza SP_EDITAR_USUARIO
        const response = await fetch(`http://localhost:8080/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('✅ Cliente actualizado desde BD:', result.data);
          
          const updatedClient: Client = {
            ...selectedClient,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            updatedAt: new Date(),
          };
          
          // Detectar cambios para el log
          const changes: any = {};
          if (selectedClient.name !== clientData.name) changes.name = { old: selectedClient.name, new: clientData.name };
          if (selectedClient.email !== clientData.email) changes.email = { old: selectedClient.email, new: clientData.email };
          if (selectedClient.phone !== clientData.phone) changes.phone = { old: selectedClient.phone, new: clientData.phone };
          
          // Actualizar en contexto local
          dispatch({ type: 'UPDATE_CLIENT', payload: updatedClient });
          
          // Generar log de negocio
          await businessLogs.logClientUpdated(updatedClient, changes);
          
          alert('Cliente actualizado exitosamente usando la base de datos');
        } else {
          alert(`Error al actualizar cliente: ${result.error || 'Error desconocido'}`);
          return;
        }
      }
      
      setIsModalOpen(false);
      
      // Recargar la lista de clientes
      await loadClients();
    } catch (error) {
      console.error('❌ Error en operación de cliente:', error);
      alert('Error de conexión al procesar la operación');
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'create': return 'Crear Nuevo Cliente';
      case 'edit': return 'Editar Cliente';
      case 'view': return 'Detalles del Cliente';
      default: return '';
    }
  };

  const handleImportComplete = (result: any) => {
    if (result.success) {
      // Recargar datos después de una importación exitosa
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600">Usuarios con rol "Cliente"</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Conectado
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {count} clientes cargados
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleForceRefresh}
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
             Recargar
          </Button>
          <Button 
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
          >
             Importar Excel
          </Button>
          <Button onClick={handleCreateClient}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>



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
                    <div className="text-sm">
                      <div className="text-gray-900">
                        Cliente desde BD
                      </div>
                      <div className="text-gray-500">
                        ID: {client.id}
                      </div>
                    </div>
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

      {/* Modal de importación Excel */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
