/**
 * UTILIDADES PARA MAPEAR IDs A NOMBRES DESCRIPTIVOS
 * Estas funciones convierten IDs crípticos en nombres legibles para la UI
 */

import { obtenerClientes } from '../servicios/clientesApiService';
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

  // Verificar cache
  const now = Date.now();
  if (cache.clients.has(clientId) && (now - cache.lastUpdate.clients) < CACHE_DURATION) {
    return cache.clients.get(clientId) || clientId;
  }

  try {
    // Cargar clientes si el cache está vacío o expirado
    if ((now - cache.lastUpdate.clients) >= CACHE_DURATION) {
      const clientes = await obtenerClientes();
      cache.clients.clear();
      clientes.forEach(cliente => {
        cache.clients.set(cliente.id, cliente.name || cliente.email);
      });
      cache.lastUpdate.clients = now;
    }

    const name = cache.clients.get(clientId);
    return name || `Cliente #${clientId}`;
  } catch (error) {
    console.error('Error obteniendo nombre de cliente:', error);
    return `Cliente #${clientId}`;
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
          const displayName = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año} - ${vehiculo.placa}`;
          cache.vehicles.set(vehiculo.id, displayName);
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
          const precio = parseFloat(servicio.precio || servicio.basePrice || 0);
          const displayName = `${servicio.nombre || servicio.name} - L${precio.toLocaleString('es-HN')}`;
          cache.services.set(servicio.id, displayName);
        });
        cache.lastUpdate.services = now;
      }
    }

    const name = cache.services.get(serviceId);
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