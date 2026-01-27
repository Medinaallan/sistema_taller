const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface InvoicePaymentData {
  paidInvoices: string[];
  pendingInvoices: string[];
}

class InvoicePaymentManager {
  private paidInvoices: Set<string> = new Set();
  private pendingInvoices: Set<string> = new Set();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/invoice-payments`);
      
      if (response.ok) {
        const data: InvoicePaymentData = await response.json();
        this.paidInvoices = new Set(data.paidInvoices || []);
        this.pendingInvoices = new Set(data.pendingInvoices || []);
        console.log('Estado de pagos de facturas cargado:', {
          pagadas: this.paidInvoices.size,
          pendientes: this.pendingInvoices.size
        });
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error inicializando estado de pagos:', error);
      this.initialized = true;
    }
  }

  async markAsPaid(workOrderId: string): Promise<void> {
    await this.initialize();
    
    console.log(`Marcando factura de OT ${workOrderId} como pagada...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/invoice-payments/mark-paid/${workOrderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.paidInvoices.add(workOrderId);
        this.pendingInvoices.delete(workOrderId);
        console.log('Factura marcada como pagada correctamente');
      } else {
        throw new Error(result.message || 'Error al marcar como pagada');
      }
    } catch (error) {
      console.error('Error marcando factura como pagada:', error);
      throw error;
    }
  }

  async markAsPending(workOrderId: string): Promise<void> {
    await this.initialize();
    
    try {
      const response = await fetch(`${API_BASE_URL}/invoice-payments/mark-pending/${workOrderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.pendingInvoices.add(workOrderId);
        this.paidInvoices.delete(workOrderId);
      }
    } catch (error) {
      console.error('Error marcando factura como pendiente:', error);
      throw error;
    }
  }

  async isPaid(workOrderId: string): Promise<boolean> {
    await this.initialize();
    return this.paidInvoices.has(workOrderId);
  }

  async isPending(workOrderId: string): Promise<boolean> {
    await this.initialize();
    return this.pendingInvoices.has(workOrderId);
  }

  async getAllPaid(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.paidInvoices);
  }

  async getAllPending(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.pendingInvoices);
  }
}

export const invoicePaymentManager = new InvoicePaymentManager();
export default invoicePaymentManager;
