import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Modal, Badge } from '../../componentes/comunes/UI';
import useInterconnectedData from '../../contexto/useInterconnectedData';
import { formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import type { WorkOrder, Client, Vehicle } from '../../tipos/index';

const WorkOrdersPage = () => {
  const data = useInterconnectedData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const filteredWorkOrders = data.workOrders.filter(order => {
    const client = data.getClientById(order.clientId);
    const vehicle = data.getVehicleById(order.vehicleId);
    
    const matchesSearch = 
      order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.problem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle && `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesClient = !clientFilter || order.clientId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleViewWorkOrder = (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    setIsModalOpen(true);
  };

  const handleCompleteWorkOrder = (orderId: string) => {
    if (confirm('¿Estás seguro de que quieres completar esta orden y generar la factura?')) {
      data.completeWorkOrderWithInvoice(orderId);
    }
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in-progress', label: 'En Progreso' },
    { value: 'completed', label: 'Completada' },
  ];

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    ...data.clients.map(client => ({
      value: client.id,
      label: client.name
    }))
  ];

  const pendingOrders = data.workOrders.filter(wo => wo.status === 'pending');
  const inProgressOrders = data.workOrders.filter(wo => wo.status === 'in-progress');
  const completedOrders = data.workOrders.filter(wo => wo.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <p className="text-gray-600">Gestiona todas las órdenes de trabajo del taller</p>
        </div>
        <Button onClick={() => {/* TODO: Implementar creación */}} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Nueva Orden</span>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{data.workOrders.length}</div>
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
              {filteredWorkOrders.map((order) => {
                const client = data.getClientById(order.clientId);
                const vehicle = data.getVehicleById(order.vehicleId);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(-6)}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {order.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client?.name || 'Cliente no encontrado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'Vehículo no encontrado'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          order.status === 'completed' ? 'success' : 
                          order.status === 'in-progress' ? 'warning' : 
                          'default'
                        }
                        size="sm"
                      >
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'in-progress' ? 'En Progreso' :
                         'Completada'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(order.totalCost)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Est: {formatCurrency(order.estimatedCost)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Inicio: {order.startDate ? formatDate(order.startDate) : 'N/A'}
                      </div>
                      {order.estimatedCompletionDate && (
                        <div className="text-sm text-gray-500">
                          Est: {formatDate(order.estimatedCompletionDate)}
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
                        {order.status === 'in-progress' && (
                          <button
                            onClick={() => handleCompleteWorkOrder(order.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Completar orden"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {/* TODO: Implementar edición */}}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* TODO: Implementar eliminación */}}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            client={data.getClientById(selectedWorkOrder.clientId)}
            vehicle={data.getVehicleById(selectedWorkOrder.vehicleId)}
          />
        )}
      </Modal>
    </div>
  );
}

// Componente para mostrar detalles de la orden de trabajo
interface WorkOrderDetailsProps {
  order: WorkOrder;
  client: Client | undefined;
  vehicle: Vehicle | undefined;
}

function WorkOrderDetails({ order, client, vehicle }: WorkOrderDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Orden</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">ID de Orden</dt>
              <dd className="text-sm text-gray-900">#{order.id.slice(-6)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="text-sm text-gray-900">{order.description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Problema</dt>
              <dd className="text-sm text-gray-900">{order.problem || 'No especificado'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Diagnóstico</dt>
              <dd className="text-sm text-gray-900">{order.diagnosis || 'Pendiente'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd>
                <Badge 
                  variant={
                    order.status === 'completed' ? 'success' : 
                    order.status === 'in-progress' ? 'warning' : 
                    'default'
                  }
                  size="sm"
                >
                  {order.status === 'pending' ? 'Pendiente' :
                   order.status === 'in-progress' ? 'En Progreso' :
                   'Completada'}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente y Vehículo</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Cliente</dt>
              <dd className="text-sm text-gray-900">{client?.name || 'Cliente no encontrado'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              <dd className="text-sm text-gray-900">{client?.phone || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Vehículo</dt>
              <dd className="text-sm text-gray-900">
                {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : 'Vehículo no encontrado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Placa</dt>
              <dd className="text-sm text-gray-900">{vehicle?.licensePlate || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Información de costos */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Costos</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{formatCurrency(order.laborCost)}</div>
            <div className="text-sm text-blue-500">Mano de Obra</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{formatCurrency(order.partsCost)}</div>
            <div className="text-sm text-purple-500">Repuestos</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{formatCurrency(order.totalCost)}</div>
            <div className="text-sm text-green-500">Total Real</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{formatCurrency(order.estimatedCost)}</div>
            <div className="text-sm text-orange-500">Estimado</div>
          </div>
        </div>
      </div>

      {/* Fechas importantes */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fechas</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
            <dd className="text-sm text-gray-900">{order.startDate ? formatDate(order.startDate) : 'N/A'}</dd>
          </div>
          {order.estimatedCompletionDate && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha Estimada</dt>
              <dd className="text-sm text-gray-900">{formatDate(order.estimatedCompletionDate)}</dd>
            </div>
          )}
          {order.actualCompletionDate && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Finalización</dt>
              <dd className="text-sm text-gray-900">{formatDate(order.actualCompletionDate)}</dd>
            </div>
          )}
        </div>
      </div>

      {/* Notas y recomendaciones */}
      {(order.notes || order.recommendations || order.technicianNotes) && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notas</h3>
          <div className="space-y-3">
            {order.notes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Notas Generales</dt>
                <dd className="text-sm text-gray-900 mt-1">{order.notes}</dd>
              </div>
            )}
            {order.technicianNotes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Notas del Técnico</dt>
                <dd className="text-sm text-gray-900 mt-1">{order.technicianNotes}</dd>
              </div>
            )}
            {order.recommendations && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Recomendaciones</dt>
                <dd className="text-sm text-gray-900 mt-1">{order.recommendations}</dd>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrdersPage;
