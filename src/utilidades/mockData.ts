// mockData.ts - Datos mock completamente VACÍOS
import { 
  Client, 
  Vehicle, 
  WorkOrder, 
  User, 
  Reminder, 
  ServiceType, 
  Notification,
  DashboardStats 
} from '../tipos/index';

// DATOS COMPLETAMENTE VACÍOS - SIN EJEMPLOS
export const mockClients: Client[] = [];
export const mockVehicles: Vehicle[] = [];
export const mockWorkOrders: WorkOrder[] = [];

// USUARIOS VACÍOS - SIN DATOS DE EJEMPLO
export const mockUsers: User[] = [];

// TIPOS DE SERVICIO VACÍOS
export const mockServiceTypes: ServiceType[] = [];

// RECORDATORIOS VACÍOS
export const mockReminders: Reminder[] = [];

// NOTIFICACIONES VACÍAS
export const mockNotifications: Notification[] = [];

// ESTADÍSTICAS DEL DASHBOARD VACÍAS
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

// Funciones de utilidad
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

// Función para buscar cliente por email (para login)
export function findClientByEmail(email: string): Client | undefined {
  return mockClients.find(client => client.email === email);
}

// Función para obtener vehículos de un cliente
export function getClientVehicles(clientId: string): Vehicle[] {
  return mockVehicles.filter(vehicle => vehicle.clientId === clientId);
}

// Función para obtener órdenes de trabajo de un cliente
export function getClientWorkOrders(clientId: string): WorkOrder[] {
  return mockWorkOrders.filter(order => order.clientId === clientId);
}

// Función para obtener recordatorios de un cliente
export function getClientReminders(clientId: string): Reminder[] {
  return mockReminders.filter(reminder => reminder.clientId === clientId);
}
