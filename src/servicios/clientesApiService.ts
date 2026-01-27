/**
 * 🌐 API SERVICE PARA CLIENTES
 * Maneja todas las operaciones CRUD con el backend usando SQL Server
 */

const API_BASE_URL = 'http://localhost:8080/api'; // Usando server-minimal.js en puerto 8080

export interface Cliente {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  registration_date: string;
  last_visit: string;
  total_visits: number;
  total_spent: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ClienteNuevo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
}

export interface ClientStats {
  totalRecords: number;
  activeClients: number;
  inactiveClients: number;
  totalSpent: number;
  averageVisits: number;
}

/**
 * 🌐 FUNCIONES DE API PARA CLIENTES
 */

// 📋 Obtener todos los clientes
export async function obtenerClientes(): Promise<Cliente[]> {
  try {
    console.log('API: Obteniendo todos los clientes...');
    const response = await fetch(`${API_BASE_URL}/clients/registered`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result: ApiResponse<Cliente[]> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Error obteniendo clientes');
    }
    console.log(`API: ${result.data.length} clientes obtenidos`);
    return result.data;
  } catch (error) {
    console.error('API Error obteniendo clientes:', error);
    throw error;
  }
}

// 🔍 Obtener un cliente específico
export async function obtenerCliente(id: string): Promise<Cliente> {
  try {
    console.log(`API: Obteniendo cliente ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<Cliente> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Cliente no encontrado');
    }
    
    console.log(`API: Cliente ${result.data.name} obtenido`);
    return result.data;
    
  } catch (error) {
    console.error(`API Error obteniendo cliente ${id}:`, error);
    throw error;
  }
}

// ➕ Crear nuevo cliente
export async function crearCliente(clienteData: ClienteNuevo): Promise<Cliente> {
  try {
    console.log('API: Creando nuevo cliente...', clienteData.name);
    
    // Obtener usuario_id del localStorage
    const usuario_id = localStorage.getItem('usuario_id');
    
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...clienteData,
        usuario_id: usuario_id ? parseInt(usuario_id) : undefined
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<Cliente> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Error creando cliente');
    }
    
    console.log(`API: Cliente ${result.data.name} creado (${result.data.id})`);
    return result.data;
    
  } catch (error) {
    console.error('API Error creando cliente:', error);
    throw error;
  }
}

// 📝 Actualizar cliente
export async function actualizarCliente(id: string, updates: Partial<ClienteNuevo>): Promise<Cliente> {
  try {
    console.log(`API: Actualizando cliente ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<Cliente> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Error actualizando cliente');
    }
    
    console.log(`API: Cliente ${result.data.name} actualizado`);
    return result.data;
    
  } catch (error) {
    console.error(`API Error actualizando cliente ${id}:`, error);
    throw error;
  }
}

// 🗑️ Eliminar cliente
export async function eliminarCliente(id: string): Promise<void> {
  try {
    console.log(`API: Eliminando cliente ${id}...`);
    
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error eliminando cliente');
    }
    
    console.log(`API: Cliente ${id} eliminado`);
    
  } catch (error) {
    console.error(`API Error eliminando cliente ${id}:`, error);
    throw error;
  }
}

// 🔍 Buscar clientes
export async function buscarClientes(filtros: Record<string, string>): Promise<Cliente[]> {
  try {
    console.log('API: Buscando clientes con filtros...', filtros);
    
    const queryParams = new URLSearchParams(filtros).toString();
    const response = await fetch(`${API_BASE_URL}/clients/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<Cliente[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Error buscando clientes');
    }
    
    console.log(`API: ${result.data.length} clientes encontrados`);
    return result.data;
    
  } catch (error) {
    console.error('API Error buscando clientes:', error);
    throw error;
  }
}

// 📊 Obtener estadísticas de clientes
export async function obtenerEstadisticasClientes(): Promise<ClientStats> {
  try {
    console.log('API: Obteniendo estadísticas de clientes...');
    
    const response = await fetch(`${API_BASE_URL}/clients/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: ApiResponse<ClientStats> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Error obteniendo estadísticas');
    }
    
    console.log('API: Estadísticas obtenidas');
    return result.data;
    
  } catch (error) {
    console.error('API Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * 🔄 FUNCIONES DE COMPATIBILIDAD CON CÓDIGO EXISTENTE
 */

// Para mantener compatibilidad con BaseDatosJS.ts
export async function obtenerClientesActualizados(): Promise<Cliente[]> {
  try {
    return await obtenerClientes();
  } catch (error) {
    console.warn('⚠️ Error obteniendo clientes de API, retornando array vacío:', error);
    return [];
  }
}

// Para mantener compatibilidad con el contexto existente
export async function obtenerDatosClientes() {
  try {
    const [clientes, stats] = await Promise.all([
      obtenerClientes(),
      obtenerEstadisticasClientes().catch(() => null)
    ]);
    
    return {
      clientes,
      total: clientes.length,
      activos: clientes.filter(c => c.status === 'active').length,
      inactivos: clientes.filter(c => c.status === 'inactive').length,
      stats
    };
  } catch (error) {
    console.warn('⚠️ Error obteniendo datos de clientes:', error);
    return {
      clientes: [],
      total: 0,
      activos: 0,
      inactivos: 0,
      stats: null
    };
  }
}