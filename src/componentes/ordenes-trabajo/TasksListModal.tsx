import React, { useEffect, useState } from 'react';
import { Modal, Button } from '../comunes/UI';
import workOrdersService, { OTTarea, WorkOrderData } from '../../servicios/workOrdersService';
import { TrashIcon, PlayIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { showError, showSuccess, showAlert, showConfirm } from '../../utilidades/sweetAlertHelpers';

interface TasksListModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderData;
  onAddTaskClick: () => void;
  onAddQuotationClick: () => void;
}

const TasksListModal: React.FC<TasksListModalProps> = ({ 
  isOpen, 
  onClose, 
  workOrder,
  onAddTaskClick,
  onAddQuotationClick 
}) => {
  const [tareas, setTareas] = useState<OTTarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workOrder.id) {
      loadTareas();
    }
  }, [isOpen, workOrder.id]);

  const loadTareas = async () => {
    if (!workOrder.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`Cargando tareas de OT ${workOrder.id}`);
      const tareasData = await workOrdersService.getTareasByOT(workOrder.id);
      console.log('Tareas cargadas:', tareasData);
      setTareas(tareasData);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      setError('Error al cargar las tareas de la orden de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (tareaId: number, nuevoEstado: any) => {
    try {
      // Cambiar estado de la tarea
      await workOrdersService.gestionarEstadoTarea(tareaId, nuevoEstado);
      
      // Si se está iniciando una tarea por primera vez y la OT está en estado 'Abierta', iniciarla automáticamente
      if (nuevoEstado === 'En proceso' && workOrder.estado === 'Abierta') {
        console.log('Iniciando OT automáticamente al iniciar primera tarea...');
        try {
          await workOrdersService.startWorkOrder(workOrder.id!);
          console.log('OT iniciada automáticamente');
          showSuccess('Tarea iniciada. La orden de trabajo se ha iniciado automáticamente.');
        } catch (otError) {
          console.error('Error al iniciar OT automáticamente:', otError);
          // No fallar si no se puede iniciar la OT, la tarea ya se inició
          showAlert('Tarea iniciada (nota: la orden de trabajo no se pudo iniciar automáticamente)');
        }
      } else {
        showSuccess('Estado de tarea actualizado exitosamente');
      }
      
      await loadTareas(); // Recargar tareas
      
      // Recargar la página para actualizar el estado de la OT
      if (nuevoEstado === 'En proceso' && workOrder.estado === 'Abierta') {
        window.location.reload();
      }
    } catch (err) {
      showError('Error al cambiar estado: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleDeleteTask = async (tareaId: number) => {
    if (!await showConfirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }

    try {
      await workOrdersService.eliminarTarea(tareaId);
      showSuccess('Tarea eliminada exitosamente');
      await loadTareas(); // Recargar tareas
    } catch (err) {
      showError('Error al eliminar tarea: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tareas de la Orden de Trabajo #${workOrder.id?.slice(-8)}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header con información de la OT */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Cliente:</span> {workOrder.clienteId}
            </div>
            <div>
              <span className="font-medium">Vehículo:</span> {workOrder.vehiculoId}
            </div>
            <div>
              <span className="font-medium">Estado OT:</span>{' '}
              <span className="font-semibold text-blue-600">{workOrder.estado}</span>
            </div>
            <div>
              <span className="font-medium">Total de Tareas:</span>{' '}
              <span className="font-semibold">{tareas.length}</span>
            </div>
          </div>
          
          {/* Botón para iniciar OT si está Abierta y hay tareas en proceso */}
          {workOrder.estado === 'Abierta' && tareas.some(t => t.estado_tarea === 'En proceso') && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 mb-2">
                ⚠️ Hay tareas en proceso pero la OT sigue en estado "Abierta"
              </p>
              <button
                onClick={async () => {
                  try {
                    await workOrdersService.startWorkOrder(workOrder.id!);
                    showSuccess('Orden de trabajo iniciada correctamente');
                    window.location.reload();
                  } catch (error) {
                    showError('Error al iniciar OT: ' + (error instanceof Error ? error.message : 'Error desconocido'));
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                🚀 Iniciar Orden de Trabajo
              </button>
            </div>
          )}
        </div>

        {/* Botones para agregar tarea o cotización */}
        <div className="flex justify-end gap-3">
          {workOrder.estado === 'Completada' || workOrder.estado === 'Cerrada' || workOrder.estado === 'Cancelada' ? (
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-md">
              ⚠️ No se pueden agregar tareas ni cotizaciones a una orden {workOrder.estado.toLowerCase()}
            </div>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={onAddQuotationClick}
                className="flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Agregar Cotización</span>
              </Button>
              <Button
                onClick={onAddTaskClick}
                className="flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Agregar Tarea</span>
              </Button>
            </>
          )}
        </div>

        {/* Tabla de tareas */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Cargando tareas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : tareas.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            No hay tareas registradas para esta orden de trabajo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas Est.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas Reales
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tareas.map((tarea) => (
                  <tr key={tarea.ot_tarea_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {tarea.ot_tarea_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {tarea.servicio_nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tarea.descripcion || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${workOrdersService.getPriorityColor(tarea.prioridad)}`}>
                        {workOrdersService.getPriorityLabel(tarea.prioridad)}
                      </span>
                      <span className={`ml-2 text-xs font-bold ${
                        tarea.color_prioridad === 'ROJO' ? 'text-red-600' :
                        tarea.color_prioridad === 'AMARILLO' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        ●
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${workOrdersService.getTaskStatusColor(tarea.estado_tarea)}`}>
                        {workOrdersService.getTaskStatusLabel(tarea.estado_tarea)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {tarea.horas_estimadas ? `${tarea.horas_estimadas} hrs` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {tarea.horas_reales ? `${tarea.horas_reales} hrs` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        {workOrder.estado === 'Completada' ? (
                          <span className="text-xs text-gray-400 italic">Orden completada</span>
                        ) : (
                          <>
                            {/* Botón para iniciar tarea */}
                            {tarea.estado_tarea === 'Pendiente' && (
                              <button
                                onClick={() => handleChangeStatus(tarea.ot_tarea_id, 'En proceso')}
                                className="text-blue-600 hover:text-blue-800"
                                title="Iniciar tarea"
                              >
                                <PlayIcon className="h-5 w-5" />
                              </button>
                            )}

                            {/* Botón para completar tarea */}
                            {tarea.estado_tarea === 'En proceso' && (
                              <button
                                onClick={() => handleChangeStatus(tarea.ot_tarea_id, 'Completada')}
                                className="text-green-600 hover:text-green-800"
                                title="Completar tarea"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                            )}

                            {/* Botón para cancelar tarea */}
                            {(tarea.estado_tarea === 'Pendiente' || tarea.estado_tarea === 'En proceso') && (
                              <button
                                onClick={() => handleChangeStatus(tarea.ot_tarea_id, 'Cancelada')}
                                className="text-orange-600 hover:text-orange-800"
                                title="Cancelar tarea"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            )}

                            {/* Botón para eliminar tarea */}
                            <button
                              onClick={() => handleDeleteTask(tarea.ot_tarea_id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar tarea"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer con información adicional */}
        {!loading && tareas.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Pendientes:</span>{' '}
                <span className="text-yellow-600 font-semibold">
                  {tareas.filter(t => t.estado_tarea === 'Pendiente').length}
                </span>
              </div>
              <div>
                <span className="font-medium">En Proceso:</span>{' '}
                <span className="text-blue-600 font-semibold">
                  {tareas.filter(t => t.estado_tarea === 'En proceso').length}
                </span>
              </div>
              <div>
                <span className="font-medium">Completadas:</span>{' '}
                <span className="text-green-600 font-semibold">
                  {tareas.filter(t => t.estado_tarea === 'Completada').length}
                </span>
              </div>
              <div>
                <span className="font-medium">Canceladas:</span>{' '}
                <span className="text-red-600 font-semibold">
                  {tareas.filter(t => t.estado_tarea === 'Cancelada').length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botón de cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TasksListModal;
