// Servicio para manejar la configuración de la empresa y facturación

const API_BASE_URL = 'http://localhost:8080/api';

export interface CompanyInfo {
  businessName: string;
  tradeName: string;
  rtn: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  economicActivity: string;
  legalRepresentative: string;
  legalRepresentativeId: string;
  establishedDate: string;
  fiscalRegime: string;
  notes: string;
  logo?: string;
}

export interface CAIConfig {
  id: string;
  cai: string;
  fechaLimiteEmision: string;
  rangoInicial: string;
  rangoFinal: string;
  numeroActual: string;
  tipoDocumento: 'factura' | 'nota-debito' | 'nota-credito' | 'nota-remision' | 'comprobante-retencion';
  establecimiento: string;
  puntoEmision: string;
  activo: boolean;
}

export interface BillingConfig {
  regimenFiscal: 'normal' | 'simplificado' | 'opcional';
  obligadoLlevarContabilidad: boolean;
  contribuyenteISV: boolean;
  isvRate: number;
  agenteRetencionISV: boolean;
  sujetoPercepcionISV: boolean;
  cais: CAIConfig[];
}

export interface CompanyConfig {
  companyInfo: CompanyInfo;
  billingConfig: BillingConfig;
}

class CompanyConfigService {
  private config: CompanyConfig | null = null;

  /**
   * Inicializa la configuración cargando desde el backend
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.config = result.data;
          return;
        }
      }
      throw new Error('Error al cargar configuración');
    } catch (error) {
      console.error('Error loading config from backend:', error);
      // Intentar cargar desde el archivo estático como fallback
      try {
        const response = await fetch('/src/data/company-config.json');
        if (response.ok) {
          this.config = await response.json();
        } else {
          this.config = this.getDefaultConfig();
        }
      } catch (fallbackError) {
        console.error('Error loading fallback config:', fallbackError);
        this.config = this.getDefaultConfig();
      }
    }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): CompanyConfig {
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }
    return this.config;
  }

  /**
   * Obtiene la información de la empresa
   */
  getCompanyInfo(): CompanyInfo {
    return this.getConfig().companyInfo;
  }

  /**
   * Obtiene la configuración de facturación
   */
  getBillingConfig(): BillingConfig {
    return this.getConfig().billingConfig;
  }

  /**
   * Obtiene el CAI activo para facturación
   */
  getActiveCAI(): CAIConfig | null {
    const cais = this.getBillingConfig().cais;
    const activeCai = cais.find(cai => cai.activo && cai.tipoDocumento === 'factura');
    
    if (!activeCai) {
      console.warn('No hay CAI activo configurado para facturas');
      return cais.find(cai => cai.tipoDocumento === 'factura') || null;
    }
    
    return activeCai;
  }

