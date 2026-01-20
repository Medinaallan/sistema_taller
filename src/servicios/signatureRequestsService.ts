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
      const response = await fetch(`${API_BASE_URL}/signature-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          fechaSolicitud: new Date().toISOString(),
          estado: 'pending'
        }),
      });

      if (!response.ok) throw new Error('Error al crear solicitud');
      return true;
    } catch (error) {
      console.error('Error creando solicitud de firma:', error);
      throw error;
    }
  }

  // Obtener solicitudes pendientes de un cliente
  async getClientPendingRequests(clienteId: string): Promise<SignatureRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/signature-requests/client/${clienteId}`);
      if (!response.ok) throw new Error('Error al obtener solicitudes');
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      return [];
    }
  }

  // Firmar (aprobar) solicitud
  async signRequest(otId: string, signatureData: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/signature-requests/${otId}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firmadoPor: 'Cliente', 
          firmaImagen: signatureData,
          fechaFirma: new Date().toISOString() 
        }),
      });

      if (!response.ok) throw new Error('Error al firmar');
      return true;
    } catch (error) {
      console.error('Error firmando solicitud:', error);
      throw error;
    }
  }

  // Rechazar solicitud
  async rejectRequest(otId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/signature-requests/${otId}/reject`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Error al rechazar');
      return true;
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      throw error;
    }
  }
}

export const signatureRequestsService = new SignatureRequestsService();
export default signatureRequestsService;
