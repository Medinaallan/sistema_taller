import { useState, useEffect } from 'react';
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

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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

  if (loading) {
    return (
      <Card title="Mis Órdenes de Trabajo">
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Cargando órdenes de trabajo...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Mis Órdenes de Trabajo">
        {data.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500 mb-4">No tienes órdenes de trabajo disponibles</div>
            <p className="text-sm text-gray-400">
              Las órdenes de trabajo aparecerán aquí después de que se aprueben tus cotizaciones
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {data.map((workOrder) => (
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
                        👁️ Ver Tareas
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Tareas */}
      {showTasksModal && selectedOT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">Tareas de la Orden de Trabajo #{selectedOT.numero_ot.substring(selectedOT.numero_ot.length - 2)}</h2>
                <div className="text-sm text-gray-600 mt-1">
                  <p>Cliente: {selectedOT.nombre_cliente}</p>
                  <p>Vehículo: {selectedOT.vehiculo_info}</p>
                  <p>Estado OT: <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(selectedOT.estado_ot)}`}>{selectedOT.estado_ot}</span></p>
                  <p>Total de Tareas: {selectedOT.total_tareas}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTasksModal(false);
                  setSelectedOT(null);
                  setTasks([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
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
                  <div className="grid gap-4">
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <div className="grid grid-cols-4 gap-4">
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
                  </div>
                  
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
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
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
