const { getConnection, sql } = require('./config/database');

async function investigarUsuarios() {
    try {
        console.log('Conectando a la base de datos...');
        const pool = await getConnection();
        console.log('Conectado a SQL Server');
        
        console.log('\n  Investigando tabla de usuarios...');
        
        // Ver todas las tablas que contienen 'usuario' en el nombre
        console.log('Buscando tablas relacionadas con usuarios...');
        const tables = await pool.request()
            .query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE' 
                AND (TABLE_NAME LIKE '%usuario%' OR TABLE_NAME LIKE '%Usuario%' OR TABLE_NAME LIKE '%cliente%')
                ORDER BY TABLE_NAME
            `);
        
        console.log('Tablas encontradas:');
        tables.recordset.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
        // Intentar consulta directa a la tabla Usuarios (si existe)
        console.log('\n  Intentando consulta directa...');
        try {
            const directQuery = await pool.request()
                .query('SELECT TOP 10 * FROM Usuarios ORDER BY correo');
            
            console.log('Usuarios en tabla Usuarios:');
            console.log('Total:', directQuery.recordset.length);
            directQuery.recordset.forEach(user => {
                console.log(` - ${user.correo} | ${user.nombre_completo || 'Sin nombre'} | ${user.rol || 'Sin rol'}`);
            });
        } catch (error) {
            console.log('Error en consulta directa a Usuarios:', error.message);
            
            // Probar con otras posibles tablas
            try {
                const directQuery2 = await pool.request()
                    .query('SELECT TOP 10 * FROM USUARIOS ORDER BY correo');
                
                console.log('Usuarios en tabla USUARIOS:');
                console.log('Total:', directQuery2.recordset.length);
                directQuery2.recordset.forEach(user => {
                    console.log(`  - ${user.correo} | ${user.nombre_completo || 'Sin nombre'} | ${user.rol || 'Sin rol'}`);
                });
            } catch (error2) {
                console.log('Error en consulta a USUARIOS:', error2.message);
            }
        }
        
        console.log('\n  Probando SP_LOGIN con usuarios conocidos...');
        const emails = ['fatima@taller.com', 'juan@taller.com', 'maria@taller.com'];
        
        for (const email of emails) {
            try {
                const loginResult = await pool.request()
                    .input('correo', sql.VarChar(100), email)
                    .input('password', sql.NVarChar(100), 'password123')
                    .execute('SP_LOGIN');
                
                const login = loginResult.recordset[0];
                if (login.usuario_id) {
                    console.log(`${email} existe - ID: ${login.usuario_id}, Nombre: ${login.nombre_completo}`);
                } else {
                    console.log(`${email} - ${login.msg || 'No encontrado'}`);
                }
            } catch (error) {
                console.log(`Error probando ${email}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('Error general:', error);
    }
}

investigarUsuarios();