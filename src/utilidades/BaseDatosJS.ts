// ====================================
// BASE DE DATOS TYPESCRIPT - CLIENTES
// Sistema de almacenamiento de clientes usando SP_OBTENER_USUARIOS
// ====================================

import type { Client } from '../tipos';

const API_BASE_URL = 'http://localhost:8080/api';

// Array de clientes registrados (cargado desde base de datos)
export let clientesRegistrados: Client[] = [];

// Función para cargar clientes desde base de datos vía SP_OBTENER_USUARIOS
async function cargarClientesDB(): Promise<Client[]> {
  try {
    console.log(' GET /api/clients/registered - Obteniendo todos los clientes desde BD');
    console.log(' Usando SP_OBTENER_USUARIOS para cargar clientes...');
    
    const response = await fetch(`${API_BASE_URL}/users/list`);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log(' Respuesta de API usuarios:', data);
    
    if (data.success && data.data) {
      console.log(' API exitosa, procesando', data.data.length, 'usuarios');
      console.log(' Primeros usuarios:', JSON.stringify(data.data.slice(0, 3), null, 2));
      
      // Filtrar solo usuarios con rol "Cliente" y convertir al formato Client
      const clientesConvertidos = data.data
        .filter((usuario: any) => {
          const esCliente = usuario.rol === 'Cliente';
          if (!esCliente) {
            console.log(` Omitiendo ${usuario.nombre_completo} (rol: ${usuario.rol})`);
          }
          return esCliente;
        })
        .map((usuario: any) => {
          const clienteConvertido = {
            id: usuario.usuario_id.toString(),
            name: usuario.nombre_completo,
            email: usuario.correo,
            phone: usuario.telefono,
            address: '', // Los usuarios no tienen dirección en el SP
            password: '', // No exponemos contraseñas
            vehicles: [], // Los vehículos se cargarían por separado
            createdAt: new Date(), // Fecha genérica
            updatedAt: new Date()
          };
          console.log(`    Cliente convertido: ${clienteConvertido.name} (${clienteConvertido.email})`);
          return clienteConvertido;
        });
      
      console.log(' Clientes (rol Cliente) convertidos:', clientesConvertidos.length);
      return clientesConvertidos;
    } else {
      console.warn(' API no exitosa o sin datos');
      return [];
    }
  } catch (error) {
    console.error(' Error cargando clientes desde API usuarios:', error);
    return [];
  }
}

// Función para guardar cliente en base de datos vía API
async function guardarCliente(cliente: Client): Promise<boolean> {
  try {
    console.log(' Guardando cliente en base de datos:', cliente.name);
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: cliente.name,           // Campo correcto: 'name'
        email: cliente.email,         // Campo correcto: 'email'
        phone: cliente.phone,         // Campo correcto: 'phone'
        address: cliente.address || '', // Campo correcto: 'address'
        password: cliente.password   // Se mapea a 'password_hash' en el backend
      })
    });
    
    if (!response.ok) {
      console.error(' Error HTTP al guardar cliente:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log(' Respuesta del servidor:', data);
    
    if (data.success) {
      console.log(' Cliente guardado exitosamente en CSV:', data.data?.name);
      return true;
    } else {
      console.error(' Error guardando cliente:', data.error);
      return false;
    }
  } catch (error) {
      console.error(' Error en guardarCliente:', error);
    return false;
  }
}

// Función para inicializar clientes desde base de datos
export async function inicializarClientes(): Promise<void> {
  clientesRegistrados = await cargarClientesDB();
  
  // Configurar recarga automática cada 30 segundos
  setInterval(async () => {
    try {
      const clientesActualizados = await cargarClientesDB();
      if (clientesActualizados.length !== clientesRegistrados.length) {
        console.log(`Cambios detectados en base de datos: ${clientesActualizados.length} clientes`);
        clientesRegistrados = clientesActualizados;
      }
    } catch (error) {
      console.error('Error en recarga automática:', error);
    }
  }, 30000); // 30 segundos
}

