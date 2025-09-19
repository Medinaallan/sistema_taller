const ExcelImportService = require('../services/excelImportService');

async function testClientProcessing() {
    console.log('🧪 Probando procesamiento de clientes con campos completos...\n');

    const service = new ExcelImportService();

    // Datos de prueba que coinciden con la nueva estructura
    const testClientsData = [
        {
            name: 'Cliente Test Completo',
            email: 'completo@test.com',
            phone: '9999-0001',
            address: 'Dirección completa de prueba',
            password: 'password123'
        },
        {
            name: 'Cliente Sin Dirección',
            email: 'sindireccion@test.com', 
            phone: '9999-0002',
            address: '', // Dirección vacía (opcional)
            password: 'mypassword456'
        },
        {
            name: 'Cliente Sin Password',
            email: 'sinpassword@test.com',
            phone: '9999-0003',
            address: 'Otra dirección',
            // password faltante - debe ser omitido
        },
        {
            name: '', // Nombre vacío - debe ser omitido
            email: 'nombrevacio@test.com',
            phone: '9999-0004',
            address: 'Dirección',
            password: 'password'
        }
    ];

    try {
        console.log('📋 Datos de entrada:');
        testClientsData.forEach((client, index) => {
            console.log(`   ${index + 1}. ${client.name || '[VACÍO]'} - ${client.email} - ${client.password || '[SIN PASSWORD]'}`);
        });

        console.log('\n🔄 Procesando clientes...');
        const processedClients = await service.processClientsData(testClientsData);

        console.log(`\n✅ Procesamiento completado:`);
        console.log(`   📊 Clientes procesados: ${processedClients.length} de ${testClientsData.length}`);
        
        console.log('\n📋 Clientes válidos procesados:');
        processedClients.forEach((client, index) => {
            console.log(`   ${index + 1}. Nombre: ${client.name}`);
            console.log(`      📧 Email: ${client.email}`);
            console.log(`      📞 Teléfono: ${client.phone}`);
            console.log(`      🏠 Dirección: ${client.address || '[VACÍA]'}`);
            console.log(`      🔐 Password: ${client.password_hash}`);
            console.log(`      🆔 ID: ${client.id}`);
            console.log(`      📅 Fecha registro: ${client.registration_date}`);
            console.log('');
        });

        // Verificar que los campos obligatorios están presentes
        const camposCompletos = processedClients.every(client => 
            client.name && client.email && client.phone && client.password_hash
        );

        console.log(`🔍 Validación de campos obligatorios: ${camposCompletos ? '✅ PASÓ' : '❌ FALLÓ'}`);

        // Verificar que la dirección puede ser opcional
        const direccionOpcional = processedClients.some(client => client.address === '');
        console.log(`🔍 Dirección como campo opcional: ${direccionOpcional ? '✅ PASÓ' : '❌ NO SE PROBÓ'}`);

        console.log('\n🎉 Prueba completada exitosamente!');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
        console.error(error.stack);
    }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    testClientProcessing();
}

module.exports = { testClientProcessing };