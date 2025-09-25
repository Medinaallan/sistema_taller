const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testExcelImportEndpoints() {
    console.log('🧪 Iniciando pruebas de endpoints de importación Excel...\n');

    const serverUrl = 'http://localhost:3001';
    const templatePath = path.join(__dirname, '..', 'templates', 'plantilla-importacion-clientes-vehiculos.xlsx');

    try {
        // 1. Probar descarga de plantilla
        console.log('📥 Probando descarga de plantilla...');
        const templateResponse = await fetch(`${serverUrl}/api/excel-import/template`);
        
        if (templateResponse.ok) {
            console.log('✅ Plantilla descargada correctamente');
        } else {
            console.log('❌ Error descargando plantilla:', templateResponse.status, templateResponse.statusText);
            return;
        }

        // 2. Verificar que existe un archivo de plantilla para usar en pruebas
        if (!fs.existsSync(templatePath)) {
            console.log('⚠️  Archivo de plantilla no encontrado, creando...');
            const { createCompatibleExcelTemplate } = require('./createCompatibleExcel');
            await createCompatibleExcelTemplate();
        }

        // 3. Probar vista previa
        console.log('\n👀 Probando vista previa de Excel...');
        const previewForm = new FormData();
        previewForm.append('excelFile', fs.createReadStream(templatePath), 'test-plantilla.xlsx');

        const previewResponse = await fetch(`${serverUrl}/api/excel-import/preview`, {
            method: 'POST',
            body: previewForm,
            headers: previewForm.getHeaders(),
        });

        if (previewResponse.ok) {
            const previewResult = await previewResponse.json();
            console.log('✅ Vista previa generada correctamente');
            console.log(`   📊 Clientes encontrados: ${previewResult.clients?.length || 0}`);
            console.log(`   🚗 Vehículos encontrados: ${previewResult.vehicles?.length || 0}`);
            console.log(`   ⚠️  Errores de validación: ${previewResult.validationErrors?.length || 0}`);
            console.log(`   📝 Advertencias: ${previewResult.warnings?.length || 0}`);

            // 4. Probar confirmación de importación (si hay archivo temporal)
            if (previewResult.tempFilePath) {
                console.log('\n💾 Probando confirmación de importación...');
                
                const confirmResponse = await fetch(`${serverUrl}/api/excel-import/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tempFilePath: previewResult.tempFilePath
                    }),
                });

                if (confirmResponse.ok) {
                    const confirmResult = await confirmResponse.json();
                    console.log('✅ Importación confirmada correctamente');
                    console.log(`   📊 Clientes procesados: ${confirmResult.stats?.clientsProcessed || 0}`);
                    console.log(`   🚗 Vehículos procesados: ${confirmResult.stats?.vehiclesProcessed || 0}`);
                } else {
                    const errorResult = await confirmResponse.text();
                    console.log('❌ Error en confirmación:', confirmResponse.status, errorResult);
                }
            } else {
                console.log('⚠️  No se encontró archivo temporal para confirmar importación');
            }

        } else {
            const errorResult = await previewResponse.text();
            console.log('❌ Error en vista previa:', previewResponse.status, errorResult);
        }

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n🏁 Pruebas completadas');
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
    testExcelImportEndpoints();
}

module.exports = { testExcelImportEndpoints };