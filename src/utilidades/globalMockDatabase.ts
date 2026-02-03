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

export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Aceite de Motor 5W-30',
    description: 'Aceite sintético para motor de alta calidad',
    brand: 'Mobil 1',
    model: '5W-30',
    price: 85000,
    cost: 65000,
    stock: 25,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-002',
    name: 'Filtro de Aceite',
    description: 'Filtro de aceite universal para vehículos',
    brand: 'Mann Filter',
    model: 'W712/75',
    price: 25000,
    cost: 18000,
    stock: 40,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-003',
    name: 'Pastillas de Freno Delanteras',
    description: 'Pastillas de freno cerámicas para freno delantero',
    brand: 'Brembo',
    model: 'P85020',
    price: 120000,
    cost: 95000,
    stock: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-004',
    name: 'Llanta 205/55R16',
    description: 'Llanta radial para automóviles',
    brand: 'Michelin',
    model: 'Energy Saver',
    price: 180000,
    cost: 140000,
    stock: 8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-005',
    name: 'Batería 12V 60Ah',
    description: 'Batería para automóvil libre de mantenimiento',
    brand: 'Bosch',
    model: 'S4024',
    price: 250000,
    cost: 200000,
    stock: 12,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];

export const mockInventory: InventoryItem[] = [
 
];

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
    case 'approved':
      return 'green';
    case 'pending':
    case 'in-progress':
      return 'yellow';
    case 'cancelled':
    case 'failed':
    case 'overdue':
    case 'rejected':
      return 'red';
    case 'draft':
    case 'scheduled':
      return 'blue';
    case 'sent':
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
    case 'sent':
      return 'Enviada a Cliente';
    case 'approved':
      return 'Aprobada';
    case 'rejected':
      return 'Rechazada';
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