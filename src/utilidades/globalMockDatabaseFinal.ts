// ====================================
// BASE DE DATOS GLOBAL VACÍA
// Sistema centralizado de datos para el taller
// ====================================

import type { 
  User, Client, Vehicle, WorkOrder, Reminder, ServiceType,
  Appointment, Quotation, Invoice, Payment, Service, Product,
  InventoryItem, Supplier, Log, DashboardStats
} from '../tipos';

// ====================================
// ARRAYS VACÍOS - LISTOS PARA LLENAR
// ====================================

export const mockUsers: User[] = [];
export const mockServiceTypes: ServiceType[] = [];
export const mockClients: Client[] = [];
export const mockVehicles: Vehicle[] = [];
export const mockWorkOrders: WorkOrder[] = [];
export const mockReminders: Reminder[] = [];
export const mockAppointments: Appointment[] = [];
export const mockQuotations: Quotation[] = [];
export const mockInvoices: Invoice[] = [];
export const mockPayments: Payment[] = [];
export const mockServices: Service[] = [];
export const mockProducts: Product[] = [];
export const mockInventory: InventoryItem[] = [];
export const mockSuppliers: Supplier[] = [];
export const mockLogs: Log[] = [];

// ====================================
// UTILIDADES DEL SISTEMA
// ====================================

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const formatCurrency = (amount: number): string => {
  return `L. ${amount.toLocaleString('es-HN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-HN');
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('es-HN');
};

// ====================================
// ESTADÍSTICAS VACÍAS DEL DASHBOARD
// ====================================

export const mockDashboardStats: DashboardStats = {
  totalWorkOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalClients: 0,
  totalVehicles: 0,
  activeReminders: 0
};
