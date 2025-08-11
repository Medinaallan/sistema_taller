import type { AppState, AppAction } from './AppContext';
import { mockUsers, mockServiceTypes, mockClients, mockVehicles, mockWorkOrders, mockReminders, mockDashboardStats } from '../utilidades/mockData';

// Función para obtener estado inicial con persistencia
export const getInitialState = (): AppState => {
  let user = null;
  let isAuthenticated = false;
  let clients = mockClients;
  let serviceTypes = mockServiceTypes;
  try {
    const savedUser = localStorage.getItem('tallerApp_user');
    const savedAuth = localStorage.getItem('tallerApp_isAuthenticated');
    const savedClients = localStorage.getItem('tallerApp_clients');
    const savedServiceTypes = localStorage.getItem('tallerApp_serviceTypes');
    if (savedUser && savedAuth === 'true') {
      user = JSON.parse(savedUser);
      isAuthenticated = true;
    }
    if (savedClients) {
      clients = JSON.parse(savedClients);
    }
    if (savedServiceTypes) {
      serviceTypes = JSON.parse(savedServiceTypes);
    }
  } catch (error) {
    console.error('Error loading saved user, clients or serviceTypes:', error);
  }
  return {
    user,
    isAuthenticated,
    clients,
    vehicles: mockVehicles,
    workOrders: mockWorkOrders,
    reminders: mockReminders,
    serviceTypes,
    users: mockUsers,
    dashboardStats: mockDashboardStats,
    loading: false,
    error: null,
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
      return {
        ...state,
        users: [...state.users, action.payload],
      };

    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === action.payload.id ? action.payload : user
        ),
      };

    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter((user) => user.id !== action.payload),
      };

    case 'SET_DASHBOARD_STATS':
      return {
        ...state,
        dashboardStats: action.payload,
      };

    default:
      return state;
  }
}
