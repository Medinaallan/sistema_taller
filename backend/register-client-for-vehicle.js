const { getConnection } = require('./config/database');

async function registerClientAndGetId() {
  try {
    const pool = await getConnection();
    
    console.log('🎯 Registrando cliente y obteniendo información...\n');
    
    // Registrar cliente
    const clientData = {
      nombre_completo: 'Cliente Prueba Para Vehiculo',
      telefono: '555-9999',
      correo: 'vehiculo@test.com'
    };
    
    console.log('👤 Registrando cliente:', clientData);
    const registerResult = await pool.request()
      .input('nombre_completo', clientData.nombre_completo)
      .input('telefono', clientData.telefono)
      .input('correo', clientData.correo)
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');
    
    console.log('✅ Cliente registrado:', registerResult.recordset[0]);
    
    // Ahora vamos a buscar manualmente qué ID se le asignó
    // Probemos con los IDs más altos (los últimos registrados)
    console.log('\n🔍 Probando IDs para encontrar el cliente recién creado...');
    
    for (let testId = 1; testId <= 20; testId++) {
      try {
        const vehicleTestResult = await pool.request()
          .input('cliente_id', testId)
          .input('marca', `Test${testId}`)
          .input('modelo', `Model${testId}`)
          .input('anio', 2023)
          .input('placa', `TST${testId.toString().padStart(3, '0')}`)
          .input('color', 'Rojo')
          .execute('SP_REGISTRAR_VEHICULO');
          
        console.log(`✅ ID ${testId} FUNCIONA! - Vehículo creado:`, vehicleTestResult.recordset[0]);
        
        // Limpiar el vehículo de prueba si es posible
        try {
          await pool.request()
            .input('vehiculo_id', vehicleTestResult.recordset[0].vehiculo_id)
            .execute('SP_ELIMINAR_VEHICULO');
          console.log(`🗑️ Vehículo de prueba ${testId} eliminado`);
        } catch (deleteError) {
          console.log(`⚠️ No se pudo eliminar vehículo de prueba ${testId}:`, deleteError.message);
        }
        
        if (testId <= 10) {
          console.log(`\n📋 RESUMEN: El cliente_id ${testId} existe y se puede usar.\n`);
        }
        
      } catch (error) {
        if (error.message.includes('FOREIGN KEY constraint')) {
          // Este ID no existe, continuar
          continue;
        } else {
          console.log(`❌ Error con ID ${testId}:`, error.message);
        }
      }
    }
    
    console.log('\n🎯 INSTRUCCIONES PARA EL USUARIO:');
    console.log('1. Ve al frontend y haz clic en "Agregar Vehículo"');
    console.log('2. En el campo "ID del Cliente", ingresa uno de los IDs que funcionaron arriba');
    console.log('3. Completa los demás campos del vehículo');
    console.log('4. Haz clic en "Crear Vehículo"');
    console.log('5. Si aparece error de clave foránea, prueba con otro ID\n');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

registerClientAndGetId();