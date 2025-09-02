import React, { createContext } from 'react';
import type { 
  User, 
  Client, 
  Vehicle, 
  WorkOrder, 
  ServiceType, 
  Reminder, 
  DashboardStats,
  Appointment,
  Quotation,
  Invoice,
  Payment,
  Service,
  Supplier,
  Product,
  InventoryItem,
  Log
} from '../tipos/index';

// Estado global de la aplicación - TODOS LOS MÓDULOS CONECTADOS
export interface AppState {
  // Autenticación y usuario
  user: User | null;
  isAuthenticated: boolean;
  
  // Datos principales del negocio
  clients: Client[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  
  // Sistema de citas y servicios
  appointments: Appointment[];
  services: Service[];
  serviceTypes: ServiceType[];
  
  // Sistema financiero
  quotations: Quotation[];
  invoices: Invoice[];
  payments: Payment[];
  
  // Inventario y productos
  products: Product[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  
  // Sistema administrativo
  users: User[];
  reminders: Reminder[];
  logs: Log[];
  
  // Dashboard y estadísticas
  dashboardStats: DashboardStats | null;
  
  // Estados de UI
  loading: boolean;
  error: string | null;
  isNavCollapsed: boolean;
}

// Acciones disponibles - SISTEMA COMPLETO INTERCONECTADO
export type AppAction =
  // Autenticación
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // ========== MÓDULO CLIENTES ==========
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  
  // ========== MÓDULO VEHÍCULOS ==========
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'DELETE_VEHICLE'; payload: string }
  
  // ========== MÓDULO ÓRDENES DE TRABAJO ==========
  | { type: 'SET_WORK_ORDERS'; payload: WorkOrder[] }
  | { type: 'ADD_WORK_ORDER'; payload: WorkOrder }
  | { type: 'UPDATE_WORK_ORDER'; payload: WorkOrder }
  | { type: 'DELETE_WORK_ORDER'; payload: string }
  
  // ========== MÓDULO CITAS ==========
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'DELETE_APPOINTMENT'; payload: string }
  
  // ========== MÓDULO COTIZACIONES ==========
  | { type: 'SET_QUOTATIONS'; payload: Quotation[] }
  | { type: 'ADD_QUOTATION'; payload: Quotation }
  | { type: 'UPDATE_QUOTATION'; payload: Quotation }
  | { type: 'DELETE_QUOTATION'; payload: string }
  
  // ========== MÓDULO FACTURAS ==========
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  
  // ========== MÓDULO PAGOS ==========
  | { type: 'SET_PAYMENTS'; payload: Payment[] }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: Payment }
  | { type: 'DELETE_PAYMENT'; payload: string }
  
  // ========== MÓDULO SERVICIOS ==========
  | { type: 'SET_SERVICES'; payload: Service[] }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'DELETE_SERVICE'; payload: string }
  
  // ========== MÓDULO TIPOS DE SERVICIO ==========
  | { type: 'SET_SERVICE_TYPES'; payload: ServiceType[] }
  | { type: 'ADD_SERVICE_TYPE'; payload: ServiceType }
  | { type: 'UPDATE_SERVICE_TYPE'; payload: ServiceType }
  | { type: 'DELETE_SERVICE_TYPE'; payload: string }
  
  // ========== MÓDULO PRODUCTOS ==========
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  
  // ========== MÓDULO INVENTARIO ==========
  | { type: 'SET_INVENTORY'; payload: InventoryItem[] }
  | { type: 'ADD_INVENTORY_ITEM'; payload: InventoryItem }
  | { type: 'UPDATE_INVENTORY_ITEM'; payload: InventoryItem }
  | { type: 'DELETE_INVENTORY_ITEM'; payload: string }
  
  // ========== MÓDULO PROVEEDORES ==========
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  
  // ========== MÓDULO RECORDATORIOS ==========
  | { type: 'SET_REMINDERS'; payload: Reminder[] }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'UPDATE_REMINDER'; payload: Reminder }
  | { type: 'DELETE_REMINDER'; payload: string }
  
  // ========== MÓDULO USUARIOS ==========
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  
  // ========== MÓDULO LOGS/BITÁCORA ==========
  | { type: 'SET_LOGS'; payload: Log[] }
  | { type: 'ADD_LOG'; payload: Log }
  
  // ========== DASHBOARD Y ESTADÍSTICAS ==========
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'REFRESH_DASHBOARD_STATS' }
  
  // ========== DATOS CSV ==========
  | { type: 'LOAD_CSV_DATA'; payload: { clients: Client[], vehicles: Vehicle[], workOrders: WorkOrder[] } }
  
  // ========== UI ==========
  | { type: 'TOGGLE_NAV'; payload?: boolean };

// Contexto
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);
