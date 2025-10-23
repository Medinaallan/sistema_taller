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
  vin?: string;
  mileage?: number;
  serviceType: ServiceType;
  workOrders: WorkOrder[];
  reminders: Reminder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderPart {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface OrderService {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  clientId: string;
  mechanicId?: string;
  receptionistId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'rejected';
  description: string;
  problem: string;
  diagnosis?: string;
  serviceType: 'preventive' | 'corrective';
  estimatedCompletionDate: Date;
  actualCompletionDate?: Date;
  startDate?: Date;
  technicianNotes?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  estimatedCost: number;
  finalCost?: number;
  parts: OrderPart[];
  services: OrderService[];
  notes?: string;
  recommendations?: string;
  paymentStatus: 'pending' | 'partial' | 'completed';
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
  startDate?: Date;
  endDate?: Date;
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

// Cita de servicio
export interface Appointment {
  id: string;
  clientId: string;
  vehicleId: string;
  serviceTypeId: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inventario
export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  supplierId?: string;
  lastEntryDate?: Date;
  lastExitDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Factura
export interface Invoice {
  id: string;
  clientId: string;
  workOrderId: string;
  invoiceNumber: string;
  date: Date;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

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

// Servicio
export interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Proveedor
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  productsSupplied?: string[]; // productIds
  createdAt: Date;
  updatedAt: Date;
}

// Producto
export interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  price: number;
  cost?: number;
  stock: number;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cotización
export interface Quotation {
  id: string;
  clientId: string;
  vehicleId: string;
  items: QuotationItem[];
  total: number;
  status: 'pending' | 'sent' | 'approved' | 'rejected';
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

// Rol de usuario
export interface Role {
  id: string;
  name: string; // Ej: 'admin', 'mechanic', 'receptionist', 'client'
  description?: string;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Bitácora de acciones
export interface Log {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  description?: string;
  timestamp: Date;
}

// Estadísticas y reportes
export interface FinancialStats {
  totalSales: number;
  taxableAmount: number;
  isv: number;
  totalWithTax: number;
  cashPayments: number;
  cardPayments: number;
  transferPayments: number;
  pendingPayments: number;
}

export interface ServiceStats {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
}

export interface SatisfactionStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  mechanicRatings: {
    mechanicId: string;
    mechanicName: string;
    averageRating: number;
    totalRatings: number;
  }[];
}

export interface OrderRating {
  orderId: string;
  mechanicId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  mechanicId?: string;
  serviceTypeId?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'rejected';
}

// Historial de servicios
export interface ServiceHistoryRecord {
  id: string;
  orderId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  vehicleColor: string;
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  serviceDuration: string;
  serviceCategory: string;
  date: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceHistoryStats {
  totalRecords: number;
  totalClients: number;
  totalVehicles: number;
  totalServices: number;
  statusBreakdown: { [key: string]: number };
}

export interface ClientServiceStats {
  totalServices: number;
  totalSpent: number;
  averageServiceCost: number;
  lastServiceDate: string | null;
  favoriteServiceType: string | null;
  vehiclesServiced: number;
  servicesByStatus: { [key: string]: number };
  servicesByCategory: { [key: string]: number };
  monthlyActivity: { [key: string]: number };
}
