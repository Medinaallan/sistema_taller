import { appConfig } from '../config/config';
const API_BASE_URL = appConfig.apiBaseUrl;

// Estado del permiso de prueba de manejo
export type DriveTestPermissionStatus = 'Pendiente' | 'Aprobado' | 'Denegado';

// Interfaz para permiso de prueba de manejo
export interface DriveTestPermission {
  permiso_id: number;
  ot_id: number;
  estado: DriveTestPermissionStatus;
  descripcion?: string;
  fecha_hora_solicitud: string;
  fecha_hora_resolucion?: string;
  firmado_por?: number;
  firma_url?: string;
  cliente_id: number;
  nombre_cliente?: string;
  vehiculo_info?: string;
  numero_ot?: string;
}

// Payload para registrar un permiso
export interface CreateDriveTestPermissionPayload {
  otId: number | string;
  descripcion?: string;
  registradoPor: number;
}

// Payload para resolver un permiso
export interface ResolveDriveTestPermissionPayload {
  estadoResolucion: 'Aprobado' | 'Denegado';
  firmadoPor: number;
  firmaBase64?: string; // base64 PNG (data URL) – solo requerido para Aprobado
}

// Filtros para obtener permisos
export interface DriveTestPermissionFilters {
  permisoId?: number;
  otId?: number;
  clienteId?: number;
  estado?: DriveTestPermissionStatus;
  fechaInicio?: string;
  fechaFin?: string;
}

class DriveTestPermissionsService {
  /**
   * Registrar un nuevo permiso de prueba de manejo para una OT.
   * Llama a SP_REGISTRAR_PERMISO_PRUEBA_MANEJO
   */
  async createPermission(payload: CreateDriveTestPermissionPayload): Promise<{ success: boolean; permisoId?: number; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/drive-test-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otId: payload.otId,
          descripcion: payload.descripcion || null,
          registradoPor: payload.registradoPor
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al registrar permiso de prueba');
      }

      return { success: true, permisoId: result.data?.permisoId, message: result.message };
    } catch (error) {
      console.error('Error creando permiso de prueba:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener permisos con filtros opcionales.
   * Llama a SP_OBTENER_PERMISO_PRUEBA_MANEJO
   */
  async getPermissions(filters: DriveTestPermissionFilters = {}): Promise<DriveTestPermission[]> {
    try {
      const params = new URLSearchParams();
      if (filters.permisoId !== undefined) params.append('permisoId', String(filters.permisoId));
      if (filters.otId !== undefined) params.append('otId', String(filters.otId));
      if (filters.clienteId !== undefined) params.append('clienteId', String(filters.clienteId));
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

      const response = await fetch(`${API_BASE_URL}/drive-test-permissions?${params.toString()}`);
      if (!response.ok) throw new Error('Error al obtener permisos de prueba');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
      return [];
    }
  }

  /**
   * Obtener el permiso de una OT específica.
   */
  async getPermissionByOT(otId: number | string): Promise<DriveTestPermission | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/drive-test-permissions/ot/${otId}`);
      if (!response.ok) return null;

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error obteniendo permiso de OT:', error);
      return null;
    }
  }

  /**
   * Obtener permisos pendientes de un cliente.
   */
  async getClientPendingPermissions(clienteId: number | string): Promise<DriveTestPermission[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/drive-test-permissions/client/${clienteId}?estado=Pendiente`
      );
      if (!response.ok) throw new Error('Error al obtener permisos del cliente');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error obteniendo permisos del cliente:', error);
      return [];
    }
  }

  /**
   * Resolver (aprobar/denegar) un permiso de prueba de manejo.
   * Si se aprueba, sube la firma a Digital Ocean Spaces en el backend.
   * Llama a SP_RESOLVER_PERMISO_PRUEBA_MANEJO
   */
  async resolvePermission(
    otId: number | string,
    payload: ResolveDriveTestPermissionPayload
  ): Promise<{ success: boolean; firmaUrl?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/drive-test-permissions/${otId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoResolucion: payload.estadoResolucion,
          firmadoPor: payload.firmadoPor,
          firmaBase64: payload.firmaBase64 || null
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al resolver permiso de prueba');
      }

      return { success: true, firmaUrl: result.data?.firmaUrl, message: result.message };
    } catch (error) {
      console.error('Error resolviendo permiso de prueba:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

export const driveTestPermissionsService = new DriveTestPermissionsService();
export default driveTestPermissionsService;
