const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
import { workOrderStatesManager } from './workOrderStatesManager';

// Estados de Órdenes de Trabajo (gestionados por BD usando SP_GESTIONAR_ESTADO_OT)
export type WorkOrderStatus = 
  | 'Abierta'
  | 'En proceso'
  | 'Control de calidad'
  | 'Completada'
  | 'Cerrada'
  | 'En espera de repuestos'
  | 'En espera de aprobación'
  | 'Cancelada';

// Estados de Tareas dentro de OT
export type TaskStatus = 'Pendiente' | 'En proceso' | 'Completada' | 'Cancelada';

// Nivel de prioridad de tareas (1-5)
export type TaskPriority = 1 | 2 | 3 | 4 | 5;

// Interfaz para Tarea de OT
export interface OTTarea {
  ot_tarea_id: number;
  ot_id: number;
  tipo_servicio_id: number;
  servicio_nombre: string;
  descripcion?: string;
  prioridad: TaskPriority;
  estado_tarea: TaskStatus;
  horas_estimadas?: number;
  horas_reales?: number;
  color_prioridad: 'ROJO' | 'AMARILLO' | 'VERDE';
}

// Data para crear nueva tarea
export interface CreateTareaData {
  tipo_servicio_id: number;
  descripcion?: string;
  horas_estimadas?: number;
  horas_reales?: number;
  prioridad?: TaskPriority;
  registrado_por?: number;
}

// Response de tareas
export interface TareasResponse {
  success: boolean;
  data?: OTTarea | OTTarea[];
  message?: string;
  msg?: string;
  allow?: boolean;
  ot_tarea_id?: number;
}

export interface WorkOrderData {
  id?: string;
  quotationId?: string;
  appointmentId?: string;
  clienteId: string;
  vehiculoId: string;
  servicioId: string;
  descripcion: string;
  // Nombres para display (vienen del SP)
  nombreCliente?: string;
  nombreVehiculo?: string;
  problema?: string;
  diagnostico?: string;
  tipoServicio: 'preventive' | 'corrective';
  fechaEstimadaCompletado?: string;
  fechaInicioReal?: string;
  costoManoObra: number;
  costoPartes: number;
  costoTotal: number;
  costoEstimado: number;
  notas?: string;
  recomendaciones?: string;
  estadoPago: 'pending' | 'partial' | 'completed';
  estado: WorkOrderStatus; // Ahora usa los 8 estados del negocio
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface WorkOrderResponse {
  success: boolean;
  data?: WorkOrderData | WorkOrderData[];
  message?: string;
}

class WorkOrdersService {
  // Mapear datos del SP al modelo WorkOrderData
  private async mapSpDataToWorkOrder(spData: any): Promise<WorkOrderData> {
    const otId = spData.ot_id?.toString() || '';
    
    // ✅ USAR EL ESTADO QUE VIENE DIRECTAMENTE DE LA BASE DE DATOS
    // El SP SP_OBTENER_ORDENES_TRABAJO ya devuelve el estado correcto
    const estado = (spData.estado_ot as WorkOrderStatus) || 'Abierta';
    
    // Construir nombre del vehículo con marca, modelo y año
    const vehiculoNombre = spData.marca && spData.modelo 
      ? `${spData.marca} ${spData.modelo} ${spData.anio || ''}`.trim()
      : spData.vehiculo_info || 'Vehículo no especificado';
    
    return {
      id: otId,
      quotationId: undefined,
      appointmentId: undefined,
      clienteId: spData.cliente_id?.toString() || '',
      vehiculoId: spData.vehiculo_id?.toString() || '',
      servicioId: '',
      // CORRECCIÓN: descripcion debe ser las notas de recepción (la tarea inicial)
      descripcion: spData.notas_recepcion || spData.descripcion || 'Servicio de taller',
      // CORRECCIÓN: nombreCliente debe venir de nombre_cliente del SP
      nombreCliente: spData.nombre_cliente || spData.nombre_completo || 'Cliente no especificado',
      // CORRECCIÓN: nombreVehiculo construido correctamente con marca/modelo/año
      nombreVehiculo: vehiculoNombre,
      problema: spData.notas_recepcion || '',
      diagnostico: '',
      tipoServicio: 'corrective',
      fechaEstimadaCompletado: spData.fecha_estimada ? new Date(spData.fecha_estimada).toISOString() : undefined,
      fechaInicioReal: spData.fecha_recepcion ? new Date(spData.fecha_recepcion).toISOString() : undefined,
      costoManoObra: 0,
      costoPartes: 0,
      // CORRECCIÓN: costoTotal debe venir del SP
      costoTotal: spData.costo_total || spData.costoTotal || 0,
      costoEstimado: spData.costo_total || spData.costoTotal || 0,
      notas: `Placa: ${spData.placa} | Odómetro: ${spData.odometro_ingreso}km | Asesor: ${spData.nombre_asesor || 'N/A'}`,
      recomendaciones: spData.nombre_mecanico ? `Mecánico asignado: ${spData.nombre_mecanico}` : '',
      estadoPago: 'pending',
      estado: estado, // ✅ Estado viene directo de la BD (SP_OBTENER_ORDENES_TRABAJO)
      fechaCreacion: spData.fecha_recepcion ? new Date(spData.fecha_recepcion).toISOString() : undefined,
      fechaActualizacion: spData.fecha_recepcion ? new Date(spData.fecha_recepcion).toISOString() : undefined,
    };
  }

