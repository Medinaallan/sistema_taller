import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CheckIcon, DocumentPlusIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge, TextArea } from '../../componentes/comunes/UI';
import CreateWorkOrderModal from '../../componentes/workorders/CreateWorkOrderModal';
import TasksListModal from '../../componentes/ordenes-trabajo/TasksListModal';
import AddTaskModal from '../../componentes/ordenes-trabajo/AddTaskModal';
import { formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import workOrdersService, { type WorkOrderData } from '../../servicios/workOrdersService';
import { chatService, type ChatMensajeDTO } from '../../servicios/chatService';
import additionalQuotationsService, { type AdditionalQuotation } from '../../servicios/additionalQuotationsService';
import { getDisplayNames, getClientDisplayName, getVehicleDisplayName } from '../../utilidades/dataMappers';

const WorkOrdersPage = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderData | null>(null);
  const [isAdditionalQuotationModalOpen, setIsAdditionalQuotationModalOpen] = useState(false);
  const [selectedOrderForQuotation, setSelectedOrderForQuotation] = useState<WorkOrderData | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [workOrdersWithNames, setWorkOrdersWithNames] = useState<Map<string, { clientName: string; vehicleName: string }>>(new Map());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Estados para gestión de tareas
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedOrderForTasks, setSelectedOrderForTasks] = useState<WorkOrderData | null>(null);

  // Cargar órdenes de trabajo
  const loadWorkOrders = async () => {
    try {
      console.log(' Iniciando carga de órdenes de trabajo...');
      setLoading(true);
      const orders = await workOrdersService.getAllWorkOrders();
      console.log(' Órdenes de trabajo cargadas:', orders);
      console.log(' Número de órdenes:', orders.length);
      setWorkOrders(orders);
      
      // Cargar nombres descriptivos para cada orden
      await loadDisplayNamesForOrders(orders);
    } catch (err) {
      console.error(' Error cargando órdenes de trabajo:', err);
      alert('Error cargando órdenes de trabajo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Cargar nombres descriptivos para las órdenes
  const loadDisplayNamesForOrders = async (orders: WorkOrderData[]) => {
    try {
      const namesMap = new Map<string, { clientName: string; vehicleName: string }>();
      
      // Procesar cada orden de trabajo
      for (const order of orders) {
        try {
          const names = await getDisplayNames({
            clientId: order.clienteId,
            vehicleId: order.vehiculoId,
            serviceId: undefined // No necesitamos servicios para órdenes de trabajo por ahora
          });
          
          if (order.id) {
            namesMap.set(order.id, {
              clientName: names.clientName,
              vehicleName: names.vehicleName
            });
          }
        } catch (error) {
          console.error(`Error cargando nombres para orden ${order.id}:`, error);
          // Fallback a IDs si hay error
          if (order.id) {
            namesMap.set(order.id, {
              clientName: `Cliente #${order.clienteId}`,
              vehicleName: `Vehículo #${order.vehiculoId}`
            });
          }
        }
      }
      
      setWorkOrdersWithNames(namesMap);
    } catch (error) {
      console.error('Error cargando nombres descriptivos:', error);
    }
  };

  // Helper para obtener el nombre del cliente
  const getClientDisplayName = (order: WorkOrderData): string => {
    if (!order.id) return `Cliente #${order.clienteId}`;
    const names = workOrdersWithNames.get(order.id);
    return names?.clientName || `Cliente #${order.clienteId}`;
  };

  // Helper para obtener el nombre del vehículo  
  const getVehicleDisplayName = (order: WorkOrderData): string => {
    if (!order.id) return `Vehículo #${order.vehiculoId}`;
    const names = workOrdersWithNames.get(order.id);
    return names?.vehicleName || `Vehículo #${order.vehiculoId}`;
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch = 
      (order.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.problema || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.clienteId || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.vehiculoId || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.estado === statusFilter;
    const matchesClient = !clientFilter || order.clienteId?.toString() === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleViewWorkOrder = (order: WorkOrderData) => {
    setSelectedWorkOrder(order);
    setIsModalOpen(true);
  };

  const handleAdditionalQuotationAccess = (order: WorkOrderData) => {
    setSelectedOrderForQuotation(order);
    setShowPasswordPrompt(true);
    setAdminPassword('');
  };

  const handlePasswordSubmit = () => {
    if (adminPassword === 'admin123') {
      setShowPasswordPrompt(false);
      setIsAdditionalQuotationModalOpen(true);
      setAdminPassword('');
    } else {
      alert('Contraseña incorrecta');
      setAdminPassword('');
    }
  };

  const handleCreateWorkOrderSuccess = (newWorkOrder: WorkOrderData) => {
    // Agregar la nueva orden a la lista
    setWorkOrders(prev => [newWorkOrder, ...prev]);
    // Cerrar modal
    setIsCreateModalOpen(false);
  };

  // Funciones para gestionar tareas
  const handleViewTasks = (order: WorkOrderData) => {
    setSelectedOrderForTasks(order);
    setShowTasksModal(true);
  };

  const handleAddTask = (order: WorkOrderData) => {
    setSelectedOrderForTasks(order);
    setShowAddTaskModal(true);
  };

  const handleTaskModalClose = () => {
    setShowTasksModal(false);
    setSelectedOrderForTasks(null);
  };

  const handleAddTaskModalClose = () => {
    setShowAddTaskModal(false);
  };

  const handleAddTaskSuccess = () => {
    // Cerrar modal de agregar tarea y reabrir modal de lista de tareas
    setShowAddTaskModal(false);
    setShowTasksModal(true);
  };

  const handleCompleteWorkOrder = async (orderId: string) => {
    if (confirm('¿Estás seguro de que quieres completar esta orden y generar la factura?')) {
      try {
        await workOrdersService.completeWorkOrder(orderId);
        alert('Orden de trabajo completada exitosamente');
        await loadWorkOrders(); // Recargar datos
      } catch (err) {
        alert('Error completando orden: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
  };

  const handleDeleteWorkOrder = async (orderId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta orden de trabajo?')) {
      try {
        await workOrdersService.deleteWorkOrder(orderId);
        alert('Orden de trabajo eliminada exitosamente');
        await loadWorkOrders(); // Recargar datos
      } catch (err) {
        alert('Error eliminando orden: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
  };

  const handleStartWorkOrder = async (orderId: string) => {
    if (confirm('¿Estás seguro de que quieres iniciar esta orden de trabajo?')) {
      try {
        await workOrdersService.startWorkOrder(orderId);
        alert('Orden de trabajo iniciada exitosamente');
        await loadWorkOrders(); // Recargar datos
      } catch (err) {
        alert('Error iniciando orden: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
  };

  const handlePauseWorkOrder = async (orderId: string) => {
    if (confirm('¿Estás seguro de que quieres pausar esta orden de trabajo?')) {
      try {
        await workOrdersService.changeStatus(orderId, 'pending');
        alert('Orden de trabajo pausada exitosamente');
        await loadWorkOrders(); // Recargar datos
      } catch (err) {
        alert('Error pausando orden: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
  };

  const statusOptions = workOrdersService.getAvailableStates().map(state => ({
    value: state.value === 'pending' ? '' : state.value, // Valor vacío para "todos"
    label: state.value === 'pending' ? 'Todos los estados' : state.label
  }));
  
  // Agregar opción "Todos los estados" al principio
  statusOptions.unshift({ value: '', label: 'Todos los estados' });

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    // TODO: Aquí podrías cargar los nombres reales de clientes desde la API
  ];

  const pendingOrders = workOrders.filter(wo => wo.estado === 'pending');
  const inProgressOrders = workOrders.filter(wo => wo.estado === 'in-progress');
  const completedOrders = workOrders.filter(wo => wo.estado === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <p className="text-gray-600">Gestiona todas las órdenes de trabajo del taller</p>
          <p className="text-sm text-blue-600">Debug: {workOrders.length} órdenes cargadas | Loading: {loading ? 'Sí' : 'No'}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadWorkOrders} 
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <span>Recargar</span>
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nueva Orden</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
           <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{workOrders.length}</div>
            <div className="text-sm text-gray-500">Total Órdenes</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            <div className="text-sm text-yellow-500">Pendientes</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressOrders.length}</div>
            <div className="text-sm text-blue-500">En Progreso</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedOrders.length}</div>
            <div className="text-sm text-green-500">Completadas</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar órdenes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, problema, cliente o vehículo..."
          />
          
          <Select
            label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />

          <Select
            label="Filtrar por cliente"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            options={clientOptions}
          />
        </div>
      </Card>

      {/* Tabla de Órdenes de Trabajo */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente / Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando órdenes de trabajo...
                  </td>
                </tr>
              ) : (
                filteredWorkOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id?.slice(-12) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {order.descripcion}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getClientDisplayName(order)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getVehicleDisplayName(order)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          order.estado === 'completed' ? 'success' : 
                          order.estado === 'in-progress' ? 'warning' : 
                          'default'
                        }
                        size="sm"
                      >
                        {workOrdersService.formatStatus(order.estado)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(order.costoTotal)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Est: {formatCurrency(order.costoEstimado)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Inicio: {order.fechaInicioReal ? formatDate(new Date(order.fechaInicioReal)) : 'N/A'}
                      </div>
                      {order.fechaEstimadaCompletado && (
                        <div className="text-sm text-gray-500">
                          Est: {formatDate(new Date(order.fechaEstimadaCompletado))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewWorkOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {/* Botones de gestión de tareas */}
                        <button
                          onClick={() => handleViewTasks(order)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver tareas de la orden"
                        >
                          📋
                        </button>

                        <button
                          onClick={() => handleAddTask(order)}
                          className="text-teal-600 hover:text-teal-900"
                          title="Agregar tarea a la orden"
                        >
                          ➕
                        </button>

                        {/* Botón Iniciar - solo para órdenes pendientes */}
                        {order.estado === 'pending' && (
                          <button
                            onClick={() => handleStartWorkOrder(order.id!)}
                            className="text-green-600 hover:text-green-900"
                            title="Iniciar orden de trabajo"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* Botón Pausar - solo para órdenes en progreso */}
                        {order.estado === 'in-progress' && (
                          <button
                            onClick={() => handlePauseWorkOrder(order.id!)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Pausar orden de trabajo"
                          >
                            <StopIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* Botón Completar - solo para órdenes en progreso */}
                        {order.estado === 'in-progress' && (
                          <button
                            onClick={() => handleCompleteWorkOrder(order.id!)}
                            className="text-green-600 hover:text-green-900"
                            title="Completar orden"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* Botón Cotización Adicional - para órdenes en progreso o pendientes */}
                        {(order.estado === 'in-progress' || order.estado === 'pending') && (
                          <button
                            onClick={() => handleAdditionalQuotationAccess(order)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Cotización adicional (Admin)"
                          >
                            <DocumentPlusIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* Botón Editar - para órdenes no completadas */}
                        {order.estado !== 'completed' && (
                          <button
                            onClick={() => {/* TODO: Implementar edición */}}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* Estados para órdenes completadas o canceladas */}
                        {order.estado === 'completed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Completada
                          </span>
                        )}

                        {order.estado === 'cancelled' && (
                          <>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ❌ Cancelada
                            </span>
                            <button
                              onClick={() => workOrdersService.changeStatus(order.id!, 'pending').then(() => loadWorkOrders())}
                              className="text-blue-600 hover:text-blue-900"
                              title="Reactivar orden"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {/* Botón Eliminar - siempre disponible */}
                        <button
                          onClick={() => handleDeleteWorkOrder(order.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredWorkOrders.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron órdenes que coincidan con los filtros.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de detalles */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles de la Orden de Trabajo"
      >
        {selectedWorkOrder && (
          <WorkOrderDetails 
            order={selectedWorkOrder} 
            clientName={getClientDisplayName(selectedWorkOrder)} 
            vehicleName={getVehicleDisplayName(selectedWorkOrder)} 
          />
        )}
      </Modal>

      {/* Modal de contraseña para cotización adicional */}
      <Modal
        isOpen={showPasswordPrompt}
        onClose={() => {
          setShowPasswordPrompt(false);
          setAdminPassword('');
          setSelectedOrderForQuotation(null);
        }}
        title="Acceso de Administrador"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Esta función está restringida a administradores. Ingresa la contraseña para continuar.
          </p>
          <Input
            label="Contraseña de administrador"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Ingresa la contraseña"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmit();
              }
            }}
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordPrompt(false);
                setAdminPassword('');
                setSelectedOrderForQuotation(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Acceder
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de cotización adicional */}
      <Modal
        isOpen={isAdditionalQuotationModalOpen}
        onClose={() => {
          setIsAdditionalQuotationModalOpen(false);
          setSelectedOrderForQuotation(null);
        }}
        title="Cotización de Servicios Adicionales"
        size="lg"
      >
        {selectedOrderForQuotation && (
          <AdditionalQuotationForm 
            workOrder={selectedOrderForQuotation}
            onClose={() => {
              setIsAdditionalQuotationModalOpen(false);
              setSelectedOrderForQuotation(null);
            }}
          />
        )}
      </Modal>

      {/* Modal de crear nueva orden de trabajo */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateWorkOrderSuccess}
      />

      {/* Modales de gestión de tareas */}
      {selectedOrderForTasks && (
        <>
          <TasksListModal
            isOpen={showTasksModal}
            onClose={handleTaskModalClose}
            workOrder={selectedOrderForTasks}
            onAddTaskClick={() => {
              setShowTasksModal(false);
              setShowAddTaskModal(true);
            }}
          />

          <AddTaskModal
            isOpen={showAddTaskModal}
            onClose={handleAddTaskModalClose}
            workOrder={selectedOrderForTasks}
            onSuccess={handleAddTaskSuccess}
          />
        </>
      )}
    </div>
  );
};

// Componente para mostrar detalles de la orden de trabajo
interface WorkOrderDetailsProps {
  order: WorkOrderData;
  clientName: string;
  vehicleName: string;
}

function WorkOrderDetails({ order, clientName, vehicleName }: WorkOrderDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Orden</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">ID de Orden</dt>
              <dd className="text-sm text-gray-900">#{order.id?.slice(-12) || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="text-sm text-gray-900">{order.descripcion}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Problema</dt>
              <dd className="text-sm text-gray-900">{order.problema || 'No especificado'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Diagnóstico</dt>
              <dd className="text-sm text-gray-900">{order.diagnostico || 'Pendiente'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd>
                <Badge 
                  variant={
                    order.estado === 'completed' ? 'success' : 
                    order.estado === 'in-progress' ? 'warning' : 
                    'default'
                  }
                  size="sm"
                >
                  {workOrdersService.formatStatus(order.estado)}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo de Servicio</dt>
              <dd className="text-sm text-gray-900">{workOrdersService.formatServiceType(order.tipoServicio)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente y Vehículo</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Cliente</dt>
              <dd className="text-sm text-gray-900 font-medium">{clientName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Vehículo</dt>
              <dd className="text-sm text-gray-900 font-medium">{vehicleName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Servicio ID</dt>
              <dd className="text-sm text-gray-900">{order.servicioId}</dd>
            </div>
            {order.quotationId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Cotización de Origen</dt>
                <dd className="text-sm text-gray-900">{order.quotationId}</dd>
              </div>
            )}
            {order.appointmentId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Cita de Origen</dt>
                <dd className="text-sm text-gray-900">{order.appointmentId}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Información de costos */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Costos</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{formatCurrency(order.costoManoObra)}</div>
            <div className="text-sm text-blue-500">Mano de Obra</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{formatCurrency(order.costoPartes)}</div>
            <div className="text-sm text-purple-500">Repuestos</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{formatCurrency(order.costoTotal)}</div>
            <div className="text-sm text-green-500">Total Real</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{formatCurrency(order.costoEstimado)}</div>
            <div className="text-sm text-orange-500">Estimado</div>
          </div>
        </div>
      </div>

      {/* Estado de pago */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Pago</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <Badge 
            variant={
              order.estadoPago === 'completed' ? 'success' : 
              order.estadoPago === 'partial' ? 'warning' : 
              'default'
            }
            size="md"
          >
            {workOrdersService.formatPaymentStatus(order.estadoPago)}
          </Badge>
        </div>
      </div>

      {/* Fechas importantes */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fechas</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
            <dd className="text-sm text-gray-900">
              {order.fechaCreacion ? formatDate(new Date(order.fechaCreacion)) : 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de Inicio Real</dt>
            <dd className="text-sm text-gray-900">
              {order.fechaInicioReal ? formatDate(new Date(order.fechaInicioReal)) : 'No iniciada'}
            </dd>
          </div>
          {order.fechaEstimadaCompletado && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha Estimada</dt>
              <dd className="text-sm text-gray-900">{formatDate(new Date(order.fechaEstimadaCompletado))}</dd>
            </div>
          )}
        </div>
      </div>

      {/* Notas y recomendaciones */}
      {(order.notas || order.recomendaciones) && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notas</h3>
          <div className="space-y-3">
            {order.notas && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Notas Generales</dt>
                <dd className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{order.notas}</dd>
              </div>
            )}
            {order.recomendaciones && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Recomendaciones</dt>
                <dd className="text-sm text-gray-900 mt-1 bg-yellow-50 p-3 rounded-lg">{order.recomendaciones}</dd>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para el formulario de cotización adicional
interface AdditionalQuotationFormProps {
  workOrder: WorkOrderData;
  onClose: () => void;
}

function AdditionalQuotationForm({ workOrder, onClose }: AdditionalQuotationFormProps) {
  const [formData, setFormData] = useState({
    serviciosEncontrados: '',
    descripcionProblema: '',
    serviciosRecomendados: '',
    costoEstimado: '',
    urgencia: 'media' as 'baja' | 'media' | 'alta',
    requiereAprobacion: true,
    notas: ''
  });
  const [loading, setLoading] = useState(false);
  const [displayNames, setDisplayNames] = useState({
    clientName: '',
    vehicleName: ''
  });

  // Cargar nombres de cliente y vehículo
  useEffect(() => {
    const loadDisplayNames = async () => {
      const [clientName, vehicleName] = await Promise.all([
        getClientDisplayName(workOrder.clienteId),
        getVehicleDisplayName(workOrder.vehiculoId)
      ]);
      setDisplayNames({ clientName, vehicleName });
    };
    loadDisplayNames();
  }, [workOrder]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear la cotización adicional usando el servicio
      const quotationData = {
        workOrderId: workOrder.id || '',
        clienteId: workOrder.clienteId,
        vehiculoId: workOrder.vehiculoId,
        tipo: 'adicional' as const,
        serviciosEncontrados: formData.serviciosEncontrados,
        descripcionProblema: formData.descripcionProblema,
        serviciosRecomendados: formData.serviciosRecomendados,
        costoEstimado: parseFloat(formData.costoEstimado),
        urgencia: formData.urgencia,
        estado: 'pendiente-aprobacion' as const,
        requiereAprobacion: formData.requiereAprobacion,
        notas: formData.notas
      };

      const additionalQuotation = await additionalQuotationsService.createAdditionalQuotation(quotationData);

      // Enviar notificación al chat del cliente
      await sendQuotationToClientChat(additionalQuotation, workOrder);

      alert('Cotización adicional creada y enviada al cliente exitosamente');
      onClose();
    } catch (error) {
      console.error('Error creando cotización adicional:', error);
      alert('Error al crear la cotización adicional');
    } finally {
      setLoading(false);
    }
  };

  const sendQuotationToClientChat = async (quotation: AdditionalQuotation, workOrder: WorkOrderData) => {
    try {
      // Obtener nombres legibles para el mensaje
      const [clientName, vehicleName] = await Promise.all([
        getClientDisplayName(workOrder.clienteId),
        getVehicleDisplayName(workOrder.vehiculoId)
      ]);

      // Crear mensaje estructurado para el chat
      const mensaje = `🔧 SERVICIOS ADICIONALES ENCONTRADOS

Orden de Trabajo: #${workOrder.id?.slice(-12)}
Cliente: ${clientName}
Vehículo: ${vehicleName}

Problemas encontrados:
${quotation.serviciosEncontrados}

Descripción del problema:
${quotation.descripcionProblema}

Servicios recomendados:
${quotation.serviciosRecomendados}

Costo estimado: L. ${quotation.costoEstimado.toFixed(2)}
Urgencia: ${quotation.urgencia.toUpperCase()}

${quotation.notas ? `Notas adicionales:\n${quotation.notas}` : ''}

---
Esta cotización requiere tu aprobación antes de proceder. Puedes aprobarla o rechazarla desde tu panel de cliente.

Cotización ID: ${quotation.id}`;

      // Crear mensaje para el chat
      const chatMessage: Omit<ChatMensajeDTO, 'mensaje_id'> = {
        sala_id: workOrder.clienteId,
        usuario_id: 'admin-system',
        rol: 'admin',
        contenido: mensaje,
        es_sistema: true,
        enviado_en: new Date().toISOString(),
        leido: false
      };

      console.log('Enviando cotización al chat del cliente...', chatMessage);
      
      // Intentar enviar usando el chatService real
      try {
        // Inicializar el servicio de chat si no está conectado
        if (!chatService.estaConectado()) {
          await chatService.conectar();
        }
        
        // Unirse a la sala del cliente
        chatService.unirSala(workOrder.clienteId);
        
        // Enviar el mensaje
        chatService.enviarMensaje(chatMessage);
        
        console.log('✅ Mensaje de cotización enviado exitosamente al chat');
      } catch (chatError) {
        console.error('⚠️ Error enviando al chat, guardando en localStorage como respaldo:', chatError);
        
        // Guardar en localStorage como respaldo si el chat falla
        const backupMessages = JSON.parse(localStorage.getItem('backup-chat-messages') || '[]');
        backupMessages.push({
          ...chatMessage,
          timestamp: Date.now(),
          type: 'cotizacion-adicional',
          quotationId: quotation.id
        });
        localStorage.setItem('backup-chat-messages', JSON.stringify(backupMessages));
      }
      
    } catch (error) {
      console.error('Error enviando cotización al chat:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información de la orden */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Información de la Orden</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Orden:</strong> #{workOrder.id?.slice(-12)}</p>
          <p><strong>Cliente:</strong> {displayNames.clientName || workOrder.clienteId}</p>
          <p><strong>Vehículo:</strong> {displayNames.vehicleName || workOrder.vehiculoId}</p>
          <p><strong>Estado actual:</strong> {workOrdersService.formatStatus(workOrder.estado)}</p>
        </div>
      </div>

      {/* Servicios encontrados */}
      <TextArea
        label="Servicios/Problemas Encontrados Durante la Revisión"
        value={formData.serviciosEncontrados}
        onChange={(e) => handleInputChange('serviciosEncontrados', e.target.value)}
        placeholder="Describe los problemas o servicios adicionales que se encontraron mientras se trabajaba en el vehículo..."
        rows={3}
        required
      />

      {/* Descripción del problema */}
      <TextArea
        label="Descripción Detallada del Problema"
        value={formData.descripcionProblema}
        onChange={(e) => handleInputChange('descripcionProblema', e.target.value)}
        placeholder="Explica detalladamente el problema encontrado y por qué requiere atención..."
        rows={3}
        required
      />

      {/* Servicios recomendados */}
      <TextArea
        label="Servicios Recomendados"
        value={formData.serviciosRecomendados}
        onChange={(e) => handleInputChange('serviciosRecomendados', e.target.value)}
        placeholder="Detalla los servicios específicos que se recomiendan para solucionar el problema..."
        rows={3}
        required
      />

      {/* Costo estimado */}
      <Input
        label="Costo Estimado (L.)"
        type="number"
        step="0.01"
        min="0"
        value={formData.costoEstimado}
        onChange={(e) => handleInputChange('costoEstimado', e.target.value)}
        placeholder="0.00"
        required
      />

      {/* Nivel de urgencia */}
      <Select
        label="Nivel de Urgencia"
        value={formData.urgencia}
        onChange={(e) => handleInputChange('urgencia', e.target.value)}
        options={[
          { value: 'baja', label: 'Baja - Puede esperar' },
          { value: 'media', label: 'Media - Recomendado pronto' },
          { value: 'alta', label: 'Alta - Requiere atención inmediata' }
        ]}
      />

      {/* Notas adicionales */}
      <TextArea
        label="Notas Adicionales"
        value={formData.notas}
        onChange={(e) => handleInputChange('notas', e.target.value)}
        placeholder="Cualquier información adicional que el cliente deba saber..."
        rows={2}
      />

      {/* Información importante */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Esta cotización se enviará automáticamente al chat del cliente y requerirá su aprobación antes de proceder con los servicios adicionales.
        </p>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear y Enviar Cotización'}
        </Button>
      </div>
    </form>
  );
}

export { WorkOrdersPage };