// Función para recargar clientes desde base de datos (para refrescar cambios manuales)
export async function recargarClientes(): Promise<void> {
  console.log('Recargando clientes desde base de datos...');
  clientesRegistrados = await cargarClientesDB();
}

// Función para obtener todos los clientes (con opción de recargar)
export async function obtenerClientes(recargar: boolean = true): Promise<Client[]> {
  if (recargar) {
    // Recargar datos frescos de la base de datos
    clientesRegistrados = await cargarClientesDB();
  }
  return [...clientesRegistrados];
}

// Función para obtener todos los clientes (versión síncrona - datos en memoria)
export function obtenerClientesEnMemoria(): Client[] {
  return [...clientesRegistrados];
}

// Función para obtener todos los clientes con recarga forzada
export async function obtenerClientesActualizados(): Promise<Client[]> {
  await recargarClientes();
  return [...clientesRegistrados];
}

// Función para agregar un nuevo cliente
export async function agregarCliente(nuevoCliente: Client): Promise<Client | null> {
  console.log(' Agregando nuevo cliente:', nuevoCliente.name);
  
  // Guardar en base de datos vía API
  const guardado = await guardarCliente(nuevoCliente);
  
  if (guardado) {
    // Recargar datos desde la base de datos para obtener el cliente con ID generado
    await recargarClientes();
    
    // Buscar el cliente recién creado por email
    const clienteCreado = clientesRegistrados.find(c => c.email === nuevoCliente.email);
    
    console.log(' Cliente agregado exitosamente');
    console.log(' Total clientes registrados:', clientesRegistrados.length);
    return clienteCreado || nuevoCliente;
  } else {
    console.error(' Error al agregar cliente en base de datos');
    return null;
  }
}

// Función para buscar cliente por email
export function buscarClientePorEmail(email: string): Client | undefined {
  return clientesRegistrados.find(cliente => 
    cliente.email.toLowerCase() === email.toLowerCase()
  );
}

// Función para autenticar cliente
export function autenticarCliente(email: string, password: string): Client | undefined {
  return clientesRegistrados.find(cliente => 
    cliente.email.toLowerCase() === email.toLowerCase() && 
    cliente.password === password
  );
}

// Función para actualizar un cliente
export async function actualizarCliente(id: string, datosActualizados: Partial<Client>): Promise<Client | null> {
  const index = clientesRegistrados.findIndex(cliente => cliente.id === id);
  if (index !== -1) {
    clientesRegistrados[index] = { 
      ...clientesRegistrados[index], 
      ...datosActualizados,
      updatedAt: new Date()
    };
    
    // Aquí podrías agregar lógica para actualizar en la base de datos si es necesario
    console.log('Cliente actualizado:', clientesRegistrados[index]);
    return clientesRegistrados[index];
  }
  return null;
}

// Función para eliminar un cliente
export function eliminarCliente(id: string): Client | null {
  const index = clientesRegistrados.findIndex(cliente => cliente.id === id);
  if (index !== -1) {
    const clienteEliminado = clientesRegistrados.splice(index, 1)[0];
    console.log('Cliente eliminado:', clienteEliminado);
    return clienteEliminado;
  }
  return null;
}

// Función para obtener estadísticas
export function obtenerEstadisticasClientes() {
  return {
    total: clientesRegistrados.length,
    fechaUltimoRegistro: clientesRegistrados.length > 0 
      ? Math.max(...clientesRegistrados.map(c => c.createdAt.getTime()))
      : null
  };
}

// Función para limpiar localStorage (eliminar datos antiguos)
export function limpiarLocalStorage(): void {
  try {
    // Eliminar clientes del localStorage
    localStorage.removeItem('tallerApp_clientesRegistrados');
    localStorage.removeItem('tallerApp_clients');
    console.log(' LocalStorage de clientes limpiado');
  } catch (error) {
    console.error(' Error limpiando localStorage:', error);
  }
}

// Auto-limpiar localStorage al cargar el módulo
limpiarLocalStorage();
