const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const spacesService = require('./services/spacesService');


// Configuración del servidor
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware de auditoría automática
const { auditMiddleware } = require('./middleware/auditMiddleware');
app.use(auditMiddleware);

// Configuración de multer para subida de imágenes a memoria (para Spaces)
const upload = multer({ 
  storage: multer.memoryStorage(), // Usar memoria en lugar de disco
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente' 
  });
});

// 👥 IMPORTAR Y CONFIGURAR RUTAS DE API DE CLIENTES
try {
  console.log('🔄 Cargando rutas de API de clientes...');
  const clientsApiRouter = require('./routes/clientsApi');
  app.use('/api/clients', clientsApiRouter);
  console.log('✅ Rutas de API de clientes cargadas exitosamente');
  console.log('   📍 /api/clients/* endpoints disponibles');
} catch (error) {
  console.error('❌ Error cargando rutas de API de clientes:', error.message);
  console.error('   Stack:', error.stack);
  console.warn('⚠️  El servidor continuará sin las rutas de clientes');
}

//  IMPORTAR Y CONFIGURAR RUTAS DE SERVICIOS
try {
  console.log(' Cargando rutas de servicios...');
  const servicesRouter = require('./routes/services');
  app.use('/api/services', servicesRouter);
  console.log(' Rutas de servicios cargadas exitosamente');
  console.log('    /api/services/* endpoints disponibles');
} catch (error) {
  console.error(' Error cargando rutas de servicios:', error.message);
  console.error('   Stack:', error.stack);
  console.warn('  El servidor continuará sin las rutas de servicios');
}

//  IMPORTAR Y CONFIGURAR RUTAS DE VEHÍCULOS
try {
  console.log('Cargando rutas de vehículos...');
  const vehiclesRouter = require('./routes/vehicles');
  app.use('/api/vehicles', vehiclesRouter);
  console.log('Rutas de vehículos cargadas exitosamente');
  console.log('/api/vehicles/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de vehículos:', error.message);
  console.error('   Stack:', error.stack);
  console.warn(' El servidor continuará sin las rutas de vehículos');
}

// IMPORTAR Y CONFIGURAR RUTAS DE IMPORTACIÓN EXCEL
try {
  console.log('Cargando rutas de importación Excel...');
  const excelImportRouter = require('./routes/excelImport');
  app.use('/api/excel-import', excelImportRouter);
  console.log('Rutas de importación Excel cargadas exitosamente');
  console.log('/api/excel-import/* endpoints disponibles');
} catch (error) {
  console.error(' Error cargando rutas de importación Excel:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de importación Excel');
}

//IMPORTAR Y CONFIGURAR RUTAS DE HISTORIAL DE SERVICIOS
try {
  console.log(' Cargando rutas de historial de servicios...');
  const serviceHistoryRouter = require('./routes/serviceHistory');
  app.use('/api/service-history', serviceHistoryRouter);
  console.log(' Rutas de historial de servicios cargadas exitosamente');
  console.log('/api/service-history/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de historial de servicios:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de historial de servicios');
}

//IMPORTAR Y CONFIGURAR RUTAS DE CITAS
try {
  console.log(' Cargando rutas de citas...');
  const appointmentsRouter = require('./routes/appointments');
  app.use('/api/appointments', appointmentsRouter);
  console.log(' Rutas de citas cargadas exitosamente');
  console.log('/api/appointments/* endpoints disponibles');
} catch (error) {
  console.error(' Error cargando rutas de citas:', error.message);
  console.error('Stack:', error.stack);
  console.warn(' El servidor continuará sin las rutas de citas');
}

//IMPORTAR Y CONFIGURAR RUTAS DE USUARIOS
try {
  console.log('👥 Cargando rutas de usuarios...');
  const usersRouter = require('./routes/users');
  app.use('/api/users', usersRouter);
  console.log('✅ Rutas de usuarios cargadas exitosamente');
  console.log('   📍 /api/users/* endpoints disponibles');
} catch (error) {
  console.error('❌ Error cargando rutas de usuarios:', error.message);
  console.error('   Stack:', error.stack);
  console.warn('⚠️  El servidor continuará sin las rutas de usuarios');
}

//IMPORTAR Y CONFIGURAR RUTAS DE COTIZACIONES
try {
  console.log('💰 Cargando rutas de cotizaciones...');
  const quotationsRouter = require('./routes/quotations');
  app.use('/api/quotations', quotationsRouter);
  console.log('✅ Rutas de cotizaciones cargadas exitosamente');
  console.log('/api/quotations/* endpoints disponibles');
} catch (error) {
  console.error('❌ Error cargando rutas de cotizaciones:', error.message);
  console.error('Stack:', error.stack);
  console.warn('⚠️ El servidor continuará sin las rutas de cotizaciones');
}

