const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const spacesService = require('./services/spacesService');

// Servicios CSV
const csvService = require('./services/csvService');

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

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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

// 👥 IMPORTAR Y CONFIGURAR RUTAS DE API CSV
try {
  console.log('🔄 Cargando rutas de API CSV...');
  const clientsApiRouter = require('./routes/clientsApi');
  app.use('/api/clients', clientsApiRouter);
  console.log('✅ Rutas de API CSV cargadas exitosamente');
  console.log('   📍 /api/clients/* endpoints disponibles');
} catch (error) {
  console.error('❌ Error cargando rutas de API CSV:', error.message);
  console.error('   Stack:', error.stack);
  console.warn('⚠️  El servidor continuará sin las rutas de clientes CSV');
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
  console.log('🔑 Verificar código:', req.body);
  try {
    const { correo, codigo_seguridad } = req.body;
    if (!correo || !codigo_seguridad) {
      return res.json({ msg: 'Correo y código requeridos', allow: 0 });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), correo)
      .input('codigo_seguridad', sql.VarChar(10), codigo_seguridad)
      .execute('SP_VERIFICAR_CODIGO_SEGURIDAD');
    
    const response = result.recordset[0];
    console.log('Resultado:', response);
    res.json(response);
  } catch (error) {
    console.error('Error verificando código:', error);
    res.json({ msg: 'Error interno', allow: 0 });
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

// Login - USANDO SP REAL
app.post('/api/auth/login', async (req, res) => {
  console.log(' Login:', req.body);
  
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
    res.json(response);
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

// NOTA: Los endpoints de clientes ahora se manejan en routes/clientsApi.js
// Los endpoints duplicados fueron removidos para evitar conflictos

/*
// Rutas para manejo de clientes en el CSV (ENDPOINTS VIEJOS COMENTADOS)
const CSV_PATH = path.join(__dirname, '../src/Client_Database.csv');

// Obtener clientes desde CSV
app.get('/api/clients', async (req, res) => {
  try {
    console.log('Obteniendo clientes desde CSV');
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8');
    console.log('Contenido CSV raw:', csvContent.length, 'caracteres');
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log('Líneas totales después del filtro:', lines.length);
    
    // Saltar la primera línea (headers)
    const dataLines = lines.slice(1);
    console.log('Líneas de datos:', dataLines.length);
    
    // Debug: mostrar cada línea
    dataLines.forEach((line, index) => {
      const columns = line.split(';');
      console.log(`Línea ${index + 1}: email=${columns[2]}, password=${columns[4]}`);
    });
    
    const clients = dataLines.map((line, index) => {
      const columns = line.split(';');
      return {
        id: `client-${index + 1}`,
        nombre: columns[0] || '',
        telefono: columns[1] || '',
        email: columns[2] || '',
        direccion: columns[3] || '',
        password: columns[4] || '',
        vehiculos: parseInt(columns[5]) || 0,
        vehiculoNombre: columns[6] || '',
        vehiculoModelo: columns[7] || '',
        ordenesActivas: parseInt(columns[8]) || 0,
        proximasCitas: parseInt(columns[9]) || 0,
        cotizaciones: parseInt(columns[10]) || 0,
        kilometraje: parseInt(columns[11]) || 0
      };
    });
    
    console.log(` ${clients.length} clientes cargados desde CSV`);
    res.json({ success: true, clients });
  } catch (error) {
    console.error(' Error leyendo CSV:', error);
        res.json({ allow: 0, msg: 'Error interno' });
  }
});

// Agregar nuevo cliente al CSV
app.post('/api/clients', async (req, res) => {
  try {
    console.log(' Agregando nuevo cliente al CSV:', req.body);
    const { nombre, telefono, email, direccion, password, vehiculos = 0, vehiculoNombre = '', vehiculoModelo = '', kilometraje = 0 } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !telefono || !email || !direccion || !password) {
      return res.json({ success: false, error: 'Campos requeridos faltantes' });
    }
    
    // Crear línea CSV
    const csvLine = `${nombre};${telefono};${email};${direccion};${password};${vehiculos};${vehiculoNombre};${vehiculoModelo};0;0;0;${kilometraje}`;
    
    // Agregar al archivo CSV
    await fs.appendFile(CSV_PATH, '\n' + csvLine);
    
    console.log(' Cliente agregado exitosamente al CSV');
    res.json({ success: true, message: 'Cliente agregado exitosamente' });
  } catch (error) {
    console.error(' Error escribiendo en CSV:', error);
    res.json({ success: false, error: 'Error guardando cliente' });
  }
});
*/

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
  console.log(` API Clientes:     http://localhost:${PORT}/api/clients`);
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
