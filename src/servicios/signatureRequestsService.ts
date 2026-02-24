const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface SignatureRequest {
  otId: string;
  clienteId: string;
  clienteNombre: string;
  vehiculoInfo: string;
  descripcion?: string; // Description of the service/work order
  fechaSolicitud: string;
  estado: 'pending' | 'signed' | 'rejected';
  firmadoPor?: string;
  firmaImagen?: string; // Base64 encoded signature image
  fechaFirma?: string;
}

class SignatureRequestsService {
  // Crear solicitud de firma para el cliente
  async createSignatureRequest(request: Omit<SignatureRequest, 'fechaSolicitud' | 'estado'>): Promise<boolean> {
    try {
      // Use drive-test-permissions SP-backed endpoint
      const getUserId = (): number => {
        try {
          const stored = localStorage.getItem('usuario_id');
          if (stored) return parseInt(stored, 10);
          const userData = localStorage.getItem('user');
          if (userData) {
            const u = JSON.parse(userData);
            return parseInt(u.id || u.userId || u.usuario_id, 10) || 1;
          }
        } catch (e) {
          console.error('Error obteniendo usuario desde localStorage:', e);
        }
        return 1;
      };

      const payload: any = {
        otId: request.otId,
        descripcion: request.descripcion || null,
        registradoPor: getUserId()
      };

      const response = await fetch(`${API_BASE_URL}/drive-test-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Error al crear solicitud');

      return true;
    } catch (error) {
      console.error('Error creando solicitud de firma:', error);
      throw error;
    }
  }

  // Obtener solicitudes pendientes de un cliente
  async getClientPendingRequests(clienteId: string): Promise<SignatureRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/drive-test-permissions/client/${clienteId}?estado=Pendiente`);
      if (!response.ok) throw new Error('Error al obtener solicitudes');

      const result = await response.json();
      const rows = result.data || [];

      // Map drive-test permission rows to SignatureRequest shape expected by UI
      return rows.map((r: any) => ({
        otId: String(r.ot_id || r.otId || r.orden_trabajo_id || ''),
        clienteId: String(r.cliente_id || r.client_id || r.usuario_id || clienteId),
        clienteNombre: r.nombre_cliente || r.nombre || r.cliente_nombre || '',
        vehiculoInfo: r.vehiculo_info || r.vehiculo || r.vehiculo_nombre || '',
        descripcion: r.descripcion || r.descripcion_solicitud || '',
        fechaSolicitud: r.fecha_hora_solicitud ? new Date(r.fecha_hora_solicitud).toISOString() : (r.fecha_solicitud || new Date().toISOString()),
        estado: (r.estado || 'Pendiente').toLowerCase() === 'pendiente' ? 'pending' : ((r.estado || '').toLowerCase() === 'aprobado' ? 'signed' : 'rejected'),
        firmadoPor: r.firmado_por ? String(r.firmado_por) : undefined,
        firmaImagen: r.firma_url || undefined,
        fechaFirma: r.fecha_hora_resolucion ? new Date(r.fecha_hora_resolucion).toISOString() : undefined
      } as SignatureRequest));
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      return [];
    }
  }

  // Firmar (aprobar) solicitud
  async signRequest(otId: string, signatureData: string): Promise<boolean> {
    try {
      const payload = {
        estadoResolucion: 'Aprobado',
        firmadoPor: 'Cliente',
        firmaBase64: signatureData
      };

      const response = await fetch(`${API_BASE_URL}/drive-test-permissions/${otId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Error al firmar');
      return true;
    } catch (error) {
      console.error('Error firmando solicitud:', error);
      throw error;
    }
  }

  // Rechazar solicitud
  async rejectRequest(otId: string): Promise<boolean> {
    try {
      const payload = { estadoResolucion: 'Denegado', firmadoPor: null };
      const response = await fetch(`${API_BASE_URL}/drive-test-permissions/${otId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Error al rechazar');
      return true;
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      throw error;
    }
  }
}

export const signatureRequestsService = new SignatureRequestsService();
export default signatureRequestsService;