//IMPORTAR Y CONFIGURAR RUTAS DE ÓRDENES DE TRABAJO
try {
  console.log('🔧 Cargando rutas de órdenes de trabajo...');
  const workOrdersRouter = require('./routes/workOrders');
  app.use('/api/workorders', workOrdersRouter);
  console.log('✅ Rutas de órdenes de trabajo cargadas exitosamente');
  console.log('📍 /api/workorders/* endpoints disponibles');
} catch (error) {
  console.error('❌ Error cargando rutas de órdenes de trabajo:', error.message);
  console.error('Stack:', error.stack);
  console.warn('⚠️ El servidor continuará sin las rutas de órdenes de trabajo');
}

//IMPORTAR Y CONFIGURAR RUTAS DE LOGS
try {
  console.log('📋 Cargando rutas de logs del sistema...');
  const logsRouter = require('./routes/logs');
  app.use('/api/logs', logsRouter);
  console.log('✅ Rutas de logs cargadas exitosamente');
  console.log('📍 /api/logs/* endpoints disponibles');
} catch (error) {
  console.error('❌ Error cargando rutas de logs:', error.message);
  console.error('Stack:', error.stack);
  console.warn('⚠️ El servidor continuará sin las rutas de logs');
}

// 🔄 IMPORTAR CONFIGURACIÓN DE BASE DE DATOS REAL
const { getConnection, sql } = require('./config/database');

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check solicitado');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint para subir imágenes de chat a Digital Ocean Spaces
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
    }

    console.log(' Subiendo imagen a Spaces...', req.file.originalname);
    
    // Subir a Digital Ocean Spaces
    const result = await spacesService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'chat-images'
    );

    if (result.success) {
      console.log(' Imagen subida exitosamente a Spaces:', result.url);
      
      res.json({
        success: true,
        imageUrl: result.url,
        filename: result.fileName,
        originalName: req.file.originalname,
        size: req.file.size,
        key: result.key // Para poder eliminar después si es necesario
      });
    } else {
      console.error(' Error subiendo a Spaces:', result.error);
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error(' Error subiendo imagen:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Endpoint para eliminar imágenes de Spaces
app.delete('/api/delete-image/:key(*)', async (req, res) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({ success: false, error: 'Key de imagen requerida' });
    }

    console.log('🗑️ Eliminando imagen de Spaces:', key);
    
    const result = await spacesService.deleteImage(key);
    
    if (result.success) {
      console.log('✅ Imagen eliminada exitosamente de Spaces');
      res.json({ success: true, message: 'Imagen eliminada exitosamente' });
    } else {
      console.error('❌ Error eliminando de Spaces:', result.error);
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Validar email (Paso 1) - USANDO SP REAL
app.post('/api/auth/validate-email', async (req, res) => {
  console.log('Validar email:', req.body);
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.json({ msg: 'Correo requerido', allow: 0 });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), correo)
      .execute('SP_VALIDAR_CORREO_USUARIO');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    res.json(response);
  } catch (error) {
    console.error('Error validando email:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// ENDPOINT ADICIONAL para el frontend - /api/users/validate-email
app.post('/api/users/validate-email', async (req, res) => {
  console.log('Validar email (users endpoint):', req.body);
  try {
    const { email, correo } = req.body;
    const emailToValidate = email || correo;
    
    if (!emailToValidate) {
      return res.json({ success: false, message: 'Email requerido' });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), emailToValidate)
      .execute('SP_VALIDAR_CORREO_USUARIO');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    
    // Adaptar respuesta para el frontend
    res.json({
      success: response.allow === 1,
      message: response.msg
    });
  } catch (error) {
    console.error('Error validando email:', error);
    res.json({ success: false, message: 'Error interno' });
  }
});

// Registrar usuario (Paso 2) 
app.post('/api/auth/register-user-info', async (req, res) => {
  console.log('👤 Registrar usuario:', req.body);
  try {
    const { nombre_completo, correo, telefono } = req.body;
    if (!nombre_completo || !correo || !telefono) {
      return res.json({ msg: 'Todos los campos son requeridos', allow: 0 });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre_completo', sql.VarChar(100), nombre_completo)
      .input('correo', sql.VarChar(100), correo)
      .input('telefono', sql.VarChar(30), telefono)
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    res.json(response);
  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Verificar código (Paso 3) 
app.post('/api/auth/verify-security-code', async (req, res) => {
  console.log('🔑 Verificar código - REQUEST COMPLETO:', {
    body: req.body,
    headers: req.headers
  });
  
  try {
    // Accept both frontend (email, securityCode) and legacy (correo, codigo_seguridad) parameter names
    const { correo, codigo_seguridad, email, securityCode } = req.body;
    const emailParam = email || correo;
    const codeParam = securityCode || codigo_seguridad;
    
    console.log('📧 Email recibido:', `"${emailParam}" (longitud: ${emailParam?.length})`);
    console.log('🔢 Código recibido:', `"${codeParam}" (longitud: ${codeParam?.length})`);
    console.log('🔍 Código en bytes:', codeParam ? Array.from(codeParam.toString()).map(c => c.charCodeAt(0)) : 'undefined');
    
    if (!emailParam || !codeParam) {
      console.log('❌ Faltan campos requeridos');
      return res.json({ msg: 'Correo y código requeridos', allow: 0 });
    }
    
    // Limpiar datos antes de enviar al SP
    const emailClean = emailParam.toString().trim().toLowerCase();
    const codeClean = codeParam.toString().trim();
    
    console.log('🧹 Datos limpiados:');
    console.log('   Email:', `"${emailClean}"`);
    console.log('   Código:', `"${codeClean}"`);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), emailClean)
      .input('codigo_seguridad', sql.VarChar(6), codeClean)
      .execute('SP_VERIFICAR_CODIGO_SEGURIDAD');
    
    const response = result.recordset[0];
    console.log('✅ Resultado del SP:', response);
    
    // Return in frontend-compatible format
    if (response.allow === 1) {
      res.json({ success: true, message: response.msg });
    } else {
      res.json({ success: false, message: response.msg });
    }
  } catch (error) {
    console.error('❌ Error verificando código:', error);
    res.json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar contraseña después de verificar código (registro)
app.post('/api/auth/update-password', async (req, res) => {
  console.log('🔑 Actualizar contraseña (registro):', req.body);
  
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.json({ success: false, message: 'Email y contraseña son requeridos' });
    }
    
    const pool = await getConnection();
    // Para registro, usamos UPDATE directo ya que no tenemos usuario_id ni contraseña actual
    const result = await pool.request()
      .input('email', sql.VarChar(100), email)
      .input('newPassword', sql.VarChar(255), newPassword)
      .query(`
        UPDATE USUARIOS_CLIENTES 
        SET password = @newPassword
        WHERE correo = @email AND verificado = 1
      `);
    
    if (result.rowsAffected[0] > 0) {
      console.log('✅ Contraseña actualizada para:', email);
      res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } else {
      console.log('❌ Usuario no encontrado o no verificado:', email);
      res.json({ success: false, message: 'Usuario no encontrado o no verificado' });
    }
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error);
    res.json({ success: false, message: 'Error interno del servidor' });
  }
});

// Cambiar contraseña desde perfil (con verificación)
app.post('/api/auth/change-password', async (req, res) => {
  console.log('🔑 Cambiar contraseña desde perfil:', req.body);
  
  try {
    const { usuario_id, currentPassword, newPassword } = req.body;
    
    if (!usuario_id || !currentPassword || !newPassword) {
      return res.json({ success: false, message: 'Todos los campos son requeridos' });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, usuario_id)
      .input('currentPassword', sql.NVarChar(100), currentPassword)
      .input('newPassword', sql.NVarChar(100), newPassword)
      .execute('SP_EDITAR_PASSWORD');
    
    const response = result.recordset[0];
    console.log('✅ Resultado SP_EDITAR_PASSWORD:', response);
    
    if (response.allow === 1) {
      res.json({ success: true, message: response.msg });
    } else {
      res.json({ success: false, message: response.msg });
    }
  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    res.json({ success: false, message: 'Error interno del servidor' });
  }
});

// ========== ENDPOINTS DE USUARIOS ==========

// Obtener todos los usuarios (versión simplificada para prueba)
app.get('/api/users/list', async (req, res) => {
  console.log('👥 Obteniendo lista de usuarios...');
  
  try {
    const pool = await getConnection();
    const usuarios = [];
    
    console.log('🔍 Probando usuario ID 41...');
    
    // Probar directamente con el ID que sabemos que existe
    try {
      const result = await pool.request()
        .input('usuario_id', sql.Int, 41)
        .execute('SP_OBTENER_USUARIOS');
      
      console.log('📋 Resultado para ID 41:', result.recordset);
      
      if (result.recordset.length > 0) {
        usuarios.push(result.recordset[0]);
        console.log('✅ María López encontrada');
      } else {
        console.log('❌ No se encontró usuario con ID 41');
      }
    } catch (error) {
      console.error('❌ Error consultando ID 41:', error);
    }
    
    console.log(`✅ Total usuarios encontrados: ${usuarios.length}`);
    
    res.json({
      success: true,
      data: usuarios,
      count: usuarios.length,
      message: usuarios.length > 0 ? 'Usuarios obtenidos exitosamente' : 'No se encontraron usuarios'
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.json({ 
      success: false, 
      message: 'Error al obtener usuarios',
      error: error.message 
    });
  }
});

// Obtener un usuario específico por ID
app.get('/api/users/:id', async (req, res) => {
  console.log('👤 Obteniendo usuario por ID:', req.params.id);
  
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.json({ 
        success: false, 
        message: 'ID de usuario inválido' 
      });
    }
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('usuario_id', sql.Int, userId)
      .execute('SP_OBTENER_USUARIOS');
    
    const user = result.recordset[0];
    
    if (user) {
      console.log('✅ Usuario encontrado:', user.nombre_completo);
      res.json({
        success: true,
        data: user
      });
    } else {
      console.log('❌ Usuario no encontrado');
      res.json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.json({ 
      success: false, 
      message: 'Error al obtener usuario',
      error: error.message 
    });
  }
});

// Editar usuario usando SP_EDITAR_USUARIO
app.put('/api/users/:id', async (req, res) => {
  console.log('✏️ Editando usuario:', req.params.id, req.body);
  
  try {
    const userId = parseInt(req.params.id);
    const { nombre_completo, correo, telefono } = req.body;
    
    if (!userId || isNaN(userId)) {
      return res.json({ 
        success: false, 
        message: 'ID de usuario inválido' 
      });
    }
    
    if (!nombre_completo || !correo || !telefono) {
      return res.json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
      });
    }
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('usuario_id', sql.Int, userId)
      .input('nombre_completo', sql.VarChar(100), nombre_completo)
      .input('correo', sql.VarChar(100), correo)
      .input('telefono', sql.VarChar(30), telefono)
      .execute('SP_EDITAR_USUARIO');
    
    const response = result.recordset[0];
    console.log('✅ Resultado SP_EDITAR_USUARIO:', response);
    
    if (response.response === '200 OK') {
      res.json({
        success: true,
        message: response.msg || 'Usuario editado exitosamente'
      });
    } else {
      res.json({ 
        success: false, 
        message: response.msg || 'Error al editar usuario' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error editando usuario:', error);
    res.json({ 
      success: false, 
      message: 'Error al editar usuario',
      error: error.message 
    });
  }
});

// ========== ENDPOINTS DE DEBUG ==========

// Reiniciar usuario fatima completo
app.post('/api/debug/reset-fatima-user', async (req, res) => {
  console.log('🔄 Reiniciando usuario fatima completamente...');
  
  try {
    const pool = await getConnection();
    
    // Datos del usuario
    const userData = {
      nombre_completo: 'Fatima González',
      correo: 'fatima@taller.com',
      telefono: '555-0123'
    };
    
    console.log('1️⃣ Registrando usuario con SP_REGISTRAR_USUARIO_CLIENTE...');
    
    // Paso 1: Registrar usuario
    const registerResult = await pool.request()
      .input('nombre_completo', sql.VarChar(100), userData.nombre_completo)
      .input('correo', sql.VarChar(100), userData.correo)
      .input('telefono', sql.VarChar(30), userData.telefono)
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');
    
    const registerResponse = registerResult.recordset[0];
    console.log('📋 Resultado registro:', registerResponse);
    
    if (registerResponse.response !== '200 OK') {
      return res.json({
        success: false,
        message: `Error en registro: ${registerResponse.msg}`,
        step: 'registration'
      });
    }
    
    const codigoSeguridad = registerResponse.codigo_seguridad;
    console.log('✅ Usuario registrado, código:', codigoSeguridad);
    
    console.log('2️⃣ Verificando código de seguridad...');
    
    // Paso 2: Verificar código
    const codeResult = await pool.request()
      .input('correo', sql.VarChar(100), userData.correo)
      .input('codigo_seguridad', sql.VarChar(6), codigoSeguridad)
      .execute('SP_VERIFICAR_CODIGO_SEGURIDAD');
    
    const codeResponse = codeResult.recordset[0];
    console.log('📋 Resultado verificación:', codeResponse);
    
    if (codeResponse.allow !== 1) {
      return res.json({
        success: false,
        message: `Error en verificación: ${codeResponse.msg}`,
        step: 'verification'
      });
    }
    
    console.log('3️⃣ Registrando contraseña...');
    
    // Paso 3: Registrar contraseña
    const passwordResult = await pool.request()
      .input('correo', sql.VarChar(100), userData.correo)
      .input('password', sql.NVarChar(100), 'asdf1234')
      .execute('SP_REGISTRAR_PASSWORD');
    
    const passwordResponse = passwordResult.recordset[0];
    console.log('📋 Resultado contraseña:', passwordResponse);
    
    if (passwordResponse.allow !== 1) {
      return res.json({
        success: false,
        message: `Error en contraseña: ${passwordResponse.msg}`,
        step: 'password'
      });
    }
    
    console.log('4️⃣ Verificando login final...');
    
    // Paso 4: Verificar login
    const loginResult = await pool.request()
      .input('correo', sql.VarChar(100), userData.correo)
      .input('password', sql.NVarChar(100), 'asdf1234')
      .execute('SP_LOGIN');
    
    const loginResponse = loginResult.recordset[0];
    console.log('📋 Resultado login:', loginResponse);
    
    if (loginResponse.usuario_id) {
      console.log('🎉 ¡Usuario fatima reiniciado exitosamente!');
      res.json({
        success: true,
        message: 'Usuario fatima reiniciado correctamente',
        userData: {
          id: loginResponse.usuario_id,
          nombre: loginResponse.nombre_completo,
          email: loginResponse.correo,
          telefono: loginResponse.telefono,
          rol: loginResponse.rol
        }
      });
    } else {
      res.json({
        success: false,
        message: `Login falló: ${loginResponse.msg}`,
        step: 'final_login'
      });
    }
    
  } catch (error) {
    console.error('❌ Error reiniciando usuario:', error);
    res.json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DEBUG: Endpoint de test simple para verificar funcionamiento
app.post('/api/auth/test-recovery', async (req, res) => {
  console.log('🧪 TEST ENDPOINT:', req.body);
  try {
    const { email } = req.body;
    const token = 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('🎟️ Token generado:', token);
    return res.json({ 
      success: true, 
      message: 'Test exitoso',
      token: token,
      email: email
    });
  } catch (error) {
    console.error('❌ Error en test:', error);
    return res.json({ success: false, message: 'Error en test' });
  }
});

// Iniciar recuperación de contraseña (usando SP disponibles)
app.post('/api/auth/forgot-password', async (req, res) => {
  console.log('📧 Iniciar recuperación de contraseña:', req.body);
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.json({ success: false, message: 'Email es requerido' });
    }
    
    const pool = await getConnection();
    
    // Usar SP_VALIDAR_CORREO_USUARIO para verificar que el email existe
    console.log('📋 Validando email con SP_VALIDAR_CORREO_USUARIO...');
    const validationResult = await pool.request()
      .input('correo', sql.VarChar(100), email)
      .input('usuario_id', sql.Int, null)
      .execute('SP_VALIDAR_CORREO_USUARIO');
    
    const validation = validationResult.recordset[0];
    console.log('✅ Resultado validación email:', validation);
    
    // Si allow = 0 significa que el email YA EXISTE (está en uso)
    // Si allow = 1 significa que el email NO EXISTE (es válido para registro)
    if (validation.allow === 1) {
      console.log('❌ Email no encontrado');
      return res.json({ 
        success: false, 
        message: 'No se encontró una cuenta con ese email' 
      });
    }
    
    console.log('✅ Email encontrado (ya existe), procediendo con recuperación...');
    
    // Intentar usar SP_INICIAR_RECUPERACION_PASSWORD
    try {
      console.log('🔄 Intentando SP_INICIAR_RECUPERACION_PASSWORD...');
      const result = await pool.request()
        .input('correo', sql.VarChar(100), email)
        .execute('SP_INICIAR_RECUPERACION_PASSWORD');
      
      const response = result.recordset[0];
      console.log('✅ Resultado SP_INICIAR_RECUPERACION_PASSWORD:', response);
      
      if (response.allow === 1) {
        return res.json({ 
          success: true, 
          message: response.msg,
          token: response.token
        });
      } else {
        return res.json({ success: false, message: response.msg });
      }
    } catch (spError) {
      // Si no tenemos permisos para el SP, usar fallback
      console.log('⚠️ Sin permisos para SP_INICIAR_RECUPERACION_PASSWORD');
      console.log('🔄 Usando método alternativo...');
      
      // Generar token simple para desarrollo
      const token = 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log('🎟️ Token generado (fallback):', token);
      
      return res.json({ 
        success: true, 
        message: 'Enlace de recuperación generado. Use el token para restablecer su contraseña.',
        token: token // En producción este se enviaría por email
      });
    }
    
  } catch (error) {
    console.error('❌ Error iniciando recuperación:', error);
    return res.json({ success: false, message: 'Error interno del servidor' });
  }
});

// Validar token de recuperación (intentar SP primero)
app.post('/api/auth/validate-reset-token', async (req, res) => {
  console.log('🔍 Validar token de recuperación:', req.body);
  
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.json({ success: false, message: 'Token es requerido' });
    }
    
    const pool = await getConnection();
    
    try {
      // Intentar usar SP_VALIDAR_TOKEN_RECUPERACION
      console.log('🔄 Intentando SP_VALIDAR_TOKEN_RECUPERACION...');
      const result = await pool.request()
        .input('token', sql.Char(36), token)
        .execute('SP_VALIDAR_TOKEN_RECUPERACION');
      
      const response = result.recordset[0];
      console.log('✅ Resultado SP_VALIDAR_TOKEN_RECUPERACION:', response);
      
      if (response.allow === 1) {
        res.json({ success: true, message: response.msg });
      } else {
        res.json({ success: false, message: response.msg });
      }
    } catch (spError) {
      // Fallback para tokens de desarrollo
      console.log('⚠️ Error con SP_VALIDAR_TOKEN_RECUPERACION:', spError.message);
      console.log('🔄 Usando validación alternativa...');
      
      if (!token.startsWith('reset_')) {
        return res.json({ success: false, message: 'Token inválido' });
      }
      
      const timestampStr = token.split('_')[1];
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (now - timestamp > oneHour) {
        return res.json({ 
          success: false, 
          message: 'Token expirado. Solicite un nuevo enlace de recuperación.' 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Token válido (modo desarrollo)' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error validando token:', error);
    res.json({ success: false, message: 'Token inválido' });
  }
});

// Restablecer contraseña con token (usar SP_REGISTRAR_PASSWORD)
app.post('/api/auth/reset-password-with-token', async (req, res) => {
  console.log('🔄 Restablecer contraseña con token:', req.body);
  
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      return res.json({ 
        success: false, 
        message: 'Token, email y nueva contraseña son requeridos' 
      });
    }
    
    const pool = await getConnection();
    
    // Validar token primero
    try {
      console.log('🔍 Validando token...');
      const tokenValidation = await pool.request()
        .input('token', sql.Char(36), token)
        .execute('SP_VALIDAR_TOKEN_RECUPERACION');
      
      const tokenResult = tokenValidation.recordset[0];
      if (tokenResult.allow === 0) {
        return res.json({ success: false, message: tokenResult.msg });
      }
    } catch (spError) {
      // Validación de fallback para tokens de desarrollo
      if (!token.startsWith('reset_')) {
        return res.json({ success: false, message: 'Token inválido' });
      }
      
      const timestampStr = token.split('_')[1];
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (now - timestamp > oneHour) {
        return res.json({ success: false, message: 'Token expirado' });
      }
    }
    
    // Usar SP_REGISTRAR_PASSWORD para actualizar la contraseña
    console.log('🔑 Actualizando contraseña con SP_REGISTRAR_PASSWORD...');
    const passwordResult = await pool.request()
      .input('correo', sql.VarChar(100), email)
      .input('password', sql.NVarChar(100), newPassword)
      .execute('SP_REGISTRAR_PASSWORD');
    
    const response = passwordResult.recordset[0];
    console.log('✅ Resultado SP_REGISTRAR_PASSWORD:', response);
    
    if (response.allow === 1) {
      console.log('✅ Contraseña restablecida para:', email);
      res.json({ 
        success: true, 
        message: response.msg || 'Contraseña restablecida exitosamente' 
      });
    } else {
      res.json({ 
        success: false, 
        message: response.msg || 'Error al restablecer contraseña' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error restableciendo contraseña:', error);
    res.json({ success: false, message: 'Error interno del servidor' });
  }
});

// ENDPOINT TEMPORAL PARA ARREGLAR USUARIO FATIMA
app.post('/api/debug/fix-fatima-password', async (req, res) => {
  console.log('🔧 Arreglando contraseña de Fatima...');
  
  try {
    const pool = await getConnection();
    
    // Actualizar contraseña de fatima@taller.com
    const updateResult = await pool.request()
      .input('email', sql.VarChar(100), 'fatima@taller.com')
      .input('newPassword', sql.VarChar(255), 'asdf1234')
      .query(`
        UPDATE USUARIOS_CLIENTES 
        SET password = @newPassword
        WHERE correo = @email
      `);
    
    console.log('✅ Contraseña actualizada. Filas afectadas:', updateResult.rowsAffected[0]);
    
    // Verificar que funcione
    const loginResult = await pool.request()
      .input('correo', sql.VarChar(100), 'fatima@taller.com')
      .input('password', sql.VarChar(255), 'asdf1234')
      .execute('SP_LOGIN');
    
    const loginResponse = loginResult.recordset[0];
    console.log('🔐 Resultado login test:', loginResponse);
    
    if (loginResponse.allow === 1) {
      res.json({ 
        success: true, 
        message: '✅ Contraseña de Fatima corregida exitosamente',
        loginTest: 'OK'
      });
    } else {
      res.json({ 
        success: false, 
        message: '❌ Contraseña actualizada pero login aún falla',
        loginError: loginResponse.msg
      });
    }
    
  } catch (error) {
    console.error('❌ Error arreglando contraseña:', error);
    res.json({ success: false, message: 'Error interno del servidor' });
  }
});

// Registrar password (Paso 4) - USANDO SP REAL
app.post('/api/auth/register-password', async (req, res) => {
  console.log('🔒 Registrar password:', req.body);
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.json({ msg: 'Correo y password requeridos', allow: 0 });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), correo)
      .input('password', sql.VarChar(255), password)
      .execute('SP_REGISTRAR_PASSWORD');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    res.json(response);
  } catch (error) {
    console.error('Error registrando password:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Obtener roles - USANDO SP REAL
app.get('/api/users/roles', async (req, res) => {
  console.log('📋 Obteniendo roles...');
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .execute('SP_OBTENER_ROLES');
    
    console.log('Roles obtenidos:', result.recordset);
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Registrar usuario desde panel admin - USANDO SP REAL
app.post('/api/users/panel', async (req, res) => {
  console.log('👥 Registrar usuario panel admin:', req.body);
  try {
    const { nombre_completo, correo, telefono, rol, registradoPor } = req.body;
    
    if (!nombre_completo || !correo || !telefono || !rol) {
      return res.json({
        success: false,
        message: 'Nombre completo, correo, teléfono y rol son requeridos'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre_completo', sql.VarChar(100), nombre_completo)
      .input('correo', sql.VarChar(100), correo)
      .input('telefono', sql.VarChar(30), telefono)
      .input('rol', sql.VarChar(50), rol)
      .input('registradoPor', sql.Int, registradoPor || null)
      .execute('SP_REGISTRAR_USUARIO_PANEL_ADMIN');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    
    res.json({
      success: response.response === '200 OK' || response.allow === 1,
      message: response.msg,
      data: response
    });
  } catch (error) {
    console.error('Error registrando usuario panel admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ENDPOINT ADICIONAL para register-client (compatibilidad frontend)
app.post('/api/auth/register-client', async (req, res) => {
  console.log('👤 Registrar cliente (frontend endpoint):', req.body);
  try {
    const { fullName, email, phone } = req.body;
    
    if (!fullName || !email || !phone) {
      return res.json({
        success: false,
        message: 'Nombre completo, email y teléfono son requeridos'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre_completo', sql.VarChar(100), fullName)
      .input('correo', sql.VarChar(100), email)
      .input('telefono', sql.VarChar(30), phone)
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    
    res.json({
      success: response.response === '200 OK',
      message: response.msg,
      data: {
        securityCode: response.codigo_seguridad
      }
    });
  } catch (error) {
    console.error('Error registrando cliente:', error);
    res.json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Login - USANDO SP REAL CON FORMATO CORRECTO
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login:', req.body);
  
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.json({ allow: 0, msg: 'Credenciales requeridas' });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), correo)
      .input('password', sql.VarChar(255), password)
      .execute('SP_LOGIN');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    
    // Si allow = 1, el SP debe retornar también los datos del usuario
    if (response.allow === 1) {
      // En este caso, el SP retorna los datos del usuario en el mismo registro
      res.json({
        allow: 1,
        usuario: {
          usuario_id: response.usuario_id,
          nombre_completo: response.nombre_completo,
          correo: response.correo,
          telefono: response.telefono,
          rol: response.rol
        }
      });
    } else {
      res.json(response);
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.json({ allow: 0, msg: 'Error interno' });
  }
});

// ==============================================
// RUTAS DE ADMINISTRACIÓN DE DATOS
// ==============================================

const dataResetService = require('./services/dataResetService');

// Obtener estadísticas de datos
app.get('/api/admin/data-stats', async (req, res) => {
  try {
    console.log('📊 Solicitando estadísticas de datos...');
    const stats = await dataResetService.getDataStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de datos',
      error: error.message
    });
  }
});

// Restablecer todos los datos
app.post('/api/admin/reset-data', async (req, res) => {
  try {
    console.log('🔄 Iniciando restablecimiento de datos desde API...');
    const result = await dataResetService.resetAllData();
    console.log('✅ Restablecimiento completado desde API');
    res.json(result);
  } catch (error) {
    console.error('❌ Error restableciendo datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error restableciendo datos',
      error: error.message
    });
  }
});



// Obtener clientes registrados en la BD (para el panel de admin)
app.get('/api/clients/registered', async (req, res) => {
  try {
    console.log('🔍 Obteniendo clientes registrados en BD...');
    const pool = await getConnection();
    const result = await pool.request()
      .execute('SP_OBTENER_CLIENTES_REGISTRADOS');

    console.log(`✅ Encontrados ${result.recordset.length} clientes registrados en BD`);
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo clientes registrados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 404
app.use('*', (req, res) => {
  console.log('Ruta no encontrada:', req.originalUrl);
  res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 8080;

// ====== CHAT AVANZADO (rooms + historial en memoria) ======
const { guardarMensaje, obtenerHistorial, marcarLeidos } = require('./chatStorage');

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // Unirse a una sala específica (clientId)
  socket.on('joinRoom', ({ sala_id }) => {
    if (!sala_id) return;
    socket.join(sala_id);
    console.log(`Socket ${socket.id} unido a sala ${sala_id}`);
    // Enviar historial actual al solicitante
    const historial = obtenerHistorial(sala_id);
    socket.emit('chat:historial', { sala_id, mensajes: historial });
  });

  socket.on('leaveRoom', ({ sala_id }) => {
    if (!sala_id) return;
    socket.leave(sala_id);
    console.log(`Socket ${socket.id} salió de sala ${sala_id}`);
  });

  // Mensaje genérico compat (legacy)
  
  socket.on('chatMessage', (msg) => {
    // Adaptar msg a estructura estándar y guardar
    const mensaje = {
      mensaje_id: msg.id || Date.now(),
      sala_id: msg.sala_id || msg.clientId || 'global',
      usuario_id: msg.usuario_id || socket.id,
      rol: msg.sender || 'client',
      contenido: msg.text || msg.contenido || '',
      es_sistema: false,
      enviado_en: msg.timestamp || new Date().toISOString(),
      leido: false,
      archivo_url: msg.archivo_url,
      tipo_archivo: msg.tipo_archivo
    };
    guardarMensaje(mensaje);
    io.to(mensaje.sala_id).emit('chatMessage', mensaje); // Solo a la sala
  });

  // Nuevo evento enviar mensaje estándar
  socket.on('chat:send', (data) => {
    if (!data || !data.sala_id || !data.contenido) return;
    const mensaje = {
  // Usar el ID enviado por el cliente si existe para permitir de-duplicación en UI
  mensaje_id: data.mensaje_id || Date.now(),
      sala_id: data.sala_id,
      usuario_id: data.usuario_id || socket.id,
      rol: data.rol || 'client',
      contenido: data.contenido,
      es_sistema: false,
      enviado_en: new Date().toISOString(),
      leido: false,
      archivo_url: data.archivo_url,
      tipo_archivo: data.tipo_archivo
    };
    guardarMensaje(mensaje);
    io.to(mensaje.sala_id).emit('chat:mensaje', mensaje);
  });

  // Solicitar historial explícito
  socket.on('chat:historial:solicitar', ({ sala_id }) => {
    if (!sala_id) return;
    const historial = obtenerHistorial(sala_id);
    socket.emit('chat:historial', { sala_id, mensajes: historial });
  });

  // Marcar mensajes como leídos
  socket.on('chat:leer', ({ sala_id, rolLectura }) => {
    if (!sala_id || !rolLectura) return;
    const cambios = marcarLeidos(sala_id, rolLectura);
    if (cambios > 0) {
      io.to(sala_id).emit('chat:leido', { sala_id, rolLectura });
    }
  });

  // Indicador escribiendo en el chat
  socket.on('chat:typing', ({ sala_id, rol, escribiendo }) => {
    if (!sala_id) return;
    socket.to(sala_id).emit('chat:typing', { sala_id, rol, escribiendo: !!escribiendo });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log('\n===============================================');
  console.log(`   SERVIDOR TALLER INICIADO EN PUERTO ${PORT}`);
  console.log(' ===============================================');
  console.log(` Health Check:     http://localhost:${PORT}/api/health`);
  console.log(` API Clientes:     http://localhost:${PORT}/api/clients/registered`);
  console.log(` API Servicios:    http://localhost:${PORT}/api/services`);
  console.log(` API Vehículos:    http://localhost:${PORT}/api/vehicles`);
  console.log(` Subir Imágenes:   http://localhost:${PORT}/api/upload-image (Digital Ocean Spaces)`);
  console.log(` Eliminar Imagen:  http://localhost:${PORT}/api/delete-image/:key`);
  console.log(` Autenticación:    http://localhost:${PORT}/api/auth/*`);
  console.log(` Socket.IO:        http://localhost:${PORT} (chat en tiempo real)`);  
  console.log(` Frontend:         http://localhost:5173`);
  console.log('===============================================\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Puerto ${PORT} ya está en uso`);
    process.exit(1);
  } else {
    console.error('Error del servidor:', error);
  }
});
