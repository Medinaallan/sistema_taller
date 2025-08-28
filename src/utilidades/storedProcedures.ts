// ====================================
// SIMULACIÓN DE PROCEDIMIENTOS ALMACENADOS
// Sistema que simula los SPs de la base de datos
// ====================================

import type { User } from '../tipos';
import { generateId } from './globalMockDatabase';
import { 
  agregarCliente, 
  obtenerTodosLosUsuarios 
} from './BaseDatosJS';

// Tipos para los responses de los procedimientos
export interface SPResponse {
  response: string;
  msg: string;
  allow?: 0 | 1;
  codigo_seguridad?: string;
  usuario?: {
    usuario_id: string;
    nombre_completo: string;
    correo: string;
    telefono: string;
    rol: string;
  };
}

// Almacén temporal para códigos de seguridad (simula caché/memoria)
const securityCodes: Record<string, { 
  code: string; 
  timestamp: number;
  userData?: { nombre_completo: string; telefono: string; }
}> = {};

// Obtener usuarios (admin/empleados + clientes) desde el nuevo sistema
function getUsers(): User[] {
  return obtenerTodosLosUsuarios();
}

// Guardar usuarios en localStorage (solo para admin/empleados)
function saveUsers(users: User[]): void {
  try {
    localStorage.setItem('tallerApp_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
}

// Generar código de seguridad de 6 dígitos
function generateSecurityCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ====================================
// PROCEDIMIENTOS ALMACENADOS SIMULADOS
// ====================================

/**
 * SP_REGISTRAR_USUARIO_PANEL_ADMIN
 * Registra usuario desde el panel de administración
 */
export async function SP_REGISTRAR_USUARIO_PANEL_ADMIN(
  nombre_completo: string,
  correo: string,
  telefono: string,
  rol: string,
  registradoPor?: number
): Promise<SPResponse> {
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const users = getUsers();
  
  // Verificar si el correo ya existe
  const existingUser = users.find(user => user.email.toLowerCase() === correo.toLowerCase());
  if (existingUser) {
    return {
      response: '409 CONFLICT',
      msg: 'Ya existe un usuario con este correo electrónico',
      allow: 0
    };
  }
  
  // Crear nuevo usuario
  const newUser: User = {
    id: generateId(),
    email: correo,
    password: 'temp123', // Contraseña temporal que deberá cambiar
    role: rol as User['role'],
    name: nombre_completo,
    phone: telefono,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Log quien registró (si se proporciona)
  if (registradoPor) {
    console.log(`Usuario registrado por: ${registradoPor}`);
  }
  
  return {
    response: '200 OK',
    msg: 'Usuario registrado con éxito',
    allow: 1
  };
}

/**
 * SP_REGISTRAR_USUARIO_CLIENTE
 * Registra cliente desde login (primera fase)
 */
export async function SP_REGISTRAR_USUARIO_CLIENTE(
  nombre_completo: string,
  correo: string,
  telefono: string
): Promise<SPResponse> {
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const users = getUsers();
  
  // Verificar si el correo ya existe
  const existingUser = users.find(user => user.email.toLowerCase() === correo.toLowerCase());
  if (existingUser) {
    return {
      response: '409 CONFLICT',
      msg: 'Ya existe un usuario con este correo electrónico',
      allow: 0
    };
  }
  
  // Generar código de seguridad
  const codigo_seguridad = generateSecurityCode();
  
  // Guardar código temporalmente (5 minutos de validez)
  // También guardamos los datos del usuario temporalmente
  securityCodes[correo.toLowerCase()] = {
    code: codigo_seguridad,
    timestamp: Date.now(),
    userData: { nombre_completo, telefono }
  };
  
  // Aquí normalmente se enviaría por email/SMS, pero lo simulamos
  console.log(`Código de seguridad para ${correo}: ${codigo_seguridad}`);
  
  return {
    response: '200 OK',
    msg: 'Usuario registrado con éxito. Se ha enviado un código de seguridad a su correo.',
    codigo_seguridad,
    allow: 1
  };
}

/**
 * SP_VALIDAR_CORREO_USUARIO
 * Valida si un correo puede ser usado
 */
export async function SP_VALIDAR_CORREO_USUARIO(correo: string): Promise<SPResponse> {
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const users = getUsers();
  
  // Verificar si el correo ya existe
  const existingUser = users.find(user => user.email.toLowerCase() === correo.toLowerCase());
  
  if (existingUser) {
    return {
      response: '409 CONFLICT',
      msg: 'Este correo electrónico ya está registrado',
      allow: 0
    };
  }
  
  // Validar formato de email básico
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(correo)) {
    return {
      response: '400 BAD REQUEST',
      msg: 'El formato del correo electrónico no es válido',
      allow: 0
    };
  }
  
  return {
    response: '200 OK',
    msg: 'Correo electrónico disponible',
    allow: 1
  };
}

/**
 * SP_VERIFICAR_CODIGO_SEGURIDAD
 * Verifica el código de seguridad enviado
 */
export async function SP_VERIFICAR_CODIGO_SEGURIDAD(
  correo: string,
  codigo_seguridad: string
): Promise<SPResponse> {
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const storedCode = securityCodes[correo.toLowerCase()];
  
  if (!storedCode) {
    return {
      response: '404 NOT FOUND',
      msg: 'No se encontró código de seguridad para este correo o ha expirado',
      allow: 0
    };
  }
  
  // Verificar si el código ha expirado (5 minutos)
  const fiveMinutesInMs = 5 * 60 * 1000;
  if (Date.now() - storedCode.timestamp > fiveMinutesInMs) {
    delete securityCodes[correo.toLowerCase()];
    return {
      response: '408 TIMEOUT',
      msg: 'El código de seguridad ha expirado. Solicite uno nuevo.',
      allow: 0
    };
  }
  
  // Verificar código
  if (storedCode.code !== codigo_seguridad) {
    return {
      response: '401 UNAUTHORIZED',
      msg: 'Código de seguridad incorrecto',
      allow: 0
    };
  }
  
  return {
    response: '200 OK',
    msg: 'Código de seguridad verificado correctamente',
    allow: 1
  };
}

/**
 * SP_REGISTRAR_PASSWORD
 * Registra la contraseña final del usuario cliente
 */
export async function SP_REGISTRAR_PASSWORD(
  correo: string,
  password: string
): Promise<SPResponse> {
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verificar que se haya verificado el código previamente
  const storedCode = securityCodes[correo.toLowerCase()];
  if (!storedCode) {
    return {
      response: '403 FORBIDDEN',
      msg: 'Debe verificar el código de seguridad primero',
      allow: 0
    };
  }
  
  // Obtener datos del usuario guardados temporalmente
  const userData = storedCode.userData || { nombre_completo: 'Cliente', telefono: '' };
  
  // Crear el usuario cliente final
  const newUser: User = {
    id: generateId(),
    email: correo,
    password: password,
    role: 'client',
    name: userData.nombre_completo,
    phone: userData.telefono,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Guardar cliente en BaseDatosJS.ts
  agregarCliente(newUser);
  
  // Limpiar código de seguridad usado
  delete securityCodes[correo.toLowerCase()];
  
  return {
    response: '200 OK',
    msg: 'Contraseña registrada con éxito. Ya puede iniciar sesión.',
    allow: 1
  };
}

/**
 * SP_LOGIN
 * Autentica usuario en el sistema
 */
export async function SP_LOGIN(
  correo: string,
  password: string
): Promise<SPResponse> {
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const users = getUsers();
  
  // Buscar usuario
  const user = users.find(
    u => u.email.toLowerCase() === correo.toLowerCase() && u.password === password
  );
  
  if (!user) {
    return {
      response: '401 UNAUTHORIZED',
      msg: 'Usuario o contraseña incorrectos',
      allow: 0
    };
  }
  
  return {
    response: '200 OK',
    msg: 'Inicio de sesión exitoso',
    allow: 1,
    usuario: {
      usuario_id: user.id,
      nombre_completo: user.name,
      correo: user.email,
      telefono: user.phone || '',
      rol: user.role
    }
  };
}
