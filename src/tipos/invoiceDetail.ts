// Detalle de Factura
export interface InvoiceDetail {
  id: string;
  invoiceId: string;
  type: 'part' | 'service';
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
