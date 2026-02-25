// Servicio para gestión de clientes (usuarios con rol Cliente)

const API_BASE = 'http://localhost:8080/api';

export interface Cliente {
  usuario_id: number;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: string;
  rtn?: string;
}

export interface ClienteResponse {
  success: boolean;
  data?: Cliente | Cliente[];
  count?: number;
  message?: string;
  error?: string;
}

class ClientesService {
  /**
   * Obtener todos los clientes (usuarios con rol "Cliente")
   */
  async obtenerClientes(): Promise<ClienteResponse> {
    try {
      const response = await fetch(`${API_BASE}/users/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Filtrar solo usuarios con rol "Cliente"
        const todosUsuarios = Array.isArray(data.data) ? data.data : [data.data];
        const clientes = todosUsuarios.filter((usuario: any) => usuario.rol === 'Cliente');
        
        return {
          success: true,
          data: clientes,
          count: clientes.length
        };
      } else {
        return {
          success: false,
          message: data.message || 'Error al obtener clientes'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Obtener un cliente específico por ID
   */
  async obtenerCliente(clienteId: number): Promise<ClienteResponse> {
    try {
      
      const response = await fetch(`${API_BASE}/users/${clienteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Verificar que sea un cliente
        if (data.data.rol === 'Cliente') {
          return {
            success: true,
            data: data.data
          };
        } else {
          return {
            success: false,
            message: 'El usuario especificado no es un cliente'
          };
        }
      } else {
        return {
          success: false,
          message: data.message || 'Cliente no encontrado'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Convertir Cliente a formato compatible con el sistema existente
   */
  convertirAFormatoLegacy(cliente: Cliente) {
    return {
      id: cliente.usuario_id.toString(),
      name: cliente.nombre_completo,
      email: cliente.correo,
      phone: cliente.telefono,
      rtn: cliente.rtn || '',
      address: '', 
      password: '', 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtener clientes en formato legacy para compatibilidad
   */
  async obtenerClientesLegacy() {
    const resultado = await this.obtenerClientes();
    
    if (resultado.success && resultado.data) {
      const clientes = Array.isArray(resultado.data) ? resultado.data : [resultado.data];
      return {
        success: true,
        data: clientes.map(cliente => this.convertirAFormatoLegacy(cliente)),
        count: clientes.length
      };
    }
    
    return resultado;
  }
}

export const clientesService = new ClientesService();
export default clientesService;