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
  // Campos adicionales para compatibilidad con el frontend de facturación
  businessName?: string;
  tradeName?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

// Configuración de CAI según SP_REGISTRAR_RANGO_CAI
export interface CAIConfig {
  id: string;
  cai: string;                    // VARCHAR(40)
  puntoEmision: string;           // VARCHAR(3)
  establecimiento: string;        // VARCHAR(3)
  tipoDocumento: string;          // VARCHAR(2) - '01', '02', '03', '04', '05'
  rangoInicial: string;           // VARCHAR(8) - Solo el número
  rangoFinal: string;             // VARCHAR(8) - Solo el número
  fechaLimiteEmision: string;     // DATE
  activo: boolean;
  numeroActual?: string;          // Controlado por el SP
}

// Configuración de facturación
export interface BillingConfig {
  regimenFiscal: 'normal' | 'simplificado' | 'opcional';
  obligadoLlevarContabilidad: boolean;
  contribuyenteISV: boolean;
  agenteRetencionISV: boolean;
  sujetoPercepcionISV: boolean;
  cais: CAIConfig[];
}

// Datos para registrar un nuevo CAI
export interface CAIRegistroData {
  cai: string;
  puntoEmision: string;
  establecimiento: string;
  tipoDocumento: string;
  rangoInicial: string;
  rangoFinal: string;
  fechaLimiteEmision: string;
}

class CompanyConfigService {
  private cachedCompanyInfo: CompanyInfo | null = null;
  private cachedBillingConfig: BillingConfig | null = null;
  private cachedCAIs: CAIConfig[] = [];

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
   * Sube el logo de la empresa a Digital Ocean Spaces
   */
  async uploadLogo(file: File): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${API_BASE_URL}/company-config/upload-logo`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.data?.url) {
        // Actualizar cache local con la nueva URL
        if (this.cachedCompanyInfo) {
          this.cachedCompanyInfo.logoUrl = result.data.url;
        }
        return {
          success: true,
          message: result.message,
          url: result.data.url
        };
      }
      
      return { success: false, message: result.message || 'Error al subir el logo' };
    } catch (error) {
      console.error('Error uploading logo:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  /**
   * Inicializa el servicio cargando toda la configuración
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.fetchCompanyInfo(),
      this.fetchCAIs()
    ]);
  }

  /**
   * Obtiene la configuración completa para el componente de facturación
   */
  getConfig(): { companyInfo: CompanyInfo | null; billingConfig: BillingConfig } {
    const companyInfo = this.cachedCompanyInfo ? {
      ...this.cachedCompanyInfo,
      // Mapear campos para compatibilidad con el frontend
      businessName: this.cachedCompanyInfo.nombreEmpresa,
      tradeName: this.cachedCompanyInfo.nombreEmpresa,
      address: this.cachedCompanyInfo.direccion,
      city: '',
      state: '',
      phone: this.cachedCompanyInfo.telefono,
      email: this.cachedCompanyInfo.correo
    } : null;

    return {
      companyInfo,
      billingConfig: this.cachedBillingConfig || {
        regimenFiscal: 'normal',
        obligadoLlevarContabilidad: false,
        contribuyenteISV: true,
        agenteRetencionISV: false,
        sujetoPercepcionISV: false,
        cais: this.cachedCAIs
      }
    };
  }

  /**
   * Obtiene la lista de CAIs desde el backend
   */
  async fetchCAIs(): Promise<CAIConfig[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        this.cachedCAIs = result.data;
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching CAIs:', error);
      return [];
    }
  }

  /**
   * Registra un nuevo CAI (SP_REGISTRAR_RANGO_CAI)
   */
  async addCAI(caiData: CAIRegistroData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caiData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Recargar la lista de CAIs
        await this.fetchCAIs();
      }
      
      return result;
    } catch (error) {
      console.error('Error adding CAI:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  /**
   * Elimina un CAI
   */
  async deleteCAI(caiId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais/${caiId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        // Recargar la lista de CAIs
        await this.fetchCAIs();
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting CAI:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  /**
   * Actualiza la configuración de facturación
   */
  async updateBillingConfig(config: BillingConfig): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      
      if (result.success) {
        this.cachedBillingConfig = config;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating billing config:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  }

  /**
   * Obtiene el CAI activo para facturación (tipo '01')
   */
  getActiveCAI(tipoDocumento: string = '01'): CAIConfig | null {
    const activeCais = this.cachedCAIs.filter(cai => 
      cai.activo && cai.tipoDocumento === tipoDocumento
    );
    
    if (activeCais.length === 0) {
      return null;
    }
    
    // Retornar el primero activo (se puede mejorar con lógica de selección)
    return activeCais[0];
  }

  /**
   * Obtiene todos los CAIs activos
   */
  getActiveCAIs(): CAIConfig[] {
    return this.cachedCAIs.filter(cai => cai.activo);
  }

  /**
   * Obtiene un CAI específico por ID
   */
  getCAIById(id: string): CAIConfig | null {
    return this.cachedCAIs.find(cai => cai.id === id) || null;
  }

  /**
   * Limpia la cache local
   */
  clearCache(): void {
    this.cachedCompanyInfo = null;
    this.cachedBillingConfig = null;
    this.cachedCAIs = [];
  }
}

// Singleton instance
export const companyConfigService = new CompanyConfigService();

export default companyConfigService;
