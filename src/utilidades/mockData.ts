import type { User, Client, Vehicle, WorkOrder, ServiceType, Reminder, DashboardStats } from '../tipos/index';

// Datos mock para desarrollo - ARRAYS VACÍOS (sin datos de ejemplo)
export const mockUsers: User[] = [];

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
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO').format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
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
