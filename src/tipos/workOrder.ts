export interface WorkOrder {
  id: string;
  clientId: string;
  vehicleId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  estimatedCompletionDate: Date;
  actualCompletionDate?: Date;
  technicianNotes?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}
