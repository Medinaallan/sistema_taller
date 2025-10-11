const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuración basada en el prompt
const PROMPT_CONFIG = {
    file: {
        path: "backend/templates/mantenimiento de freno.xlsx",
        sheets: [
            {
                name: "Hoja1",
                range: "A3:J",
                columns: {
                    "A": "Unidad registrada (vehículo)",
                    "B": "Fecha (freno delantero)",
                    "C": "Kilometraje de cambio recomendado (freno delantero)",
                    "D": "Kilometraje de revisión (freno delantero)",
                    "E": "Marca de frenos cambiados (freno delantero)",
                    "F": "Fecha de revisión (freno trasero)",
                    "G": "Kilometraje de revisión (freno trasero)",
                    "H": "Kilometraje recomendado por mecánico (freno trasero)",
                    "I": "Kilometraje de cambio final recomendado (freno trasero)",
                    "J": "Kilometraje de cambio final recomendado (freno trasero)"
                },
                services: {
                    "B-E": "CAMBIO DE FRENO DELANTERO",
                    "F-J": "CAMBIO DE FRENO TRASERO"
                }
            },
            {
                name: "Hoja2",
                range: "A3:D",
                columns: {
                    "A": "Unidad registrada (vehículo)",
                    "B": "Fecha",
                    "C": "Tipo de balinera (ej. derecha, izquierda, etc.)",
                    "D": "Marca de la balinera cambiada"
                },
                services: {
                    "B-D": "CAMBIO DE BALINERAS DELANTERAS"
                }
            }
        ]
    },
    client: {
        name: "GRUPO INCOVA - PRUEBA 061025",
        email: "incova@taller.com"
    },
    vehicle_defaults: {
        modelo: "ASDF",
        año: 2025,
        placa: "PPP999",
        color: "Blanco"
    }
};

// Paths para archivos CSV
const CLIENTS_CSV_PATH = path.join(__dirname, '../data/clients/clients.csv');
const VEHICLES_CSV_PATH = path.join(__dirname, '../data/vehicles/vehicles.csv');
const SERVICES_CSV_PATH = path.join(__dirname, '../data/services/services.csv');
const WORK_ORDERS_CSV_PATH = path.join(__dirname, '../data/services/work_orders.csv');

// Funciones utilitarias para manejar CSVs
function readCSV(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        
        const csvContent = fs.readFileSync(filePath, 'utf8');
        const lines = csvContent.trim().split('\n');
        
        if (lines.length <= 1) return [];
        
        const headers = lines[0].split(',');
        const records = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
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
        console.error(`Error reading CSV ${filePath}:`, error);
        return [];
    }
}

function writeCSV(filePath, records, headers) {
    try {
        const csvContent = headers.join(',') + '\n' + 
            records.map(record => 
                headers.map(header => record[header] || '').join(',')
            ).join('\n');
        
        fs.writeFileSync(filePath, csvContent);
        return true;
    } catch (error) {
        console.error(`Error writing CSV ${filePath}:`, error);
        return false;
    }
}

