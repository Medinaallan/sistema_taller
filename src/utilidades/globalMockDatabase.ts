// ====================================
// BASE DE DATOS GLOBAL COMPLETAMENTE VACÍA
// Sistema centralizado de datos para el taller - SIN DATOS DE EJEMPLO
// ====================================

import type { 
  User, Client, Vehicle, WorkOrder, Reminder, ServiceType,
  Appointment, Quotation, Invoice, Payment, Service, Product,
  InventoryItem, Supplier, Log, DashboardStats
} from '../tipos';

// ====================================
// ARRAYS COMPLETAMENTE VACÍOS - SIN DATOS DE EJEMPLO
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

// ESTADÍSTICAS VACÍAS
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

// ====================================
// FUNCIONES DE UTILIDAD
// ====================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL'
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Función para obtener el texto del rol del usuario
export function getRoleText(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'mechanic':
      return 'Mecánico';
    case 'receptionist':
      return 'Recepcionista';
    case 'client':
      return 'Cliente';
    default:
      return 'Usuario';
  }
}

// Función para obtener el color según el estado
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'active':
    case 'confirmed':
      return 'green';
    case 'pending':
    case 'in-progress':
      return 'yellow';
    case 'cancelled':
    case 'failed':
    case 'overdue':
      return 'red';
    case 'draft':
    case 'scheduled':
      return 'blue';
    default:
      return 'gray';
  }
}

// Función para obtener el texto del estado
export function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'pending':
      return 'Pendiente';
    case 'in-progress':
      return 'En Progreso';
    case 'cancelled':
      return 'Cancelado';
    case 'confirmed':
      return 'Confirmado';
    case 'active':
      return 'Activo';
    case 'failed':
      return 'Fallido';
    case 'overdue':
      return 'Vencido';
    case 'draft':
      return 'Borrador';
    case 'scheduled':
      return 'Programado';
    default:
      return 'Desconocido';
  }
}

// Función para generar IDs únicos
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}