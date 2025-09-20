const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// SQL Server temporalmente desactivado - Solo usar CSV
// const { getConnection, sql } = require('../config/database');

class ExcelImportService {
    constructor() {
        this.clientsPath = path.join(__dirname, '..', 'data', 'clients', 'clients.csv');
        this.vehiclesPath = path.join(__dirname, '..', 'data', 'vehicles', 'vehicles.csv');
    }

    /**
     * Procesa un archivo Excel y extrae datos de clientes y vehículos
     * @param {string} filePath - Ruta al archivo Excel
     * @returns {Object} - Resultado del procesamiento
     */
    async processExcelFile(filePath) {
        try {
            // Leer el archivo Excel
            const workbook = XLSX.readFile(filePath);
            
            // Verificar que las hojas necesarias existan
            if (!workbook.SheetNames.includes('Clientes')) {
                throw new Error('La hoja "Clientes" no fue encontrada en el archivo Excel');
            }
            
            if (!workbook.SheetNames.includes('Vehiculos')) {
                throw new Error('La hoja "Vehiculos" no fue encontrada en el archivo Excel');
            }

            // Extraer datos de las hojas
            const clientsSheet = workbook.Sheets['Clientes'];
            const vehiclesSheet = workbook.Sheets['Vehiculos'];

            const clientsData = XLSX.utils.sheet_to_json(clientsSheet);
            const vehiclesData = XLSX.utils.sheet_to_json(vehiclesSheet);

            // Validar y procesar datos
            const processedClients = await this.processClientsData(clientsData);
            const processedVehicles = await this.processVehiclesData(vehiclesData, processedClients);

            // Guardar datos procesados
            const result = await this.saveProcessedData(processedClients, processedVehicles);

            return {
                success: true,
                message: 'Archivo procesado exitosamente',
                stats: {
                    clientsProcessed: processedClients.length,
                    vehiclesProcessed: processedVehicles.length,
                    clientsSkipped: result.clientsSkipped,
                    vehiclesSkipped: result.vehiclesSkipped
                },
                errors: result.errors
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error procesando archivo Excel',
                error: error.message
            };
        }
    }

