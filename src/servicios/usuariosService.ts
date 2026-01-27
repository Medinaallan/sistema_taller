// Servicio para gestión de usuarios
import { Usuario } from '../tipos/usuario';

const API_BASE = 'http://localhost:8080/api';

export interface UsuarioResponse {
  success: boolean;
  data?: Usuario | Usuario[];
  count?: number;
  message?: string;
  error?: string;
}

class UsuariosService {
  /**
   * Obtener todos los usuarios
   */
  async obtenerUsuarios(): Promise<UsuarioResponse> {
    try {
      console.log(' Obteniendo lista de usuarios...');
      
      const response = await fetch(`${API_BASE}/users/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success) {
        console.log(` ${data.count} usuarios obtenidos`);
        return {
          success: true,
          data: data.data,
          count: data.count
        };
      } else {
        console.log('Error del servidor:', data.message);
        return {
          success: false,
          message: data.message || 'Error al obtener usuarios'
        };
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Obtener un usuario por ID
   */
  async obtenerUsuario(userId: number): Promise<UsuarioResponse> {
    try {
      console.log('Obteniendo usuario ID:', userId);
      
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success) {
        console.log('Usuario obtenido:', data.data.nombre_completo);
        return {
          success: true,
          data: data.data
        };
      } else {
        console.log('Usuario no encontrado:', data.message);
        return {


            
          success: false,
          message: data.message || 'Usuario no encontrado'
        };
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Editar usuario
   */
  async editarUsuario(userId: number, datosUsuario: {
    nombre_completo: string;
    correo: string;
    telefono: string;
  }): Promise<UsuarioResponse> {
    try {
      console.log('Editando usuario ID:', userId, datosUsuario);
      
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosUsuario),
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success) {
        console.log('Usuario editado exitosamente');
        return {
          success: true,
          message: data.message
        };
      } else {
        console.log('Error editando usuario:', data.message);
        return {
          success: false,
          message: data.message || 'Error al editar usuario'
        };
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }
}

export const usuariosService = new UsuariosService();
export default usuariosService;