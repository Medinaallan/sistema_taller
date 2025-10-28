// Test script to simulate quotation approval and work order creation
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testWorkOrderCreation() {
  console.log('🔧 Probando creación de orden de trabajo...');
  
  // Primero obtener cotizaciones existentes
  console.log('1. Obteniendo cotizaciones...');
  try {
    const quotationsResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/quotations',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Cotizaciones obtenidas:', quotationsResponse.statusCode);
    console.log('Cotizaciones:', JSON.stringify(quotationsResponse.data, null, 2));
    
    // Encontrar una cotización en estado "sent"
    const sentQuotations = quotationsResponse.data.data?.filter(q => q.estado === 'sent') || [];
    
    if (sentQuotations.length === 0) {
      console.log('❌ No hay cotizaciones en estado "sent" para aprobar');
      return;
    }
    
    const quotationToApprove = sentQuotations[0];
    console.log('2. Cotización a aprobar:', quotationToApprove.id);
    
    // Aprobar la cotización
    console.log('3. Aprobando cotización...');
    const approvalResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: `/api/quotations/${quotationToApprove.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    }, { estado: 'approved' });
    
    console.log('✅ Cotización aprobada:', approvalResponse.statusCode);
    console.log('Respuesta:', JSON.stringify(approvalResponse.data, null, 2));
    
    // Crear orden de trabajo desde la cotización
    console.log('4. Creando orden de trabajo desde cotización...');
    const workOrderResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/workorders/from-quotation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, { quotation: quotationToApprove });
    
    console.log('✅ Orden de trabajo creada:', workOrderResponse.statusCode);
    console.log('Nueva orden:', JSON.stringify(workOrderResponse.data, null, 2));
    
    // Verificar que se creó la orden de trabajo
    console.log('5. Verificando órdenes de trabajo existentes...');
    const workOrdersResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/workorders',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Órdenes de trabajo actuales:', workOrdersResponse.statusCode);
    console.log('Órdenes:', JSON.stringify(workOrdersResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testWorkOrderCreation();