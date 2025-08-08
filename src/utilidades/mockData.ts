import type { User, Client, Vehicle, WorkOrder, ServiceType, Reminder, DashboardStats } from '../tipos/index';

// Usuarios predefinidos del sistema - Honduras
export const mockUsers: User[] = [
  // Administrador
  {
    id: 'admin-001',
    email: 'admin@taller.com',
    password: 'admin123',
    role: 'admin',
    name: 'ALLAN MEDINA',
    phone: '+504 9789-6227',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  // Recepcionista
  {
    id: 'recep-001',
    email: 'recep@taller.com',
    password: 'recep123',
    role: 'receptionist',
    name: 'Andre Vargas',
    phone: '+504 9656-3917',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  // Mecánico
  {
    id: 'mech-001',
    email: 'mecanico@taller.com',
    password: 'mec123',
    role: 'mechanic',
    name: 'José Manuel Hernández',
    phone: '+504 8765-4321',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockServiceTypes: ServiceType[] = [];

export const mockClients: Client[] = [];

export const mockVehicles: Vehicle[] = [];

export const mockWorkOrders: WorkOrder[] = [];

export const mockReminders: Reminder[] = [];

export const mockDashboardStats: DashboardStats = {
  totalWorkOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalClients: 0,
  totalVehicles: 0,
  activeReminders: 0,
};

// Funciones auxiliares
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatCurrency = (amount: number): string => {
  return `L. ${new Intl.NumberFormat('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-HN').format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('es-HN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getStatusColor = (status: string): string => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getStatusText = (status: string): string => {
  const statusTexts = {
    pending: 'Pendiente',
    'in-progress': 'En Proceso',
    completed: 'Completado',
    cancelled: 'Cancelado',
    paid: 'Pagado',
    preventive: 'Preventivo',
    corrective: 'Correctivo',
  };
  return statusTexts[status as keyof typeof statusTexts] || status;
};

export const getRoleText = (role: string): string => {
  const roleTexts = {
    admin: 'Administrador',
    mechanic: 'Mecánico',
    receptionist: 'Recepcionista',
    client: 'Cliente',
  };
  return roleTexts[role as keyof typeof roleTexts] || role;
};
