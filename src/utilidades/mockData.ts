// mockData.ts - Datos mock usando información del CSV
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
import { csvClients, csvWorkOrders, csvVehicles } from './csvDatabase';

// Usar datos del CSV como fuente principal
export const mockClients: Client[] = csvClients;
export const mockVehicles: Vehicle[] = csvVehicles;
export const mockWorkOrders: WorkOrder[] = csvWorkOrders;

// Usuarios del sistema (administradores, mecánicos, recepcionistas)
export const mockUsers: User[] = [
  {
    id: 'admin-001',
    email: 'admin@taller.com',
    password: 'admin123',
    role: 'admin',
    name: 'Administrador Sistema',
    phone: '9999-0000',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'mech-001',
    email: 'mecanico@taller.com',
    password: 'mech123',
    role: 'mechanic',
    name: 'Juan Pérez',
    phone: '9999-0001',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'recep-001',
    email: 'recepcion@taller.com',
    password: 'recep123',
    role: 'receptionist',
    name: 'María García',
    phone: '9999-0002',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

// Tipos de servicio
export const mockServiceTypes: ServiceType[] = [
  {
    id: 'maintenance',
    name: 'Mantenimiento Preventivo',
    description: 'Servicio de mantenimiento regular',
    estimatedDuration: 2,
    basePrice: 500
  },
  {
    id: 'repair',
    name: 'Reparación Correctiva',
    description: 'Reparación de fallas específicas',
    estimatedDuration: 4,
    basePrice: 800
  },
  {
    id: 'inspection',
    name: 'Inspección General',
    description: 'Revisión completa del vehículo',
    estimatedDuration: 1,
    basePrice: 200
  }
];

// Recordatorios basados en los vehículos del CSV
export const mockReminders: Reminder[] = csvVehicles.map((vehicle, index) => ({
  id: `reminder-${index + 1}`,
  vehicleId: vehicle.id,
  clientId: vehicle.clientId,
  type: vehicle.mileage! > 50000 ? 'mileage' : 'date',
  title: `Mantenimiento ${vehicle.brand} ${vehicle.model}`,
  description: `Recordatorio de mantenimiento para ${vehicle.brand} ${vehicle.model}`,
  triggerValue: vehicle.mileage! > 50000 ? vehicle.mileage! + 5000 : new Date('2025-10-01'),
  currentValue: vehicle.mileage,
  isActive: true,
  isCompleted: false,
  services: ['Cambio de aceite', 'Revisión de frenos'],
  createdAt: new Date('2024-01-01'),
  triggerDate: new Date('2025-10-01')
}));

// Notificaciones para los clientes del CSV
export const mockNotifications: Notification[] = csvClients.map((client, index) => ({
  id: `notif-${index + 1}`,
  userId: client.id,
  title: 'Servicio Programado',
  message: `Su vehículo ${client.vehicles[0]?.brand} ${client.vehicles[0]?.model} tiene un servicio próximo`,
  type: 'info',
  isRead: false,
  createdAt: new Date()
}));

// Estadísticas del dashboard basadas en datos del CSV
export const mockDashboardStats: DashboardStats = {
  totalWorkOrders: csvWorkOrders.length,
  pendingOrders: csvWorkOrders.filter(wo => wo.status === 'pending').length,
  completedOrders: csvWorkOrders.filter(wo => wo.status === 'completed').length,
  totalRevenue: csvWorkOrders
    .filter(wo => wo.status === 'completed')
    .reduce((sum, wo) => sum + wo.totalCost, 0),
  monthlyRevenue: csvWorkOrders
    .filter(wo => wo.status === 'completed' && wo.actualCompletionDate?.getMonth() === new Date().getMonth())
    .reduce((sum, wo) => sum + wo.totalCost, 0),
  totalClients: csvClients.length,
  totalVehicles: csvVehicles.length,
  activeReminders: mockReminders.filter(r => r.isActive).length
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
  return csvClients.find(client => client.email === email);
}

// Función para obtener vehículos de un cliente
export function getClientVehicles(clientId: string): Vehicle[] {
  return csvVehicles.filter(vehicle => vehicle.clientId === clientId);
}

// Función para obtener órdenes de trabajo de un cliente
export function getClientWorkOrders(clientId: string): WorkOrder[] {
  return csvWorkOrders.filter(order => order.clientId === clientId);
}

// Función para obtener recordatorios de un cliente
export function getClientReminders(clientId: string): Reminder[] {
  return mockReminders.filter(reminder => reminder.clientId === clientId);
}
