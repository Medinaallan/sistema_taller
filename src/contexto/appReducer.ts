import type { AppState, AppAction } from './AppContext';
import type { DashboardStats } from '../tipos/index';
import { 
  mockUsers,
  mockServiceTypes, 
  mockClients, 
  mockVehicles, 
  mockWorkOrders, 
  mockReminders, 
  mockDashboardStats
} from '../utilidades/globalMockDatabaseFinal'; // ✅ CORREGIDO: usar el archivo con datos reales

// Función para obtener estado inicial con persistencia
export const getInitialState = (): AppState => {
  let user: import('../tipos').User | null = null; // ✅ CORREGIDO: Permitir null
  let isAuthenticated = false; // ✅ CORREGIDO: Iniciar como NO autenticado por defecto
  let clients = mockClients; // Datos del CSV
  let serviceTypes = mockServiceTypes;
  let users = mockUsers; // Usuarios del sistema
  
  try {
    const savedUser = localStorage.getItem('tallerApp_user');
    const savedAuth = localStorage.getItem('tallerApp_isAuthenticated');
    const savedClients = localStorage.getItem('tallerApp_clients');
    const savedServiceTypes = localStorage.getItem('tallerApp_serviceTypes');
    const savedUsers = localStorage.getItem('tallerApp_users');
    
    // ✅ CORREGIDO: Solo autenticar si AMBAS condiciones se cumplen
    if (savedUser && savedAuth === 'true') {
      user = JSON.parse(savedUser);
      isAuthenticated = true;
    } else {
      // Si no hay autenticación válida, asegurar que esté limpio
      user = null;
      isAuthenticated = false;
    }
    if (savedClients) {
      clients = JSON.parse(savedClients);
    }
    if (savedServiceTypes) {
      serviceTypes = JSON.parse(savedServiceTypes);
    }
    if (savedUsers) {
      users = JSON.parse(savedUsers);
    }
  } catch (error) {
    console.error('Error loading saved user, clients, serviceTypes or users:', error);
  }
  
  // Cargar el estado del nav
  let isNavCollapsed = false;
  const savedNavState = localStorage.getItem('tallerApp_navState');
  if (savedNavState) {
    try {
      isNavCollapsed = JSON.parse(savedNavState);
    } catch (error) {
      console.error('Error loading saved nav state:', error);
    }
  }

  return {
    // Autenticación y usuario
    user,
    isAuthenticated,
    
    // Datos principales del negocio (usando datos del CSV)
    clients,
    vehicles: mockVehicles,
    workOrders: mockWorkOrders,
    
    // Sistema de citas y servicios
    appointments: [], // Inicializar vacío por ahora
    services: [], // Inicializar vacío por ahora
    serviceTypes,
    
    // Sistema financiero
    quotations: [], // Inicializar vacío por ahora
    invoices: [], // Inicializar vacío por ahora
    payments: [], // Inicializar vacío por ahora
    
    // Inventario y productos
    products: [], // Inicializar vacío por ahora
    inventory: [], // Inicializar vacío por ahora
    suppliers: [], // Inicializar vacío por ahora
    
    // Sistema administrativo
    users,
    reminders: mockReminders,
    logs: [], // Inicializar vacío por ahora
    
    // Dashboard y estadísticas (usando datos del CSV)
    dashboardStats: mockDashboardStats,
    
    // Estados de UI
    loading: false,
    error: null,
    isNavCollapsed
  };
};

