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
// ARRAYS CON DATOS DE PRUEBA
// ====================================

export const mockUsers: User[] = [
  {
    id: 'user-admin-001',
    email: 'admin@taller.com',
    password: 'admin123',
    role: 'admin',
    name: 'ALLAN MEDINA',
    phone: '+1234567890',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-recep-001',
    email: 'recep@taller.com',
    password: 'recep123',
    role: 'receptionist',
    name: 'ANDRE VARGAS',
    phone: '+1234567891',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-mec-001',
    email: 'mecanico@taller.com',
    password: 'mec123',
    role: 'mechanic',
    name: 'Mecánico Principal',
    phone: '+1234567892',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];
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

export const getRoleText = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    admin: 'Administrador',
    mechanic: 'Mecánico',
    receptionist: 'Recepcionista',
    client: 'Cliente'
  };
  return roleMap[role] || role;
};

export const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: 'Pendiente',
    'in-progress': 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    confirmed: 'Confirmada',
    paid: 'Pagado',
    unpaid: 'No Pagado'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    confirmed: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
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
