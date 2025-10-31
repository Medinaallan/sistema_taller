// Servicio para gestionar cotizaciones adicionales (subcotizaciones)

export interface AdditionalQuotation {
  id: string;
  workOrderId: string;
  clienteId: string;
  vehiculoId: string;
  tipo: 'adicional';
  serviciosEncontrados: string;
  descripcionProblema: string;
  serviciosRecomendados: string;
  costoEstimado: number;
  urgencia: 'baja' | 'media' | 'alta';
  estado: 'pendiente-aprobacion' | 'aprobada' | 'rechazada';
  fechaCreacion: string;
  fechaRespuesta?: string;
  requiereAprobacion: boolean;
  notas?: string;
  aprobadoPor?: string;
}

class AdditionalQuotationsService {
  private quotations: AdditionalQuotation[] = [];
  private storageKey = 'additional-quotations';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.quotations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error cargando subcotizaciones desde localStorage:', error);
      this.quotations = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.quotations));
    } catch (error) {
      console.error('Error guardando subcotizaciones en localStorage:', error);
    }
  }

  // Crear nueva cotización adicional
  async createAdditionalQuotation(quotationData: Omit<AdditionalQuotation, 'id' | 'fechaCreacion'>): Promise<AdditionalQuotation> {
    const newQuotation: AdditionalQuotation = {
      ...quotationData,
      id: `AQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fechaCreacion: new Date().toISOString(),
    };

    this.quotations.push(newQuotation);
    this.saveToStorage();

    console.log('Cotización adicional creada:', newQuotation);
    return newQuotation;
  }

  // Obtener todas las cotizaciones adicionales
  getAllAdditionalQuotations(): AdditionalQuotation[] {
    return [...this.quotations];
  }

  // Obtener cotizaciones por cliente
  getByClientId(clienteId: string): AdditionalQuotation[] {
    return this.quotations.filter(q => q.clienteId === clienteId);
  }

  // Obtener cotizaciones por orden de trabajo
  getByWorkOrderId(workOrderId: string): AdditionalQuotation[] {
    return this.quotations.filter(q => q.workOrderId === workOrderId);
  }

  // Obtener cotizaciones pendientes por cliente
  getPendingByClientId(clienteId: string): AdditionalQuotation[] {
    return this.quotations.filter(q => 
      q.clienteId === clienteId && q.estado === 'pendiente-aprobacion'
    );
  }

  // Aprobar o rechazar cotización
  async respondToQuotation(quotationId: string, approved: boolean, respondedBy?: string): Promise<boolean> {
    const quotationIndex = this.quotations.findIndex(q => q.id === quotationId);
    
    if (quotationIndex === -1) {
      throw new Error('Cotización no encontrada');
    }

    this.quotations[quotationIndex] = {
      ...this.quotations[quotationIndex],
      estado: approved ? 'aprobada' : 'rechazada',
      fechaRespuesta: new Date().toISOString(),
      aprobadoPor: respondedBy
    };

    this.saveToStorage();

    console.log(`Cotización ${quotationId} ${approved ? 'aprobada' : 'rechazada'} por ${respondedBy || 'cliente'}`);
    return true;
  }

  // Obtener cotización por ID
  getById(quotationId: string): AdditionalQuotation | undefined {
    return this.quotations.find(q => q.id === quotationId);
  }

  // Eliminar cotización
  async deleteQuotation(quotationId: string): Promise<boolean> {
    const initialLength = this.quotations.length;
    this.quotations = this.quotations.filter(q => q.id !== quotationId);
    
    if (this.quotations.length !== initialLength) {
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  // Obtener estadísticas
  getStats() {
    const total = this.quotations.length;
    const pendientes = this.quotations.filter(q => q.estado === 'pendiente-aprobacion').length;
    const aprobadas = this.quotations.filter(q => q.estado === 'aprobada').length;
    const rechazadas = this.quotations.filter(q => q.estado === 'rechazada').length;

    return {
      total,
      pendientes,
      aprobadas,
      rechazadas
    };
  }
}

// Instancia única del servicio
const additionalQuotationsService = new AdditionalQuotationsService();

export default additionalQuotationsService;
export { AdditionalQuotationsService };