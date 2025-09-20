const csvService = require('../services/csvService');
const { getConnection, sql } = require('../config/database');

// Cargar variables de entorno
require('dotenv').config();

/**
 * Script para sincronizar clientes CSV con sistema de autenticación SQL Server
 */
async function syncClientsWithAuth() {
    console.log('🔄 Iniciando sincronización de clientes CSV con sistema de autenticación...\n');

    try {
        // Leer todos los clientes del CSV
        const clients = await csvService.readCSV('clients', 'clients.csv');
        console.log(`📋 Encontrados ${clients.length} clientes en CSV`);

        let syncedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const client of clients) {
            try {
                console.log(`\n🔄 Procesando cliente: ${client.name} (${client.email})`);

                // Verificar campos requeridos
                if (!client.email || !client.name || !client.phone) {
                    console.log(`   ⚠️ Saltando - faltan campos requeridos`);
                    skippedCount++;
                    continue;
                }

                // Intentar registrar en SQL Server
                const pool = await getConnection();
                const sqlResult = await pool.request()
                    .input('Email', sql.VarChar(255), client.email)
                    .input('Password', sql.VarChar(255), client.password_hash || 'default123')
                    .input('FullName', sql.VarChar(255), client.name)
                    .input('Phone', sql.VarChar(20), client.phone)
                    .input('Address', sql.VarChar(500), client.address || '')
                    .input('CompanyName', sql.VarChar(255), '') // Campo opcional
                    .execute('SP_REGISTRAR_USUARIO_CLIENTE');

                const authResult = sqlResult.recordset[0];
                
                if (authResult && authResult.Success) {
                    console.log(`   ✅ Sincronizado exitosamente`);
                    console.log(`   🔑 Código de seguridad: ${authResult.SecurityCode}`);
                    syncedCount++;
                } else {
                    console.log(`   ⚠️ No se pudo sincronizar: ${authResult?.Message || 'Error desconocido'}`);
                    if (authResult?.Message && authResult.Message.includes('ya existe')) {
                        console.log(`   ℹ️ Cliente ya existe en sistema de autenticación`);
                        skippedCount++;
                    } else {
                        errorCount++;
                    }
                }

            } catch (error) {
                console.error(`   ❌ Error procesando ${client.email}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Resumen de sincronización:');
        console.log(`   ✅ Sincronizados: ${syncedCount}`);
        console.log(`   ⚠️ Omitidos: ${skippedCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📋 Total procesados: ${clients.length}`);

        if (syncedCount > 0) {
            console.log('\n🎉 Sincronización completada! Los clientes ya pueden hacer login.');
        } else {
            console.log('\n⚠️ No se sincronizaron nuevos clientes.');
        }

    } catch (error) {
        console.error('❌ Error durante la sincronización:', error.message);
        console.error(error.stack);
    }
}

// Función para sincronizar un cliente específico
async function syncSpecificClient(email) {
    console.log(`🔄 Sincronizando cliente específico: ${email}\n`);

    try {
        // Buscar cliente en CSV
        const clients = await csvService.readCSV('clients', 'clients.csv');
        const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());

        if (!client) {
            console.error(`❌ Cliente no encontrado en CSV: ${email}`);
            return false;
        }

        console.log(`📋 Cliente encontrado: ${client.name}`);
        console.log(`   📧 Email: ${client.email}`);
        console.log(`   📞 Teléfono: ${client.phone}`);
        console.log(`   🏠 Dirección: ${client.address || '[Sin dirección]'}`);
        console.log(`   🔐 Password: ${client.password_hash}`);

        // Registrar en SQL Server
        const pool = await getConnection();
        const sqlResult = await pool.request()
            .input('Email', sql.VarChar(255), client.email)
            .input('Password', sql.VarChar(255), client.password_hash || 'default123')
            .input('FullName', sql.VarChar(255), client.name)
            .input('Phone', sql.VarChar(20), client.phone)
            .input('Address', sql.VarChar(500), client.address || '')
            .input('CompanyName', sql.VarChar(255), '')
            .execute('SP_REGISTRAR_USUARIO_CLIENTE');

        const authResult = sqlResult.recordset[0];
        
        if (authResult && authResult.Success) {
            console.log('\n✅ Cliente sincronizado exitosamente!');
            console.log(`🔑 Código de seguridad: ${authResult.SecurityCode}`);
            console.log('🎉 El cliente ya puede hacer login!');
            return true;
        } else {
            console.log(`\n❌ No se pudo sincronizar: ${authResult?.Message || 'Error desconocido'}`);
            return false;
        }

    } catch (error) {
        console.error('❌ Error durante la sincronización:', error.message);
        return false;
    }
}

// Ejecutar según argumentos de línea de comandos
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Sincronizar cliente específico
        const email = args[0];
        syncSpecificClient(email).then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        // Sincronizar todos los clientes
        syncClientsWithAuth().then(() => {
            process.exit(0);
        }).catch(() => {
            process.exit(1);
        });
    }
}

module.exports = { syncClientsWithAuth, syncSpecificClient };