import React, { createContext } from 'react';
import type { User, Client, Vehicle, WorkOrder, ServiceType, Reminder, DashboardStats } from '../tipos/index';

// Estado global de la aplicación
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  clients: Client[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  reminders: Reminder[];
  serviceTypes: ServiceType[];
  users: User[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

// Acciones disponibles
export type AppAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'DELETE_VEHICLE'; payload: string }
  | { type: 'SET_WORK_ORDERS'; payload: WorkOrder[] }
  | { type: 'ADD_WORK_ORDER'; payload: WorkOrder }
  | { type: 'UPDATE_WORK_ORDER'; payload: WorkOrder }
  | { type: 'DELETE_WORK_ORDER'; payload: string }
  | { type: 'SET_REMINDERS'; payload: Reminder[] }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'UPDATE_REMINDER'; payload: Reminder }
  | { type: 'DELETE_REMINDER'; payload: string }
  | { type: 'SET_SERVICE_TYPES'; payload: ServiceType[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats };

// Contexto
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);
