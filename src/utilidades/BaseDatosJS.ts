// ====================================
// BASE DE DATOS TYPESCRIPT - CLIENTES
// Sistema de almacenamiento de clientes registrados en localStorage
// ====================================

import type { User } from '../tipos';

// Clave para localStorage específica para clientes
const CLIENTES_STORAGE_KEY = 'tallerApp_clientesRegistrados';

// Función para cargar clientes desde localStorage
function cargarClientesDesdeStorage(): User[] {
  try {
    const clientesGuardados = localStorage.getItem(CLIENTES_STORAGE_KEY);
    if (clientesGuardados) {
      const clientes = JSON.parse(clientesGuardados);
      // Convertir fechas de string a Date
      return clientes.map((cliente: any) => ({
        ...cliente,
        createdAt: new Date(cliente.createdAt),
        updatedAt: new Date(cliente.updatedAt)
      }));
    }
  } catch (error) {
    console.error('Error al cargar clientes desde localStorage:', error);
  }
  return [];
}

// Función para guardar clientes en localStorage
function guardarClientesEnStorage(clientes: User[]): void {
  try {
    localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(clientes));
    console.log('Clientes guardados en localStorage:', clientes.length);
  } catch (error) {
    console.error('Error al guardar clientes en localStorage:', error);
  }
}

// Array de clientes registrados (se carga desde localStorage)
export let clientesRegistrados: User[] = cargarClientesDesdeStorage();

// Función para agregar un nuevo cliente
export function agregarCliente(nuevoCliente: User): User {
  clientesRegistrados.push(nuevoCliente);
  guardarClientesEnStorage(clientesRegistrados);
  console.log('Cliente agregado a BaseDatosJS:', nuevoCliente);
  console.log('Total clientes registrados:', clientesRegistrados.length);
  return nuevoCliente;
}

// Función para obtener todos los clientes (recarga desde storage)
export function obtenerClientes(): User[] {
  clientesRegistrados = cargarClientesDesdeStorage();
  return [...clientesRegistrados];
}

// Función para buscar cliente por email (recarga desde storage)
export function buscarClientePorEmail(email: string): User | undefined {
  clientesRegistrados = cargarClientesDesdeStorage();
  return clientesRegistrados.find(cliente => 
    cliente.email.toLowerCase() === email.toLowerCase()
  );
}

// Función para buscar cliente por email y password (recarga desde storage)
export function autenticarCliente(email: string, password: string): User | undefined {
  clientesRegistrados = cargarClientesDesdeStorage();
  return clientesRegistrados.find(cliente => 
    cliente.email.toLowerCase() === email.toLowerCase() && 
    cliente.password === password
  );
}

// Función para actualizar un cliente
export function actualizarCliente(id: string, datosActualizados: Partial<User>): User | null {
  clientesRegistrados = cargarClientesDesdeStorage();
  const index = clientesRegistrados.findIndex(cliente => cliente.id === id);
  if (index !== -1) {
    clientesRegistrados[index] = { 
      ...clientesRegistrados[index], 
      ...datosActualizados,
      updatedAt: new Date()
    };
    guardarClientesEnStorage(clientesRegistrados);
    console.log('Cliente actualizado en BaseDatosJS:', clientesRegistrados[index]);
    return clientesRegistrados[index];
  }
  return null;
}

// Función para eliminar un cliente
export function eliminarCliente(id: string): User | null {
  clientesRegistrados = cargarClientesDesdeStorage();
  const index = clientesRegistrados.findIndex(cliente => cliente.id === id);
  if (index !== -1) {
    const clienteEliminado = clientesRegistrados.splice(index, 1)[0];
    guardarClientesEnStorage(clientesRegistrados);
    console.log('Cliente eliminado de BaseDatosJS:', clienteEliminado);
    return clienteEliminado;
  }
  return null;
}

// Función para obtener estadísticas
export function obtenerEstadisticasClientes() {
  const clientes = cargarClientesDesdeStorage();
  return {
    total: clientes.length,
    fechaUltimoRegistro: clientes.length > 0 
      ? Math.max(...clientes.map(c => c.createdAt.getTime()))
      : null
  };
}

// Función para limpiar todos los clientes (solo para testing)
export function limpiarTodosLosClientes(): void {
  clientesRegistrados = [];
  guardarClientesEnStorage(clientesRegistrados);
  console.log('Todos los clientes han sido eliminados de BaseDatosJS');
}

// Función para obtener todos los usuarios (admin/empleados + clientes)
export function obtenerTodosLosUsuarios(): User[] {
  // Obtener usuarios admin/empleados desde localStorage
  let adminUsers: User[] = [];
  try {
    const savedUsers = localStorage.getItem('tallerApp_users');
    if (savedUsers) {
      adminUsers = JSON.parse(savedUsers);
    }
  } catch (error) {
    console.error('Error loading admin users from localStorage:', error);
  }
  
  // Si no hay usuarios admin, usar los por defecto
  if (adminUsers.length === 0) {
    adminUsers = [
      {
        id: 'user-admin-001',
        email: 'admin@taller.com',
        password: 'admin123',
        role: 'admin',
        name: 'ALLAN MEDINA',
        phone: '+1234567890',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'user-recep-001',
        email: 'recep@taller.com',
        password: 'recep123',
        role: 'receptionist',
        name: 'ANDRE VARGAS',
        phone: '+1234567891',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'user-mec-001',
        email: 'mecanico@taller.com',
        password: 'mec123',
        role: 'mechanic',
        name: 'Mecánico Principal',
        phone: '+1234567892',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }
    ];
  }
  
  // Obtener clientes desde localStorage específico
  const clientesActuales = cargarClientesDesdeStorage();
  
  // Combinar usuarios admin/empleados con clientes
  return [...adminUsers, ...clientesActuales];
}
