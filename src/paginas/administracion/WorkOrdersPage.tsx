import { useState } from 'react';
import { Card, Button, Select, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import type { WorkOrder, WorkOrderFilters } from '../../tipos/index';
import { formatCurrency } from '../../utilidades/globalMockDatabase';

// Componente para los filtros de órdenes
function WorkOrderFilters({ filters, onChange }: {
  filters: WorkOrderFilters;
  onChange: (filters: WorkOrderFilters) => void;
}) {
  const { state } = useApp();
  const mechanicOptions = state.users
    .filter(user => user.role === 'mechanic')
    .map(user => ({ value: user.id, label: user.name }));

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <Button>Nueva Orden</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Fecha Inicio"
            value={filters.startDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => onChange({
              ...filters,
              startDate: e.target.value ? new Date(e.target.value) : undefined
            })}
          />
          <Input
            type="date"
            label="Fecha Fin"
            value={filters.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => onChange({
              ...filters,
              endDate: e.target.value ? new Date(e.target.value) : undefined
            })}
          />
          <Select
            label="Estado"
            value={filters.status || ''}
            onChange={(e) => onChange({
              ...filters,
              status: (e.target.value as WorkOrder['status']) || undefined
            })}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'in-progress', label: 'En Proceso' },
              { value: 'completed', label: 'Completada' },
              { value: 'rejected', label: 'Rechazada' }
            ]}
          />
          <Select
            label="Mecánico"
            value={filters.mechanicId || ''}
            onChange={(e) => onChange({
              ...filters,
              mechanicId: e.target.value || undefined
            })}
            options={[
              { value: '', label: 'Todos los mecánicos' },
              ...mechanicOptions
            ]}
          />
        </div>
        <div className="flex justify-end">
          <Button>
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente para mostrar el resumen de una orden
function WorkOrderCard({ order }: { order: WorkOrder }) {
  const getStatusColor = (status: WorkOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'in-progress': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'completed': return 'bg-green-50 border-green-200 text-green-700';
      case 'rejected': return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  const getPaymentStatusColor = (status: WorkOrder['paymentStatus']) => {
    switch (status) {
      case 'pending': return 'text-red-600';
      case 'partial': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
    }
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Orden #{order.id}</h3>
            <p className="text-sm text-gray-600">{order.serviceType}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status === 'pending' && 'Pendiente'}
            {order.status === 'in-progress' && 'En Proceso'}
            {order.status === 'completed' && 'Completada'}
            {order.status === 'rejected' && 'Rechazada'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Fecha de Creación</p>
            <p className="font-medium">{order.createdAt.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Costo Estimado</p>
            <p className="font-medium">{formatCurrency(order.estimatedCost || 0)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Estado de Pago</p>
              <p className={`font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus === 'pending' && 'Pendiente'}
                {order.paymentStatus === 'partial' && 'Pago Parcial'}
                {order.paymentStatus === 'completed' && 'Pagado'}
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                Ver Detalles
              </Button>
              <Button size="sm">
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Página principal de órdenes de trabajo
export function WorkOrdersPage() {
  const [filters, setFilters] = useState<WorkOrderFilters>({});
  const [orders] = useState<WorkOrder[]>([
    {
      id: '1',
      vehicleId: 'v1',
      clientId: 'c1',
      mechanicId: 'm1',
      receptionistId: 'r1',
      status: 'in-progress',
      description: 'Servicio de mantenimiento preventivo',
      problem: 'Mantenimiento programado',
      serviceType: 'preventive',
      estimatedCompletionDate: new Date(),
      laborCost: 500,
      partsCost: 1000,
      totalCost: 1500,
      estimatedCost: 1500,
      parts: [],
      services: [],
      notes: 'Servicio de rutina',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
        <p className="text-gray-600">Gestión de servicios y reparaciones</p>
      </div>

      <WorkOrderFilters filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map(order => (
          <WorkOrderCard key={order.id} order={order} />
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600">No hay órdenes de trabajo que coincidan con los filtros.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
