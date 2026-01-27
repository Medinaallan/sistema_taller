const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  type: 'product' | 'service';
}

export interface Invoice {
  id: string;
  numero: string;
  fecha: string;
  clientId: string | null;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  metodoPago?: string;
  estado: 'pagada' | 'pendiente' | 'anulada';
  createdAt: string;
  createdBy: string;
}

const STORAGE_KEY = 'taller_invoices';

class InvoicesService {
  // Obtener todas las facturas desde backend
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`);
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error('Error obteniendo facturas (API):', error);
      return [];
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (error) {
      console.error('Error obteniendo factura por id:', error);
      return null;
    }
  }

  // Crear nueva factura (POST a backend)
  async createInvoice(data: Omit<Invoice, 'id' | 'numero' | 'createdAt' | 'estado'>): Promise<Invoice | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        console.error('Error creando factura (status):', res.status);
        return null;
      }
      const json = await res.json();
      return json.data || null;
    } catch (error) {
      console.error('Error creando factura (API):', error);
      return null;
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (error) {
      console.error('Error actualizando factura (API):', error);
      return null;
    }
  }

  async anularInvoice(id: string): Promise<boolean> {
    try {
      const updated = await this.updateInvoice(id, { estado: 'anulada' } as any);
      return !!updated;
    } catch (error) {
      console.error('Error anulando factura:', error);
      return false;
    }
  }

  async getInvoicesByClient(clientIdOrName: string): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices?client=${encodeURIComponent(clientIdOrName)}`);
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error('Error buscando facturas por cliente:', error);
      return [];
    }
  }

  async getInvoicesByDate(startDate: string, endDate: string): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices?from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}`);
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error('Error buscando facturas por fecha:', error);
      return [];
    }
  }

  async getStatistics() {
    const invoices = await this.getAllInvoices();
    const today = new Date().toISOString().split('T')[0];
    return {
      total: invoices.length,
      hoy: invoices.filter(inv => inv.fecha.split('T')[0] === today).length,
      montoTotal: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      montoHoy: invoices
        .filter(inv => inv.fecha.split('T')[0] === today)
        .reduce((sum, inv) => sum + (inv.total || 0), 0)
    };
  }

  // Generar HTML para impresión
  generatePrintHTML(invoice: Invoice): string {
    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">L ${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">L ${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura ${invoice.numero}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .totals {
            text-align: right;
            margin-top: 20px;
          }
          .totals div {
            margin: 5px 0;
          }
          .print-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir</button>
        
        <div class="header">
          <h1>TALLER MECÁNICO</h1>
          <p>Factura ${invoice.numero}</p>
          <p>Fecha: ${new Date(invoice.fecha).toLocaleString('es-HN')}</p>
        </div>

        <div class="info">
          <div>
            <strong>Cliente:</strong><br>
            ${invoice.clientName}<br>
            ${invoice.clientId ? `ID: ${invoice.clientId}` : 'Consumidor Final'}
          </div>
          <div style="text-align: right;">
            <strong>Método de Pago:</strong><br>
            ${invoice.metodoPago || 'Efectivo'}
          </div>
        </div>

        <table>
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left;">Descripción</th>
              <th style="padding: 10px; text-align: center;">Cant.</th>
              <th style="padding: 10px; text-align: right;">Precio</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="totals">
          <div><strong>Subtotal:</strong> L ${invoice.subtotal.toFixed(2)}</div>
          ${invoice.discount > 0 ? `<div><strong>Descuento:</strong> - L ${invoice.discount.toFixed(2)}</div>` : ''}
          <div><strong>ISV (15%):</strong> L ${invoice.tax.toFixed(2)}</div>
          <div style="font-size: 1.2em; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333;">
            <strong>TOTAL:</strong> L ${invoice.total.toFixed(2)}
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #666;">
          <p>¡Gracias por su preferencia!</p>
        </div>
      </body>
      </html>
    `;
  }

  // Imprimir factura (DEPRECADO - usar pdfInvoiceGenerator)
  printInvoice(invoice: Invoice): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(this.generatePrintHTML(invoice));
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  // ========== MÉTODOS DE IMPRESIÓN PDF ==========
  
  /**
   * Imprime factura en formato carta SAR (usa pdfInvoiceGenerator)
   */
  printInvoiceCarta(invoice: Invoice): void {
    // Lazy import para evitar cargar jsPDF si no se usa
    import('./pdfInvoiceGenerator').then(({ pdfInvoiceGenerator }) => {
      pdfInvoiceGenerator.printInvoice(invoice, 'carta');
    });
  }

  /**
   * Imprime factura en formato ticket 80mm (usa pdfInvoiceGenerator)
   */
  printInvoiceTicket(invoice: Invoice): void {
    import('./pdfInvoiceGenerator').then(({ pdfInvoiceGenerator }) => {
      pdfInvoiceGenerator.printInvoice(invoice, 'ticket');
    });
  }

  /**
   * Descarga factura en formato carta SAR
   */
  downloadInvoiceCarta(invoice: Invoice): void {
    import('./pdfInvoiceGenerator').then(({ pdfInvoiceGenerator }) => {
      pdfInvoiceGenerator.downloadInvoice(invoice, 'carta');
    });
  }

  /**
   * Descarga factura en formato ticket 80mm
   */
  downloadInvoiceTicket(invoice: Invoice): void {
    import('./pdfInvoiceGenerator').then(({ pdfInvoiceGenerator }) => {
      pdfInvoiceGenerator.downloadInvoice(invoice, 'ticket');
    });
  }
}

export const invoicesService = new InvoicesService();
export default invoicesService;
