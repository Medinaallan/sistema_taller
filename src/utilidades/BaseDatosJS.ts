// ====================================
// BASE DE DATOS TYPESCRIPT - CLIENTES
// Sistema de almacenamiento de clientes en CSV vía API
// ====================================

import type { Client } from '../tipos';

const API_BASE_URL = 'http://localhost:8080/api';

// Array de clientes registrados (cargado desde CSV)
export let clientesRegistrados: Client[] = [];

// Función para cargar clientes desde CSV vía API
async function cargarClientesDesdeCSV(): Promise<Client[]> {
  try {
    console.log('🔄 Cargando clientes desde API:', `${API_BASE_URL}/clients`);
    const response = await fetch(`${API_BASE_URL}/clients`);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('📊 Respuesta de API:', data);
    
    if (data.success && data.data) {
      console.log('✅ API exitosa, procesando', data.data.length, 'clientes');
      
      // Convertir los datos del CSV al formato Client
      const clientesConvertidos = data.data.map((cliente: any) => ({
        id: cliente.id,
        name: cliente.name,           // Usar 'name' directamente
        email: cliente.email,
        phone: cliente.phone,         // Usar 'phone' directamente  
        address: cliente.address,     // Usar 'address' directamente
        password: cliente.password_hash || '', // El backend usa 'password_hash'
        vehicles: [], // Los vehículos se cargarían por separado
        createdAt: new Date(cliente.created_at || cliente.registration_date || new Date()),
        updatedAt: new Date(cliente.updated_at || new Date())
      }));
      
      console.log('🎯 Clientes convertidos:', clientesConvertidos.length);
      return clientesConvertidos;
    } else {
      console.warn('⚠️ API no exitosa o sin datos');
      return [];
    }
  } catch (error) {
    console.error('❌ Error cargando clientes desde API:', error);
    return [];
  }
}

// Función para guardar cliente en CSV vía API
async function guardarClienteEnCSV(cliente: Client): Promise<boolean> {
  try {
    console.log('Guardando cliente en CSV:', cliente.name);
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: cliente.name,
        telefono: cliente.phone,
        email: cliente.email,
        direccion: cliente.address || '',
        password: cliente.password,
        vehiculos: cliente.vehicles.length || 0,
        vehiculoNombre: cliente.vehicles[0]?.brand || '',
        vehiculoModelo: cliente.vehicles[0]?.model || '',
        kilometraje: cliente.vehicles[0]?.mileage || 0
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Cliente guardado exitosamente en CSV');
      return true;
    } else {
      console.error('Error guardando cliente:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error al guardar cliente en CSV:', error);
    return false;
  }
}

// Función para inicializar clientes desde CSV
export async function inicializarClientesDesdeCSV(): Promise<void> {
  clientesRegistrados = await cargarClientesDesdeCSV();
  
  // Configurar recarga automática cada 30 segundos
  setInterval(async () => {
    try {
      const clientesActualizados = await cargarClientesDesdeCSV();
      if (clientesActualizados.length !== clientesRegistrados.length) {
        console.log(`Cambios detectados en CSV: ${clientesActualizados.length} clientes`);
        clientesRegistrados = clientesActualizados;
      }
    } catch (error) {
      console.error('Error en recarga automática:', error);
    }
  }, 30000); // 30 segundos
}

// Función para recargar clientes desde CSV (para refrescar cambios manuales)
export async function recargarClientesDesdeCSV(): Promise<void> {
  console.log('Recargando clientes desde CSV...');
  clientesRegistrados = await cargarClientesDesdeCSV();
}

// Función para obtener todos los clientes (con opción de recargar)
export async function obtenerClientes(recargar: boolean = true): Promise<Client[]> {
  if (recargar) {
    // Recargar datos frescos del CSV
    clientesRegistrados = await cargarClientesDesdeCSV();
  }
  return [...clientesRegistrados];
}

// Función para obtener todos los clientes (versión síncrona - datos en memoria)
export function obtenerClientesEnMemoria(): Client[] {
  return [...clientesRegistrados];
}

// Función para obtener todos los clientes con recarga forzada
export async function obtenerClientesActualizados(): Promise<Client[]> {
  await recargarClientesDesdeCSV();
  return [...clientesRegistrados];
}

// Función para agregar un nuevo cliente
export async function agregarCliente(nuevoCliente: Client): Promise<Client | null> {
  console.log('Agregando nuevo cliente:', nuevoCliente.name);
  
  // Guardar en CSV
  const guardado = await guardarClienteEnCSV(nuevoCliente);
  
  if (guardado) {
    clientesRegistrados.push(nuevoCliente);
    console.log('Cliente agregado exitosamente');
    console.log('Total clientes registrados:', clientesRegistrados.length);
    return nuevoCliente;
  } else {
    console.error('Error al agregar cliente');
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
    
    // Aquí podrías agregar lógica para actualizar en CSV si es necesario
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
    console.log('🧹 LocalStorage de clientes limpiado');
  } catch (error) {
    console.error('❌ Error limpiando localStorage:', error);
  }
}

// Auto-limpiar localStorage al cargar el módulo
limpiarLocalStorage();
