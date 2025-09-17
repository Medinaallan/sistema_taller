// Test de API endpoints de clientes
const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8081,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🧪 INICIANDO TESTS DE API CLIENTES\n');

    // 1. Test GET /api/clients
    console.log('1️⃣ Testing GET /api/clients...');
    const getAllResult = await makeRequest('GET', '/api/clients');
    console.log(`Status: ${getAllResult.status}`);
    console.log(`Clientes encontrados: ${getAllResult.data.total}`);
    console.log(`Primer cliente: ${getAllResult.data.data[0]?.name}\n`);

    // 2. Test GET /api/clients/:id
    if (getAllResult.data.data.length > 0) {
      const clientId = getAllResult.data.data[0].id;
      console.log(`2️⃣ Testing GET /api/clients/${clientId}...`);
      const getOneResult = await makeRequest('GET', `/api/clients/${clientId}`);
      console.log(`Status: ${getOneResult.status}`);
      console.log(`Cliente: ${getOneResult.data.data?.name}\n`);
    }

    // 3. Test POST /api/clients
    console.log('3️⃣ Testing POST /api/clients...');
    const newClient = {
      name: 'Cliente Test API',
      email: 'test@api.com',
      phone: '555-0123',
      address: 'Dirección Test API',
      notes: 'Cliente creado via API test'
    };
    const createResult = await makeRequest('POST', '/api/clients', newClient);
    console.log(`Status: ${createResult.status}`);
    console.log(`Cliente creado: ${createResult.data.data?.name} (ID: ${createResult.data.data?.id})\n`);

    // 4. Test PUT /api/clients/:id
    if (createResult.data.data?.id) {
      console.log(`4️⃣ Testing PUT /api/clients/${createResult.data.data.id}...`);
      const updateData = { phone: '555-9999', notes: 'Cliente actualizado via API test' };
      const updateResult = await makeRequest('PUT', `/api/clients/${createResult.data.data.id}`, updateData);
      console.log(`Status: ${updateResult.status}`);
      console.log(`Cliente actualizado: ${updateResult.data.data?.phone}\n`);
    }

    // 5. Test DELETE /api/clients/:id
    if (createResult.data.data?.id) {
      console.log(`5️⃣ Testing DELETE /api/clients/${createResult.data.data.id}...`);
      const deleteResult = await makeRequest('DELETE', `/api/clients/${createResult.data.data.id}`);
      console.log(`Status: ${deleteResult.status}`);
      console.log(`Mensaje: ${deleteResult.data.message}\n`);
    }

    // 6. Test GET /api/clients/stats
    console.log('6️⃣ Testing GET /api/clients/stats...');
    const statsResult = await makeRequest('GET', '/api/clients/stats');
    console.log(`Status: ${statsResult.status}`);
    console.log(`Total clientes: ${statsResult.data.data?.totalRecords}`);
    console.log(`Clientes activos: ${statsResult.data.data?.activeClients}\n`);

    console.log('✅ TODOS LOS TESTS COMPLETADOS');

  } catch (error) {
    console.error('❌ Error en tests:', error);
  }
}

// Ejecutar tests
testAPI();