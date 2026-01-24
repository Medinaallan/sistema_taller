const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
  // Obtener todas las facturas
  getAllInvoices(): Invoice[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error obteniendo facturas:', error);
      return [];
    }
  }

  // Obtener factura por ID
  getInvoiceById(id: string): Invoice | null {
    const invoices = this.getAllInvoices();
    return invoices.find(inv => inv.id === id) || null;
  }

  // Generar número de factura correlativo
  private generateInvoiceNumber(): string {
    const invoices = this.getAllInvoices();
    const lastNumber = invoices.length > 0 
      ? Math.max(...invoices.map(inv => parseInt(inv.numero.split('-')[1]) || 0))
      : 0;
    const nextNumber = lastNumber + 1;
    return `FAC-${String(nextNumber).padStart(8, '0')}`;
  }

  // Crear nueva factura
  createInvoice(data: Omit<Invoice, 'id' | 'numero' | 'createdAt' | 'estado'>): Invoice {
    const invoices = this.getAllInvoices();
    
    const newInvoice: Invoice = {
      ...data,
      id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      numero: this.generateInvoiceNumber(),
      createdAt: new Date().toISOString(),
      estado: 'pagada'
    };

    invoices.push(newInvoice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));

    return newInvoice;
  }

  // Actualizar factura
  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoices = this.getAllInvoices();
    const index = invoices.findIndex(inv => inv.id === id);
    
    if (index === -1) return null;

    invoices[index] = { ...invoices[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));

    return invoices[index];
  }

  // Anular factura
  anularInvoice(id: string): boolean {
    try {
      const invoices = this.getAllInvoices();
      const invoiceIndex = invoices.findIndex(inv => inv.id === id);
      
      if (invoiceIndex === -1) {
        return false;
      }

      invoices[invoiceIndex].estado = 'anulada';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
      return true;
    } catch (error) {
      console.error('Error al anular factura:', error);
      return false;
    }
  }

  // Obtener facturas por cliente (por ID o nombre)
  getInvoicesByClient(clientIdOrName: string): Invoice[] {
    const invoices = this.getAllInvoices();
    return invoices.filter(inv => 
      inv.clientId === clientIdOrName || 
      inv.clientName.toLowerCase().includes(clientIdOrName.toLowerCase())
    );
  }

  // Obtener facturas por fecha
  getInvoicesByDate(startDate: string, endDate: string): Invoice[] {
    const invoices = this.getAllInvoices();
    return invoices.filter(inv => {
      const invoiceDate = new Date(inv.fecha);
      return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
    });
  }

  // Obtener estadísticas
  getStatistics() {
    const invoices = this.getAllInvoices();
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: invoices.length,
      hoy: invoices.filter(inv => inv.fecha.split('T')[0] === today).length,
      montoTotal: invoices.reduce((sum, inv) => sum + inv.total, 0),
      montoHoy: invoices
        .filter(inv => inv.fecha.split('T')[0] === today)
        .reduce((sum, inv) => sum + inv.total, 0)
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