// Función para generar ID único
function generateId(prefix = '') {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

// Función para encontrar cliente por nombre
function findClientByName(clients, name) {
    return clients.find(client => client.name === name);
}

// Función para crear cliente si no existe
function ensureClient(clients, clientConfig) {
    let client = findClientByName(clients, clientConfig.name);
    
    if (!client) {
        client = {
            id: generateId('clients-'),
            name: clientConfig.name,
            email: clientConfig.email,
            phone: '',
            address: '',
            password_hash: '',
            status: 'active',
            registration_date: new Date().toISOString(),
            last_visit: '',
            total_visits: 0,
            total_spent: 0,
            notes: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        clients.push(client);
        console.log(`Cliente creado: ${client.name} (${client.id})`);
    } else {
        console.log(`Cliente existente encontrado: ${client.name} (${client.id})`);
    }
    
    return client;
}

// Función para crear vehículo
function createVehicle(clientId, marca, defaults) {
    return {
        id: generateId('vehicle-'),
        clienteId: clientId,
        marca: marca,
        modelo: defaults.modelo,
        año: defaults.año,
        placa: defaults.placa,
        color: defaults.color
    };
}

// Función para encontrar servicio por nombre
function findServiceByName(services, nombre) {
    return services.find(service => 
        service.nombre.toUpperCase() === nombre.toUpperCase()
    );
}

// Función para crear orden de trabajo
function createWorkOrder(vehicleId, serviceId, date, details) {
    return {
        id: generateId('order-'),
        vehicleId: vehicleId,
        serviceId: serviceId,
        date: date,
        status: 'completed',
        notes: JSON.stringify(details),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

// Función principal para procesar el Excel
async function processMaintenanceExcel() {
    try {
        console.log('=== INICIANDO PROCESAMIENTO DE EXCEL DE MANTENIMIENTO ===');
        
        // Leer archivo Excel
        const excelPath = path.join(__dirname, '../templates/mantenimiento de freno.xlsx');
        
        if (!fs.existsSync(excelPath)) {
            throw new Error(`Archivo Excel no encontrado: ${excelPath}`);
        }
        
        const workbook = XLSX.readFile(excelPath);
        console.log(`Archivo Excel leído: ${excelPath}`);
        console.log(`Hojas disponibles: ${workbook.SheetNames.join(', ')}`);
        
        // Cargar datos existentes
        let clients = readCSV(CLIENTS_CSV_PATH);
        let vehicles = readCSV(VEHICLES_CSV_PATH);
        let services = readCSV(SERVICES_CSV_PATH);
        let workOrders = readCSV(WORK_ORDERS_CSV_PATH);
        
        console.log(`\nDatos cargados:`);
        console.log(`- Clientes: ${clients.length}`);
        console.log(`- Vehículos: ${vehicles.length}`);
        console.log(`- Servicios: ${services.length}`);
        console.log(`- Órdenes de trabajo: ${workOrders.length}`);
        
        // Asegurar que el cliente existe
        const client = ensureClient(clients, PROMPT_CONFIG.client);
        
        // Procesar cada hoja según la configuración
        for (const sheetConfig of PROMPT_CONFIG.file.sheets) {
            console.log(`\n--- PROCESANDO HOJA: ${sheetConfig.name} ---`);
            
            const worksheet = workbook.Sheets[sheetConfig.name];
            if (!worksheet) {
                console.log(`Hoja "${sheetConfig.name}" no encontrada, saltando...`);
                continue;
            }
            
            // Convertir hoja a JSON (omitiendo las primeras 2 filas como especifica el prompt)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                range: 'A3:Z1000', // Comenzar desde fila 3 para omitir filas 1 y 2
                header: 1,
                defval: ''
            });
            
            console.log(`Filas de datos encontradas: ${jsonData.length}`);
            
            // Procesar cada fila de datos
            for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
                const row = jsonData[rowIndex];
                
                // Obtener marca del vehículo de la columna A
                const vehicleMarca = row[Object.keys(row)[0]]; // Primera columna (A)
                
                if (!vehicleMarca || vehicleMarca.trim() === '') {
                    continue; // Saltar filas vacías
                }
                
                console.log(`\nProcesando vehículo: ${vehicleMarca}`);
                
                // Crear vehículo
                const vehicle = createVehicle(client.id, vehicleMarca, PROMPT_CONFIG.vehicle_defaults);
                vehicles.push(vehicle);
                console.log(`Vehículo creado: ${vehicle.marca} ${vehicle.modelo} (${vehicle.id})`);
                
                // Procesar servicios según la configuración de la hoja
                for (const [columnRange, serviceName] of Object.entries(sheetConfig.services)) {
                    console.log(`  Procesando servicio: ${serviceName}`);
                    
                    // Encontrar el servicio
                    const service = findServiceByName(services, serviceName);
                    if (!service) {
                        console.log(` Servicio "${serviceName}" no encontrado en el sistema`);
                        continue;
                    }
                    
                    // Determinar qué columnas corresponden a este servicio
                    let serviceColumns = [];
                    if (sheetConfig.name === "Hoja1") {
                        if (columnRange === "B-E") {
                            serviceColumns = ['B', 'C', 'D', 'E'];
                        } else if (columnRange === "F-J") {
                            serviceColumns = ['F', 'G', 'H', 'I', 'J'];
                        }
                    } else if (sheetConfig.name === "Hoja2") {
                        if (columnRange === "B-D") {
                            serviceColumns = ['B', 'C', 'D'];
                        }
                    }
                    
                    // Verificar si hay datos para este servicio
                    const serviceData = {};
                    let hasData = false;
                    
                    serviceColumns.forEach((colLetter, index) => {
                        const colIndex = colLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
                        const value = row[Object.keys(row)[colIndex]];
                        if (value && value.toString().trim() !== '') {
                            serviceData[colLetter] = value;
                            hasData = true;
                        }
                    });
                    
                    if (hasData) {
                        // Extraer fecha (primera columna del rango de servicio)
                        const dateColumn = serviceColumns[0];
                        const dateValue = serviceData[dateColumn] || new Date().toISOString().split('T')[0];
                        
                        // Crear orden de trabajo
                        const workOrder = createWorkOrder(vehicle.id, service.id, dateValue, serviceData);
                        workOrders.push(workOrder);
                        
                        console.log(`Orden de trabajo creada para ${serviceName} (${workOrder.id})`);
                        console.log(`Datos: ${JSON.stringify(serviceData)}`);
                    } else {
                        console.log(`Sin datos para ${serviceName}, saltando...`);
                    }
                }
            }
        }
        
        // Guardar todos los datos actualizados
        console.log('\n=== GUARDANDO DATOS ===');
        
        const clientHeaders = ['id', 'name', 'email', 'phone', 'address', 'password_hash', 'status', 'registration_date', 'last_visit', 'total_visits', 'total_spent', 'notes', 'created_at', 'updated_at'];
        const vehicleHeaders = ['id', 'clienteId', 'marca', 'modelo', 'año', 'placa', 'color'];
        const workOrderHeaders = ['id', 'vehicleId', 'serviceId', 'date', 'status', 'notes', 'created_at', 'updated_at'];
        
        const success = 
            writeCSV(CLIENTS_CSV_PATH, clients, clientHeaders) &&
            writeCSV(VEHICLES_CSV_PATH, vehicles, vehicleHeaders) &&
            writeCSV(WORK_ORDERS_CSV_PATH, workOrders, workOrderHeaders);
        
        if (success) {
            console.log('Todos los archivos guardados exitosamente');
            console.log(`\nResumen final:`);
            console.log(`- Clientes: ${clients.length}`);
            console.log(`- Vehículos: ${vehicles.length}`);
            console.log(`- Órdenes de trabajo: ${workOrders.length}`);
        } else {
            console.log('Error guardando algunos archivos');
        }
        
    } catch (error) {
        console.error('Error procesando Excel:', error);
        throw error;
    }
}

// Exportar función principal
module.exports = { processMaintenanceExcel };

// Si se ejecuta directamente
if (require.main === module) {
    processMaintenanceExcel()
        .then(() => {
            console.log('\nProcesamiento completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nError en el procesamiento:', error);
            process.exit(1);
        });
}