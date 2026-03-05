import { WorkOrderStatus } from './workOrdersService';
import { appConfig } from '../config/config';

const API_BASE_URL = appConfig.apiBaseUrl;

// Estructura del JSON de estados
interface WorkOrderStatesStorage {
  workOrderStates: Record<string, WorkOrderStatus>;
}

class WorkOrderStatesManager {
  private states: Record<string, WorkOrderStatus> = {};
  private initialized: boolean = false;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.loadStates();
  }

  // ⚠️ YA NO SE USA - Los estados vienen directo de la BD con SP_OBTENER_ORDENES_TRABAJO
  // Este método se mantiene por compatibilidad pero ya no carga nada
  private async loadStates(): Promise<void> {
    this.states = {};
    this.initialized = true;
  }

  // Esperar a que se complete la inicialización
  async waitForInit(): Promise<void> {
    await this.initPromise;
  }

  // ⚠️ YA NO SE USA - Los estados vienen directo de la BD
  // Se mantiene por compatibilidad pero siempre retorna null
  async getState(otId: string): Promise<WorkOrderStatus | null> {
    return null;
  }

  // ✅ Actualizar el estado de una OT usando SP_GESTIONAR_ESTADO_OT
  async updateState(otId: string, newState: WorkOrderStatus): Promise<{ success: boolean; message?: string }> {
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
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, message: `Error de conexión: ${errorMessage}` };
    }
  }

  // Obtener todos los estados
  getAllStates(): Record<string, WorkOrderStatus> {
    return { ...this.states };
  }

  // Inicializar estado de una nueva OT (solo en memoria, sin backend)
  async initializeState(otId: string, initialState: WorkOrderStatus = 'Abierta'): Promise<void> {
    await this.waitForInit();
    if (!this.states[otId]) {
      this.states[otId] = initialState;
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
