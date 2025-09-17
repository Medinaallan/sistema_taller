const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * 🔄 MIGRACIÓN DE CSV EXISTENTE A NUEVA ESTRUCTURA
 * 
 * Convierte el Client_Database.csv actual en:
 * 1. clients/clients.csv - Datos principales del cliente
 * 2. vehicles/vehicles.csv - Vehículos del cliente
 * 3. services/work_orders.csv - Órdenes activas
 * 4. appointments/appointments.csv - Citas programadas
 */

async function migrateClientDatabase() {
  console.log('🔄 Iniciando migración de Client_Database.csv...');
  
  try {
    // Rutas
    const sourceFile = path.join(__dirname, '../../src/Client_Database.csv');
    const dataPath = path.join(__dirname, '../data');
    
    // Verificar que el archivo fuente existe
    if (!await fs.pathExists(sourceFile)) {
      throw new Error('❌ Client_Database.csv no encontrado en src/');
    }
    
    // Arrays para almacenar datos migrados
    const clients = [];
    const vehicles = [];
    const workOrders = [];
    const appointments = [];
    
    // Leer CSV original
    const originalData = await readCSV(sourceFile);
    console.log(`📖 Leídos ${originalData.length} registros del CSV original`);
    
    // Procesar cada registro
    originalData.forEach((row, index) => {
      const clientId = `client-${index + 1}`;
      const timestamp = new Date().toISOString();
      
      // 👥 DATOS DEL CLIENTE
      const client = {
        id: clientId,
        name: row.Id_Client || 'Sin nombre',
        email: row.Id_Mail || '',
        phone: row.Id_Cellphone || '',
        address: row.Id_Direction || '',
        password_hash: row.Id_PassAccount || 'default123', // En producción usar hash real
        status: 'active',
        registration_date: timestamp,
        last_visit: timestamp,
        total_visits: parseInt(row.Active_Orders) || 0,
        total_spent: 0,
        notes: '',
        created_at: timestamp,
        updated_at: timestamp
      };
      clients.push(client);
      
      // 🚗 VEHÍCULOS (si tiene datos de vehículo)
      if (row.Vehicles_Name && row.Vehicles_Model) {
        const vehicle = {
          id: `vehicle-${clientId}-1`,
          client_id: clientId,
          make: row.Vehicles_Name || '',
          model: row.Vehicles_Model || '',
          year: new Date().getFullYear(), // Año actual por defecto
          license_plate: '',
          vin: '',
          color: '',
          mileage: parseInt(row.Kilometraje) || 0,
          status: 'active',
          notes: '',
          created_at: timestamp,
          updated_at: timestamp
        };
        vehicles.push(vehicle);
      }
      
      // 📋 ÓRDENES DE TRABAJO (si tiene órdenes activas)
      const activeOrders = parseInt(row.Active_Orders) || 0;
      for (let i = 1; i <= activeOrders; i++) {
        const workOrder = {
          id: `order-${clientId}-${i}`,
          client_id: clientId,
          vehicle_id: vehicles.length > 0 ? vehicles[vehicles.length - 1].id : '',
          title: `Orden de trabajo #${i}`,
          description: 'Orden migrada desde sistema anterior',
          status: 'pending',
          priority: 'medium',
          estimated_cost: 0,
          actual_cost: 0,
          start_date: timestamp,
          estimated_completion: timestamp,
          actual_completion: '',
          mechanic_id: '',
          notes: '',
          created_at: timestamp,
          updated_at: timestamp
        };
        workOrders.push(workOrder);
      }
      
      // 📅 CITAS (si tiene citas programadas)
      const nextAppointments = parseInt(row.Next_Appointments) || 0;
      for (let i = 1; i <= nextAppointments; i++) {
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + (i * 7)); // Citas semanales
        
        const appointment = {
          id: `appointment-${clientId}-${i}`,
          client_id: clientId,
          vehicle_id: vehicles.length > 0 ? vehicles[vehicles.length - 1].id : '',
          title: `Cita programada #${i}`,
          description: 'Cita migrada desde sistema anterior',
          appointment_date: appointmentDate.toISOString(),
          duration: 60,
          status: 'scheduled',
          service_type: 'maintenance',
          mechanic_id: '',
          notes: '',
          created_at: timestamp,
          updated_at: timestamp
        };
        appointments.push(appointment);
      }
    });
    
    // Escribir archivos CSV migrados
    await writeClientsCSV(clients);
    await writeVehiclesCSV(vehicles);
    await writeWorkOrdersCSV(workOrders);
    await writeAppointmentsCSV(appointments);
    
    // Crear backup del archivo original
    const backupPath = path.join(dataPath, 'backup', `Client_Database_original_${Date.now()}.csv`);
    await fs.copy(sourceFile, backupPath);
    
    console.log('✅ MIGRACIÓN COMPLETADA:');
    console.log(`   👥 ${clients.length} clientes`);
    console.log(`   🚗 ${vehicles.length} vehículos`);
    console.log(`   📋 ${workOrders.length} órdenes de trabajo`);
    console.log(`   📅 ${appointments.length} citas`);
    console.log(`   💾 Backup creado en: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

// Funciones auxiliares
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' })) // CSV usa punto y coma
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function writeClientsCSV(clients) {
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, '../data/clients/clients.csv'),
    header: [
      { id: 'id', title: 'id' },
      { id: 'name', title: 'name' },
      { id: 'email', title: 'email' },
      { id: 'phone', title: 'phone' },
      { id: 'address', title: 'address' },
      { id: 'password_hash', title: 'password_hash' },
      { id: 'status', title: 'status' },
      { id: 'registration_date', title: 'registration_date' },
      { id: 'last_visit', title: 'last_visit' },
      { id: 'total_visits', title: 'total_visits' },
      { id: 'total_spent', title: 'total_spent' },
      { id: 'notes', title: 'notes' },
      { id: 'created_at', title: 'created_at' },
      { id: 'updated_at', title: 'updated_at' }
    ]
  });
  await csvWriter.writeRecords(clients);
}

async function writeVehiclesCSV(vehicles) {
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, '../data/vehicles/vehicles.csv'),
    header: [
      { id: 'id', title: 'id' },
      { id: 'client_id', title: 'client_id' },
      { id: 'make', title: 'make' },
      { id: 'model', title: 'model' },
      { id: 'year', title: 'year' },
      { id: 'license_plate', title: 'license_plate' },
      { id: 'vin', title: 'vin' },
      { id: 'color', title: 'color' },
      { id: 'mileage', title: 'mileage' },
      { id: 'status', title: 'status' },
      { id: 'notes', title: 'notes' },
      { id: 'created_at', title: 'created_at' },
      { id: 'updated_at', title: 'updated_at' }
    ]
  });
  await csvWriter.writeRecords(vehicles);
}

async function writeWorkOrdersCSV(workOrders) {
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, '../data/services/work_orders.csv'),
    header: [
      { id: 'id', title: 'id' },
      { id: 'client_id', title: 'client_id' },
      { id: 'vehicle_id', title: 'vehicle_id' },
      { id: 'title', title: 'title' },
      { id: 'description', title: 'description' },
      { id: 'status', title: 'status' },
      { id: 'priority', title: 'priority' },
      { id: 'estimated_cost', title: 'estimated_cost' },
      { id: 'actual_cost', title: 'actual_cost' },
      { id: 'start_date', title: 'start_date' },
      { id: 'estimated_completion', title: 'estimated_completion' },
      { id: 'actual_completion', title: 'actual_completion' },
      { id: 'mechanic_id', title: 'mechanic_id' },
      { id: 'notes', title: 'notes' },
      { id: 'created_at', title: 'created_at' },
      { id: 'updated_at', title: 'updated_at' }
    ]
  });
  await csvWriter.writeRecords(workOrders);
}

async function writeAppointmentsCSV(appointments) {
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, '../data/appointments/appointments.csv'),
    header: [
      { id: 'id', title: 'id' },
      { id: 'client_id', title: 'client_id' },
      { id: 'vehicle_id', title: 'vehicle_id' },
      { id: 'title', title: 'title' },
      { id: 'description', title: 'description' },
      { id: 'appointment_date', title: 'appointment_date' },
      { id: 'duration', title: 'duration' },
      { id: 'status', title: 'status' },
      { id: 'service_type', title: 'service_type' },
      { id: 'mechanic_id', title: 'mechanic_id' },
      { id: 'notes', title: 'notes' },
      { id: 'created_at', title: 'created_at' },
      { id: 'updated_at', title: 'updated_at' }
    ]
  });
  await csvWriter.writeRecords(appointments);
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateClientDatabase()
    .then(() => {
      console.log('🎉 Migración exitosa!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateClientDatabase };