import { WorkOrderStatus } from './workOrdersService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Estructura del JSON de estados
interface WorkOrderStatesStorage {
  workOrderStates: Record<string, WorkOrderStatus>;
}

class WorkOrderStatesManager {
  private states: Record<string, WorkOrderStatus> = {};
  private initialized: boolean = false;

  constructor() {
    this.loadStates();
  }

  // Cargar estados desde el backend
  private async loadStates() {
    try {
      console.log('📂 Cargando estados desde backend...');
      const response = await fetch(`${API_BASE_URL}/workorder-states`);
      const result = await response.json();
      
      if (result.success) {
        this.states = result.data || {};
        console.log('✅ Estados cargados desde backend:', this.states);
        this.initialized = true;
      } else {
        console.error('❌ Error en respuesta:', result.message);
        this.states = {};
      }
    } catch (error) {
      console.error('❌ Error cargando estados desde backend:', error);
      this.states = {};
    }
  }

  // Obtener el estado de una OT específica
  getState(otId: string): WorkOrderStatus | null {
    if (!this.initialized) {
      console.warn('⚠️ Estados no inicializados aún');
      return null;
    }
    const state = this.states[otId];
    if (state) {
      console.log(`📋 Estado de OT ${otId}: ${state}`);
    }
    return state || null;
  }

  // Actualizar el estado de una OT en el backend
  async updateState(otId: string, newState: WorkOrderStatus): Promise<void> {
    console.log(`💾 Actualizando estado de OT ${otId} a ${newState}...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/workorder-states/${otId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newState }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.states[otId] = newState;
        console.log('✅ Estado actualizado correctamente en backend');
      } else {
        throw new Error(result.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('❌ Error actualizando estado en backend:', error);
      throw error;
    }
  }

  // Obtener todos los estados
  getAllStates(): Record<string, WorkOrderStatus> {
    return { ...this.states };
  }

  // Inicializar estado de una nueva OT
  async initializeState(otId: string, initialState: WorkOrderStatus = 'Abierta'): Promise<void> {
    if (!this.states[otId]) {
      await this.updateState(otId, initialState);
    }
  }

  // Recargar estados desde el backend
  async reloadStates(): Promise<void> {
    await this.loadStates();
  }
}

// Exportar instancia singleton
export const workOrderStatesManager = new WorkOrderStatesManager();
export default workOrderStatesManager;
