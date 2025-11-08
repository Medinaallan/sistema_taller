const { getConnection, sql } = require('../config/database');

async function testStoredProcedures() {
  try {
    console.log('🧪 Probando stored procedures existentes...');
    const pool = await getConnection();
    
    // Test 1: SP_LOGIN
    console.log('\n1️⃣ Probando SP_LOGIN...');
    try {
      const result = await pool.request()
        .input('correo', sql.VarChar(100), 'test@example.com')
        .input('password', sql.VarChar(100), 'test123')
        .execute('SP_LOGIN');
      
      console.log('✅ SP_LOGIN funciona');
      console.log('   Columnas retornadas:', Object.keys(result.recordset[0] || {}));
      console.log('   Resultado:', result.recordset[0]);
    } catch (loginError) {
      console.log('❌ Error en SP_LOGIN:', loginError.message);
    }
    
    // Test 2: SP_VALIDAR_CORREO_USUARIO
    console.log('\n2️⃣ Probando SP_VALIDAR_CORREO_USUARIO...');
    try {
      const result = await pool.request()
        .input('correo', sql.VarChar(100), 'nuevo@test.com')
        .execute('SP_VALIDAR_CORREO_USUARIO');
      
      console.log('✅ SP_VALIDAR_CORREO_USUARIO funciona');
      console.log('   Columnas retornadas:', Object.keys(result.recordset[0] || {}));
      console.log('   Resultado:', result.recordset[0]);
    } catch (validarError) {
      console.log('❌ Error en SP_VALIDAR_CORREO_USUARIO:', validarError.message);
    }
    
    // Test 3: SP_REGISTRAR_USUARIO_CLIENTE
    console.log('\n3️⃣ Probando SP_REGISTRAR_USUARIO_CLIENTE...');
    try {
      const result = await pool.request()
        .input('nombre_completo', sql.VarChar(100), 'Usuario Test')
        .input('correo', sql.VarChar(100), 'usuariotest@example.com')
        .input('telefono', sql.VarChar(30), '123456789')
        .execute('SP_REGISTRAR_USUARIO_CLIENTE');
      
      console.log('✅ SP_REGISTRAR_USUARIO_CLIENTE funciona');
      console.log('   Columnas retornadas:', Object.keys(result.recordset[0] || {}));
      console.log('   Resultado:', result.recordset[0]);
    } catch (registrarError) {
      console.log('❌ Error en SP_REGISTRAR_USUARIO_CLIENTE:', registrarError.message);
    }
    
    // Test 4: SP_OBTENER_ROLES
    console.log('\n4️⃣ Probando SP_OBTENER_ROLES...');
    try {
      const result = await pool.request()
        .execute('SP_OBTENER_ROLES');
      
      console.log('✅ SP_OBTENER_ROLES funciona');
      console.log('   Columnas retornadas:', Object.keys(result.recordset[0] || {}));
      console.log('   Resultado:', result.recordset);
    } catch (rolesError) {
      console.log('❌ Error en SP_OBTENER_ROLES:', rolesError.message);
    }
    
    // Test 5: SP_OBTENER_USUARIOS
    console.log('\n5️⃣ Probando SP_OBTENER_USUARIOS...');
    try {
      const result = await pool.request()
        .input('usuario_id', sql.Int, 1)
        .execute('SP_OBTENER_USUARIOS');
      
      console.log('✅ SP_OBTENER_USUARIOS funciona');
      console.log('   Columnas retornadas:', Object.keys(result.recordset[0] || {}));
      console.log('   Resultado:', result.recordset[0]);
    } catch (usuariosError) {
      console.log('❌ Error en SP_OBTENER_USUARIOS:', usuariosError.message);
    }
    
  } catch (error) {
    console.error('❌ Error general probando stored procedures:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testStoredProcedures()
    .then(() => {
      console.log('\n✅ Pruebas completadas');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error en las pruebas:', err);
      process.exit(1);
    });
}

module.exports = { testStoredProcedures };