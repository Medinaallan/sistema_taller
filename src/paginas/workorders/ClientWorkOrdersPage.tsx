import { useState, useEffect } from 'react';
import { appConfig } from '../../config/config';
import { Card, Button } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { showError } from '../../utilidades/sweetAlertHelpers';

interface WorkOrder {
  ot_id: number;
  numero_ot: string;
  estado_ot: string;
  fecha_recepcion: string;
  fecha_estimada: string | null;
  odometro_ingreso: number | null;
  notas_recepcion: string | null;
  nombre_cliente: string;
  telefono_cliente: string;
  vehiculo_info: string;
  placa: string;
  nombre_asesor: string;
  nombre_mecanico: string | null;
  total_tareas: number;
}

interface WorkOrderTask {
  ot_tarea_id: number;
  ot_id: number;
  tipo_servicio_id: number;
  servicio_nombre: string;
  descripcion: string;
  prioridad: string;
  estado_tarea: string;
  horas_estimadas: string | null;
  horas_reales: string | null;
  color_prioridad: string;
}

const ClientWorkOrdersPage = () => {
  const { state } = useApp();
  const user = state.user;
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedOT, setSelectedOT] = useState<WorkOrder | null>(null);
  const [tasks, setTasks] = useState<WorkOrderTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'abiertas' | 'en_proceso' | 'cerradas'>('all');

  const API_BASE_URL = appConfig.apiBaseUrl;

  const loadClientWorkOrders = async () => {
    try {
      if (!user?.id) return;
      
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/workorders/client/${user.id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener órdenes de trabajo');
      }
      
      setData(result.data || []);
    } catch (err) {
      console.error('Error cargando órdenes de trabajo del cliente:', err);
      showError('Error cargando órdenes de trabajo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (otId: number) => {
    try {
      setLoadingTasks(true);
      const response = await fetch(`${API_BASE_URL}/workorders/${otId}/tareas`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener tareas');
      }
      
      setTasks(result.data || []);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      showError('Error cargando tareas: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadClientWorkOrders();
    
    // Recargar cada 30 minutos para mantener estados actualizados
    const interval = setInterval(() => {
      loadClientWorkOrders();
    }, 30000*60*1000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleViewTasks = async (workOrder: WorkOrder) => {
    setSelectedOT(workOrder);
    setShowTasksModal(true);
    await loadTasks(workOrder.ot_id);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'abierta':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en proceso':
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadColor = (color: string) => {
    switch (color.toUpperCase()) {
      case 'ROJO':
        return 'bg-red-500';
      case 'AMARILLO':
        return 'bg-yellow-500';
      case 'VERDE':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Clasificar estados en 3 categorías principales
  const getEstadoCategory = (estado: string): 'abiertas' | 'en_proceso' | 'cerradas' => {
    const lower = estado.toLowerCase();
    if (lower.includes('completada') || lower.includes('cerrada') || lower.includes('cancelada') || lower.includes('entregada')) {
      return 'cerradas';
    }
    if (lower.includes('proceso') || lower.includes('diagnos') || lower.includes('reparac') || lower.includes('espera')) {
      return 'en_proceso';
    }
    return 'abiertas'; // abierta, pendiente, recibida, etc.
  };

  // Filtrar datos según la pestaña activa
  const filteredData = activeFilter === 'all'
    ? data
    : data.filter(wo => getEstadoCategory(wo.estado_ot) === activeFilter);

  // Conteos por categoría
  const counts = {
    all: data.length,
    abiertas: data.filter(wo => getEstadoCategory(wo.estado_ot) === 'abiertas').length,
    en_proceso: data.filter(wo => getEstadoCategory(wo.estado_ot) === 'en_proceso').length,
    cerradas: data.filter(wo => getEstadoCategory(wo.estado_ot) === 'cerradas').length,
  };

  if (loading) {
    return (
      <Card title="Órdenes de Trabajo">
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Cargando órdenes de trabajo...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card title="Órdenes de Trabajo">
        {/* Pestañas de filtrado con scroll horizontal en mobile */}
        <div className="mb-4 -mx-4 sm:-mx-6">
          <div className="overflow-x-auto">
            <div className="flex border-b border-gray-200 min-w-max sm:min-w-0 px-4 sm:px-6">
              {([
                { key: 'all' as const, label: 'Todas', count: counts.all },
                { key: 'abiertas' as const, label: 'Abiertas', count: counts.abiertas },
                { key: 'en_proceso' as const, label: 'En Proceso', count: counts.en_proceso },
                { key: 'cerradas' as const, label: 'Cerradas', count: counts.cerradas },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 sm:px-5 py-3 font-medium text-sm transition-colors border-b-2 flex items-center whitespace-nowrap ${
                    activeFilter === tab.key
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeFilter === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500 mb-4">
              {data.length === 0
                ? 'No tienes órdenes de trabajo disponibles'
                : 'No hay órdenes en esta categoría'}
            </div>
            <p className="text-sm text-gray-400">
              {data.length === 0
                ? 'Las órdenes de trabajo aparecerán aquí después de que se aprueben tus cotizaciones'
                : 'Prueba cambiando de pestaña para ver otras órdenes'}
            </p>
          </div>
        ) : (
          <>
            {/* ===== Vista MOBILE: Tarjetas ===== */}
            <div className="sm:hidden space-y-3">
              {filteredData.map((workOrder) => (
                <div
                  key={workOrder.ot_id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Header de tarjeta */}
                  <div className="px-4 py-3 flex items-start justify-between border-b border-gray-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-gray-500">{workOrder.numero_ot}</p>
                      <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5">{workOrder.vehiculo_info}</h3>
                      <p className="text-xs text-gray-600 font-medium">{workOrder.placa}</p>
                    </div>
                    <span className={`ml-2 flex-shrink-0 px-2.5 py-1 text-xs rounded-full font-medium ${getEstadoColor(workOrder.estado_ot)}`}>
                      {workOrder.estado_ot}
                    </span>
                  </div>

                  {/* Cuerpo de tarjeta */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-gray-500">Recepción</span>
                        <p className="font-medium text-gray-900">
                          {new Date(workOrder.fecha_recepcion).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fecha Est.</span>
                        <p className="font-medium text-gray-900">
                          {workOrder.fecha_estimada
                            ? new Date(workOrder.fecha_estimada).toLocaleDateString('es-ES')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Mecánico</span>
                        <p className="font-medium text-gray-900">{workOrder.nombre_mecanico || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tareas</span>
                        <p>
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {workOrder.total_tareas}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer con acción */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-center"
                      onClick={() => handleViewTasks(workOrder)}
                    >
                      Ver Tareas
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== Vista DESKTOP: Tabla ===== */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3"># OT</th>
                    <th className="px-6 py-3">Vehículo</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Fecha Recepción</th>
                    <th className="px-6 py-3">Fecha Estimada</th>
                    <th className="px-6 py-3">Mecánico</th>
                    <th className="px-6 py-3">Tareas</th>
                    <th className="px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((workOrder) => (
                    <tr key={workOrder.ot_id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs">
                        {workOrder.numero_ot}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{workOrder.placa}</div>
                        <div className="text-xs text-gray-500">{workOrder.vehiculo_info}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(workOrder.estado_ot)}`}>
                          {workOrder.estado_ot}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(workOrder.fecha_recepcion).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">
                        {workOrder.fecha_estimada ? new Date(workOrder.fecha_estimada).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {workOrder.nombre_mecanico || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {workOrder.total_tareas}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleViewTasks(workOrder)}
                        >
                          Ver Tareas
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Modal de Tareas */}
      {showTasksModal && selectedOT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start p-4 sm:p-6 border-b">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">Tareas – OT #{selectedOT.numero_ot.substring(selectedOT.numero_ot.length - 2)}</h2>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-0.5">
                  <p className="truncate">Vehículo: {selectedOT.vehiculo_info}</p>
                  <p>Estado: <span className={`px-2 py-0.5 rounded-full text-xs ${getEstadoColor(selectedOT.estado_ot)}`}>{selectedOT.estado_ot}</span></p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTasksModal(false);
                  setSelectedOT(null);
                  setTasks([]);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingTasks ? (
                <div className="flex justify-center p-8">
                  <div className="text-gray-500">Cargando tareas...</div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No hay tareas registradas para esta orden
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Resumen de tareas */}
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <span className="font-semibold">Pendientes:</span> {tasks.filter(t => t.estado_tarea === 'Pendiente').length}
                      </div>
                      <div>
                        <span className="font-semibold">En Proceso:</span> {tasks.filter(t => t.estado_tarea === 'En proceso').length}
                      </div>
                      <div>
                        <span className="font-semibold">Completadas:</span> {tasks.filter(t => t.estado_tarea === 'Completada').length}
                      </div>
                      <div>
                        <span className="font-semibold">Canceladas:</span> {tasks.filter(t => t.estado_tarea === 'Cancelada').length}
                      </div>
                    </div>
                  </div>

                  {/* Vista MOBILE de tareas: Tarjetas */}
                  <div className="sm:hidden space-y-3">
                    {tasks.map((task) => (
                      <div key={task.ot_tarea_id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900">{task.servicio_nombre}</p>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{task.descripcion}</p>
                          </div>
                          <span className={`ml-2 flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${getEstadoColor(task.estado_tarea)}`}>
                            {task.estado_tarea}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${getPrioridadColor(task.color_prioridad)}`}></div>
                            <span>{task.prioridad}</span>
                          </div>
                          <div className="flex gap-3">
                            {task.horas_estimadas && <span>Est: {task.horas_estimadas}h</span>}
                            {task.horas_reales && <span>Real: {task.horas_reales}h</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista DESKTOP de tareas: Tabla */}
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">SERVICIO</th>
                          <th className="px-4 py-2">DESCRIPCIÓN</th>
                          <th className="px-4 py-2">PRIORIDAD</th>
                          <th className="px-4 py-2">ESTADO</th>
                          <th className="px-4 py-2">HORAS EST.</th>
                          <th className="px-4 py-2">HORAS REALES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task.ot_tarea_id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-center">{task.ot_tarea_id}</td>
                            <td className="px-4 py-3 font-medium">{task.servicio_nombre}</td>
                            <td className="px-4 py-3 text-gray-600">{task.descripcion}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getPrioridadColor(task.color_prioridad)}`}></div>
                                <span className="text-xs">{task.prioridad}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(task.estado_tarea)}`}>
                                {task.estado_tarea}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">{task.horas_estimadas || '-'}</td>
                            <td className="px-4 py-3 text-center">{task.horas_reales || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t">
              <Button 
                variant="secondary"
                onClick={() => {
                  setShowTasksModal(false);
                  setSelectedOT(null);
                  setTasks([]);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientWorkOrdersPage;
