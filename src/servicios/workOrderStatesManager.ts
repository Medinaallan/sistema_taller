import { WorkOrderStatus } from './workOrdersService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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

  // Cargar estados desde el backend
  private async loadStates(): Promise<void> {
    try {
      console.log('📂 Cargando estados desde backend...');
      const response = await fetch(`${API_BASE_URL}/workorder-states`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.states = result.data || {};
        console.log('✅ Estados cargados desde backend:', this.states);
        this.initialized = true;
      } else {
        console.error('❌ Error en respuesta:', result.message);
        this.states = {};
        this.initialized = true; // Marcar como inicializado aunque esté vacío
      }
    } catch (error) {
      console.error('❌ Error cargando estados desde backend:', error);
      this.states = {};
      this.initialized = true; // Marcar como inicializado aunque haya error
    }
  }

  // Esperar a que se complete la inicialización
  async waitForInit(): Promise<void> {
    await this.initPromise;
  }

  // Obtener el estado de una OT específica (ahora asíncrono)
  async getState(otId: string): Promise<WorkOrderStatus | null> {
    await this.waitForInit();
    const state = this.states[otId];
    if (state) {
      console.log(`📋 Estado de OT ${otId}: ${state}`);
    }
    return state || null;
  }

  // Actualizar el estado de una OT en el backend (usando SP_GESTIONAR_ESTADO_OT)
  async updateState(otId: string, newState: WorkOrderStatus): Promise<{ success: boolean; message?: string }> {
    console.log(`💾 Actualizando estado de OT ${otId} a ${newState}...`);
    console.log(`🔗 URL: ${API_BASE_URL}/workorder-states/${otId}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/workorder-states/${otId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newState }),
      });

      console.log(`📡 Respuesta HTTP: ${response.status} ${response.statusText}`);

      const result = await response.json();
      console.log('📦 Resultado:', result);
      
      if (result.success) {
        this.states[otId] = newState;
        console.log('✅ Estado actualizado correctamente en backend');
        return { success: true, message: result.message };
      } else {
        // El SP rechazó el cambio (ej: tareas pendientes)
        console.warn('⚠️ El cambio de estado fue rechazado:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Error actualizando estado en backend:', error);
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
      console.log(`🆕 Inicializando estado de OT ${otId} a ${initialState} (solo memoria)`);
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
