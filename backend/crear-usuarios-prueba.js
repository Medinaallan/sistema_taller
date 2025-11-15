const { getConnection, sql } = require('./config/database');

async function crearUsuariosDePrueba() {
    try {
        console.log('🔗 Conectando a la base de datos...');
        const pool = await getConnection();
        console.log('✅ Conectado a SQL Server');
        
        // Usuarios de prueba
        const usuariosPrueba = [
            {
                nombre: 'Fatima García',
                correo: 'fatima@taller.com',
                telefono: '555-0001'
            },
            {
                nombre: 'Juan Pérez',
                correo: 'juan@taller.com',
                telefono: '555-0002'
            },
            {
                nombre: 'María López',
                correo: 'maria@taller.com',
                telefono: '555-0003'
            }
        ];
        
        for (let i = 0; i < usuariosPrueba.length; i++) {
            const usuario = usuariosPrueba[i];
            console.log(`\n👤 Registrando usuario ${i + 1}: ${usuario.nombre}...`);
            
            try {
                // Paso 1: Registrar usuario
                console.log('1️⃣ Ejecutando SP_REGISTRAR_USUARIO_CLIENTE...');
                const registroResult = await pool.request()
                    .input('nombre_completo', sql.VarChar(100), usuario.nombre)
                    .input('correo', sql.VarChar(100), usuario.correo)
                    .input('telefono', sql.VarChar(30), usuario.telefono)
                    .execute('SP_REGISTRAR_USUARIO_CLIENTE');
                
                const registro = registroResult.recordset[0];
                console.log('📋 Resultado registro:', registro);
                
                if (registro.response === '200 OK') {
                    console.log('✅ Usuario registrado, código:', registro.codigo_seguridad);
                    
                    // Paso 2: Verificar código (simular que el usuario lo ingresó)
                    console.log('2️⃣ Verificando código de seguridad...');
                    const verifyResult = await pool.request()
                        .input('correo', sql.VarChar(100), usuario.correo)
                        .input('codigo_seguridad', sql.VarChar(6), registro.codigo_seguridad)
                        .execute('SP_VERIFICAR_CODIGO_SEGURIDAD');
                    
                    const verify = verifyResult.recordset[0];
                    console.log('📋 Resultado verificación:', verify);
                    
                    if (verify.allow === 1) {
                        // Paso 3: Registrar contraseña
                        console.log('3️⃣ Registrando contraseña...');
                        const passwordResult = await pool.request()
                            .input('correo', sql.VarChar(100), usuario.correo)
                            .input('password', sql.NVarChar(100), 'password123')
                            .execute('SP_REGISTRAR_PASSWORD');
                        
                        const passwordResp = passwordResult.recordset[0];
                        console.log('📋 Resultado password:', passwordResp);
                        
                        if (passwordResp.allow === 1) {
                            console.log('🎉 Usuario completamente registrado:', usuario.nombre);
                        } else {
                            console.log('❌ Error registrando contraseña:', passwordResp.msg);
                        }
                    } else {
                        console.log('❌ Error verificando código:', verify.msg);
                    }
                } else {
                    console.log('❌ Error en registro:', registro.msg);
                }
                
            } catch (error) {
                console.error(`❌ Error registrando ${usuario.nombre}:`, error.message);
            }
        }
        
        console.log('\n📊 Verificando usuarios creados...');
        const finalCheck = await pool.request()
            .input('usuario_id', sql.Int, null)
            .execute('SP_OBTENER_USUARIOS');
        
        console.log('👥 Usuarios en la BD:', finalCheck.recordset.length);
        finalCheck.recordset.forEach(user => {
            console.log(`  - ${user.nombre_completo} (${user.correo}) - Rol: ${user.rol}`);
        });
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

crearUsuariosDePrueba();