    /**
     * Procesa y valida datos de clientes
     */
    async processClientsData(clientsData) {
        const processed = [];
        const existingClients = await this.getExistingClients();
        const existingEmails = new Set(existingClients.map(c => c.email.toLowerCase()));

        for (const row of clientsData) {
            // Validar campos obligatorios
            if (!row.name || !row.email || !row.phone || !row.password) {
                continue; // Saltar filas incompletas
            }

            // Validar email único
            if (existingEmails.has(row.email.toLowerCase())) {
                continue; // Saltar emails duplicados
            }

            // Crear objeto cliente con formato correcto
            const client = {
                id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: row.name.trim(),
                email: row.email.trim().toLowerCase(),
                phone: row.phone.trim(),
                address: row.address ? row.address.trim() : '', // Campo opcional
                password_hash: row.password.trim(), // Usar la contraseña proporcionada
                status: 'active',
                registration_date: new Date().toISOString().split('T')[0],
                last_visit: '',
                total_visits: 0,
                total_spent: 0,
                notes: 'Importado desde Excel',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            processed.push(client);
            existingEmails.add(client.email); // Evitar duplicados en el mismo lote
        }

        return processed;
    }

    /**
     * Procesa y valida datos de vehículos
     */
    async processVehiclesData(vehiclesData, processedClients) {
        const processed = [];
        const existingVehicles = await this.getExistingVehicles();
        const existingPlates = new Set(existingVehicles.map(v => v.placa.toLowerCase()));
        
        // Crear mapa de emails a IDs de clientes (incluyendo los recién procesados)
        const existingClients = await this.getExistingClients();
        const allClients = [...existingClients, ...processedClients];
        const emailToClientId = new Map();
        allClients.forEach(client => {
            emailToClientId.set(client.email.toLowerCase(), client.id);
        });

        for (const row of vehiclesData) {
            // Validar campos obligatorios
            if (!row.clienteEmail || !row.marca || !row.modelo || !row.año || !row.placa || !row.color) {
                continue; // Saltar filas incompletas
            }

            // Validar que el cliente existe
            const clientId = emailToClientId.get(row.clienteEmail.toLowerCase());
            if (!clientId) {
                continue; // Saltar si el cliente no existe
            }

            // Validar placa única
            if (existingPlates.has(row.placa.toLowerCase())) {
                continue; // Saltar placas duplicadas
            }

            // Validar año
            const year = parseInt(row.año);
            if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
                continue; // Saltar años inválidos
            }

            // Crear objeto vehículo con formato correcto
            const vehicle = {
                id: `VEH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                clienteId: clientId,
                marca: row.marca.trim(),
                modelo: row.modelo.trim(),
                año: year,
                placa: row.placa.trim().toUpperCase(),
                color: row.color.trim()
            };

            processed.push(vehicle);
            existingPlates.add(vehicle.placa.toLowerCase()); // Evitar duplicados en el mismo lote
        }

        return processed;
    }

    /**
     * Obtiene clientes existentes del CSV
     */
    async getExistingClients() {
        try {
            // Verificar si el directorio y archivo existen
            const clientsDir = path.dirname(this.clientsPath);
            await fs.access(clientsDir).catch(async () => {
                await fs.mkdir(clientsDir, { recursive: true });
            });

            let csvContent;
            try {
                csvContent = await fs.readFile(this.clientsPath, 'utf8');
            } catch (error) {
                // Si el archivo no existe, crear uno vacío con headers
                const headers = 'id,name,email,phone,address,password_hash,status,registration_date,last_visit,total_visits,total_spent,notes,created_at,updated_at';
                await fs.writeFile(this.clientsPath, headers + '\n');
                return [];
            }

            const lines = csvContent.trim().split('\n');
            
            if (lines.length <= 1) return []; // Solo headers o archivo vacío
            
            const headers = lines[0].split(',');
            const clients = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const client = {};
                headers.forEach((header, index) => {
                    client[header] = values[index] || '';
                });
                clients.push(client);
            }
            
            return clients;
        } catch (error) {
            console.error('Error reading clients CSV:', error);
            return []; // Si hay cualquier error, devolver array vacío
        }
    }

    /**
     * Obtiene vehículos existentes del CSV
     */
    async getExistingVehicles() {
        try {
            // Verificar si el directorio y archivo existen
            const vehiclesDir = path.dirname(this.vehiclesPath);
            await fs.access(vehiclesDir).catch(async () => {
                await fs.mkdir(vehiclesDir, { recursive: true });
            });

            let csvContent;
            try {
                csvContent = await fs.readFile(this.vehiclesPath, 'utf8');
            } catch (error) {
                // Si el archivo no existe, crear uno vacío con headers
                const headers = 'id,clienteId,marca,modelo,año,placa,color';
                await fs.writeFile(this.vehiclesPath, headers + '\n');
                return [];
            }

            const lines = csvContent.trim().split('\n');
            
            if (lines.length <= 1) return []; // Solo headers o archivo vacío
            
            const headers = lines[0].split(',');
            const vehicles = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const vehicle = {};
                headers.forEach((header, index) => {
                    vehicle[header] = values[index] || '';
                });
                vehicles.push(vehicle);
            }
            
            return vehicles;
        } catch (error) {
            console.error('Error reading vehicles CSV:', error);
            return []; // Si hay cualquier error, devolver array vacío
        }
    }

    /**
     * Guarda los datos procesados en los archivos CSV
     */
    async saveProcessedData(processedClients, processedVehicles) {
        const errors = [];
        let clientsSkipped = 0;
        let vehiclesSkipped = 0;

        try {
            // Guardar clientes
            if (processedClients.length > 0) {
                await this.appendToCSV(this.clientsPath, processedClients, [
                    'id', 'name', 'email', 'phone', 'address', 'password_hash', 
                    'status', 'registration_date', 'last_visit', 'total_visits', 
                    'total_spent', 'notes', 'created_at', 'updated_at'
                ]);

                // ========================================
                // SQL SERVER TEMPORALMENTE DESACTIVADO
                // (Los stored procedures se mantienen para uso futuro)
                // ========================================
                
                // También registrar clientes en SQL Server para autenticación
                // COMENTADO TEMPORALMENTE - Solo usar CSV por ahora
                /*
                for (const client of processedClients) {
                    try {
                        console.log(`🔄 Registrando cliente ${client.name} en sistema de autenticación...`);
                        const pool = await getConnection();
                        const sqlResult = await pool.request()
                            .input('Email', sql.VarChar(255), client.email)
                            .input('Password', sql.VarChar(255), client.password_hash)
                            .input('FullName', sql.VarChar(255), client.name)
                            .input('Phone', sql.VarChar(20), client.phone)
                            .input('Address', sql.VarChar(500), client.address || '')
                            .input('CompanyName', sql.VarChar(255), '') // Campo opcional
                            .execute('SP_REGISTRAR_USUARIO_CLIENTE');

                        const authResult = sqlResult.recordset[0];
                        
                        if (authResult && authResult.Success) {
                            console.log(`✅ Cliente ${client.name} registrado en autenticación`);
                        } else {
                            console.warn(`⚠️ No se pudo registrar ${client.name} en autenticación:`, authResult?.Message);
                        }
                    } catch (authError) {
                        console.error(`❌ Error registrando ${client.name} en autenticación:`, authError.message);
                        // Continuar con el siguiente cliente
                    }
                }
                */
            }

            // Guardar vehículos
            if (processedVehicles.length > 0) {
                await this.appendToCSV(this.vehiclesPath, processedVehicles, [
                    'id', 'clienteId', 'marca', 'modelo', 'año', 'placa', 'color'
                ]);
            }

        } catch (error) {
            errors.push(`Error guardando datos: ${error.message}`);
        }

        return { errors, clientsSkipped, vehiclesSkipped };
    }

    /**
     * Agrega datos a un archivo CSV
     */
    async appendToCSV(filePath, data, headers) {
        // Verificar si el archivo existe
        let fileExists = true;
        try {
            await fs.access(filePath);
        } catch {
            fileExists = false;
        }

        // Si no existe, crear con headers
        if (!fileExists) {
            await fs.writeFile(filePath, headers.join(',') + '\n');
        }

        // Agregar datos
        const csvLines = data.map(item => {
            return headers.map(header => {
                const value = item[header] || '';
                // Escapar comas y comillas en los valores
                if (value.toString().includes(',') || value.toString().includes('"')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value.toString();
            }).join(',');
        });

        await fs.appendFile(filePath, csvLines.join('\n') + '\n');
    }

    /**
     * Descarga la plantilla Excel
     */
    async downloadTemplate() {
        const templatePath = path.join(__dirname, '..', 'templates', 'plantilla-importacion-clientes-vehiculos.xlsx');
        return templatePath;
    }
}

module.exports = ExcelImportService;