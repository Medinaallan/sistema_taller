// Interfaces para el sistema de talleres mecánicos

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'mechanic' | 'receptionist' | 'client';
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  password: string;
  vehicles: Vehicle[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  mileage?: number;
  serviceType: ServiceType;
  workOrders: WorkOrder[];
  reminders: Reminder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  clientId: string;
  mechanicId?: string;
  receptionistId: string;
  description: string;
  problem: string;
  serviceType: 'preventive' | 'corrective';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  estimatedCost: number;
  finalCost?: number;
  estimatedDate?: Date;
  completedDate?: Date;
  parts?: Part[];
  notes?: string;
  recommendations?: string;
  paymentStatus: 'pending' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  name: string;
  description: string;
  cost: number;
  quantity: number;
}

export interface ServiceHistory {
  id: string;
  vehicleId: string;
  workOrderId: string;
  serviceDate: Date;
  serviceType: string;
  description: string;
  cost: number;
  mileage?: number;
  observations: string;
  recommendations?: string;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  clientId: string;
  type: 'date' | 'mileage';
  title: string;
  description: string;
  triggerValue: number | Date; // kilómetros o fecha
  currentValue?: number; // kilómetros actuales
  isActive: boolean;
  isCompleted: boolean;
  services: string[];
  createdAt: Date;
  triggerDate?: Date;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // en horas
  basePrice: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: Date;
}

// Estados y filtros
export interface WorkOrderFilters {
  status?: WorkOrder['status'];
  clientId?: string;
  mechanicId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DashboardStats {
  totalWorkOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  totalVehicles: number;
  activeReminders: number;
}
