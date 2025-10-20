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
    name: 'ADMIN ALLAN',
    phone: '+1234567890',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-recep-001',
    email: 'recep@taller.com',
    password: 'recep123',
    role: 'receptionist',
    name: 'Recepcionista del Taller',
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
  {
    id: 'inv-001',
    productId: 'prod-001',
    quantity: 25,
    minStock: 10,
    maxStock: 50,
    location: 'Estante A-1',
    lastEntryDate: new Date('2024-10-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: 'inv-002',
    productId: 'prod-002',
    quantity: 40,
    minStock: 15,
    maxStock: 60,
    location: 'Estante A-2',
    lastEntryDate: new Date('2024-09-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-09-15'),
  },
  {
    id: 'inv-003',
    productId: 'prod-003',
    quantity: 15,
    minStock: 8,
    maxStock: 30,
    location: 'Estante B-1',
    lastEntryDate: new Date('2024-10-05'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-05'),
  },
  {
    id: 'inv-004',
    productId: 'prod-004',
    quantity: 8,
    minStock: 4,
    maxStock: 20,
    location: 'Bodega Principal',
    lastEntryDate: new Date('2024-09-20'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-09-20'),
  },
  {
    id: 'inv-005',
    productId: 'prod-005',
    quantity: 12,
    minStock: 5,
    maxStock: 25,
    location: 'Estante C-1',
    lastEntryDate: new Date('2024-10-10'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-10'),
  }
];

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
