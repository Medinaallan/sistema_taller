/**
 * 🔄 MIGRACIÓN DE CLIENT_DATABASE.CSV AL NUEVO SISTEMA
 * 
 * Este script migra los datos del CSV viejo (src/Client_Database.csv) 
 * al nuevo sistema CSV normalizado (backend/data/clients/clients.csv)
 */

const fs = require('fs').promises;
const path = require('path');
const csvService = require('../services/csvService');

// Archivos
const OLD_CSV = path.join(__dirname, '../../src/Client_Database.csv');
const MODULE = 'clients';
const CSV_FILE = 'clients.csv';

// Headers del nuevo CSV
const CLIENT_HEADERS = [
  'id', 'name', 'email', 'phone', 'address', 'password_hash', 
  'status', 'registration_date', 'last_visit', 'total_visits', 
  'total_spent', 'notes', 'created_at', 'updated_at'
];

async function migrarClientesDelCSVViejo() {
  try {
    console.log('🔄 INICIANDO MIGRACIÓN DEL CSV VIEJO...\n');

    // 1. Leer el CSV viejo
    console.log('📖 Leyendo CSV viejo:', OLD_CSV);
    const csvContent = await fs.readFile(OLD_CSV, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`   ${lines.length} líneas encontradas`);
    
    // 2. Parsear datos (formato viejo separado por ;)
    const dataLines = lines.slice(1); // Saltar header
    const clientesViejos = [];
    
    dataLines.forEach((line, index) => {
      const columns = line.split(';');
      if (columns.length >= 5) {
        clientesViejos.push({
          nombre: columns[0] || '',
          telefono: columns[1] || '',
          email: columns[2] || '',
          direccion: columns[3] || '',
          password: columns[4] || '',
          vehiculos: parseInt(columns[5]) || 0,
          vehiculoNombre: columns[6] || '',
          vehiculoModelo: columns[7] || '',
          kilometraje: parseInt(columns[11]) || 0
        });
      }
    });
    
    console.log(`   ${clientesViejos.length} clientes válidos encontrados\n`);

    // 3. Verificar el CSV nuevo
    let clientesNuevos = [];
    try {
      clientesNuevos = await csvService.readCSV(MODULE, CSV_FILE);
      console.log(`📋 CSV nuevo tiene ${clientesNuevos.length} clientes existentes`);
    } catch (error) {
      console.log('📋 CSV nuevo no existe, se creará desde cero');
    }

    // 4. Migrar clientes (evitar duplicados por email)
    const emailsExistentes = new Set(clientesNuevos.map(c => c.email.toLowerCase()));
    let migrados = 0;
    let omitidos = 0;

    for (const clienteViejo of clientesViejos) {
      const email = clienteViejo.email.toLowerCase().trim();
      
      // Verificar si ya existe
      if (emailsExistentes.has(email) || !email) {
        omitidos++;
        console.log(`   ⚠️  Omitido: ${clienteViejo.nombre || 'Sin nombre'} (${email || 'sin email'})`);
        continue;
      }
      
      // Convertir al formato nuevo
      const clienteNuevo = {
        name: clienteViejo.nombre || 'Cliente Migrado',
        email: email,
        phone: clienteViejo.telefono || '',
        address: clienteViejo.direccion || '',
        password_hash: clienteViejo.password || 'migrado123',
        status: 'active',
        registration_date: new Date().toISOString(),
        last_visit: '',
        total_visits: 0,
        total_spent: 0,
        notes: `Migrado del CSV viejo. Vehículos: ${clienteViejo.vehiculos}, Veh: ${clienteViejo.vehiculoNombre} ${clienteViejo.vehiculoModelo}, KM: ${clienteViejo.kilometraje}`
      };
      
      try {
        const created = await csvService.createRecord(MODULE, CSV_FILE, clienteNuevo, CLIENT_HEADERS);
        migrados++;
        emailsExistentes.add(email);
        console.log(`   ✅ Migrado: ${created.name} (${created.email})`);
      } catch (error) {
        console.error(`   ❌ Error migrando ${clienteViejo.email}:`, error.message);
        omitidos++;
      }
    }

    // 5. Resumen
    console.log('\n🎉 MIGRACIÓN COMPLETADA:');
    console.log(`   📊 Clientes en CSV viejo: ${clientesViejos.length}`);
    console.log(`   ✅ Migrados exitosamente: ${migrados}`);
    console.log(`   ⚠️  Omitidos (duplicados/inválidos): ${omitidos}`);
    console.log(`   📋 Total en CSV nuevo: ${clientesNuevos.length + migrados}`);

    // 6. Crear backup del CSV viejo
    const backupPath = OLD_CSV + '.backup.' + Date.now();
    await fs.copyFile(OLD_CSV, backupPath);
    console.log(`   💾 Backup creado: ${backupPath}\n`);

    return {
      migrados,
      omitidos,
      total: clientesViejos.length
    };

  } catch (error) {
    console.error('❌ ERROR EN MIGRACIÓN:', error);
    throw error;
  }
}

// Ejecutar migración si se ejecuta directamente
if (require.main === module) {
  migrarClientesDelCSVViejo()
    .then(resultado => {
      console.log('✅ Migración completada:', resultado);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migración falló:', error);
      process.exit(1);
    });
}

module.exports = { migrarClientesDelCSVViejo };