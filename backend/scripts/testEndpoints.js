const http = require('http');

// Función para hacer requests HTTP simples
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testEndpoints() {
    const baseUrl = 'localhost';
    const port = 8080;

    console.log('🧪 Probando endpoints de importación Excel...\n');

    try {
        // Probar endpoint de estado
        console.log('📊 Probando GET /api/excel-import/status');
        const statusResponse = await makeRequest({
            hostname: baseUrl,
            port: port,
            path: '/api/excel-import/status',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${statusResponse.statusCode}`);
        if (statusResponse.statusCode === 200) {
            const statusData = JSON.parse(statusResponse.body);
            console.log(`   ✅ Total clientes: ${statusData.stats.totalClients}`);
            console.log(`   ✅ Total vehículos: ${statusData.stats.totalVehicles}`);
        } else {
            console.log(`   ❌ Error: ${statusResponse.body}`);
        }

        // Probar endpoint de plantilla
        console.log('\n. Probando GET /api/excel-import/template');
        const templateResponse = await makeRequest({
            hostname: baseUrl,
            port: port,
            path: '/api/excel-import/template',
            method: 'GET'
        });

        console.log(`   Status: ${templateResponse.statusCode}`);
        if (templateResponse.statusCode === 200) {
            console.log(`   ✅ Plantilla disponible (${templateResponse.headers['content-length']} bytes)`);
            console.log(`   ✅ Content-Type: ${templateResponse.headers['content-type']}`);
        } else {
            console.log(`   ❌ Error: ${templateResponse.body}`);
        }

        console.log('\n✅ Pruebas de endpoints completadas!');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
    testEndpoints();
}

module.exports = { testEndpoints };