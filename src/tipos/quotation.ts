// Cotización
export interface Quotation {
  id: string;
  clientId: string;
  vehicleId: string;
  items: QuotationItem[];
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
