const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface WorkOrderData {
  id?: string;
  quotationId?: string;
  appointmentId?: string;
  clienteId: string;
  vehiculoId: string;
  servicioId: string;
  descripcion: string;
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
  estado: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface WorkOrderResponse {
  success: boolean;
  data?: WorkOrderData | WorkOrderData[];
  message?: string;
}

class WorkOrdersService {
  // Obtener todas las órdenes de trabajo
  async getAllWorkOrders(): Promise<WorkOrderData[]> {
    try {
      console.log('🌐 Llamando API:', `${API_BASE_URL}/workorders`);
      const response = await fetch(`${API_BASE_URL}/workorders`);
      console.log('📡 Respuesta recibida. Status:', response.status);
      
      const result: WorkOrderResponse = await response.json();
      console.log('📦 Datos recibidos:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener órdenes de trabajo');
      }
      
      const orders = Array.isArray(result.data) ? result.data : [];
      console.log('🎯 Órdenes procesadas:', orders.length, 'elementos');
      return orders;
    } catch (error) {
      console.error('❌ Error fetching work orders:', error);
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

  // Cambiar estado de orden de trabajo
  async changeStatus(id: string, newStatus: WorkOrderData['estado']): Promise<WorkOrderData> {
    return this.updateWorkOrder(id, { estado: newStatus });
  }

  // Iniciar orden de trabajo
  async startWorkOrder(id: string): Promise<WorkOrderData> {
    return this.updateWorkOrder(id, { 
      estado: 'in-progress',
      fechaInicioReal: new Date().toISOString()
    });
  }

  // Completar orden de trabajo
  async completeWorkOrder(id: string): Promise<WorkOrderData> {
    return this.updateWorkOrder(id, { estado: 'completed' });
  }

  // Cancelar orden de trabajo
  async cancelWorkOrder(id: string): Promise<WorkOrderData> {
    return this.updateWorkOrder(id, { estado: 'cancelled' });
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

  // Obtener estados disponibles
  getAvailableStates(): Array<{ value: string; label: string }> {
    return [
      { value: 'pending', label: 'Pendiente' },
      { value: 'in-progress', label: 'En Progreso' },
      { value: 'completed', label: 'Completada' },
      { value: 'cancelled', label: 'Cancelada' }
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
  formatStatus(status: string): string {
    const states = this.getAvailableStates();
    const state = states.find(s => s.value === status);
    return state?.label || status;
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
}

export const workOrdersService = new WorkOrdersService();
export default workOrdersService;