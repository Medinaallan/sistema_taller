const { getConnection, sql } = require('../config/database');

async function listStoredProcedures() {
  try {
    console.log('Consultando stored procedures disponibles...');
    const pool = await getConnection();
    
    // Obtener lista de stored procedures
    const result = await pool.request().query(`
      SELECT 
        name,
        create_date,
        modify_date
      FROM sys.procedures 
      WHERE name LIKE 'SP_%'
      ORDER BY name
    `);
    
    console.log('Stored Procedures encontrados:');
    console.log('=====================================');
    
    if (result.recordset.length === 0) {
      console.log('No se encontraron stored procedures que comiencen con SP_');
    } else {
      result.recordset.forEach((sp, index) => {
        console.log(`${index + 1}. ${sp.name}`);
        console.log(`   Creado: ${sp.create_date}`);
        console.log(`   Modificado: ${sp.modify_date}`);
        console.log('   ---');
      });
    }
    
    // También verificar la tabla Users
    console.log('\n  Verificando tabla Users...');
    try {
      const userCount = await pool.request().query(`
        SELECT COUNT(*) as total FROM Users
      `);
      console.log(`Tabla Users existe con ${userCount.recordset[0].total} registros`);
      
      const userStructure = await pool.request().query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('\n  Estructura de tabla Users:');
      userStructure.recordset.forEach(col => {
        console.log(`   ${col.COLUMN_NAME} - ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
    } catch (tableError) {
      console.log('Error verificando tabla Users:', tableError.message);
    }
    
  } catch (error) {
    console.error('Error consultando stored procedures:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  listStoredProcedures()
    .then(() => {
      console.log('\n  Consulta completada');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error en la consulta:', err);
      process.exit(1);
    });
}

module.exports = { listStoredProcedures };