const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface QuotationData {
  cotizacion_id: number;
  numero_cotizacion: string;
  cita_id: number;
  ot_id: number | null;
  estado_cotizacion: string;
  total: number;
  fecha_creacion: string;
  fecha_vencimiento: string;
  comentario: string;
  registrado_por: string;
  numero_cita: string;
  numero_ot: string;
  nombre_cliente: string;
  placa_vehiculo: string;
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
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizaciones');
      }
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error('Error fetching quotations:', error);
      throw error;
    }
  }

  // Obtener cotizaciones por usuario cliente
  async getQuotationsByClient(userId: string): Promise<QuotationData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/client/${userId}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizaciones del cliente');
      }
      return Array.isArray(result.data) ? result.data : [];
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
  async createQuotation(quotationData: any): Promise<{ cotizacion_id: string; success: boolean; msg: string; allow: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al crear cotización');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw error;
    }
  }

  // Actualizar cotización
  async updateQuotation(id: string, updateData: { decision?: string; usuario_id?: number | null; comentario?: string }): Promise<QuotationData> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar cotización');
      }
      
      return result.data as QuotationData;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  }

  // Aprobar cotización (cliente) - Usa SP_GESTIONAR_APROBACION_COTIZACION
  async approveQuotation(id: string): Promise<QuotationData> {
    const usuario_id = localStorage.getItem('usuario_id');
    return this.updateQuotation(id, { 
      decision: 'Aprobada',
      usuario_id: usuario_id ? parseInt(usuario_id) : null,
      comentario: ''
    });
  }

  // Generar Orden de Trabajo desde cotización aprobada (SP_GENERAR_OT_DESDE_COTIZACION)
  async generateWorkOrderFromQuotation(quotationId: string, otData: {
    asesor_id: number;
    mecanico_encargado_id?: number | null;
    odometro_ingreso?: number | null;
    fecha_estimada?: string | null;
    hora_estimada?: string | null; // horas de trabajo estimadas en formato HH:mm:ss
    generado_por?: number | null;
  }): Promise<{
    success: boolean;
    msg: string;
    allow: boolean;
    ot_id: number;
    numero_ot: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${quotationId}/generate-workorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al generar orden de trabajo');
      }
      
      return result;
    } catch (error) {
      console.error('Error generating work order from quotation:', error);
      throw error;
    }
  }

  // Flujo completo: Aprobar cotización + Generar OT
  async approveAndGenerateWorkOrder(quotationId: string, otData: {
    asesor_id: number;
    mecanico_encargado_id?: number | null;
    odometro_ingreso?: number | null;
    fecha_estimada?: string | null;
    hora_estimada?: string | null;
    generado_por?: number | null;
  }): Promise<{
    quotationApproved: boolean;
    workOrderGenerated: boolean;
    ot_id?: number;
    numero_ot?: string;
    msg: string;
  }> {
    try {
      console.log('🔄 Iniciando flujo de aprobación y generación de OT');
      
      // Verificar estado actual de la cotización
      const quotation = await this.getQuotationById(quotationId);
      const alreadyApproved = quotation?.estado_cotizacion === 'Aprobada';
      
      // Paso 1: Aprobar cotización solo si no está aprobada
      if (!alreadyApproved) {
        console.log(`📋 Paso 1: Aprobando cotización ${quotationId}...`);
        await this.approveQuotation(quotationId);
        console.log('✅ Cotización aprobada exitosamente');
      } else {
        console.log('ℹ️ Cotización ya estaba aprobada, saltando paso de aprobación');
      }
      
      // Paso 2: Generar orden de trabajo (ejecuta SP_GENERAR_OT_DESDE_COTIZACION)
      console.log(`📋 Paso 2: Generando orden de trabajo desde cotización...`);
      const workOrderResult = await this.generateWorkOrderFromQuotation(quotationId, otData);
      console.log('✅ Orden de trabajo generada exitosamente:', workOrderResult);
      
      return {
        quotationApproved: true,
        workOrderGenerated: workOrderResult.allow,
        ot_id: workOrderResult.ot_id,
        numero_ot: workOrderResult.numero_ot,
        msg: `${alreadyApproved ? 'Cotización previamente aprobada' : 'Cotización aprobada exitosamente'}. Orden de trabajo #${workOrderResult.numero_ot} generada.`
      };
    } catch (error) {
      console.error('❌ Error en flujo de aprobación y generación:', error);
      throw error;
    }
  }

  // Rechazar cotización (cliente) - Usa SP_GESTIONAR_APROBACION_COTIZACION
  async rejectQuotation(id: string): Promise<QuotationData> {
    const usuario_id = localStorage.getItem('usuario_id');
    return this.updateQuotation(id, { 
      decision: 'Rechazada',
      usuario_id: usuario_id ? parseInt(usuario_id) : null,
      comentario: ''
    });
  }

  // Marcar como enviada - Solo cambia estado local en frontend, no usa SP
  // El SP solo maneja Aprobada y Rechazada
  async markQuotationAsSent(id: string): Promise<QuotationData> {
    try {
      // Este es un cambio local del frontend, no requiere llamada al SP
      // El estado cambia para mostrar los botones Aprobar/Rechazar
      const quotation = await this.getQuotationById(id);
      if (!quotation) throw new Error('Cotización no encontrada');
      
      // Simular actualización local
      return {
        ...quotation,
        estado_cotizacion: 'Enviada'
      };
    } catch (error) {
      console.error('Error marking quotation as sent:', error);
      throw error;
    }
  }

  // Eliminar cotización
  async deleteQuotation(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
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
      { value: 'Pendiente', label: 'Pendiente' },
      { value: 'Enviada', label: 'Enviada' },
      { value: 'Aprobada', label: 'Aprobada' },
      { value: 'Rechazada', label: 'Rechazada' },
      { value: 'Completada', label: 'Completada' }
    ];
  }

  // Formatear estado para mostrar
  formatStatus(status: string): string {
    const states = this.getAvailableStates();
    const state = states.find(s => s.value === status);
    return state?.label || status;
  }

  // Agregar item a cotización (SP_AGREGAR_ITEM_COTIZACION)
  async addItemToQuotation(itemData: {
    cotizacion_id: string;
    tipo_item: 'Servicio' | 'Repuesto';
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento_unitario?: number;
    tipo_servicio_id?: string | null;
    registrado_por?: number | null;
  }): Promise<{ success: boolean; msg: string; allow: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${itemData.cotizacion_id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al agregar item a cotización');
      }
      
      return result;
    } catch (error) {
      console.error('Error adding item to quotation:', error);
      throw error;
    }
  }

  // Obtener items de una cotización (SP_OBTENER_ITEMS_COTIZACION)
  async getQuotationItems(cotizacionId: string): Promise<Array<{
    cot_item_id: string;
    cotizacion_id: string;
    tipo_item: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento_unitario: number;
    total_linea: number;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${cotizacionId}/items`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener items de cotización');
      }
      
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error('Error fetching quotation items:', error);
      throw error;
    }
  }

  // Eliminar item de cotización (SP_ELIMINAR_ITEM_COTIZACION)
  async removeItemFromQuotation(itemData: {
    cot_item_id: string;
    eliminado_por?: number | null;
  }): Promise<{ success: boolean; msg: string; allow: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/items/${itemData.cot_item_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar item de cotización');
      }
      
      return result;
    } catch (error) {
      console.error('Error removing item from quotation:', error);
      throw error;
    }
  }
}

export const quotationsService = new QuotationsService();
export default quotationsService;