  /**
   * Actualiza la información de la empresa
   */
  async updateCompanyInfo(info: Partial<CompanyInfo>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/company-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        const config = this.getConfig();
        config.companyInfo = {
          ...config.companyInfo,
          ...info
        };
        this.config = config;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating company info:', error);
      return { success: false, message: 'Error al actualizar la información' };
    }
  }

  /**
   * Actualiza la configuración de facturación
   */
  async updateBillingConfig(billing: Partial<BillingConfig>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/billing-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billing)
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        const config = this.getConfig();
        config.billingConfig = {
          ...config.billingConfig,
          ...billing
        };
        this.config = config;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating billing config:', error);
      return { success: false, message: 'Error al actualizar la configuración' };
    }
  }

  /**
   * Agrega un nuevo CAI
   */
  async addCAI(cai: Omit<CAIConfig, 'id'>): Promise<{ success: boolean; message: string; cai?: CAIConfig }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cai)
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        const config = this.getConfig();
        config.billingConfig.cais.push(result.data);
        this.config = config;
      }
      
      return result;
    } catch (error) {
      console.error('Error adding CAI:', error);
      return { success: false, message: 'Error al agregar el CAI' };
    }
  }

  /**
   * Actualiza un CAI existente
   */
  async updateCAI(id: string, updates: Partial<CAIConfig>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        const config = this.getConfig();
        const index = config.billingConfig.cais.findIndex(cai => cai.id === id);
        if (index !== -1) {
          config.billingConfig.cais[index] = {
            ...config.billingConfig.cais[index],
            ...updates
          };
          this.config = config;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating CAI:', error);
      return { success: false, message: 'Error al actualizar el CAI' };
    }
  }

  /**
   * Elimina un CAI
   */
  async deleteCAI(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        const config = this.getConfig();
        config.billingConfig.cais = config.billingConfig.cais.filter(cai => cai.id !== id);
        this.config = config;
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting CAI:', error);
      return { success: false, message: 'Error al eliminar el CAI' };
    }
  }

  /**
   * Incrementa el número de factura del CAI activo
   */
  async incrementInvoiceNumber(): Promise<{ success: boolean; message: string; numeroActual?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais/increment-invoice`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        await this.initialize();
      }
      
      return result;
    } catch (error) {
      console.error('Error incrementing invoice number:', error);
      return { success: false, message: 'Error al incrementar el número de factura' };
    }
  }

  /**
   * Activa o desactiva un CAI
   */
  async toggleCAIStatus(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/company-config/cais/${id}/toggle`, {
        method: 'PATCH'
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar cache local
        const config = this.getConfig();
        const cai = config.billingConfig.cais.find(c => c.id === id);
        if (cai) {
          cai.activo = !cai.activo;
          this.config = config;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error toggling CAI:', error);
      return { success: false, message: 'Error al cambiar el estado del CAI' };
    }
  }

  /**
   * Exporta la configuración como JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * Obtiene CAIs activos
   */
  getActiveCAIs(): CAIConfig[] {
    return this.getBillingConfig().cais.filter(cai => cai.activo);
  }

  /**
   * Obtiene CAI por tipo de documento
   */
  getCAIByDocumentType(tipoDocumento: CAIConfig['tipoDocumento']): CAIConfig | undefined {
    return this.getBillingConfig().cais.find(
      cai => cai.tipoDocumento === tipoDocumento && cai.activo
    );
  }

  /**
   * Configuración por defecto
   */
  private getDefaultConfig(): CompanyConfig {
    return {
      companyInfo: {
        businessName: 'TALLER MECÁNICO AUTOMOTRIZ',
        tradeName: 'La Esperanza',
        rtn: '08019999999999',
        address: 'Col. Las Flores, Calle Principal #123',
        city: 'LA ESPERANZA',
        state: 'INTIBUCA',
        postalCode: '14101',
        country: 'Honduras',
        phone: '2783-5678',
        mobile: '9789-6227',
        email: 'info@talleresp.com',
        website: 'www.talleresp.com',
        economicActivity: 'Reparación y mantenimiento de vehículos automotores',
        legalRepresentative: 'GERENTE XD',
        legalRepresentativeId: '1001-1985-12345',
        establishedDate: '2010-03-15',
        fiscalRegime: 'Contribuyente Nacional',
        notes: 'Taller especializado en mecánica general y diagnóstico automotriz',
        logo: ''
      },
      billingConfig: {
        regimenFiscal: 'normal',
        obligadoLlevarContabilidad: true,
        contribuyenteISV: true,
        isvRate: 15,
        agenteRetencionISV: false,
        sujetoPercepcionISV: false,
        cais: [
          {
            id: 'cai-default',
            cai: 'CAI-000000-000000-000000-000000-000000-00',
            fechaLimiteEmision: '2026-12-31',
            rangoInicial: 'FAC-00000001',
            rangoFinal: 'FAC-99999999',
            numeroActual: 'FAC-00000001',
            tipoDocumento: 'factura',
            establecimiento: '001',
            puntoEmision: '001',
            activo: true
          }
        ]
      }
    };
  }
}

// Singleton instance
export const companyConfigService = new CompanyConfigService();

// Inicializar al cargar el módulo
companyConfigService.initialize();

export default companyConfigService;
