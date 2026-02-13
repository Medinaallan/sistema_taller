const http = require('http');
const fs = require('fs');
const path = require('path');

async function testDownloadEndpoint() {
    console.log('🌐 Probando descarga de plantilla desde endpoint...\n');

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/excel-import/template',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`📡 Status Code: ${res.statusCode}`);
            console.log(`. Headers:`, res.headers);

            if (res.statusCode !== 200) {
                console.error('❌ Error en la respuesta');
                resolve(false);
                return;
            }

            // Guardar el archivo descargado
            const downloadPath = path.join(__dirname, '..', 'templates', 'downloaded-plantilla.xlsx');
            const writeStream = fs.createWriteStream(downloadPath);

            let totalBytes = 0;

            res.on('data', (chunk) => {
                totalBytes += chunk.length;
                writeStream.write(chunk);
            });

            res.on('end', () => {
                writeStream.end();
                
                console.log(`📊 Bytes descargados: ${totalBytes}`);
                console.log(`💾 Archivo guardado en: ${downloadPath}`);

                // Verificar el archivo descargado
                if (fs.existsSync(downloadPath)) {
                    const stats = fs.statSync(downloadPath);
                    console.log(`📏 Tamaño del archivo descargado: ${stats.size} bytes`);

                    // Intentar leer con XLSX
                    try {
                        const XLSX = require('xlsx');
                        const workbook = XLSX.readFile(downloadPath);
                        console.log(`✅ Archivo descargado es válido Excel`);
                        console.log(`📑 Hojas: ${workbook.SheetNames.join(', ')}`);
                        
                        // Limpiar archivo de prueba
                        fs.unlinkSync(downloadPath);
                        console.log('🧹 Archivo de prueba eliminado');
                        
                        console.log('\n🎉 ¡Descarga exitosa y archivo válido!');
                        resolve(true);
                    } catch (error) {
                        console.error('❌ Error leyendo archivo descargado:', error.message);
                        resolve(false);
                    }
                } else {
                    console.error('❌ No se pudo crear el archivo descargado');
                    resolve(false);
                }
            });

            res.on('error', (error) => {
                console.error('❌ Error en la respuesta:', error.message);
                resolve(false);
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error en la petición:', error.message);
            console.log('💡 Asegúrate de que el servidor esté corriendo en puerto 8080');
            resolve(false);
        });

        req.end();
    });
}

// Ejecutar test si se llama directamente
if (require.main === module) {
    testDownloadEndpoint().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testDownloadEndpoint };