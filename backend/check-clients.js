const { getConnection } = require('./config/database.js');

async function checkClientsData() {
  try {
    const pool = await getConnection();
    
    // 1. Verificar stored procedures de clientes
    console.log('Verificando stored procedures de clientes...');
    try {
      const spQuery = `
        SELECT name 
        FROM sys.procedures 
        WHERE name LIKE '%CLIENTE%' OR name LIKE '%USUARIO%' OR name LIKE '%REGISTRAR%' OR name LIKE '%LISTAR%'
        ORDER BY name
      `;
      const spResult = await pool.request().query(spQuery);
      console.log('SPs encontrados:');
      spResult.recordset.forEach(sp => console.log('- ', sp.name));
    } catch (error) {
      console.log('Error consultando SPs:', error.message);
    }
    
    // 2. Registrar clientes usando el parámetro correcto: @nombre_completo
    console.log('\n  Registrando clientes con @nombre_completo...');
    
    for (const cliente of clientes) {
      try {
        const result = await pool.request()
          .input('nombre_completo', cliente.nombre_completo)
          .input('telefono', cliente.telefono)
          .input('correo', cliente.email)
          .execute('SP_REGISTRAR_USUARIO_CLIENTE');
        
        console.log(`Registrado: ${cliente.nombre_completo}`, result.recordset[0]);
      } catch (error) {
        console.log(`Error registrando ${cliente.nombre_completo}:`, error.message);
        
        // Intentar solo con nombre_completo y correo
        try {
          const result2 = await pool.request()
            .input('nombre_completo', cliente.nombre_completo)
            .input('correo', cliente.email)
            .execute('SP_REGISTRAR_USUARIO_CLIENTE');
          
          console.log(`Registrado (nombre+correo): ${cliente.nombre_completo}`, result2.recordset[0]);
        } catch (error2) {
          console.log(`Error nombre+correo ${cliente.nombre_completo}:`, error2.message);
        }
      }
    }
    
    // 3. Usar SP_OBTENER_USUARIOS para ver si hay clientes ya registrados
    console.log('\n  Obteniendo usuarios existentes...');
    try {
      const existingUsers = await pool.request().execute('SP_OBTENER_USUARIOS');
      console.log('Usuarios existentes:', existingUsers.recordset);
    } catch (error) {
      console.log('Error obteniendo usuarios:', error.message);
    }
    
  } catch (error) {
    console.log('Error general:', error.message);
  }
}

checkClientsData();