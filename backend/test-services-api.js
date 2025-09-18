// Script simple para probar la API de servicios
const http = require('http');

function testAPI() {
  // Probar GET
  console.log('🧪 Probando GET /api/services...');
  
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/services',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('Response body:', body);
      
      // Ahora probar POST
      testPOST();
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error en GET: ${e.message}`);
  });

  req.end();
}

function testPOST() {
  console.log('\n🧪 Probando POST /api/services...');
  
  const postData = JSON.stringify({
    nombre: 'Servicio de Prueba',
    descripcion: 'Descripción de prueba',
    precio: 100.50,
    duracion: '2 horas',
    categoria: 'mantenimiento'
  });

  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/services',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('Response body:', body);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error en POST: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

testAPI();