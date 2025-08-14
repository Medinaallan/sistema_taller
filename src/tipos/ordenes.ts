export interface WorkOrder {
  id: string;
  vehicleId: string;
  clientId: string;
  mechanicId?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  createdAt: Date;
  startDate?: Date;
  completedDate?: Date;
  description: string;
  diagnosis?: string;
  serviceType: string;
  estimatedCost?: number;
  finalCost?: number;
  parts: OrderPart[];
  services: OrderService[];
  notes?: string;
  paymentStatus: 'pending' | 'partial' | 'completed';
}

export interface OrderPart {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'pending' | 'ordered' | 'received' | 'installed';
}

export interface OrderService {
  id: string;
  name: string;
  description: string;
  cost: number;
  status: 'pending' | 'in-progress' | 'completed';
  mechanicNotes?: string;
}

export interface WorkOrderFilters {
  startDate?: Date;
  endDate?: Date;
  status?: WorkOrder['status'];
  mechanicId?: string;
  clientId?: string;
  vehicleId?: string;
  paymentStatus?: WorkOrder['paymentStatus'];
}
