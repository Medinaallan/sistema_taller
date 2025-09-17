// Servicio API para comunicarse con el backend real
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Configuración base para fetch
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Función helper para manejar respuestas
async function handleResponse(response: Response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Error HTTP: ${response.status}`);
  }
  
  return data;
}

// Interfaces para los tipos de respuesta
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  error?: string;
}

export interface LoginData {
  userId: number;
  email: string;
  fullName: string;
  userType: string;
}

export interface RegisterClientData {
  userId: number;
  securityCode: string;
}

export interface ClientData {
  userId: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
}

// Servicios de autenticación
export const authService = {
  // Login de usuario
  async login(email: string, password: string): Promise<ApiResponse<LoginData>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    return handleResponse(response);
  },

  // Registro de cliente
  async registerClient(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    address?: string,
    companyName?: string
  ): Promise<ApiResponse<RegisterClientData>> {
    const response = await fetch(`${API_BASE_URL}/auth/register-client`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        fullName,
        phone,
        address,
        companyName,
      }),
    });
    
    return handleResponse(response);
  },

  // Verificar código de seguridad
  async verifySecurityCode(email: string, securityCode: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-security-code`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({ email, securityCode }),
    });
    
    return handleResponse(response);
  },
};

// Servicios de clientes
export const clientService = {
  // Obtener clientes registrados
  async getRegisteredClients(): Promise<ApiResponse<ClientData[]>> {
    const response = await fetch(`${API_BASE_URL}/clients/registered`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Servicios de usuarios
export const userService = {
  // Crear administrador
  async createAdmin(email: string, password: string, fullName: string): Promise<ApiResponse<{ userId: number }>> {
    const response = await fetch(`${API_BASE_URL}/users/admin`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    
    return handleResponse(response);
  },
};

// Servicio de salud del servidor
export const healthService = {
  async check(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/health`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Función para probar la conectividad con el backend
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await healthService.check();
    return response.success;
  } catch (error) {
    console.error('Error conectando con el backend:', error);
    return false;
  }
}

export default {
  authService,
  clientService,
  userService,
  healthService,
  testBackendConnection,
};
