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
      const response = await fetch(`${API_BASE}/users/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          data: data.data,
          count: data.count
        };
      } else {
        return {
          success: false,
          message: data.message || 'Error al obtener usuarios'
        };
      }
    } catch (error) {
      // error de conexión con servidor
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
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Usuario no encontrado'
        };
      }
    } catch (error) {
      // error de conexión
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
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosUsuario),
      });

      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          message: data.message
        };
      } else {
        return {
          success: false,
          message: data.message || 'Error al editar usuario'
        };
      }
    } catch (error) {
      // error de conexión
      return {
        success: false,
        message: 'Error de conexión con el servidor'
      };
    }
  }
}

export const usuariosService = new UsuariosService();
export default usuariosService;