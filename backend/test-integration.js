// Script de prueba para verificar la integración entre login y CSV
const storedProcedures = require('./simulation/storedProcedures');

async function testIntegration() {
  console.log('🧪 Iniciando pruebas de integración...\n');

  // 1. Probar login con usuario del CSV
  console.log('1️⃣ Probando login con ALLAN MEDINA desde CSV...');
  try {
    const loginResult = await storedProcedures.SP_LOGIN('allanmedina@email.com', 'password123');
    console.log('Resultado login:', loginResult);
    if (loginResult.allow === 1) {
      console.log('✅ Login exitoso desde CSV\n');
    } else {
      console.log('❌ Error en login desde CSV\n');
    }
  } catch (error) {
    console.error('❌ Error en login:', error.message, '\n');
  }

  // 2. Probar obtener clientes registrados
  console.log('2️⃣ Obteniendo lista de clientes registrados...');
  try {
    const clients = await storedProcedures.SP_OBTENER_CLIENTES_REGISTRADOS();
    console.log('Clientes encontrados:', clients.length);
    clients.forEach(client => {
      console.log(`   - ${client.fullName} (${client.email})`);
    });
    console.log('✅ Lista de clientes obtenida correctamente\n');
  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error.message, '\n');
  }

  // 3. Probar registro completo
  console.log('3️⃣ Probando registro completo de nuevo cliente...');
  try {
    const testEmail = 'prueba@test.com';
    
    // Paso 1: Registrar usuario
    const regResult = await storedProcedures.SP_REGISTRAR_USUARIO_CLIENTE('Juan Prueba', testEmail, '123456789');
    console.log('Resultado registro:', regResult);
    
    if (regResult.response === '200 OK') {
      console.log('✅ Paso 1 completado: Usuario registrado');
      
      // Paso 2: Verificar código (simular)
      const verifyResult = await storedProcedures.SP_VERIFICAR_CODIGO_SEGURIDAD(testEmail, regResult.codigo_seguridad);
      console.log('Resultado verificación:', verifyResult);
      
      if (verifyResult.allow === 1) {
        console.log('✅ Paso 2 completado: Código verificado');
        
        // Paso 3: Registrar contraseña
        const passResult = await storedProcedures.SP_REGISTRAR_PASSWORD(testEmail, 'test123');
        console.log('Resultado contraseña:', passResult);
        
        if (passResult.allow === 1) {
          console.log('✅ Paso 3 completado: Contraseña registrada');
          
          // Paso 4: Probar login
          const loginTest = await storedProcedures.SP_LOGIN(testEmail, 'test123');
          console.log('Resultado login final:', loginTest);
          
          if (loginTest.allow === 1) {
            console.log('✅ Registro y login completo exitoso');
          } else {
            console.log('❌ Error en login final');
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error en registro completo:', error.message);
  }

  console.log('\n🏁 Pruebas completadas');
}

testIntegration().catch(console.error);