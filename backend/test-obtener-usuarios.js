const { getConnection, sql } = require('./config/database');

async function testObtenerUsuarios() {
    try {
        console.log('🔗 Conectando a la base de datos...');
        const pool = await getConnection();
        console.log('✅ Conectado a SQL Server');
        
        // Probar SP_OBTENER_USUARIOS sin parámetro (para obtener todos)
        console.log('\n1️⃣ Probando SP_OBTENER_USUARIOS (todos los usuarios)...');
        try {
            const result = await pool.request()
                .input('usuario_id', sql.Int, null)
                .execute('SP_OBTENER_USUARIOS');
            
            console.log('📋 Usuarios obtenidos:', result.recordset.length);
            console.log('📋 Primeros registros:');
            result.recordset.slice(0, 3).forEach((user, index) => {
                console.log(`  ${index + 1}. ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.correo}, Rol: ${user.rol}`);
            });
            
        } catch (error) {
            console.error('❌ Error en SP_OBTENER_USUARIOS:', error.message);
        }
        
        // Probar con un ID específico
        console.log('\n2️⃣ Probando SP_OBTENER_USUARIOS con ID específico...');
        try {
            const result = await pool.request()
                .input('usuario_id', sql.Int, 1) // Probar con ID 1
                .execute('SP_OBTENER_USUARIOS');
            
            if (result.recordset.length > 0) {
                const user = result.recordset[0];
                console.log('📋 Usuario específico encontrado:');
                console.log(`  ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.correo}, Rol: ${user.rol}`);
            } else {
                console.log('❌ No se encontró usuario con ID 1');
            }
            
        } catch (error) {
            console.error('❌ Error en SP_OBTENER_USUARIOS con ID:', error.message);
        }
        
        // Buscar específicamente a fatima
        console.log('\n3️⃣ Buscando usuarios que contengan "fatima"...');
        try {
            const result = await pool.request()
                .input('usuario_id', sql.Int, null)
                .execute('SP_OBTENER_USUARIOS');
            
            const fatimaUsers = result.recordset.filter(user => 
                user.correo.toLowerCase().includes('fatima') || 
                user.nombre_completo.toLowerCase().includes('fatima')
            );
            
            if (fatimaUsers.length > 0) {
                console.log('📋 Usuarios relacionados con fatima:');
                fatimaUsers.forEach(user => {
                    console.log(`  ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.correo}, Rol: ${user.rol}`);
                });
            } else {
                console.log('❌ No se encontraron usuarios con "fatima"');
            }
            
        } catch (error) {
            console.error('❌ Error buscando usuarios fatima:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

testObtenerUsuarios();