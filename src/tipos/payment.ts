// Pago
export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}