  // Obtener todas las órdenes de trabajo (SIN LÍMITE DE PAGINACIÓN)
  async getAllWorkOrders(): Promise<WorkOrderData[]> {
    try {
      // 🔥 CRÍTICO: limit=999999 para obtener TODAS las órdenes
      const response = await fetch(`${API_BASE_URL}/workorders?limit=999999`);
      const result: any = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener órdenes de trabajo');
      }
      
      console.log(`📦 getAllWorkOrders: Obtenidas ${result.data?.length || 0} órdenes de ${result.count || 0} totales`);
      
      // Mapear datos del SP al modelo WorkOrderData
      const rawOrders = Array.isArray(result.data) ? result.data : [];
      const orders = await Promise.all(rawOrders.map((order: any) => this.mapSpDataToWorkOrder(order)));
      
      return orders;
    } catch (error) {
      console.error('Error fetching work orders:', error);
      throw error;
    }
  }

  // Obtener una página de órdenes de trabajo (server-side pagination)
  async getWorkOrdersPage(page = 1, limit = 20, includeCosts = false): Promise<{ data: WorkOrderData[]; count: number; page: number; limit: number}> {
    try {
      const url = new URL(`${API_BASE_URL}/workorders`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      if (includeCosts) url.searchParams.set('includeCosts', 'true');

      const response = await fetch(url.toString());
      const result: any = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener órdenes de trabajo');
      }

      const rawOrders = Array.isArray(result.data) ? result.data : [];
      const orders = await Promise.all(rawOrders.map((order: any) => this.mapSpDataToWorkOrder(order)));

      // mapSpDataToWorkOrder returns WorkOrderData; preserve calculated cost if present
      orders.forEach((o, idx) => {
        const raw = rawOrders[idx];
        if (raw && raw._calculatedCost !== undefined) {
          // @ts-ignore attach to the object for display
          (o as any)._calculatedCost = raw._calculatedCost;
        }
      });

      return { data: orders, count: result.count || 0, page: result.page || page, limit: result.limit || limit };
    } catch (error) {
      console.error('Error fetching paged work orders:', error);
      throw error;
    }
  }

  // Obtener órdenes de trabajo por cliente
  async getWorkOrdersByClient(clienteId: string): Promise<WorkOrderData[]> {
    try {
      const allWorkOrders = await this.getAllWorkOrders();
      return allWorkOrders.filter(workOrder => workOrder.clienteId === clienteId);
    } catch (error) {
      console.error('Error fetching client work orders:', error);
      throw error;
    }
  }

