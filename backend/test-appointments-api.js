const fetch = require('node-fetch');

// Configuración
const API_BASE_URL = 'http://localhost:8080/api';

// Función para probar la creación de una cita
async function testCreateAppointment() {
  try {
    console.log('🧪 Probando creación de cita...');
    
    const appointmentData = {
      clienteId: 'CLI-001',
      vehiculoId: 'VEH-001',
      fecha: '2025-10-20',
      hora: '10:00',
      servicio: 'SRV-001',
      estado: 'pending',
      notas: 'Cita de prueba desde el script'
    };

    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cita creada exitosamente:');
      console.log('ID:', result.data.id);
      console.log('Cliente:', result.data.clienteId);
      console.log('Vehículo:', result.data.vehiculoId);
      console.log('Fecha:', result.data.fecha);
      console.log('Hora:', result.data.hora);
      console.log('Estado:', result.data.estado);
      console.log('Notas:', result.data.notas);
      return result.data.id;
    } else {
      console.log('❌ Error creando cita:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    return null;
  }
}

// Función para obtener todas las citas
async function testGetAppointments() {
  try {
    console.log('\n Probando obtención de citas...');
    
    const response = await fetch(`${API_BASE_URL}/appointments`);
    const result = await response.json();
    
    if (result.success) {
      console.log(` Se encontraron ${result.data.length} citas:`);
      result.data.forEach((appointment, index) => {
        console.log(`${index + 1}. ID: ${appointment.id} | Cliente: ${appointment.clienteId} | Fecha: ${appointment.fecha} | Hora: ${appointment.hora}`);
      });
    } else {
      console.log(' Error obteniendo citas:', result.message);
    }
  } catch (error) {
    console.error(' Error en la prueba:', error.message);
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas del API de citas...\n');
  
  // Crear una cita de prueba
  const appointmentId = await testCreateAppointment();
  
  // Obtener todas las citas
  await testGetAppointments();
  
  console.log('\n✨ Pruebas completadas');
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  runTests();
}

module.exports = { testCreateAppointment, testGetAppointments };