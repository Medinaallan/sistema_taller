const API_BASE_URL = 'http://localhost:8080/api';

export const serviceHistoryService = {
  /**
   * Obtener historial completo de servicios (para admins)
   */
  async getAllServiceHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/service-history`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
      return data;
    } catch (error) {
      console.error('Error obteniendo historial completo:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión',
        data: []
      };
    }
  },

  /**
   * Obtener historial de servicios para un cliente específico
   */
  async getClientServiceHistory(clientId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/service-history/client/${clientId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
      return data;
    } catch (error) {
      console.error('Error obteniendo historial del cliente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión',
        data: []
      };
    }
  },

  /**
   * Obtener estadísticas de un cliente específico
   */
  async getClientStats(clientId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/service-history/client/${clientId}/stats`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas del cliente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión',
        data: null
      };
    }
  },

  /**
   * Obtener estadísticas generales del historial
   */
  async getGeneralStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/service-history/stats`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas generales:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión',
        data: null
      };
    }
  },

  /**
   * Agregar nuevo registro al historial de servicios
   */
  async addServiceHistory(historyData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/service-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
      return data;
    } catch (error) {
      console.error('Error agregando registro al historial:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión',
        data: null
      };
    }
  }
};

export default serviceHistoryService;