  // Obtener órdenes de trabajo por estado
  async getWorkOrdersByStatus(estado: string): Promise<WorkOrderData[]> {
    try {
      const allWorkOrders = await this.getAllWorkOrders();
      return allWorkOrders.filter(workOrder => workOrder.estado === estado);
    } catch (error) {
      console.error('Error fetching work orders by status:', error);
      throw error;
    }
  }

  // Obtener primera orden completada (para mostrar en el dashboard)
  async getFirstCompletedWorkOrder(): Promise<WorkOrderData | null> {
    try {
      const completedOrders = await this.getWorkOrdersByStatus('completed');
      return completedOrders.length > 0 ? completedOrders[0] : null;
    } catch (error) {
      console.error('Error fetching first completed work order:', error);
      return null;
    }
  }

  // Obtener orden de trabajo por ID
  async getWorkOrderById(id: string): Promise<WorkOrderData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorders/${id}`);
      const result: WorkOrderResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener orden de trabajo');
      }
      
      return result.data as WorkOrderData || null;
    } catch (error) {
      console.error('Error fetching work order:', error);
      throw error;
    }
  }

  // Crear nueva orden de trabajo
  async createWorkOrder(workOrderData: Omit<WorkOrderData, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<WorkOrderData> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workOrderData),
      });
      
      const result: WorkOrderResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al crear orden de trabajo');
      }
      
      return result.data as WorkOrderData;
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  }

  // Crear orden de trabajo desde cotización aprobada
  async createWorkOrderFromQuotation(quotation: any): Promise<WorkOrderData> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorders/from-quotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quotation }),
      });
      
      const result: WorkOrderResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al crear orden de trabajo desde cotización');
      }
      
      return result.data as WorkOrderData;
    } catch (error) {
      console.error('Error creating work order from quotation:', error);
      throw error;
    }
  }

  // Actualizar orden de trabajo
  async updateWorkOrder(id: string, updateData: Partial<WorkOrderData>): Promise<WorkOrderData> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result: WorkOrderResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar orden de trabajo');
      }
      
      return result.data as WorkOrderData;
    } catch (error) {
      console.error('Error updating work order:', error);
      throw error;
    }
  }

  // Cambiar estado de orden de trabajo (usando SP_GESTIONAR_ESTADO_OT)
  async changeStatus(id: string, newStatus: WorkOrderData['estado']): Promise<{ success: boolean; message?: string; order?: WorkOrderData }> {
    console.log(`🔄 Cambiando estado de OT ${id} a ${newStatus} (usando SP)`);
    
    // Actualizar usando el SP que valida las tareas
    const result = await workOrderStatesManager.updateState(id, newStatus);
    
    if (!result.success) {
      // El SP rechazó el cambio (ej: tareas pendientes)
      console.warn('⚠️ Cambio de estado rechazado:', result.message);
      return { 
        success: false, 
        message: result.message 
      };
    }
    
    // Obtener la orden actualizada
    const orders = await this.getAllWorkOrders();
    const updatedOrder = orders.find(o => o.id === id);
    
    if (!updatedOrder) {
      return { 
        success: false, 
        message: 'Orden de trabajo no encontrada' 
      };
    }
    
    return { 
      success: true, 
      message: result.message,
      order: updatedOrder 
    };
  }

  // Iniciar orden de trabajo
  async startWorkOrder(id: string): Promise<{ success: boolean; message?: string; order?: WorkOrderData }> {
    console.log(`🚀 Iniciando OT ${id}`);
    return this.changeStatus(id, 'En proceso');
  }

  // Completar orden de trabajo (usando SP - valida que tareas estén completadas)
  async completeWorkOrder(id: string, userId?: number): Promise<{ success: boolean; message?: string; order?: WorkOrderData }> {
    console.log(`✅ Completando OT ${id} (usando SP con validación de tareas)`);
    
    try {
      // Primero, cambiar el estado a "Completada"
      const statusResult = await this.changeStatus(id, 'Completada');
      
      if (!statusResult.success) {
        return statusResult;
      }
      
      // Obtener usuario ID desde localStorage si no se proporciona
      const getUserId = (): number => {
        if (userId) return userId;
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            return parseInt(user.id) || 1;
          }
        } catch (error) {
          console.error('Error obteniendo usuario ID:', error);
        }
        return 1;
      };
      
      // Luego, generar automáticamente la factura usando el SP
      console.log(`🧾 Generando factura automáticamente para OT ${id}...`);
      
      const response = await fetch(`${API_BASE_URL}/invoices/generate-from-ot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ot_id: parseInt(id),
          registrado_por: getUserId()
        })
      });
      
      const facturaResult = await response.json();
      
      if (!response.ok || !facturaResult.success) {
        console.error('❌ Error generando factura automáticamente:', facturaResult.message);
        // No fallar la operación completa si la factura no se genera
        return {
          ...statusResult,
          message: `OT completada pero no se pudo generar la factura: ${facturaResult.message}`
        };
      }
      
      console.log(`✅ Factura generada automáticamente: ${facturaResult.data.numero_factura} (ID: ${facturaResult.data.factura_id})`);
      
      return {
        ...statusResult,
        message: `OT completada exitosamente. Factura ${facturaResult.data.numero_factura} generada.`
      };
    } catch (error) {
      console.error('❌ Error completando OT y generando factura:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al completar OT'
      };
    }
  }

  // Cancelar orden de trabajo
  async cancelWorkOrder(id: string): Promise<{ success: boolean; message?: string; order?: WorkOrderData }> {
    console.log(`❌ Cancelando OT ${id}`);
    return this.changeStatus(id, 'Cancelada');
  }

  // Eliminar orden de trabajo
  async deleteWorkOrder(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorders/${id}`, {
        method: 'DELETE',
      });
      
      const result: WorkOrderResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar orden de trabajo');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting work order:', error);
      throw error;
    }
  }

  // Registrar una nueva orden de trabajo manualmente (SP_REGISTRAR_OT_MANUAL)
  async registerWorkOrderManually(data: {
    cliente_id: number;
    vehiculo_id: number;
    cita_id?: number | null;
    asesor_id?: number | null;
    mecanico_encargado_id?: number | null;
    odometro_ingreso?: number | null;
    fecha_estimada?: string | null;
    hora_estimada?: string | null;
    notas_recepcion?: string | null;
    registrado_por?: number | null;
  }): Promise<any> {
    try {
      console.log('📋 Registrando OT manual desde cliente:', data);
      
      const response = await fetch(`${API_BASE_URL}/workorders/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al registrar orden de trabajo');
      }

      const result = await response.json();
      console.log('✅ Orden registrada exitosamente:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error registrando orden:', error);
      throw error;
    }
  }

  // Obtener estados disponibles (ahora con los 8 estados del negocio)
  getAvailableStates(): Array<{ value: WorkOrderStatus; label: string; color: string; description: string }> {
    return [
      { 
        value: 'Abierta', 
        label: 'Abierta', 
        color: 'yellow',
        description: 'Orden de trabajo creada y lista para iniciar'
      },
      { 
        value: 'En proceso', 
        label: 'En Proceso', 
        color: 'blue',
        description: 'Trabajo actualmente en ejecución'
      },
      { 
        value: 'Control de calidad', 
        label: 'Control de Calidad', 
        color: 'purple',
        description: 'En revisión de calidad'
      },
      { 
        value: 'Completada', 
        label: 'Completada', 
        color: 'green',
        description: 'Trabajo finalizado exitosamente'
      },
      { 
        value: 'Cerrada', 
        label: 'Cerrada', 
        color: 'gray',
        description: 'Orden cerrada y archivada'
      },
      { 
        value: 'En espera de repuestos', 
        label: 'Espera de Repuestos', 
        color: 'orange',
        description: 'Pausada esperando repuestos'
      },
      { 
        value: 'En espera de aprobación', 
        label: 'Espera de Aprobación', 
        color: 'amber',
        description: 'Requiere aprobación del cliente'
      },
      { 
        value: 'Cancelada', 
        label: 'Cancelada', 
        color: 'red',
        description: 'Orden cancelada'
      }
    ];
  }

  // Obtener tipos de servicio disponibles
  getServiceTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'preventive', label: 'Preventivo' },
      { value: 'corrective', label: 'Correctivo' }
    ];
  }

  // Obtener estados de pago disponibles
  getPaymentStates(): Array<{ value: string; label: string }> {
    return [
      { value: 'pending', label: 'Pendiente' },
      { value: 'partial', label: 'Parcial' },
      { value: 'completed', label: 'Completado' }
    ];
  }

  // Formatear estado para mostrar
  formatStatus(status: WorkOrderStatus): string {
    const states = this.getAvailableStates();
    const state = states.find(s => s.value === status);
    return state?.label || status;
  }

  // Obtener color del estado para badges
  getStatusColor(status: WorkOrderStatus): { bg: string; text: string } {
    const colorMap: Record<WorkOrderStatus, { bg: string; text: string }> = {
      'Abierta': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'En proceso': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Control de calidad': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'Completada': { bg: 'bg-green-100', text: 'text-green-800' },
      'Cerrada': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'En espera de repuestos': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'En espera de aprobación': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'Cancelada': { bg: 'bg-red-100', text: 'text-red-800' }
    };
    return colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  }

  // Formatear tipo de servicio para mostrar
  formatServiceType(type: string): string {
    const types = this.getServiceTypes();
    const serviceType = types.find(t => t.value === type);
    return serviceType?.label || type;
  }

  // Formatear estado de pago para mostrar
  formatPaymentStatus(status: string): string {
    const states = this.getPaymentStates();
    const state = states.find(s => s.value === status);
    return state?.label || status;
  }

  // ==================== GESTIÓN DE TAREAS DE OT ====================

  // Obtener todas las tareas de una orden de trabajo
  async getTareasByOT(otId: string): Promise<OTTarea[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorders/${otId}/tareas`);
      
      if (!response.ok) {
        throw new Error('Error al obtener tareas de la orden');
      }
      
      const result: TareasResponse = await response.json();
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error('Error obteniendo tareas:', error);
      throw error;
    }
  }

  // Agregar nueva tarea a una orden de trabajo
  async agregarTarea(otId: string, tareaData: CreateTareaData): Promise<OTTarea> {
    try {
      console.log(`➕ Agregando tarea a OT ${otId}:`, tareaData);
      const response = await fetch(`${API_BASE_URL}/workorders/${otId}/tareas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tareaData),
      });
      
      const result: TareasResponse = await response.json();
      
      if (!response.ok || !result.allow) {
        throw new Error(result.message || result.msg || 'Error al agregar tarea');
      }
      
      console.log('✅ Tarea agregada exitosamente:', result);
      return result.data as OTTarea;
    } catch (error) {
      console.error('❌ Error agregando tarea:', error);
      throw error;
    }
  }

  // Eliminar una tarea de OT
  async eliminarTarea(tareaId: number, eliminadoPor?: number): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando tarea ${tareaId}`);
      const response = await fetch(`${API_BASE_URL}/workorders/tareas/${tareaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eliminado_por: eliminadoPor }),
      });
      
      const result: TareasResponse = await response.json();
      
      if (!response.ok || !result.allow) {
        throw new Error(result.message || result.msg || 'Error al eliminar tarea');
      }
      
      console.log('✅ Tarea eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando tarea:', error);
      throw error;
    }
  }

  // Gestionar estado de una tarea
  async gestionarEstadoTarea(
    tareaId: number, 
    nuevoEstado: TaskStatus, 
    horasEstimadas?: number,
    registradoPor?: number
  ): Promise<OTTarea> {
    try {
      console.log(`🔄 Gestionando estado de tarea ${tareaId} a ${nuevoEstado}`);
      const response = await fetch(`${API_BASE_URL}/workorders/tareas/${tareaId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevo_estado: nuevoEstado,
          horas_estimadas: horasEstimadas,
          registrado_por: registradoPor
        }),
      });
      
      const result: TareasResponse = await response.json();
      
      if (!response.ok || !result.allow) {
        throw new Error(result.message || result.msg || 'Error al gestionar estado de tarea');
      }
      
      console.log('✅ Estado de tarea gestionado exitosamente');
      return result.data as OTTarea;
    } catch (error) {
      console.error('❌ Error gestionando estado de tarea:', error);
      throw error;
    }
  }

  // Helpers para prioridades de tareas
  getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      1: 'Baja',
      2: 'Media-Baja',
      3: 'Normal',
      4: 'Alta',
      5: 'Crítica'
    };
    return labels[priority];
  }

  getPriorityColor(priority: TaskPriority): string {
    const colors: Record<TaskPriority, string> = {
      1: 'text-gray-600 bg-gray-100',
      2: 'text-blue-600 bg-blue-100',
      3: 'text-green-600 bg-green-100',
      4: 'text-orange-600 bg-orange-100',
      5: 'text-red-600 bg-red-100'
    };
    return colors[priority];
  }

  getPriorityOptions(): Array<{ value: TaskPriority; label: string }> {
    return [
      { value: 1, label: 'Baja - Estética o ruidos leves' },
      { value: 2, label: 'Media-Baja - Mantenimiento preventivo' },
      { value: 3, label: 'Normal - Operación estándar' },
      { value: 4, label: 'Alta - Afecta seguridad o espera cliente' },
      { value: 5, label: 'Crítica - Garantías, emergencias, urgente' }
    ];
  }

  // Helpers para estados de tareas
  getTaskStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      'Pendiente': 'Pendiente',
      'En proceso': 'En Proceso',
      'Completada': 'Completada',
      'Cancelada': 'Cancelada'
    };
    return labels[status];
  }

  getTaskStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
      'Pendiente': 'text-yellow-700 bg-yellow-100',
      'En proceso': 'text-blue-700 bg-blue-100',
      'Completada': 'text-green-700 bg-green-100',
      'Cancelada': 'text-red-700 bg-red-100'
    };
    return colors[status];
  }

  getTaskStatusOptions(): Array<{ value: TaskStatus; label: string }> {
    return [
      { value: 'Pendiente', label: 'Pendiente' },
      { value: 'En proceso', label: 'En Proceso' },
      { value: 'Completada', label: 'Completada' },
      { value: 'Cancelada', label: 'Cancelada' }
    ];
  }

  // Estados temporales de OT (hasta implementar SP reales)
  getWorkOrderStatusOptions(): Array<{ value: WorkOrderStatus; label: string }> {
    return [
      { value: 'Abierta', label: 'Abierta - Vehículo ingresado' },
      { value: 'En proceso', label: 'En Proceso - Trabajo iniciado' },
      { value: 'Control de calidad', label: 'Control de Calidad - Verificación final' },
      { value: 'Completada', label: 'Completada - Lista para retiro' },
      { value: 'Cerrada', label: 'Cerrada - Entregada y facturada' },
      { value: 'En espera de repuestos', label: 'En Espera de Repuestos' },
      { value: 'En espera de aprobación', label: 'En Espera de Aprobación' },
      { value: 'Cancelada', label: 'Cancelada' }
    ];
  }

  getWorkOrderStatusColor(status: WorkOrderStatus): string {
    const colors: Record<WorkOrderStatus, string> = {
      'Abierta': 'text-blue-700 bg-blue-100',
      'En proceso': 'text-purple-700 bg-purple-100',
      'Control de calidad': 'text-indigo-700 bg-indigo-100',
      'Completada': 'text-green-700 bg-green-100',
      'Cerrada': 'text-gray-700 bg-gray-100',
      'En espera de repuestos': 'text-orange-700 bg-orange-100',
      'En espera de aprobación': 'text-yellow-700 bg-yellow-100',
      'Cancelada': 'text-red-700 bg-red-100'
    };
    return colors[status];
  }
}

export const workOrdersService = new WorkOrdersService();
export default workOrdersService;