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
  },
  // Usuarios clientes (basados en el CSV)
  {
    id: 'client-avargas',
    email: 'avargas@taller.com',
    password: 'asdf1234',
    role: 'client',
    name: 'Andre Vargas',
    phone: '9999-9999',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-gmedina', 
    email: 'gmedina@taller.com',
    password: 'asdf1234',
    role: 'client',
    name: 'Gerardo Medina',
    phone: '9999-9999',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-avasquez',
    email: 'avasquez@taller.com', // Corregido el email del CSV que tenía .con
    password: 'asdf1234',
    role: 'client',
    name: 'Alex Vasquez',
    phone: '9999-1000',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-ncano',
    email: 'ncano@taller.com',
    password: 'asdf1234', 
    role: 'client',
    name: 'Natanael Cano',
    phone: '9999-1002',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-kramos',
    email: 'kramos@taller.com',
    password: 'asdf1234',
    role: 'client', 
    name: 'Katy Ramos',
    phone: '9999-1003',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];
export const mockServiceTypes: ServiceType[] = [];
export const mockClients: Client[] = [
  {
    id: 'client-avargas',
    name: 'Andre Vargas',
    phone: '9999-9999',
    email: 'avargas@taller.com',
    address: 'Col. Los arbolitos',
    password: 'asdf1234',
    vehicles: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-gmedina',
    name: 'Gerardo Medina',
    phone: '9999-9999', 
    email: 'gmedina@taller.com',
    address: 'Col. Los maestros',
    password: 'asdf1234',
    vehicles: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-avasquez',
    name: 'Alex Vasquez',
    phone: '9999-1000',
    email: 'avasquez@taller.com',
    address: 'Barrio x',
    password: 'asdf1234',
    vehicles: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-ncano',
    name: 'Natanael Cano', 
    phone: '9999-1002',
    email: 'ncano@taller.com',
    address: 'Barrio z',
    password: 'asdf1234',
    vehicles: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'client-kramos',
    name: 'Katy Ramos',
    phone: '9999-1003',
    email: 'kramos@taller.com', 
    address: 'Barrio A',
    password: 'asdf1234',
    vehicles: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];
export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    clientId: 'client-avargas',
    brand: 'Honda',
    model: 'Civic',
    year: 2020,
    licensePlate: 'ABC-001',
    color: 'Blanco',
    mileage: 20000,
    serviceType: {
      id: 'maintenance',
      name: 'Mantenimiento',
      description: 'Servicio general',
      estimatedDuration: 2,
      basePrice: 500
    },
    workOrders: [],
    reminders: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vehicle-2',
    clientId: 'client-gmedina',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2021,
    licensePlate: 'ABC-002',
    color: 'Gris',
    mileage: 12000,
    serviceType: {
      id: 'maintenance',
      name: 'Mantenimiento',
      description: 'Servicio general',
      estimatedDuration: 2,
      basePrice: 500
    },
    workOrders: [],
    reminders: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vehicle-3',
    clientId: 'client-avasquez',
    brand: 'Mazda',
    model: 'BT50',
    year: 2019,
    licensePlate: 'ABC-003',
    color: 'Negro',
    mileage: 8000,
    serviceType: {
      id: 'maintenance',
      name: 'Mantenimiento',
      description: 'Servicio general',
      estimatedDuration: 2,
      basePrice: 500
    },
    workOrders: [],
    reminders: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vehicle-4',
    clientId: 'client-ncano',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2018,
    licensePlate: 'ABC-004',
    color: 'Rojo',
    mileage: 7500,
    serviceType: {
      id: 'maintenance',
      name: 'Mantenimiento',
      description: 'Servicio general',
      estimatedDuration: 2,
      basePrice: 500
    },
    workOrders: [],
    reminders: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vehicle-5',
    clientId: 'client-kramos',
    brand: 'Honda',
    model: 'CRV',
    year: 2015,
    licensePlate: 'ABC-005',
    color: 'Azul',
    mileage: 120000,
    serviceType: {
      id: 'maintenance',
      name: 'Mantenimiento',
      description: 'Servicio general',
      estimatedDuration: 2,
      basePrice: 500
    },
    workOrders: [],
    reminders: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];
