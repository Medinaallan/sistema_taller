const { getConnection, sql } = require('../config/database');

/**
 * Función para verificar la conexión con el servidor remoto de base de datos
 */
async function setupDatabase() {
  try {
    console.log(' Verificando conexión con el servidor remoto de base de datos...');
    const pool = await getConnection();
    
    // Verificar que las tablas principales existen
    console.log(' Verificando tablas existentes...');
    const tablesResult = await pool.request().execute('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES');
    const tables = tablesResult.recordset.map(r => r.TABLE_NAME);
    console.log(` Tablas encontradas: ${tables.join(', ')}`);
    
    // Verificar que los stored procedures principales existen
    console.log(' Verificando stored procedures...');
    const procsResult = await pool.request().execute('SELECT name FROM sys.procedures ORDER BY name');
    const procedures = procsResult.recordset.map(r => r.name);
    console.log(` Stored Procedures disponibles (${procedures.length}): ${procedures.slice(0, 10).join(', ')}${procedures.length > 10 ? '...' : ''}`);
    
    // Verificar SPs críticos
    const criticalSPs = ['SP_LOGIN', 'SP_OBTENER_USUARIOS', 'SP_REGISTRAR_USUARIO_CLIENTE', 'SP_VALIDAR_CORREO_USUARIO'];
    const missingSPs = criticalSPs.filter(sp => !procedures.includes(sp));
    
    if (missingSPs.length > 0) {
      console.warn(` ADVERTENCIA: Stored Procedures críticos no encontrados: ${missingSPs.join(', ')}`);
    } else {
      console.log(' Todos los stored procedures críticos están disponibles');
    }
    
    console.log(' Conexión verificada exitosamente con el servidor remoto');
    
  } catch (error) {
    console.error(' Error verificando la conexión con la base de datos remota:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log(' Configuración completada');
      process.exit(0);
    })
    .catch(err => {
      console.error(' Error en la configuración:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
