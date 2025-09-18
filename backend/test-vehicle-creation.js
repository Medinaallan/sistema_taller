const https = require('https');
const http = require('http');

// Datos de prueba para crear un vehículo
const vehicleData = {
  clienteId: 'CLIENT-001',
  marca: 'Toyota', 
  modelo: 'Corolla',
  año: 2020,
  placa: 'ABC123',
  color: 'Blanco'
};

// Configuración de la petición
const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/vehicles',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const postData = JSON.stringify(vehicleData);

console.log('🚗 Probando creación de vehículo...');
console.log('📤 Datos a enviar:', vehicleData);

const req = http.request(options, (res) => {
  console.log(`📡 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📥 Respuesta del servidor:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Respuesta no es JSON válido:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la petición:', error);
});

// Enviar los datos
req.write(postData);
req.end();

console.log('⏳ Petición enviada, esperando respuesta...');