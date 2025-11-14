const { getConnection } = require('./config/database.js');

async function checkRealClients() {
  try {
    const pool = await getConnection();
    
    console.log('🔍 Buscando clientes en la base de datos...');
    
    // 1. Intentar SP_OBTENER_USUARIOS
    try {
      const result1 = await pool.request().execute('SP_OBTENER_USUARIOS');
      console.log('SP_OBTENER_USUARIOS resultado:', result1.recordset.length, 'registros');
      if (result1.recordset.length > 0) {
        console.log('Primeros 3 usuarios:', result1.recordset.slice(0, 3));
      }
    } catch (error1) {
      console.log('❌ SP_OBTENER_USUARIOS error:', error1.message);
    }
    
    // 2. Intentar consulta directa a Usuarios
    try {
      const result2 = await pool.request().query('SELECT TOP 5 usuario_id, nombre_completo, telefono, correo FROM Usuarios ORDER BY usuario_id DESC');
      console.log('✅ Consulta directa Usuarios:', result2.recordset.length, 'registros');
      console.log('Usuarios encontrados:', result2.recordset);
    } catch (error2) {
      console.log('❌ Consulta directa error:', error2.message);
    }
    
    // 3. Verificar tablas disponibles
    try {
      const tables = await pool.request().query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'TABLE' ORDER BY TABLE_NAME`);
      console.log('\n📋 Tablas disponibles:');
      tables.recordset.forEach(table => console.log('- ', table.TABLE_NAME));
    } catch (error3) {
      console.log('❌ Error listando tablas:', error3.message);
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

checkRealClients();