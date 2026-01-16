import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge } from '../../componentes/comunes/UI';
import { formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import workOrdersService, { type WorkOrderData } from '../../servicios/workOrdersService';
import TasksListModal from '../../componentes/ordenes-trabajo/TasksListModal';
import AddTaskModal from '../../componentes/ordenes-trabajo/AddTaskModal';
import { QualityControlModal } from '../../componentes/ordenes-trabajo/QualityControlModal';
import { appointmentsService, servicesService, vehiclesService } from '../../servicios/apiService';
import { useClientesFromAPI } from '../../hooks/useClientesFromAPI';

const WorkOrdersPage = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderData | null>(null);
  
  // Estados para gestión de tareas
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedOrderForTasks, setSelectedOrderForTasks] = useState<WorkOrderData | null>(null);
  
  // Estados para control de calidad
  const [showQualityControlModal, setShowQualityControlModal] = useState(false);
  const [selectedOrderForQuality, setSelectedOrderForQuality] = useState<WorkOrderData | null>(null);
  
  // Estados para datos de mapeo
  const { clientes: clientesAPI } = useClientesFromAPI();
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Funciones de mapeo
  const getClienteName = (order: WorkOrderData) => {
    const cliente = clientesAPI.find((c: any) => 
      String(c.usuario_id).trim() === String(order.clienteId).trim()
    );
    return cliente ? cliente.nombre_completo : `Cliente #${order.clienteId}`;
  };

  const getVehicleName = (order: WorkOrderData) => {
    // Usar la descripción que ya tiene el nombre del vehículo
    return order.descripcion || `Vehículo #${order.vehiculoId}`;
  };

  const getServiceName = (servicioId: string) => {
    const servicio = servicios.find(s => s.id === servicioId);
    return servicio ? servicio.name || servicio.nombre : servicioId;
  };

  const getAppointmentName = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    return appointment ? `Cita ${appointment.date} ${appointment.time}` : appointmentId;
  };

  // Funciones para cargar datos de referencia
  const loadVehiculos = async () => {
    try {
      const response = await vehiclesService.getAll();
      if (response.success) {
        // Mapear igual que en AppointmentsPage
        const mappedVehicles = response.data.map((spVehicle: any) => ({
          id: String(spVehicle.vehiculo_id || spVehicle.id),
          clientId: String(spVehicle.cliente_id || spVehicle.clientId),
          brand: spVehicle.marca,
          model: spVehicle.modelo,
          year: parseInt(spVehicle.anio),
          licensePlate: spVehicle.placa,
          color: spVehicle.color,
          mileage: parseInt(spVehicle.kilometraje) || 0,
          vin: spVehicle.vin || '',
          numeroMotor: spVehicle.numero_motor || '',
          fotoUrl: spVehicle.foto_url || '',
        }));
        setVehiculos(mappedVehicles);
      }
    } catch (error) {
      console.error('Error cargando vehículos:', error);
    }
  };

  const loadServicios = async () => {
    try {
      const response = await servicesService.getAll();
      if (response.success) {
        const mappedServices = response.data.map((service: any) => ({
          id: service.id,
          name: service.nombre,
          nombre: service.nombre,
        }));
        setServicios(mappedServices);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await appointmentsService.getAll();
      if (response.success) {
        const appointmentsData = response.data.map((appointment: any) => ({
          id: appointment.id,
          date: new Date(appointment.fecha).toLocaleDateString('es-ES'),
          time: appointment.hora,
        }));
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  };

  // Cargar órdenes de trabajo
  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const orders = await workOrdersService.getAllWorkOrders();
      setWorkOrders(orders);
    } catch (err) {
      console.error('Error cargando órdenes de trabajo:', err);
      alert('Error cargando órdenes de trabajo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadWorkOrders(),
        loadVehiculos(),
        loadServicios(),
        loadAppointments()
      ]);
    };
    
    loadAllData();
  }, [clientesAPI]);

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch = 
      order.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.problema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clienteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehiculoId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.estado === statusFilter;
    const matchesClient = !clientFilter || order.clienteId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleViewWorkOrder = (order: WorkOrderData) => {
    setSelectedWorkOrder(order);
    setIsModalOpen(true);
  };

  const handlePauseWorkOrder = async (_orderId: string) => {
    if (confirm('¿Deseas pausar esta orden de trabajo?')) {
      try {
        // TODO: Implementar cambio de estado a paused en el backend
        alert('Orden pausada (funcionalidad pendiente en backend)');
        await loadWorkOrders();
      } catch (err) {
        alert('Error pausando orden: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
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

  // Funciones para gestionar tareas
  // Funciones para gestionar tareas
  const handleViewTasks = (order: WorkOrderData) => {
    setSelectedOrderForTasks(order);
    setShowTasksModal(true);
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

  const handleQualityControl = (order: WorkOrderData) => {
    setSelectedOrderForQuality(order);
    setShowQualityControlModal(true);
  };

  const handleQualityControlComplete = async () => {
    // Recargar órdenes después de completar control de calidad
    await loadWorkOrders();
    setShowQualityControlModal(false);
    setSelectedOrderForQuality(null);
  };

  // Agregar opción "Todos los estados" al inicio
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    ...workOrdersService.getAvailableStates().map(state => ({
      value: state.value,
      label: state.label
    }))
  ];

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    // TODO: Aquí podrías cargar los nombres reales de clientes desde la API
  ];

  const pendingOrders = workOrders.filter(wo => wo.estado === 'Abierta');
  const inProgressOrders = workOrders.filter(wo => wo.estado === 'En proceso');
  const completedOrders = workOrders.filter(wo => wo.estado === 'Completada');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <p className="text-gray-600">Gestiona todas las órdenes de trabajo del taller</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadWorkOrders} 
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <span>🔄 Recargar</span>
          </Button>
          <Button onClick={() => {/* TODO: Implementar creación */}} className="flex items-center space-x-2">
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
                  <tr key={`${order.id}-${order.descripcion}`} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap" style={{backgroundColor: 'yellow'}}>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getClienteName(order)}
                        </div>
                        <div className="text-sm text-red-500 font-bold">
                          🚗 CAMBIO APLICADO: {order.descripcion}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${workOrdersService.getStatusColor(order.estado).bg} ${workOrdersService.getStatusColor(order.estado).text}`}>
                        {workOrdersService.formatStatus(order.estado)}
                      </span>
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
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleViewWorkOrder(order)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                          title="Ver detalles"
                        >
                          👁️ Ver
                        </button>
                        <button
                          onClick={() => handleViewTasks(order)}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-xs"
                          title="Ver y gestionar tareas"
                        >
                          📋 Tareas
                        </button>
                        {/* Botón Control de Calidad - disponible si está en proceso */}
                        {order.estado === 'En proceso' && (
                          <button
                            onClick={() => handleQualityControl(order)}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs font-semibold"
                            title="Control de Calidad"
                          >
                            🔍 Calidad
                          </button>
                        )}
                        {/* Botón Pausar - disponible si está en progreso */}
                        {order.estado === 'En proceso' && (
                          <button
                            onClick={() => handlePauseWorkOrder(order.id!)}
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-semibold"
                            title="Pausar orden"
                          >
                            ⏸️ Pausar
                          </button>
                        )}
                        {/* Botón Completar - disponible si está en progreso */}
                        {order.estado === 'En proceso' && (
                          <button
                            onClick={() => handleCompleteWorkOrder(order.id!)}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold"
                            title="Completar orden"
                          >
                            ✅ Completar
                          </button>
                        )}
                        <button
                          onClick={() => {/* TODO: Implementar edición */}}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs"
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteWorkOrder(order.id!)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                          title="Eliminar"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredWorkOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron órdenes que coincidan con los filtros.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles de la Orden de Trabajo"
      >
        {selectedWorkOrder && (
          <WorkOrderDetails 
            order={selectedWorkOrder} 
            clientName={getClienteName(selectedWorkOrder)} 
            vehicleName={getVehicleName(selectedWorkOrder)} 
            serviceName={getServiceName(selectedWorkOrder.servicioId)} 
            appointmentName={selectedWorkOrder.appointmentId ? getAppointmentName(selectedWorkOrder.appointmentId) : undefined}
            quotationName={selectedWorkOrder.quotationId ? `COT-${selectedWorkOrder.quotationId?.substring(0, 8)}` : undefined}
          />
        )}
      </Modal>

      {/* Modal de tareas */}
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

      {/* Modal de control de calidad */}
      {selectedOrderForQuality && (
        <QualityControlModal
          isOpen={showQualityControlModal}
          onClose={() => setShowQualityControlModal(false)}
          workOrder={selectedOrderForQuality}
          clientName={getClienteName(selectedOrderForQuality)}
          vehicleName={getVehicleName(selectedOrderForQuality)}
          onComplete={handleQualityControlComplete}
        />
      )}
    </div>
  );
}

// Componente para mostrar detalles de la orden de trabajo
interface WorkOrderDetailsProps {
  order: WorkOrderData;
  clientName?: string;
  vehicleName?: string;
  serviceName?: string;
  appointmentName?: string;
  quotationName?: string;
}

function WorkOrderDetails({ order, clientName, vehicleName, serviceName, appointmentName, quotationName }: WorkOrderDetailsProps) {
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
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${workOrdersService.getStatusColor(order.estado).bg} ${workOrdersService.getStatusColor(order.estado).text}`}>
                  {workOrdersService.formatStatus(order.estado)}
                </span>
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
              <dd className="text-sm text-gray-900">{clientName || order.clienteId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Vehículo</dt>
              <dd className="text-sm text-gray-900">{vehicleName || order.vehiculoId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Servicio</dt>
              <dd className="text-sm text-gray-900">{serviceName || order.servicioId}</dd>
            </div>
            {order.quotationId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Cotización de Origen</dt>
                <dd className="text-sm text-gray-900">{quotationName || `COT-${order.quotationId?.substring(0, 8)}`}</dd>
              </div>
            )}
            {order.appointmentId && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Cita de Origen</dt>
                <dd className="text-sm text-gray-900">{appointmentName || order.appointmentId}</dd>
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
};

export default WorkOrdersPage;
