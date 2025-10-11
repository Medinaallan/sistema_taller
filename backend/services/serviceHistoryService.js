const fs = require('fs').promises;
const path = require('path');

class ServiceHistoryService {
    constructor() {
        this.clientsPath = path.join(__dirname, '..', 'data', 'clients', 'clients.csv');
        this.vehiclesPath = path.join(__dirname, '..', 'data', 'vehicles', 'vehicles.csv');
        this.servicesPath = path.join(__dirname, '..', 'data', 'services', 'services.csv');
        this.workOrdersPath = path.join(__dirname, '..', 'data', 'services', 'work_orders.csv');
    }

    /**
     * Leer datos desde un archivo CSV
     */
    async readCSV(filePath) {
        try {
            const csvContent = await fs.readFile(filePath, 'utf8');
            const lines = csvContent.trim().split('\n');
            
            if (lines.length <= 1) return [];
            
            const headers = lines[0].split(',').map(header => header.trim());
            const records = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const record = {};
                    headers.forEach((header, index) => {
                        record[header] = values[index];
                    });
                    records.push(record);
                }
            }
            
            return records;
        } catch (error) {
            console.error(`Error leyendo CSV ${filePath}:`, error);
            return [];
        }
    }

    /**
     * Parsear una línea CSV considerando campos con comas
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Obtener historial completo de servicios
     */
    async getServiceHistory(clientId = null) {
        try {
            // Cargar todos los datos necesarios
            const [clients, vehicles, services, workOrders] = await Promise.all([
                this.readCSV(this.clientsPath),
                this.readCSV(this.vehiclesPath),
                this.readCSV(this.servicesPath),
                this.readCSV(this.workOrdersPath)
            ]);

            // Crear mapas para búsquedas rápidas
            const clientsMap = new Map(clients.map(client => [client.id, client]));
            const vehiclesMap = new Map(vehicles.map(vehicle => [vehicle.id, vehicle]));
            const servicesMap = new Map(services.map(service => [service.id, service]));

            // Construir historial de servicios
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
}

module.exports = ServiceHistoryService;