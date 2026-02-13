const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function verifyExcelFile() {
    console.log('🔍 Verificando integridad del archivo Excel...\n');

    const templatePath = path.join(__dirname, '..', 'templates', 'plantilla-importacion-clientes-vehiculos.xlsx');

    try {
        // Verificar que el archivo existe
        if (!fs.existsSync(templatePath)) {
            console.error('❌ El archivo no existe:', templatePath);
            return false;
        }

        console.log('✅ Archivo existe:', templatePath);

        // Obtener información del archivo
        const stats = fs.statSync(templatePath);
        console.log(`📊 Tamaño: ${stats.size} bytes`);
        console.log(`📅 Fecha creación: ${stats.birthtime}`);
        console.log(`📝 Fecha modificación: ${stats.mtime}\n`);

        // Intentar leer el archivo con XLSX
        console.log('📖 Intentando leer archivo con XLSX...');
        const workbook = XLSX.readFile(templatePath);
        
        console.log('✅ Archivo leído exitosamente');
        console.log(`📑 Hojas encontradas: ${workbook.SheetNames.join(', ')}\n`);

        // Verificar cada hoja
        for (const sheetName of workbook.SheetNames) {
            console.log(`🔍 Verificando hoja: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            
            if (sheetName === 'Clientes' || sheetName === 'Vehiculos') {
                const data = XLSX.utils.sheet_to_json(worksheet);
                console.log(`   📊 Filas de datos: ${data.length}`);
                
                if (data.length > 0) {
                    console.log(`   🗂️  Columnas: ${Object.keys(data[0]).join(', ')}`);
                }
            } else if (sheetName === 'Instrucciones') {
                const range = worksheet['!ref'];
                console.log(`   📐 Rango: ${range}`);
            }
            
            console.log('   ✅ Hoja válida\n');
        }

        // Intentar escribir un archivo de prueba
        console.log('💾 Creando archivo de prueba...');
        const testPath = path.join(__dirname, '..', 'templates', 'test-plantilla.xlsx');
        XLSX.writeFile(workbook, testPath);
        
        if (fs.existsSync(testPath)) {
            console.log('✅ Archivo de prueba creado exitosamente');
            
            // Leer el archivo de prueba
            const testWorkbook = XLSX.readFile(testPath);
            console.log('✅ Archivo de prueba leído exitosamente');
            
            // Limpiar archivo de prueba
            fs.unlinkSync(testPath);
            console.log('🧹 Archivo de prueba eliminado');
        }

        console.log('\n🎉 Verificación completada exitosamente!');
        console.log('. El archivo Excel es válido y compatible.');
        
        return true;

    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
    verifyExcelFile().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { verifyExcelFile };