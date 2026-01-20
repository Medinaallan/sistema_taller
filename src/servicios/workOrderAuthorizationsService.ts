const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Estado de autorización
export type AuthorizationStatus = 'pending' | 'approved' | 'rejected';

// Interfaz para autorización de OT
export interface WorkOrderAuthorization {
  otId: string;
  otNumero?: string;
  clienteId: string;
  clienteNombre?: string;
  vehiculoInfo?: string;
  motivo: string;
  detalles: string;
  costoEstimado?: number;
  fechaEnvio: string;
  fechaRespuesta?: string;
  estado: AuthorizationStatus;
  comentariosCliente?: string;
  enviadoPor?: number;
  enviadoPorNombre?: string;
}

// Estructura del JSON
interface AuthorizationsStorage {
  authorizations: Record<string, WorkOrderAuthorization>;
}

class WorkOrderAuthorizationsService {
  // Obtener todas las autorizaciones
  async getAllAuthorizations(): Promise<WorkOrderAuthorization[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorder-authorizations`);
      if (!response.ok) throw new Error('Error al cargar autorizaciones');
      
      const result = await response.json();
      return Object.values(result.data || {});
    } catch (error) {
      console.error('Error cargando autorizaciones:', error);
      return [];
    }
  }

  // Obtener autorizaciones pendientes de un cliente
  async getClientPendingAuthorizations(clienteId: string): Promise<WorkOrderAuthorization[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorder-authorizations/client/${clienteId}`);
      if (!response.ok) throw new Error('Error al cargar autorizaciones del cliente');
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error cargando autorizaciones del cliente:', error);
      return [];
    }
  }

  // Obtener autorización de una OT específica
  async getAuthorizationByOT(otId: string): Promise<WorkOrderAuthorization | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/workorder-authorizations/ot/${otId}`);
      if (!response.ok) return null;
      
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error cargando autorización:', error);
      return null;
    }
  }

  // Crear/Enviar nueva autorización
  async createAuthorization(authorization: Omit<WorkOrderAuthorization, 'fechaEnvio' | 'estado'>): Promise<boolean> {
    try {
      console.log('📤 Enviando autorización al cliente...');
      const response = await fetch(`${API_BASE_URL}/workorder-authorizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...authorization,
          fechaEnvio: new Date().toISOString(),
          estado: 'pending'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar autorización');
      }

      const result = await response.json();
      console.log('✅ Autorización enviada:', result);
      return result.success;
    } catch (error) {
      console.error('❌ Error enviando autorización:', error);
      throw error;
    }
  }

  // Responder a una autorización (aprobar/rechazar)
  async respondToAuthorization(
    otId: string, 
    estado: 'approved' | 'rejected', 
    comentarios?: string
  ): Promise<boolean> {
    try {
      console.log(`📝 Respondiendo autorización de OT ${otId}: ${estado}`);
      const response = await fetch(`${API_BASE_URL}/workorder-authorizations/${otId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado,
          comentariosCliente: comentarios,
          fechaRespuesta: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al responder autorización');
      }

      const result = await response.json();
      console.log('✅ Respuesta registrada:', result);
      return result.success;
    } catch (error) {
      console.error('❌ Error respondiendo autorización:', error);
      throw error;
    }
  }

  // Verificar si una OT tiene autorización pendiente
  async hasPendingAuthorization(otId: string): Promise<boolean> {
    const auth = await this.getAuthorizationByOT(otId);
    return auth?.estado === 'pending';
  }

  // Contar autorizaciones pendientes de un cliente
  async countPendingAuthorizations(clienteId: string): Promise<number> {
    const authorizations = await this.getClientPendingAuthorizations(clienteId);
    return authorizations.filter(a => a.estado === 'pending').length;
  }
}

export const workOrderAuthorizationsService = new WorkOrderAuthorizationsService();
export default workOrderAuthorizationsService;
