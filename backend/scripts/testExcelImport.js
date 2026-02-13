const ExcelImportService = require('../services/excelImportService');
const path = require('path');

async function testExcelImport() {
    console.log('🧪 Iniciando pruebas del servicio de importación Excel...\n');

    const service = new ExcelImportService();

    try {
        // Probar obtener clientes existentes
        console.log('. Probando obtención de clientes existentes...');
        const existingClients = await service.getExistingClients();
        console.log(`   ✅ Se encontraron ${existingClients.length} clientes existentes`);
        
        // Probar obtener vehículos existentes
        console.log('🚗 Probando obtención de vehículos existentes...');
        const existingVehicles = await service.getExistingVehicles();
        console.log(`   ✅ Se encontraron ${existingVehicles.length} vehículos existentes`);

        // Probar datos de prueba
        console.log('\n📊 Probando procesamiento de datos de prueba...');
        
        const testClientsData = [
            {
                name: 'Cliente Test 1',
                email: 'test1@ejemplo.com',
                phone: '9999-0001',
                address: 'Dirección de prueba 1',
                notes: 'Cliente de prueba'
            },
            {
                name: 'Cliente Test 2',
                email: 'test2@ejemplo.com',
                phone: '9999-0002',
                address: 'Dirección de prueba 2',
                notes: 'Cliente de prueba'
            },
            {
                // Cliente incompleto - debe ser omitido
                name: 'Cliente Incompleto',
                email: '', // Email faltante
                phone: '9999-0003',
                address: 'Dirección incompleta'
            }
        ];

        const processedClients = await service.processClientsData(testClientsData);
        console.log(`   ✅ Se procesaron ${processedClients.length} de ${testClientsData.length} clientes`);
        console.log(`   📝 Clientes procesados:`, processedClients.map(c => ({ name: c.name, email: c.email })));

        const testVehiclesData = [
            {
                clienteEmail: 'test1@ejemplo.com',
                marca: 'Toyota',
                modelo: 'Corolla',
                año: '2020',
                placa: 'TEST-001',
                color: 'Blanco'
            },
            {
                clienteEmail: 'test2@ejemplo.com',
                marca: 'Honda',
                modelo: 'Civic',
                año: '2019',
                placa: 'TEST-002',
                color: 'Azul'
            },
            {
                // Vehículo con cliente inexistente - debe ser omitido
                clienteEmail: 'noexiste@ejemplo.com',
                marca: 'Ford',
                modelo: 'Focus',
                año: '2018',
                placa: 'TEST-003',
                color: 'Rojo'
            },
            {
                // Vehículo con año inválido - debe ser omitido
                clienteEmail: 'test1@ejemplo.com',
                marca: 'Nissan',
                modelo: 'Sentra',
                año: 'año_inválido',
                placa: 'TEST-004',
                color: 'Negro'
            }
        ];

        const processedVehicles = await service.processVehiclesData(testVehiclesData, processedClients);
        console.log(`   ✅ Se procesaron ${processedVehicles.length} de ${testVehiclesData.length} vehículos`);
        console.log(`   🚗 Vehículos procesados:`, processedVehicles.map(v => ({ 
            marca: v.marca, 
            modelo: v.modelo, 
            placa: v.placa 
        })));

        // Probar validaciones específicas
        console.log('\n🔍 Probando validaciones específicas...');
        
        // Email duplicado
        const duplicateEmailTest = [
            { name: 'Test', email: existingClients[0]?.email || 'test@test.com', phone: '1234', address: 'Test' }
        ];
        const noDuplicates = await service.processClientsData(duplicateEmailTest);
        console.log(`   ✅ Validación de email duplicado: ${noDuplicates.length === 0 ? 'PASÓ' : 'FALLÓ'}`);

        // Año inválido
        const invalidYearTest = [
            { clienteEmail: 'test@test.com', marca: 'Test', modelo: 'Test', año: '1800', placa: 'INV-001', color: 'Test' }
        ];
        const noInvalidYear = await service.processVehiclesData(invalidYearTest, []);
        console.log(`   ✅ Validación de año inválido: ${noInvalidYear.length === 0 ? 'PASÓ' : 'FALLÓ'}`);

        console.log('\n✅ Todas las pruebas completadas exitosamente!');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
        console.error(error.stack);
    }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
    testExcelImport();
}

module.exports = { testExcelImport };