// Reducer
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      // Guardar en localStorage
      localStorage.setItem('tallerApp_user', JSON.stringify(action.payload));
      localStorage.setItem('tallerApp_isAuthenticated', 'true');
      
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        error: null,
      };

    case 'LOGOUT':
      // Limpiar localStorage
      localStorage.removeItem('tallerApp_user');
      localStorage.removeItem('tallerApp_isAuthenticated');
      
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_CLIENTS': {
      localStorage.setItem('tallerApp_clients', JSON.stringify(action.payload));
      return {
        ...state,
        clients: action.payload,
      };
    }

    case 'ADD_CLIENT': {
      const updatedClients = [...state.clients, action.payload];
      localStorage.setItem('tallerApp_clients', JSON.stringify(updatedClients));
      return {
        ...state,
        clients: updatedClients,
      };
    }

    case 'UPDATE_CLIENT': {
      const updatedClients = state.clients.map((client) =>
        client.id === action.payload.id ? action.payload : client
      );
      localStorage.setItem('tallerApp_clients', JSON.stringify(updatedClients));
      return {
        ...state,
        clients: updatedClients,
      };
    }

    case 'DELETE_CLIENT': {
      const updatedClients = state.clients.filter((client) => client.id !== action.payload);
      localStorage.setItem('tallerApp_clients', JSON.stringify(updatedClients));
      return {
        ...state,
        clients: updatedClients,
      };
    }

    case 'SET_VEHICLES':
      return {
        ...state,
        vehicles: action.payload,
      };

    case 'ADD_VEHICLE':
      return {
        ...state,
        vehicles: [...state.vehicles, action.payload],
      };

    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map((vehicle) =>
          vehicle.id === action.payload.id ? action.payload : vehicle
        ),
      };

    case 'DELETE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.filter((vehicle) => vehicle.id !== action.payload),
      };

    case 'SET_WORK_ORDERS':
      return {
        ...state,
        workOrders: action.payload,
      };

    case 'ADD_WORK_ORDER':
      return {
        ...state,
        workOrders: [...state.workOrders, action.payload],
      };

    case 'UPDATE_WORK_ORDER':
      return {
        ...state,
        workOrders: state.workOrders.map((order) =>
          order.id === action.payload.id ? action.payload : order
        ),
      };

    case 'DELETE_WORK_ORDER':
      return {
        ...state,
        workOrders: state.workOrders.filter((order) => order.id !== action.payload),
      };

    case 'SET_REMINDERS':
      return {
        ...state,
        reminders: action.payload,
      };

    case 'ADD_REMINDER':
      return {
        ...state,
        reminders: [...state.reminders, action.payload],
      };

    case 'UPDATE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map((reminder) =>
          reminder.id === action.payload.id ? action.payload : reminder
        ),
      };

    case 'DELETE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter((reminder) => reminder.id !== action.payload),
      };

    case 'SET_SERVICE_TYPES': {
      localStorage.setItem('tallerApp_serviceTypes', JSON.stringify(action.payload));
      return {
        ...state,
        serviceTypes: action.payload,
      };
    }
    case 'ADD_SERVICE_TYPE': {
      const updatedServiceTypes = [...state.serviceTypes, action.payload];
      localStorage.setItem('tallerApp_serviceTypes', JSON.stringify(updatedServiceTypes));
      return {
        ...state,
        serviceTypes: updatedServiceTypes,
      };
    }
    case 'UPDATE_SERVICE_TYPE': {
      const updatedServiceTypes = state.serviceTypes.map((st) =>
        st.id === action.payload.id ? action.payload : st
      );
      localStorage.setItem('tallerApp_serviceTypes', JSON.stringify(updatedServiceTypes));
      return {
        ...state,
        serviceTypes: updatedServiceTypes,
      };
    }
    case 'DELETE_SERVICE_TYPE': {
      const updatedServiceTypes = state.serviceTypes.filter((st) => st.id !== action.payload);
      localStorage.setItem('tallerApp_serviceTypes', JSON.stringify(updatedServiceTypes));
      return {
        ...state,
        serviceTypes: updatedServiceTypes,
      };
    }

    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };

    case 'ADD_USER':
      const newUsersArray = [...state.users, action.payload];
      // Persistir en localStorage
      localStorage.setItem('tallerApp_users', JSON.stringify(newUsersArray));
      return {
        ...state,
        users: newUsersArray,
      };

    case 'UPDATE_USER':
      const updatedUsersArray = state.users.map((user) =>
        user.id === action.payload.id ? action.payload : user
      );
      // Persistir en localStorage
      localStorage.setItem('tallerApp_users', JSON.stringify(updatedUsersArray));
      return {
        ...state,
        users: updatedUsersArray,
      };

    case 'DELETE_USER':
      const filteredUsersArray = state.users.filter((user) => user.id !== action.payload);
      // Persistir en localStorage
      localStorage.setItem('tallerApp_users', JSON.stringify(filteredUsersArray));
      return {
        ...state,
        users: filteredUsersArray,
      };

    case 'SET_DASHBOARD_STATS':
      return {
        ...state,
        dashboardStats: action.payload,
      };

    case 'REFRESH_DASHBOARD_STATS':
      // Función para recalcular estadísticas basadas en datos actuales
      const totalClients = state.clients.length;
      const totalVehicles = state.vehicles.length;
      const totalWorkOrders = state.workOrders.length;
      const completedOrders = state.workOrders.filter(wo => wo.status === 'completed').length;
      const pendingOrders = state.workOrders.filter(wo => wo.status === 'pending').length;
      
      // Calcular ingresos basado en órdenes completadas si no hay facturas
      const totalRevenue = state.invoices.length > 0 
        ? state.invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0)
        : state.workOrders
            .filter(wo => wo.status === 'completed')
            .reduce((sum, wo) => sum + wo.totalCost, 0);
            
      // Calcular ingresos mensuales
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = state.invoices.length > 0
        ? state.invoices
            .filter(inv => {
              const invDate = new Date(inv.date);
              return inv.status === 'paid' && 
                     invDate.getMonth() === currentMonth && 
                     invDate.getFullYear() === currentYear;
            })
            .reduce((sum, inv) => sum + inv.total, 0)
        : state.workOrders
            .filter(wo => {
              const completionDate = wo.actualCompletionDate;
              return wo.status === 'completed' && 
                     completionDate &&
                     completionDate.getMonth() === currentMonth &&
                     completionDate.getFullYear() === currentYear;
            })
            .reduce((sum, wo) => sum + wo.totalCost, 0);
            
      const activeReminders = state.reminders.filter(r => r.isActive).length;

      const refreshedStats: DashboardStats = {
        totalClients,
        totalVehicles,
        totalWorkOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        monthlyRevenue,
        activeReminders,
      };

      return {
        ...state,
        dashboardStats: refreshedStats,
      };

    // ========== CITAS ==========
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload };
    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter(item => item.id !== action.payload)
      };

    // ========== COTIZACIONES ==========
    case 'SET_QUOTATIONS':
      return { ...state, quotations: action.payload };
    case 'ADD_QUOTATION':
      return { ...state, quotations: [...state.quotations, action.payload] };
    case 'UPDATE_QUOTATION':
      return {
        ...state,
        quotations: state.quotations.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_QUOTATION':
      return {
        ...state,
        quotations: state.quotations.filter(item => item.id !== action.payload)
      };

    // ========== FACTURAS ==========
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(item => item.id !== action.payload)
      };

    // ========== PAGOS ==========
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload };
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_PAYMENT':
      return {
        ...state,
        payments: state.payments.filter(item => item.id !== action.payload)
      };

    // ========== SERVICIOS ==========
    case 'SET_SERVICES':
      return { ...state, services: action.payload };
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_SERVICE':
      return {
        ...state,
        services: state.services.filter(item => item.id !== action.payload)
      };

    // ========== PRODUCTOS ==========
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(item => item.id !== action.payload)
      };

    // ========== INVENTARIO ==========
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventory: [...state.inventory, action.payload] };
    case 'UPDATE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.filter(item => item.id !== action.payload)
      };

    // ========== PROVEEDORES ==========
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(item => item.id !== action.payload)
      };

    // ========== LOGS/BITÁCORA ==========
    case 'SET_LOGS':
      return { ...state, logs: action.payload };
    case 'ADD_LOG':
      const newLog = {
        ...action.payload,
        timestamp: new Date()
      };
      return { 
        ...state, 
        logs: [newLog, ...state.logs].slice(0, 1000) // Mantener solo los últimos 1000 logs
      };

    case 'TOGGLE_NAV': {
      const newNavState = typeof action.payload === 'boolean' 
        ? action.payload 
        : !state.isNavCollapsed;
      const newState = {
        ...state,
        isNavCollapsed: newNavState
      };
      localStorage.setItem('tallerApp_navState', JSON.stringify(newState.isNavCollapsed));
      return newState;
    }

    case 'LOAD_CSV_DATA': {
      const { clients, vehicles, workOrders } = action.payload;
      
      // Calcular nuevas estadísticas del dashboard
      const newDashboardStats = {
        totalWorkOrders: workOrders.length,
        pendingOrders: workOrders.filter(wo => wo.status === 'pending').length,
        completedOrders: workOrders.filter(wo => wo.status === 'completed').length,
        totalRevenue: workOrders
          .filter(wo => wo.status === 'completed')
          .reduce((sum, wo) => sum + wo.totalCost, 0),
        monthlyRevenue: workOrders
          .filter(wo => wo.status === 'completed' && wo.actualCompletionDate?.getMonth() === new Date().getMonth())
          .reduce((sum, wo) => sum + wo.totalCost, 0),
        totalClients: clients.length,
        totalVehicles: vehicles.length,
        activeReminders: state.reminders.filter(r => r.isActive).length
      };

      return {
        ...state,
        clients: [...clients, ...state.clients.filter(c => !clients.find(nc => nc.email === c.email))], // Merge sin duplicar
        vehicles: [...vehicles, ...state.vehicles.filter(v => !vehicles.find(nv => nv.id === v.id))], // Merge sin duplicar
        workOrders: [...workOrders, ...state.workOrders.filter(wo => !workOrders.find(nwo => nwo.id === wo.id))], // Merge sin duplicar
        dashboardStats: newDashboardStats
      };
    }

    default:
      return state;
  }
}
