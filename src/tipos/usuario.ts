// Tipos relacionados con usuarios

export interface Usuario {
  usuario_id: number;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: string;
}

export interface UsuarioFormData {
  nombre_completo: string;
  correo: string;
  telefono: string;
}

export interface UsuarioLogin {
  correo: string;
  password: string;
}

export interface UsuarioRegistro {
  nombre_completo: string;
  correo: string;
  telefono: string;
  codigo_seguridad?: string;
  password?: string;
}