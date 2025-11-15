// Servicio para gestión de clientes (usuarios con rol Cliente)

const API_BASE = 'http://localhost:8080/api';

export interface Cliente {
  usuario_id: number;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: string;
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
      console.log('👥 Obteniendo lista de clientes desde SP_OBTENER_USUARIOS...');
      
      const response = await fetch(`${API_BASE}/users/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📝 Respuesta completa del servidor:', data);

      if (data.success && data.data) {
        // Filtrar solo usuarios con rol "Cliente"
        const todosUsuarios = Array.isArray(data.data) ? data.data : [data.data];
        const clientes = todosUsuarios.filter((usuario: any) => usuario.rol === 'Cliente');
        
        console.log(`✅ ${clientes.length} clientes obtenidos de ${todosUsuarios.length} usuarios totales`);
        
        return {
          success: true,
          data: clientes,
          count: clientes.length
        };
      } else {
        console.log('❌ Error del servidor:', data.message);
        return {
          success: false,
          message: data.message || 'Error al obtener clientes'
        };
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
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
      console.log('👤 Obteniendo cliente ID:', clienteId);
      
      const response = await fetch(`${API_BASE}/users/${clienteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📝 Respuesta del servidor:', data);

      if (data.success && data.data) {
        // Verificar que sea un cliente
        if (data.data.rol === 'Cliente') {
          console.log('✅ Cliente obtenido:', data.data.nombre_completo);
          return {
            success: true,
            data: data.data
          };
        } else {
          console.log('❌ El usuario no es un cliente, rol:', data.data.rol);
          return {
            success: false,
            message: 'El usuario especificado no es un cliente'
          };
        }
      } else {
        console.log('❌ Cliente no encontrado:', data.message);
        return {
          success: false,
          message: data.message || 'Cliente no encontrado'
        };
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
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
      address: '', // No tenemos dirección en el nuevo sistema
      password: '', // No exponemos contraseñas
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