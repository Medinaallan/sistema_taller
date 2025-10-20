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
  try {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Error HTTP: ${response.status}`,
        error: `HTTP ${response.status}`,
        data: data
      };
    }
    
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Error al procesar respuesta del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
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

// Servicio para gestión de servicios
export const servicesService = {
  async getAll(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/services`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
  
  async create(serviceData: { 
    nombre: string; 
    descripcion?: string; 
    precio: number; 
    duracion?: string; 
    categoria?: string; 
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/services`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    
    return handleResponse(response);
  },
  
  async update(id: string, serviceData: Partial<{ 
    nombre: string; 
    descripcion: string; 
    precio: number; 
    duracion: string; 
    categoria: string; 
  }>): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/services/${id}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
    
    return handleResponse(response);
  },
  
  async delete(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/services/${id}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },
};

// Servicio para gestión de productos/inventario
export const productsService = {
  async getAll(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
  
  async create(productData: { 
    name: string; 
    description?: string; 
    brand?: string;
    model?: string;
    price: number; 
    cost?: number;
    stock: number;
    supplierId?: string;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(productData),
    });
    
    return handleResponse(response);
  },
  
  async update(id: string, productData: Partial<{ 
    name: string; 
    description: string; 
    brand: string;
    model: string;
    price: number; 
    cost: number;
    stock: number;
    supplierId: string;
  }>): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    
    return handleResponse(response);
  },
  
  async delete(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },
};

// Servicio para gestión de vehículos
export const vehiclesService = {
  async getAll(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
  
  async create(vehicleData: { 
    clienteId: string; 
    marca: string; 
    modelo: string; 
    año: number; 
    placa: string; 
    color: string; 
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
    
    return handleResponse(response);
  },
  
  async update(id: string, vehicleData: Partial<{ 
    clienteId: string; 
    marca: string; 
    modelo: string; 
    año: number; 
    placa: string; 
    color: string; 
  }>): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
    
    return handleResponse(response);
  },
  
  async delete(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },
};

// Servicio para gestión de citas
export const appointmentsService = {
  async getAll(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
  
  async create(appointmentData: { 
    clienteId: string; 
    vehiculoId: string; 
    fecha: string; 
    hora: string; 
    servicio: string; 
    estado?: string;
    notas?: string;
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    
    return handleResponse(response);
  },
  
  async update(id: string, appointmentData: Partial<{ 
    clienteId: string; 
    vehiculoId: string; 
    fecha: string; 
    hora: string; 
    servicio: string; 
    estado: string;
    notas: string;
  }>): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
    
    return handleResponse(response);
  },
  
  async delete(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },
  
  async getById(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Servicio para gestión de cotizaciones
export const quotationsService = {
  async getAll(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/quotations`, {
      ...fetchConfig,
      method: 'GET',
    });
    
    return handleResponse(response);
  },
  
  async create(quotationData: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/quotations`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(quotationData),
    });
    
    return handleResponse(response);
  },
  
  async update(id: string, quotationData: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify(quotationData),
    });
    
    return handleResponse(response);
  },
  
  async delete(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
      ...fetchConfig,
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },
  
  async getById(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
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
  servicesService,
  productsService,
  vehiclesService,
  appointmentsService,
  quotationsService,
  testBackendConnection,
};
