// Nueva versión de stored procedures que usa el backend real según especificaciones exactas

// URLs de las APIs - actualizadas para el flujo exacto de 4 pasos
const API_BASE_URL = 'http://localhost:8080/api';

const API_ENDPOINTS = {
  // Flujo de 4 pasos exacto
  validateEmail: `${API_BASE_URL}/auth/validate-email`,
  registerUserInfo: `${API_BASE_URL}/auth/register-user-info`,
  verifySecurityCode: `${API_BASE_URL}/auth/verify-security-code`,
  registerPassword: `${API_BASE_URL}/auth/register-password`,
  
  // Login
  login: `${API_BASE_URL}/auth/login`,
  
  // Admin
  registerAdminUser: `${API_BASE_URL}/auth/register-admin-user`,
  
  // Gestión
  clients: `${API_BASE_URL}/clients`,
  stats: `${API_BASE_URL}/stats`
} as const;

// Interfaces para mantener compatibilidad exacta con las especificaciones
export interface SPResponse {
  response?: string;
  msg: string;
  allow?: number;
  codigo_seguridad?: string;
}

export interface SPLoginResponse {
  allow?: number;
  msg?: string;
  usuario?: {
    usuario_id: number;
    nombre_completo: string;
    correo: string;
    telefono: string;
    rol: string;
  };
}

export interface ClientData {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  address: string | null;
  companyName: string | null;
  isActive: boolean;
  createdAt: string;
}

// SP_VALIDAR_CORREO_USUARIO - Validar correo
export async function SP_VALIDAR_CORREO_USUARIO(correo: string): Promise<SPResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.validateEmail, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo }),
    });

    if (!response.ok) {
      return {
        msg: 'Error de conexión al servidor',
        allow: 0
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error en SP_VALIDAR_CORREO_USUARIO:', error);
    return {
      msg: 'Error de conexión',
      allow: 0
    };
  }
}

// SP_REGISTRAR_USUARIO_CLIENTE - Registro de cliente
export async function SP_REGISTRAR_USUARIO_CLIENTE(
  nombre_completo: string,
  correo: string,
  telefono: string
): Promise<SPResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.registerUserInfo, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre_completo, correo, telefono }),
    });

    if (!response.ok) {
      return {
        msg: 'Error de conexión al servidor',
        allow: 0
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error en SP_REGISTRAR_USUARIO_CLIENTE:', error);
    return {
      msg: 'Error de conexión',
      allow: 0
    };
  }
}

// SP_VERIFICAR_CODIGO_SEGURIDAD - Verificar código
export async function SP_VERIFICAR_CODIGO_SEGURIDAD(
  correo: string,
  codigo_seguridad: string
): Promise<SPResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.verifySecurityCode, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo, codigo_seguridad }),
    });

    if (!response.ok) {
      return {
        msg: 'Error de conexión al servidor',
        allow: 0
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error en SP_VERIFICAR_CODIGO_SEGURIDAD:', error);
    return {
      msg: 'Error de conexión',
      allow: 0
    };
  }
}

// SP_REGISTRAR_PASSWORD - Registrar contraseña final
export async function SP_REGISTRAR_PASSWORD(
  correo: string,
  password: string
): Promise<SPResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.registerPassword, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo, password }),
    });

    if (!response.ok) {
      return {
        msg: 'Error de conexión al servidor',
        allow: 0
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error en SP_REGISTRAR_PASSWORD:', error);
    return {
      msg: 'Error de conexión',
      allow: 0
    };
  }
}

// SP_LOGIN - Login de usuario
export async function SP_LOGIN(correo: string, password: string): Promise<SPLoginResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo, password }),
    });

    if (!response.ok) {
      return {
        allow: 0,
        msg: 'Error de conexión al servidor'
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error en SP_LOGIN:', error);
    return {
      allow: 0,
      msg: 'Error de conexión'
    };
  }
}

// SP_REGISTRAR_USUARIO_PANEL_ADMIN - Registrar desde panel admin
export async function SP_REGISTRAR_USUARIO_PANEL_ADMIN(
  nombre_completo: string,
  correo: string,
  telefono: string,
  rol: string,
  registradoPor?: number
): Promise<SPResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.registerAdminUser, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre_completo, correo, telefono, rol, registradoPor }),
    });

    if (!response.ok) {
      return {
        msg: 'Error de conexión al servidor',
        allow: 0
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error en SP_REGISTRAR_USUARIO_PANEL_ADMIN:', error);
    return {
      msg: 'Error de conexión',
      allow: 0
    };
  }
}

// SP_OBTENER_CLIENTES_REGISTRADOS - Obtener clientes
export async function SP_OBTENER_CLIENTES_REGISTRADOS(): Promise<ClientData[]> {
  try {
    const response = await fetch(API_ENDPOINTS.clients, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error
      ('Error obteniendo clientes:', response.status);
      return [];
    }

    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error en SP_OBTENER_CLIENTES_REGISTRADOS:', error);
    return [];
  }
}
