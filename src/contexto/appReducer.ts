import type { AppState, AppAction } from './AppContext';

// Función para obtener estado inicial con persistencia
export const getInitialState = (): AppState => {
  try {
    const savedUser = localStorage.getItem('tallerApp_user');
    const savedAuth = localStorage.getItem('tallerApp_isAuthenticated');
    
    if (savedUser && savedAuth === 'true') {
      return {
        user: JSON.parse(savedUser),
        isAuthenticated: true,
        clients: [],
        vehicles: [],
        workOrders: [],
        reminders: [],
        serviceTypes: [],
        users: [],
        dashboardStats: null,
        loading: false,
        error: null,
      };
    }
  } catch (error) {
    console.error('Error loading saved user:', error);
  }
  
  return {
    user: null,
    isAuthenticated: false,
    clients: [],
    vehicles: [],
    workOrders: [],
    reminders: [],
    serviceTypes: [],
    users: [],
    dashboardStats: null,
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

    case 'SET_CLIENTS':
      return {
        ...state,
        clients: action.payload,
      };

    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [...state.clients, action.payload],
      };

    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((client) =>
          client.id === action.payload.id ? action.payload : client
        ),
      };

    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter((client) => client.id !== action.payload),
      };

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

    case 'SET_SERVICE_TYPES':
      return {
        ...state,
        serviceTypes: action.payload,
      };

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
