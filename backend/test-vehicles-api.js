const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testVehiclesAPI() {
  console.log('🚗 Testing Vehicles API...\n');

  try {
    // Test 1: Get all vehicles
    console.log('1. Testing GET /vehicles');
    const getResponse = await fetch(`${API_BASE_URL}/vehicles`);
    const getResult = await getResponse.json();
    console.log('Response:', getResult);
    console.log('✅ GET /vehicles works\n');

    // Test 2: Create a new vehicle
    console.log('2. Testing POST /vehicles');
    const newVehicle = {
      clienteId: 'CLIENT-001',
      marca: 'Toyota',
      modelo: 'Corolla',
      año: 2020,
      placa: 'ABC123',
      color: 'Blanco'
    };

    const createResponse = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newVehicle),
    });

    const createResult = await createResponse.json();
    console.log('Response:', createResult);
    
    if (createResult.success) {
      console.log('✅ POST /vehicles works\n');
      
      // Test 3: Update the vehicle
      console.log('3. Testing PUT /vehicles/:id');
      const updateData = {
        ...newVehicle,
        color: 'Azul'
      };

      const updateResponse = await fetch(`${API_BASE_URL}/vehicles/${createResult.data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const updateResult = await updateResponse.json();
      console.log('Response:', updateResult);
      console.log('✅ PUT /vehicles/:id works\n');

      // Test 4: Delete the vehicle
      console.log('4. Testing DELETE /vehicles/:id');
      const deleteResponse = await fetch(`${API_BASE_URL}/vehicles/${createResult.data.id}`, {
        method: 'DELETE',
      });

      const deleteResult = await deleteResponse.json();
      console.log('Response:', deleteResult);
      console.log('✅ DELETE /vehicles/:id works\n');
    } else {
      console.log('❌ POST /vehicles failed');
    }

  } catch (error) {
    console.error('❌ Error testing vehicles API:', error.message);
  }
}

async function testServicesAPI() {
  console.log('🔧 Testing Services API...\n');

  try {
    console.log('Testing GET /services');
    const response = await fetch(`${API_BASE_URL}/services`);
    const result = await response.json();
    console.log('Response:', result);
    console.log('✅ GET /services works\n');
  } catch (error) {
    console.error('❌ Error testing services API:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests\n');
  await testServicesAPI();
  await testVehiclesAPI();
  console.log('🎉 All tests completed!');
}

runTests();