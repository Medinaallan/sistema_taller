const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface QuotationData {
  id?: string;
  appointmentId: string;
  clienteId: string;
  vehiculoId: string;
  servicioId: string;
  descripcion: string;
  precio: number;
  notas?: string;
  estado: 'draft' | 'sent' | 'approved' | 'rejected' | 'completed';
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface QuotationResponse {
  success: boolean;
  data?: QuotationData | QuotationData[];
  message?: string;
}

class QuotationsService {
  // Obtener todas las cotizaciones
  async getAllQuotations(): Promise<QuotationData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations`);
      const result: QuotationResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizaciones');
      }
      
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error('Error fetching quotations:', error);
      throw error;
    }
  }

  // Obtener cotizaciones por cliente
  async getQuotationsByClient(clienteId: string): Promise<QuotationData[]> {
    try {
      const allQuotations = await this.getAllQuotations();
      return allQuotations.filter(quotation => quotation.clienteId === clienteId);
    } catch (error) {
      console.error('Error fetching client quotations:', error);
      throw error;
    }
  }

  // Obtener cotización por ID
  async getQuotationById(id: string): Promise<QuotationData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${id}`);
      const result: QuotationResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotización');
      }
      
      return result.data as QuotationData || null;
    } catch (error) {
      console.error('Error fetching quotation:', error);
      throw error;
    }
  }

  // Crear nueva cotización
  async createQuotation(quotationData: Omit<QuotationData, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<QuotationData> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });
      
      const result: QuotationResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al crear cotización');
      }
      
      return result.data as QuotationData;
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw error;
    }
  }

  // Actualizar cotización
  async updateQuotation(id: string, updateData: Partial<QuotationData>): Promise<QuotationData> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result: QuotationResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar cotización');
      }
      
      return result.data as QuotationData;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  }

  // Aprobar cotización (cliente)
  async approveQuotation(id: string): Promise<QuotationData> {
    return this.updateQuotation(id, { estado: 'approved' });
  }

  // Rechazar cotización (cliente)
  async rejectQuotation(id: string): Promise<QuotationData> {
    return this.updateQuotation(id, { estado: 'rejected' });
  }

  // Eliminar cotización
  async deleteQuotation(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
        method: 'DELETE',
      });
      
      const result: QuotationResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar cotización');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting quotation:', error);
      throw error;
    }
  }

  // Obtener estados disponibles
  getAvailableStates(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Borrador' },
      { value: 'sent', label: 'Enviada' },
      { value: 'approved', label: 'Aprobada' },
      { value: 'rejected', label: 'Rechazada' },
      { value: 'completed', label: 'Completada' }
    ];
  }

  // Formatear estado para mostrar
  formatStatus(status: string): string {
    const states = this.getAvailableStates();
    const state = states.find(s => s.value === status);
    return state?.label || status;
  }
}

export const quotationsService = new QuotationsService();
export default quotationsService;