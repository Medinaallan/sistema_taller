const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  type: 'product' | 'service';
  es_obligatorio?: boolean; // Indica si el item es obligatorio (no editable)
  factura_item_id?: number; // ID del item en la BD
  tipo_item_inferido?: string; // 'Servicio' o 'Repuesto'
}

export interface Invoice {
  id: string;
  numero: string;
  fecha: string;
  clientId: string | null;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  exento?: number;
  exonerado?: number;
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
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoices` : `${base}/api/invoices`;
      const res = await fetch(url);
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error('Error obteniendo facturas (API):', error);
      return [];
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoices/${encodeURIComponent(id)}` : `${base}/api/invoices/${encodeURIComponent(id)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (error) {
      console.error('Error obteniendo factura por id:', error);
      return null;
    }
  }

  // Obtener items de una factura usando SP_OBTENER_ITEMS_FACTURA
  async getInvoiceItems(facturaId: number): Promise<InvoiceItem[]> {
    try {
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoices/${facturaId}/items` : `${base}/api/invoices/${facturaId}/items`;
      console.log(`🔍 Obteniendo items de factura ${facturaId} desde:`, url);
      
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Error en respuesta:', res.status);
        return [];
      }
      
      const json = await res.json();
      const items = json.data || [];
      
      // Mapear items de BD a formato InvoiceItem
      return items.map((item: any) => ({
        id: `item-${item.factura_item_id}`,
        name: item.descripcion,
        quantity: item.cantidad,
        price: item.precio_unitario,
        total: item.total,
        type: item.tipo_servicio_id ? 'service' : 'product',
        es_obligatorio: !!item.es_obligatorio,
        factura_item_id: item.factura_item_id,
        tipo_item_inferido: item.tipo_item_inferido
      }));
    } catch (error) {
      console.error('Error obteniendo items de factura:', error);
      return [];
    }
  }

  // Crear nueva factura (POST a backend)
  async createInvoice(data: Omit<Invoice, 'id' | 'numero' | 'createdAt' | 'estado'>): Promise<Invoice | null> {
    try {
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoices` : `${base}/api/invoices`;
      const res = await fetch(url, {
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
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoices/${encodeURIComponent(id)}` : `${base}/api/invoices/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
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
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoices?client=${encodeURIComponent(clientIdOrName)}` : `${base}/api/invoices?client=${encodeURIComponent(clientIdOrName)}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error('Error buscando facturas por cliente:', error);
      return [];
    }
  }

  async getInvoicesByDate(startDate: string, endDate: string): Promise<Invoice[]> {
    try {
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoices?from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}` : `${base}/api/invoices?from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}`;
      const res = await fetch(url);
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
          ${invoice.discount > 0 ? `<div><strong>Descuento:</strong> - L ${invoice.discount.toFixed(2)}</div>` : ''}
          <div><strong>Importe Exento:</strong> L ${((invoice as any).exento || 0).toFixed(2)}</div>
          <div><strong>Importe Exonerado:</strong> L ${((invoice as any).exonerado || 0).toFixed(2)}</div>
          <div><strong>Importe Gravado 15%:</strong> L ${invoice.subtotal.toFixed(2)}</div>
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
    (async () => {
      // Si la factura no trae exento/exonerado, intentar recomponer desde los productos API
      try {
        const exentoVal = (invoice as any).exento || 0;
        const exoneradoVal = (invoice as any).exonerado || 0;
        if ((!exentoVal || !exentoVal > 0) && (!exoneradoVal || !exoneradoVal > 0)) {
          const base = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const url = base.replace(/\/$/, '').endsWith('/api') ? `${base.replace(/\/$/, '')}/products` : `${base.replace(/\/$/, '')}/api/products`;
          try {
            const res = await fetch(url);
            const json = await res.json();
            const products = json.data || [];
            let ex = 0, exo = 0;
            for (const item of invoice.items || []) {
              const prod = products.find((p: any) => String(p.id) === String(item.id));
              if (!prod) continue;
              const amount = Number(item.total || 0);
              if (prod.exento) ex += amount;
              else if (prod.exonerado) exo += amount;
            }
            if (ex > 0) (invoice as any).exento = ex;
            if (exo > 0) (invoice as any).exonerado = exo;
            // ajustar subtotal (gravado) si es necesario
            const gravado = Number(invoice.subtotal || 0);
            const recomputedGravado = Math.max(0, gravado);
            (invoice as any).subtotal = recomputedGravado;
          } catch (e) {
            // ignore fetch errors, fall back to invoice fields
          }
        }
      } catch (err) {}

      import('./pdfInvoiceGenerator').then(async ({ pdfInvoiceGenerator }) => {
        await pdfInvoiceGenerator.printInvoice(invoice, 'carta');
      });
    })();
  }

  /**
   * Imprime factura en formato ticket 80mm (usa pdfInvoiceGenerator)
   */
  printInvoiceTicket(invoice: Invoice): void {
    (async () => {
      try {
        const exentoVal = (invoice as any).exento || 0;
        const exoneradoVal = (invoice as any).exonerado || 0;
        if ((!exentoVal || !exentoVal > 0) && (!exoneradoVal || !exoneradoVal > 0)) {
          const base = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const url = base.replace(/\/$/, '').endsWith('/api') ? `${base.replace(/\/$/, '')}/products` : `${base.replace(/\/$/, '')}/api/products`;
          try {
            const res = await fetch(url);
            const json = await res.json();
            const products = json.data || [];
            let ex = 0, exo = 0;
            for (const item of invoice.items || []) {
              const prod = products.find((p: any) => String(p.id) === String(item.id));
              if (!prod) continue;
              const amount = Number(item.total || 0);
              if (prod.exento) ex += amount;
              else if (prod.exonerado) exo += amount;
            }
            if (ex > 0) (invoice as any).exento = ex;
            if (exo > 0) (invoice as any).exonerado = exo;
          } catch (e) {
          }
        }
      } catch (err) {}

      import('./pdfInvoiceGenerator').then(async ({ pdfInvoiceGenerator }) => {
        await pdfInvoiceGenerator.printInvoice(invoice, 'ticket');
      });
    })();
  }

  /**
   * Descarga factura en formato carta SAR
   */
  downloadInvoiceCarta(invoice: Invoice): void {
    (async () => {
      try {
        const exentoVal = (invoice as any).exento || 0;
        const exoneradoVal = (invoice as any).exonerado || 0;
        if ((!exentoVal || !exentoVal > 0) && (!exoneradoVal || !exoneradoVal > 0)) {
          const base = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const url = base.replace(/\/$/, '').endsWith('/api') ? `${base.replace(/\/$/, '')}/products` : `${base.replace(/\/$/, '')}/api/products`;
          try {
            const res = await fetch(url);
            const json = await res.json();
            const products = json.data || [];
            let ex = 0, exo = 0;
            for (const item of invoice.items || []) {
              const prod = products.find((p: any) => String(p.id) === String(item.id));
              if (!prod) continue;
              const amount = Number(item.total || 0);
              if (prod.exento) ex += amount;
              else if (prod.exonerado) exo += amount;
            }
            if (ex > 0) (invoice as any).exento = ex;
            if (exo > 0) (invoice as any).exonerado = exo;
          } catch (e) {}
        }
      } catch (err) {}
      import('./pdfInvoiceGenerator').then(async ({ pdfInvoiceGenerator }) => {
        await pdfInvoiceGenerator.downloadInvoice(invoice, 'carta');
      });
    })();
  }

  /**
   * Descarga factura en formato ticket 80mm
   */
  downloadInvoiceTicket(invoice: Invoice): void {
    (async () => {
      try {
        const exentoVal = (invoice as any).exento || 0;
        const exoneradoVal = (invoice as any).exonerado || 0;
        if ((!exentoVal || !exentoVal > 0) && (!exoneradoVal || !exoneradoVal > 0)) {
          const base = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const url = base.replace(/\/$/, '').endsWith('/api') ? `${base.replace(/\/$/, '')}/products` : `${base.replace(/\/$/, '')}/api/products`;
          try {
            const res = await fetch(url);
            const json = await res.json();
            const products = json.data || [];
            let ex = 0, exo = 0;
            for (const item of invoice.items || []) {
              const prod = products.find((p: any) => String(p.id) === String(item.id));
              if (!prod) continue;
              const amount = Number(item.total || 0);
              if (prod.exento) ex += amount;
              else if (prod.exonerado) exo += amount;
            }
            if (ex > 0) (invoice as any).exento = ex;
            if (exo > 0) (invoice as any).exonerado = exo;
          } catch (e) {}
        }
      } catch (err) {}
      import('./pdfInvoiceGenerator').then(async ({ pdfInvoiceGenerator }) => {
        await pdfInvoiceGenerator.downloadInvoice(invoice, 'ticket');
      });
    })();
  }
}

export const invoicesService = new InvoicesService();
export default invoicesService;