export const mockWorkOrders: WorkOrder[] = [];
export const mockReminders: Reminder[] = [
  // Recordatorios para Andre Vargas (avargas@taller.com)
  {
    id: 'reminder-1',
    vehicleId: 'vehicle-1',
    clientId: 'client-avargas',
    type: 'date',
    title: 'Mantenimiento Honda Civic',
    description: 'Cambio de aceite y filtros programado',
    triggerValue: new Date('2025-01-15'),
    isActive: true,
    isCompleted: false,
    services: ['Cambio de aceite', 'Cambio de filtros'],
    createdAt: new Date('2024-12-01'),
    triggerDate: new Date('2025-01-15')
  },
  {
    id: 'reminder-2', 
    vehicleId: 'vehicle-1',
    clientId: 'client-avargas',
    type: 'mileage',
    title: 'Revisión de frenos Honda Civic',
    description: 'Inspección y cambio de pastillas de freno',
    triggerValue: 22000,
    currentValue: 20000,
    isActive: true,
    isCompleted: false,
    services: ['Revisión de frenos', 'Cambio pastillas'],
    createdAt: new Date('2024-12-05'),
  },
  
  // Recordatorios para Gerardo Medina (gmedina@taller.com)
  {
    id: 'reminder-3',
    vehicleId: 'vehicle-2', 
    clientId: 'client-gmedina',
    type: 'date',
    title: 'Servicio Toyota Hilux',
    description: 'Mantenimiento preventivo programado cada 6 meses',
    triggerValue: new Date('2025-02-01'),
    isActive: true,
    isCompleted: false,
    services: ['Mantenimiento preventivo', 'Cambio de aceite'],
    createdAt: new Date('2024-12-01'),
    triggerDate: new Date('2025-02-01')
  },
  
  // Recordatorios para Alex Vasquez (avasquez@taller.com - ¡nota el email correcto!)
  {
    id: 'reminder-4',
    vehicleId: 'vehicle-3',
    clientId: 'client-avasquez', 
    type: 'mileage',
    title: 'Cambio de aceite Mazda BT50',
    description: 'Próximo cambio de aceite por kilometraje',
    triggerValue: 10000,
    currentValue: 8000,
    isActive: true,
    isCompleted: false,
    services: ['Cambio de aceite', 'Revisión general'],
    createdAt: new Date('2024-12-10'),
  },
  {
    id: 'reminder-5',
    vehicleId: 'vehicle-3',
    clientId: 'client-avasquez',
    type: 'date', 
    title: 'Revisión anual Mazda BT50',
    description: 'Inspección técnica vehicular anual',
    triggerValue: new Date('2025-03-15'),
    isActive: true,
    isCompleted: false,
    services: ['Inspección técnica', 'Revisión completa'],
    createdAt: new Date('2024-12-01'),
    triggerDate: new Date('2025-03-15')
  },
  
  // Recordatorios para Natanael Cano (ncano@taller.com)
  {
    id: 'reminder-6',
    vehicleId: 'vehicle-4',
    clientId: 'client-ncano',
    type: 'date',
    title: 'Mantenimiento Toyota Corolla', 
    description: 'Servicio preventivo trimestral',
    triggerValue: new Date('2024-12-20'), // Vencido para mostrar ejemplo
    isActive: true,
    isCompleted: false,
    services: ['Cambio de aceite', 'Revisión de frenos'],
    createdAt: new Date('2024-11-15'),
    triggerDate: new Date('2024-12-20')
  },
  
  // Recordatorios para Katy Ramos (kramos@taller.com)
  {
    id: 'reminder-7',
    vehicleId: 'vehicle-5',
    clientId: 'client-kramos',
    type: 'mileage',
    title: 'Gran servicio Honda CRV',
    description: 'Servicio mayor por alto kilometraje (120,000+ km)',
    triggerValue: 125000,
    currentValue: 120000,
    isActive: true,
    isCompleted: false,
    services: ['Servicio mayor', 'Cambio de banda de distribución'],
    createdAt: new Date('2024-12-01'),
  },
  {
    id: 'reminder-8',
    vehicleId: 'vehicle-5', 
    clientId: 'client-kramos',
    type: 'date',
    title: 'Recordatorio completado',
    description: 'Ejemplo de recordatorio ya completado',
    triggerValue: new Date('2024-11-01'),
    isActive: true,
    isCompleted: true, // Este está completado
    services: ['Cambio de llantas'],
    createdAt: new Date('2024-10-15'),
    triggerDate: new Date('2024-11-01')
  }
];
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
