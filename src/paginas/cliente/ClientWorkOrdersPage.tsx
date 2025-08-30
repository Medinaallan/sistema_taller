import { useState } from 'react';
import {
  WrenchScrewdriverIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';

interface WorkOrder {
  id: string;
  vehicleId: string;
  vehicleName: string;
  status: 'pending' | 'diagnosed' | 'in-progress' | 'pending-parts' | 'pending-approval' | 'completed' | 'cancelled';
  service: string;
  createdDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  progress: number;
  description: string;
  problem: string;
  diagnosis?: string;
  estimatedCost: number;
  finalCost?: number;
  photos: string[];
  updates: {
    id: string;
    date: string;
    message: string;
    type: 'info' | 'progress' | 'issue' | 'completed';
  }[];
  technician?: {
    name: string;
    phone: string;
  };
}

export function ClientWorkOrdersPage() {
  const { state } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Datos de ejemplo
  const workOrders: WorkOrder[] = [
    {
      id: 'OT-2025-001',
      vehicleId: '1',
      vehicleName: 'Toyota Corolla 2020 (HTN-0123)',
      status: 'in-progress',
      service: 'Mantenimiento General',
      createdDate: '2025-08-25',
      estimatedDelivery: '2025-08-30',
      progress: 75,
      description: 'Cambio de aceite, filtros y revisión general del sistema',
      problem: 'Mantenimiento preventivo rutinario según calendario',
      diagnosis: 'Vehículo en buen estado general. Aceite necesita cambio. Filtros en condición límite.',
      estimatedCost: 8500,
      photos: [],
      updates: [
        {
          id: '1',
          date: '2025-08-25 09:00',
          message: 'Vehículo recibido en taller. Iniciando diagnóstico.',
          type: 'info'
        },
        {
          id: '2',
          date: '2025-08-25 11:30',
          message: 'Diagnóstico completado. Iniciando cambio de aceite y filtros.',
          type: 'progress'
        },
        {
          id: '3',
          date: '2025-08-26 14:00',
          message: 'Cambio de aceite completado. Revisando sistema de frenos.',
          type: 'progress'
        },
        {
          id: '4',
          date: '2025-08-27 10:15',
          message: 'Trabajo 75% completado. Realizando pruebas finales.',
          type: 'progress'
        }
      ],
      technician: {
        name: 'Carlos Mendoza',
        phone: '9876-5432'
      }
    },
    {
      id: 'OT-2025-002',
      vehicleId: '2',
      vehicleName: 'Honda Civic 2019 (HTN-4567)',
      status: 'pending-parts',
      service: 'Reparación de frenos',
      createdDate: '2025-08-28',
      estimatedDelivery: '2025-09-02',
      progress: 40,
      description: 'Cambio de pastillas y discos de freno delanteros',
      problem: 'Frenos chirriando y pedal esponjoso',
      diagnosis: 'Pastillas de freno gastadas completamente. Discos rayados requieren cambio.',
      estimatedCost: 12000,
      photos: [],
      updates: [
        {
          id: '1',
          date: '2025-08-28 08:30',
          message: 'Vehículo ingresado. Diagnóstico inicial programado.',
          type: 'info'
        },
        {
          id: '2',
          date: '2025-08-28 15:00',
          message: 'Diagnóstico completado. Se requiere cambio de pastillas y discos.',
          type: 'progress'
        },
        {
          id: '3',
          date: '2025-08-29 09:00',
          message: 'Esperando llegada de repuestos. Entrega estimada mañana.',
          type: 'issue'
        }
      ],
      technician: {
        name: 'Miguel Rodriguez',
        phone: '9876-5433'
      }
    },
    {
      id: 'OT-2025-003',
      vehicleId: '1',
      vehicleName: 'Toyota Corolla 2020 (HTN-0123)',
      status: 'completed',
      service: 'Cambio de aceite',
      createdDate: '2025-07-15',
      estimatedDelivery: '2025-07-15',
      actualDelivery: '2025-07-15',
      progress: 100,
      description: 'Cambio de aceite y filtro de aceite',
      problem: 'Mantenimiento programado cada 5000 km',
      diagnosis: 'Aceite en buen estado pero cumplió ciclo de cambio.',
      estimatedCost: 3500,
      finalCost: 3500,
      photos: [],
      updates: [
        {
          id: '1',
          date: '2025-07-15 10:00',
          message: 'Vehículo recibido. Iniciando cambio de aceite.',
          type: 'info'
        },
        {
          id: '2',
          date: '2025-07-15 11:30',
          message: 'Cambio de aceite completado. Vehículo listo.',
          type: 'completed'
        }
      ],
      technician: {
        name: 'Carlos Mendoza',
        phone: '9876-5432'
      }
    }
  ];

  const filteredOrders = workOrders.filter(order => {
    switch (activeFilter) {
      case 'active':
        return !['completed', 'cancelled'].includes(order.status);
      case 'completed':
        return order.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-gray-100 text-gray-800', text: 'Pendiente', icon: ClockIcon };
      case 'diagnosed':
        return { color: 'bg-blue-100 text-blue-800', text: 'Diagnosticado', icon: EyeIcon };
      case 'in-progress':
        return { color: 'bg-blue-100 text-blue-800', text: 'En Proceso', icon: WrenchScrewdriverIcon };
      case 'pending-parts':
        return { color: 'bg-orange-100 text-orange-800', text: 'Esperando Repuestos', icon: ExclamationTriangleIcon };
      case 'pending-approval':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Esperando Aprobación', icon: DocumentTextIcon };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Completado', icon: CheckCircleIcon };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', text: 'Cancelado', icon: ExclamationTriangleIcon };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status, icon: ClockIcon };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderOrderCard = (order: WorkOrder) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div key={order.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-xl mr-4">
                <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{order.service}</h3>
                <p className="text-sm text-gray-600">#{order.id}</p>
                <p className="text-sm text-gray-500">{order.vehicleName}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.text}
              </span>
            </div>
          </div>

          {/* Progreso */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Progreso</span>
              <span className="text-gray-500">{order.progress}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  order.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${order.progress}%` }}
              />
            </div>
          </div>

          {/* Información */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha Ingreso</p>
              <p className="text-sm font-semibold text-gray-900">{order.createdDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {order.status === 'completed' ? 'Entregado' : 'Estimado'}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {order.actualDelivery || order.estimatedDelivery}
              </p>
            </div>
          </div>

          {/* Técnico */}
          {order.technician && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Técnico Asignado</p>
                  <p className="text-sm text-gray-600">{order.technician.name}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Contactar
                </button>
              </div>
            </div>
          )}

          {/* Última actualización */}
          {order.updates.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <BellIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">Última Actualización</p>
                  <p className="text-sm text-blue-700">{order.updates[order.updates.length - 1].message}</p>
                  <p className="text-xs text-blue-600 mt-1">{order.updates[order.updates.length - 1].date}</p>
                </div>
              </div>
            </div>
          )}

          {/* Costo */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              {order.status === 'completed' ? 'Costo Final' : 'Costo Estimado'}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(order.finalCost || order.estimatedCost)}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedOrder(order)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Ver Detalles
            </button>
            {order.status !== 'completed' && (
              <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-2" />
                Contactar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOrderDetail = () => {
    if (!selectedOrder) return null;

    const statusConfig = getStatusConfig(selectedOrder.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedOrder.service}</h3>
                  <p className="text-blue-100 text-sm">#{selectedOrder.id} • {selectedOrder.vehicleName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.text}
                </span>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Progreso */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">Progreso del Trabajo</h4>
                <span className="text-2xl font-bold text-blue-600">{selectedOrder.progress}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 mb-2">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    selectedOrder.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${selectedOrder.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {selectedOrder.progress === 100 
                  ? 'Trabajo completado' 
                  : `Estimado para ${selectedOrder.estimatedDelivery}`
                }
              </p>
            </div>

            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Información General</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fecha de ingreso:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedOrder.createdDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Entrega estimada:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedOrder.estimatedDelivery}</span>
                  </div>
                  {selectedOrder.actualDelivery && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Entrega real:</span>
                      <span className="text-sm font-medium text-green-700">{selectedOrder.actualDelivery}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Costos</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Costo estimado:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedOrder.estimatedCost)}</span>
                  </div>
                  {selectedOrder.finalCost && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Costo final:</span>
                      <span className="text-sm font-bold text-green-700">{formatCurrency(selectedOrder.finalCost)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Problema y diagnóstico */}
            <div className="mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-yellow-800 mb-2">Problema Reportado</h5>
                <p className="text-sm text-yellow-700">{selectedOrder.problem}</p>
              </div>
              
              {selectedOrder.diagnosis && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-800 mb-2">Diagnóstico Técnico</h5>
                  <p className="text-sm text-blue-700">{selectedOrder.diagnosis}</p>
                </div>
              )}
            </div>

            {/* Técnico asignado */}
            {selectedOrder.technician && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <h5 className="font-semibold text-gray-900 mb-3">Técnico Asignado</h5>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedOrder.technician.name}</p>
                    <p className="text-sm text-gray-600">Especialista en mecánica general</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Contactar
                  </button>
                </div>
              </div>
            )}

            {/* Timeline de actualizaciones */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">Historial de Actualizaciones</h5>
              <div className="space-y-4">
                {selectedOrder.updates.map((update) => (
                  <div key={update.id} className="flex items-start">
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 mr-4 ${
                      update.type === 'completed' ? 'bg-green-500' :
                      update.type === 'progress' ? 'bg-blue-500' :
                      update.type === 'issue' ? 'bg-orange-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{update.message}</p>
                      <p className="text-xs text-gray-500">{update.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
                  <p className="text-orange-100 text-lg">Seguimiento en tiempo real de tus servicios</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{workOrders.length}</div>
                  <div className="text-orange-100 text-sm">Total Órdenes</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">
                    {workOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}
                  </div>
                  <div className="text-orange-100 text-sm">En Proceso</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">
                    {workOrders.filter(o => o.status === 'completed').length}
                  </div>
                  <div className="text-orange-100 text-sm">Completadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas', count: workOrders.length },
              { key: 'active', label: 'Activas', count: workOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length },
              { key: 'completed', label: 'Completadas', count: workOrders.filter(o => o.status === 'completed').length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  activeFilter === filter.key
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
                <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de órdenes */}
        {filteredOrders.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {filteredOrders.map(renderOrderCard)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay órdenes de trabajo
            </h3>
            <p className="text-gray-500 mb-8">
              Cuando tengas servicios activos aparecerán aquí
            </p>
          </div>
        )}

        {/* Modal de detalle */}
        {selectedOrder && renderOrderDetail()}
      </div>
    </div>
  );
}
