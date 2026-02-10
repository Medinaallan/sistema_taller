const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface AddItemParams {
  factura_id: number;
  descripcion: string;
  cantidad: number;
  precio_final_unitario: number;
  porcentaje_descuento?: number;
  registrado_por: number;
}

interface EditItemParams {
  factura_item_id: number;
  descripcion: string;
  cantidad: number;
  precio_final_unitario: number;
  porcentaje_descuento?: number;
  registrado_por: number;
}

interface DeleteItemParams {
  factura_item_id: number;
  registrado_por: number;
}

interface SPResponse {
  success: boolean;
  message: string;
  allow: number;
  response?: string;
}

/**
 * Servicio para manejar items de factura en tiempo real (POS)
 * Cada operación llama directamente a los SP correspondientes
 */
const invoiceItemsService = {
  /**
   * Agregar un item a una factura en tiempo real
   * Llama a SP_AGREGAR_ITEM_FACTURA_POS
   */
  async addItem(params: AddItemParams): Promise<SPResponse> {
    try {
      console.log('📦 Agregando item a factura en BD...', params);
      
      const base = API_BASE.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoice-items/add` : `${base}/api/invoice-items/add`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || data.allow === 0) {
        throw new Error(data.message || 'Error agregando item');
      }

      console.log('✅ Item agregado en BD:', data.message);
      return data;
    } catch (error: any) {
      console.error('❌ Error agregando item:', error);
      throw error;
    }
  },

  /**
   * Editar un item de factura en tiempo real
   * Llama a SP_EDITAR_ITEM_FACTURA_POS
   * Restricciones: items de OT solo permiten editar descuento
   */
  async editItem(params: EditItemParams): Promise<SPResponse> {
    try {
      console.log('✏️ Editando item de factura en BD...', params);
      
      const base = API_BASE.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoice-items/edit` : `${base}/api/invoice-items/edit`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || data.allow === 0) {
        throw new Error(data.message || 'Error editando item');
      }

      console.log('✅ Item editado en BD:', data.message);
      return data;
    } catch (error: any) {
      console.error('❌ Error editando item:', error);
      throw error;
    }
  },

  /**
   * Eliminar un item de factura en tiempo real
   * Llama a SP_ELIMINAR_ITEM_FACTURA_POS
   * Solo permite eliminar items agregados en POS (es_agregado_pos = 1)
   */
  async deleteItem(params: DeleteItemParams): Promise<SPResponse> {
    try {
      console.log('🗑️ Eliminando item de factura en BD...', params);
      
      const base = API_BASE.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoice-items/delete/${params.factura_item_id}` : `${base}/api/invoice-items/delete/${params.factura_item_id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrado_por: params.registrado_por }),
      });

      const data = await response.json();

      if (!response.ok || data.allow === 0) {
        throw new Error(data.message || 'Error eliminando item');
      }

      console.log('✅ Item eliminado en BD:', data.message);
      return data;
    } catch (error: any) {
      console.error('❌ Error eliminando item:', error);
      throw error;
    }
  },
};

export default invoiceItemsService;
