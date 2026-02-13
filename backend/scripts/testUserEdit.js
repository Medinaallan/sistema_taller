// Script para probar SP_EDITAR_USUARIO
const sql = require('mssql');
const config = require('../config/database');

async function testUserEdit() {
  const pool = new sql.ConnectionPool(config);
  
  try {
    await pool.connect();
    console.log('✅ Conectado a la BD');

    // Obtener primero un usuario para editar
    const result = await pool.request()
      .input('rol', sql.VarChar, 'admin')
      .execute('SP_OBTENER_USUARIOS');

    const users = result.recordset;
    console.log(`. Se encontraron ${users.length} usuarios`);

    if (users.length === 0) {
      console.log('❌ No hay usuarios para editar');
      return;
    }

    const user = users[0];
    console.log(`\n👤 Editando usuario: ${user.usuario_id} - ${user.nombre_completo}`);

    // Test 1: Validar correo
    console.log('\n🔍 Test 1: Validando correo nuevo...');
    const emailResult = await pool.request()
      .input('correo', sql.VarChar, 'newemail@example.com')
      .input('usuario_id', sql.Int, user.usuario_id)
      .execute('SP_VALIDAR_CORREO_USUARIO');

    const emailValid = emailResult.recordset[0];
    console.log('Resultado validación:', emailValid);

    // Test 2: Editar usuario
    console.log('\n📝 Test 2: Editando usuario...');
    const editResult = await pool.request()
      .input('usuario_id', sql.Int, user.usuario_id)
      .input('nombre_completo', sql.VarChar, 'Juan Pérez Actualizado')
      .input('correo', sql.VarChar, 'juan.actualizado@example.com')
      .input('telefono', sql.VarChar, '987654321')
      .execute('SP_EDITAR_USUARIO');

    console.log('Resultado edición:', editResult.recordset);

    // Test 3: Verificar cambios
    console.log('\n✅ Test 3: Verificando cambios...');
    const verifyResult = await pool.request()
      .input('usuario_id', sql.Int, user.usuario_id)
      .execute('SP_OBTENER_USUARIO_POR_ID');

    const updatedUser = verifyResult.recordset[0];
    console.log('Usuario después de edición:');
    console.log(`  - Nombre: ${updatedUser.nombre_completo}`);
    console.log(`  - Email: ${updatedUser.correo}`);
    console.log(`  - Teléfono: ${updatedUser.telefono}`);

    console.log('\n✅ Todas las pruebas completadas');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.close();
  }
}

testUserEdit();
