/**
 * UTILIDADES PARA MAPEAR IDs A NOMBRES DESCRIPTIVOS
 * Estas funciones convierten IDs crípticos en nombres legibles para la UI
 */

import clientesService from '../servicios/clientesService';
import { vehiclesService } from '../servicios/apiService';
import { servicesService } from '../servicios/apiService';

// Cache para evitar llamadas múltiples a la API
const cache = {
  clients: new Map<string, string>(),
  vehicles: new Map<string, string>(),
  services: new Map<string, string>(),
  lastUpdate: {
    clients: 0,
    vehicles: 0,
    services: 0
  }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Convierte ID de cliente a nombre descriptivo
 * @param clientId - ID del cliente
 * @returns Nombre del cliente o ID si no se encuentra
 */
export async function getClientDisplayName(clientId: string): Promise<string> {
  if (!clientId) return 'Cliente no especificado';

  const now = Date.now();
  const clientIdStr = clientId?.toString();

  try {
    // Cargar clientes si el cache está vacío o expirado
    if ((now - cache.lastUpdate.clients) >= CACHE_DURATION) {
      console.log('🔄 Actualizando cache de clientes...');
      const resultado = await clientesService.obtenerClientes();
      if (resultado.success && resultado.data) {
        const clientes = Array.isArray(resultado.data) ? resultado.data : [resultado.data];
        cache.clients.clear();
        clientes.forEach(cliente => {
          const id = cliente.usuario_id?.toString();
          cache.clients.set(id, cliente.nombre_completo || cliente.correo);
          console.log(`  ✓ Cliente ${id}: ${cliente.nombre_completo}`);
        });
        cache.lastUpdate.clients = now;
        console.log('✅ Cache de clientes actualizado:', cache.clients.size, 'clientes');
      }
    }

    // Verificar si existe en cache
    if (cache.clients.has(clientIdStr)) {
      const name = cache.clients.get(clientIdStr);
      console.log(`🔍 Cliente encontrado - ID: ${clientIdStr} -> ${name}`);
      return name || clientIdStr;
    }

    // Si no está en cache y el cache es reciente, intentar recargar una vez
    if ((now - cache.lastUpdate.clients) < CACHE_DURATION) {
      console.log(`⚠️ Cliente ${clientIdStr} no encontrado en cache, recargando...`);
      const resultado = await clientesService.obtenerClientes();
      if (resultado.success && resultado.data) {
        const clientes = Array.isArray(resultado.data) ? resultado.data : [resultado.data];
        clientes.forEach(cliente => {
          const id = cliente.usuario_id?.toString();
          cache.clients.set(id, cliente.nombre_completo || cliente.correo);
        });
        cache.lastUpdate.clients = now;
        
        if (cache.clients.has(clientIdStr)) {
          return cache.clients.get(clientIdStr) || clientIdStr;
        }
      }
    }

    console.log(`❌ Cliente ${clientIdStr} NO encontrado en ninguna fuente`);
    return `Cliente #${clientIdStr}`;
  } catch (error) {
    console.error('Error obteniendo nombre de cliente:', error);
    return `Cliente #${clientIdStr}`;
  }
}

/**
 * Convierte ID de vehículo a nombre descriptivo
 * @param vehicleId - ID del vehículo
 * @returns Nombre descriptivo del vehículo (Marca Modelo Año - Placa)
 */
export async function getVehicleDisplayName(vehicleId: string): Promise<string> {
  if (!vehicleId) return 'Vehículo no especificado';

  // Verificar cache
  const now = Date.now();
  if (cache.vehicles.has(vehicleId) && (now - cache.lastUpdate.vehicles) < CACHE_DURATION) {
    return cache.vehicles.get(vehicleId) || vehicleId;
  }

  try {
    // Cargar vehículos si el cache está vacío o expirado
    if ((now - cache.lastUpdate.vehicles) >= CACHE_DURATION) {
      const response = await vehiclesService.getAll();
      if (response.success && response.data) {
        cache.vehicles.clear();
        response.data.forEach((vehiculo: any) => {
          const vehiculoId = vehiculo.vehiculo_id?.toString() || vehiculo.id?.toString();
          const displayName = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} - ${vehiculo.placa}`;
          cache.vehicles.set(vehiculoId, displayName);
        });
        cache.lastUpdate.vehicles = now;
      }
    }

    const name = cache.vehicles.get(vehicleId);
    return name || `Vehículo #${vehicleId}`;
  } catch (error) {
    console.error('Error obteniendo nombre de vehículo:', error);
    return `Vehículo #${vehicleId}`;
  }
}

/**
 * Convierte ID de servicio a nombre descriptivo
 * @param serviceId - ID del servicio
 * @returns Nombre del servicio con precio
 */
export async function getServiceDisplayName(serviceId: string): Promise<string> {
  if (!serviceId) return 'Servicio no especificado';

  // Verificar cache
  const now = Date.now();
  if (cache.services.has(serviceId) && (now - cache.lastUpdate.services) < CACHE_DURATION) {
    return cache.services.get(serviceId) || serviceId;
  }

  try {
    // Cargar servicios si el cache está vacío o expirado
    if ((now - cache.lastUpdate.services) >= CACHE_DURATION) {
      const response = await servicesService.getAll();
      if (response.success && response.data) {
        cache.services.clear();
        response.data.forEach((servicio: any) => {
          const servicioId = servicio.tipo_servicio_id?.toString() || servicio.id?.toString();
          const precio = parseFloat(servicio.precio_base || servicio.basePrice || 0);
          const displayName = `${servicio.nombre || servicio.name} - L${precio.toLocaleString('es-HN')}`;
          cache.services.set(servicioId, displayName);
        });
        cache.lastUpdate.services = now;
        console.log('📋 Cache de servicios actualizado:', cache.services.size, 'servicios');
      }
    }

    const name = cache.services.get(serviceId?.toString());
    console.log(`🔍 Buscando servicio ID: ${serviceId}, encontrado: ${name || 'NO ENCONTRADO'}`);
    return name || `Servicio #${serviceId}`;
  } catch (error) {
    console.error('Error obteniendo nombre de servicio:', error);
    return `Servicio #${serviceId}`;
  }
}

/**
 * Convierte múltiples IDs a nombres de forma eficiente
 * @param data - Objeto con IDs a convertir
 * @returns Objeto con nombres descriptivos
 */
export async function getDisplayNames(data: {
  clientId?: string;
  vehicleId?: string;
  serviceId?: string;
}): Promise<{
  clientName: string;
  vehicleName: string;
  serviceName: string;
}> {
  try {
    const [clientName, vehicleName, serviceName] = await Promise.all([
      data.clientId ? getClientDisplayName(data.clientId) : 'No especificado',
      data.vehicleId ? getVehicleDisplayName(data.vehicleId) : 'No especificado',
      data.serviceId ? getServiceDisplayName(data.serviceId) : 'No especificado'
    ]);

    return {
      clientName,
      vehicleName,
      serviceName
    };
  } catch (error) {
    console.error('Error obteniendo nombres descriptivos:', error);
    return {
      clientName: data.clientId ? `Cliente #${data.clientId}` : 'No especificado',
      vehicleName: data.vehicleId ? `Vehículo #${data.vehicleId}` : 'No especificado',
      serviceName: data.serviceId ? `Servicio #${data.serviceId}` : 'No especificado'
    };
  }
}

/**
 * Limpia el cache (útil cuando se sabe que los datos han cambiado)
 */
export function clearDisplayNameCache(): void {
  cache.clients.clear();
  cache.vehicles.clear();
  cache.services.clear();
  cache.lastUpdate = { clients: 0, vehicles: 0, services: 0 };
}

/**
 * Obtiene información completa de un appointment con nombres descriptivos
 * @param appointment - Appointment con IDs
 * @returns Appointment con nombres descriptivos agregados
 */
export async function enrichAppointmentWithNames(appointment: any): Promise<any> {
  const names = await getDisplayNames({
    clientId: appointment.clientId || appointment.clienteId,
    vehicleId: appointment.vehicleId || appointment.vehiculoId,
    serviceId: appointment.serviceTypeId || appointment.servicio
  });

  return {
    ...appointment,
    displayNames: names,
    // Aliases para compatibilidad
    clientName: names.clientName,
    vehicleName: names.vehicleName,
    serviceName: names.serviceName
  };
}