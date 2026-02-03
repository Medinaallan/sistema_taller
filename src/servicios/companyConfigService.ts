// Servicio para manejar la configuración de la empresa - Conexión directa al backend con SQL Server

const API_BASE_URL = 'http://localhost:8080/api';

// Interface adaptada a los campos del SP_OBTENER_CONFIGURACION_EMPRESA
export interface CompanyInfo {
  empresaId: number;
  nombreEmpresa: string;
  rtn: string;
  direccion: string;
  telefono: string;
  correo: string;
  logoUrl: string;
  mensajePieFactura: string;
  impuestoPorcentaje: number;
  moneda: string;
}

class CompanyConfigService {
  private cachedCompanyInfo: CompanyInfo | null = null;

  /**
   * Obtiene la información de la empresa desde el backend (SP_OBTENER_CONFIGURACION_EMPRESA)
   */
  async fetchCompanyInfo(): Promise<CompanyInfo | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/company-info`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        this.cachedCompanyInfo = result.data;
        return result.data;
      }
      
      console.error('Error en respuesta del servidor:', result.message);
      return null;
    } catch (error) {
      console.error('Error fetching company info:', error);
      throw error;
    }
  }

  /**
   * Obtiene la información de empresa cacheada (si existe)
   */
  getCompanyInfo(): CompanyInfo | null {
    return this.cachedCompanyInfo;
  }

  /**
   * Actualiza la información de la empresa (SP_ACTUALIZAR_CONFIGURACION_EMPRESA)
   */
  async updateCompanyInfo(info: CompanyInfo): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/company-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        this.cachedCompanyInfo = info;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating company info:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  /**
   * Limpia la cache local
   */
  clearCache(): void {
    this.cachedCompanyInfo = null;
  }
}

// Singleton instance
export const companyConfigService = new CompanyConfigService();

export default companyConfigService;
