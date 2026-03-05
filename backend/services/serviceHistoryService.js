const fs = require('fs').promises;
const path = require('path');

class ServiceHistoryService {
    constructor() {
        this.clientsPath = path.join(__dirname, '..', 'data', 'clients', 'clients.json');
        this.vehiclesPath = path.join(__dirname, '..', 'data', 'vehicles', 'vehicles.json');
        this.servicesPath = path.join(__dirname, '..', 'data', 'services', 'services.json');
        this.workOrdersPath = path.join(__dirname, '..', 'data', 'workorders', 'workorders.json');
    }

    /**
     * Leer datos desde un archivo JSON de forma segura.
     * Si el archivo no existe o no es JSON válido, devuelve array vacío.
     */
    async readJSON(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const json = JSON.parse(content);
            if (Array.isArray(json)) return json;
            // Si el JSON es un objeto con llave `data`, devolver ese valor
            if (json && Array.isArray(json.data)) return json.data;
            return [];
        } catch (error) {
            // Archivo no existe o no es JSON válido
            // Mostrar mensaje claro en logs y devolver array vacío
            if (error && error.code === 'ENOENT') {
                // Sólo loguear archivo faltante cuando DEBUG_JSON=true
                if (process.env.DEBUG_JSON === 'true') {
                  console.warn(`Archivo no encontrado, devolviendo array vacío: ${filePath}`);
                }
            } else {
                console.error(`Error leyendo JSON ${filePath}:`, error);
            }
            return [];
        }
    }

    /**
     * Obtener historial completo de servicios
     */
    async getServiceHistory(clientId = null) {
        try {
            // Cargar todos los datos necesarios
            const [clients, vehicles, services, workOrders] = await Promise.all([
                this.readJSON(this.clientsPath),
                this.readJSON(this.vehiclesPath),
                this.readJSON(this.servicesPath),
                this.readJSON(this.workOrdersPath)
            ]);

            // Crear mapas para búsquedas rápidas
            const clientsMap = new Map(clients.map(client => [client.id, client]));
            const vehiclesMap = new Map(vehicles.map(vehicle => [vehicle.id, vehicle]));
            const servicesMap = new Map(services.map(service => [service.id, service]));

            // Construir historial de servicios desde work orders
            const serviceHistory = [];

            for (const workOrder of workOrders) {
                // Saltar órdenes sin vehículo o servicio asignado
                if (!workOrder.vehicleId || !workOrder.serviceId) continue;

                const vehicle = vehiclesMap.get(workOrder.vehicleId);
                const service = servicesMap.get(workOrder.serviceId);
                
                if (!vehicle || !service) continue;

                const client = clientsMap.get(vehicle.clienteId);
                
                if (!client) continue;

                // Filtrar por cliente si se especifica
                if (clientId && client.id !== clientId) continue;

                // Construir el registro del historial
                const historyRecord = {
                    id: workOrder.id,
                    orderId: workOrder.id,
                    clientId: client.id,
                    clientName: client.name,
                    clientEmail: client.email,
                    clientPhone: client.phone,
                    vehicleId: vehicle.id,
                    vehicleName: `${vehicle.marca} ${vehicle.modelo} ${vehicle.año}`,
                    vehiclePlate: vehicle.placa,
                    vehicleColor: vehicle.color,
                    serviceId: service.id,
                    serviceName: service.nombre,
                    serviceDescription: service.descripcion || '',
                    servicePrice: parseFloat(service.precio) || 0,
                    serviceDuration: service.duracion || '',
                    serviceCategory: service.categoria || '',
                    date: workOrder.date || workOrder.created_at,
                    status: workOrder.status || 'pending',
                    notes: workOrder.notes || '',
                    createdAt: workOrder.created_at,
                    updatedAt: workOrder.updated_at
                };

                serviceHistory.push(historyRecord);
            }

            // Ordenar por fecha (más recientes primero)
            serviceHistory.sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt);
                const dateB = new Date(b.date || b.createdAt);
                return dateB - dateA;
            });

            return {
                success: true,
                data: serviceHistory,
                stats: {
                    totalRecords: serviceHistory.length,
                    totalClients: clientId ? 1 : new Set(serviceHistory.map(h => h.clientId)).size,
                    totalVehicles: new Set(serviceHistory.map(h => h.vehicleId)).size,
                    totalServices: new Set(serviceHistory.map(h => h.serviceId)).size,
                    statusBreakdown: this.getStatusBreakdown(serviceHistory)
                }
            };

        } catch (error) {
            console.error('Error obteniendo historial de servicios:', error);
            return {
                success: false,
                message: 'Error interno del servidor',
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Obtener historial de servicios para un cliente específico
     */
    async getClientServiceHistory(clientId) {
        return this.getServiceHistory(clientId);
    }

    /**
     * Obtener historial completo para administradores
     */
    async getAdminServiceHistory() {
        return this.getServiceHistory();
    }

    /**
     * Obtener estadísticas de estado
     */
    getStatusBreakdown(serviceHistory) {
        const breakdown = {};
        
        for (const record of serviceHistory) {
            const status = record.status || 'unknown';
            breakdown[status] = (breakdown[status] || 0) + 1;
        }
        
        return breakdown;
    }

    /**
     * Obtener estadísticas por cliente
     */
    async getClientStats(clientId) {
        try {
            const history = await this.getClientServiceHistory(clientId);
            
            if (!history.success) {
                return history;
            }

            const records = history.data;
            
            const stats = {
                totalServices: records.length,
                totalSpent: records.reduce((sum, record) => sum + (record.servicePrice || 0), 0),
                averageServiceCost: 0,
                lastServiceDate: null,
                favoriteServiceType: null,
                vehiclesServiced: new Set(records.map(r => r.vehicleId)).size,
                servicesByStatus: this.getStatusBreakdown(records),
                servicesByCategory: {},
                monthlyActivity: {}
            };

            // Calcular promedio
            if (stats.totalServices > 0) {
                stats.averageServiceCost = stats.totalSpent / stats.totalServices;
            }

            // Última fecha de servicio
            if (records.length > 0) {
                stats.lastServiceDate = records[0].date || records[0].createdAt;
            }

            // Servicios por categoría
            for (const record of records) {
                const category = record.serviceCategory || 'otros';
                stats.servicesByCategory[category] = (stats.servicesByCategory[category] || 0) + 1;
            }

            // Tipo de servicio favorito
            const serviceFrequency = {};
            for (const record of records) {
                const serviceName = record.serviceName;
                serviceFrequency[serviceName] = (serviceFrequency[serviceName] || 0) + 1;
            }
            
            if (Object.keys(serviceFrequency).length > 0) {
                stats.favoriteServiceType = Object.entries(serviceFrequency)
                    .sort(([,a], [,b]) => b - a)[0][0];
            }

            // Actividad mensual
            for (const record of records) {
                const date = new Date(record.date || record.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                stats.monthlyActivity[monthKey] = (stats.monthlyActivity[monthKey] || 0) + 1;
            }

            return {
                success: true,
                data: stats
            };

        } catch (error) {
            console.error('Error obteniendo estadísticas del cliente:', error);
            return {
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            };
        }
    }

    /**
     * Agregar nuevo registro al historial de servicios
     * (Almacenamiento JSON eliminado - este método es un no-op por ahora)
     */
    async addServiceHistory(historyData) {
        console.log('addServiceHistory: almacenamiento JSON eliminado, registro ignorado');
        return {
            success: true,
            data: { id: `hist_${Date.now()}`, ...historyData },
            message: 'Almacenamiento JSON deshabilitado'
        };
    }
}

module.exports = ServiceHistoryService;