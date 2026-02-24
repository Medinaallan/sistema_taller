const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const spacesService = require('./services/spacesService');

// ========================================
// CONFIGURACIÓN DE ZONA HORARIA
// ========================================
// Honduras está en GMT-6 (Central Standard Time)
process.env.TZ = 'America/Tegucigalpa';
console.log('🕐 Zona horaria configurada: America/Tegucigalpa (GMT-6)');
console.log('🕐 Hora actual del servidor:', new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }));

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

// 👥 IMPORTAR Y CONFIGURAR RUTAS DE API CSV - DESHABILITADO
// csvService ha sido eliminado - Sistema ahora usa SQL Server
try {
  console.log('API CSV deshabilitada - Usar SQL Server');
} catch (error) {
  console.error('Error cargando rutas:', error.message);
}

//  IMPORTAR Y CONFIGURAR RUTAS DE SERVICIOS
// ENDPOINTS DE SERVICIOS USANDO SP DE SQL SERVER
const { getConnection, sql } = require('./config/database');

// GET - Obtener todos los tipos de servicio (SP)
app.get('/api/services', async (req, res) => {
  try {
    // Conexión y ejecución de SP para obtener tipos de servicio
    const pool = await getConnection();
    const result = await pool.request()
      .execute('SP_OBTENER_TIPOS_SERVICIO');
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error en /api/services:', error);
    res.status(500).json({ success: false, message: error.message, error });
  }
});

// POST - Registrar nuevo tipo de servicio (SP)
app.post('/api/services', async (req, res) => {
  const { nombre, descripcion, precio, duracion, categoria, registrado_por } = req.body;
  try {
    console.log('POST /api/services - Datos recibidos:', req.body);
    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre', sql.VarChar(100), nombre)
      .input('descripcion', sql.VarChar(200), descripcion)
      .input('precio_base', sql.Decimal(10, 2), precio || null)
      .input('horas_estimadas', sql.VarChar(50), duracion || null)
      .input('registrado_por', sql.Int, registrado_por || 1)
      .execute('SP_REGISTRAR_TIPO_SERVICIO');
    console.log('Resultado SP_REGISTRAR_TIPO_SERVICIO:', result);
    res.json(result.recordset[0] || { response: '200 OK', msg: 'Registrado', allow: 1 });
  } catch (error) {
    console.error('Error en POST /api/services:', error);
    res.status(500).json({ response: '500 ERROR', msg: error.message, error });
  }
});

// PUT - Editar tipo de servicio (SP_EDITAR_TIPO_SERVICIO)
app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, duracion, editado_por } = req.body;
  try {
    const pool = await getConnection();
    const request = pool.request()
      .input('tipo_servicio_id', sql.Int, id)
      .input('nombre', sql.VarChar(100), nombre)
      .input('descripcion', sql.VarChar(200), descripcion)
      .input('horas_estimadas', sql.VarChar(50), duracion || null)
      .input('precio_base', sql.Decimal(10, 2), precio || null)
      .input('editado_por', sql.Int, editado_por || 1);

    const result = await request.execute('SP_EDITAR_TIPO_SERVICIO');
    res.json(result.recordset[0] || { response: '200 OK', msg: 'Editado', allow: 1 });
  } catch (error) {
    console.error('Error en PUT /api/services/:id', error);
    res.status(500).json({ response: '500 ERROR', msg: error.message, error });
  }
});

// PUT - Editar estado tipo de servicio (SP)
app.put('/api/services/estado/:id', async (req, res) => {
  const { id } = req.params;
  const { activo, editado_por } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('tipo_servicio_id', sql.Int, id)
      .input('activo', sql.Bit, activo)
      .input('editado_por', sql.Int, editado_por)
      .execute('SP_EDITAR_ESTADO_TIPO_SERVICIO');
    res.json(result.recordset[0] || { response: '200 OK', msg: 'Estado editado' });
  } catch (error) {
    res.status(500).json({ response: '500 ERROR', msg: error.message });
  }
});

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
  console.log('Cargando rutas de historial de servicios...');
  const serviceHistoryRouter = require('./routes/serviceHistory');
  app.use('/api/service-history', serviceHistoryRouter);
  console.log('Rutas de historial de servicios cargadas exitosamente');
  console.log('/api/service-history/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de historial de servicios:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de historial de servicios');
}

//IMPORTAR Y CONFIGURAR RUTAS DE NOTIFICACIONES
try {
  console.log('Cargando rutas de notificaciones...');
  const notificationsRouter = require('./routes/notifications');
  app.use('/api/notifications', notificationsRouter);
  console.log('Rutas de notificaciones cargadas exitosamente');
  console.log('/api/notifications/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de notificaciones:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de notificaciones');
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

//IMPORTAR Y CONFIGURAR RUTAS DE CONFIGURACIÓN DE EMPRESA (JSON)
try {
  console.log('Cargando rutas de configuración de empresa...');
  const companyConfigRouter = require('./routes/companyConfig');
  app.use('/api/company-config', companyConfigRouter);
  console.log('Rutas de configuración de empresa cargadas exitosamente');
  console.log('/api/company-config/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de configuración de empresa:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de configuración de empresa');
}

//IMPORTAR Y CONFIGURAR RUTAS DE USUARIOS
try {
  console.log('Cargando rutas de usuarios...');
  const usersRouter = require('./routes/users');
  app.use('/api/users', usersRouter);
  console.log('Rutas de usuarios cargadas exitosamente');
  console.log('/api/users/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de usuarios:', error.message);
  console.error(' Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de usuarios');
}

//IMPORTAR Y CONFIGURAR RUTAS DE COTIZACIONES
try {
  console.log('Cargando rutas de cotizaciones...');
  const quotationsRouter = require('./routes/quotations');
  app.use('/api/quotations', quotationsRouter);
  console.log('Rutas de cotizaciones cargadas exitosamente');
  console.log('/api/quotations/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de cotizaciones:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de cotizaciones');
}

//IMPORTAR Y CONFIGURAR RUTAS DE ÓRDENES DE TRABAJO
try {
  console.log('Cargando rutas de órdenes de trabajo...');
  const workOrdersRouter = require('./routes/workOrders');
  app.use('/api/workorders', workOrdersRouter);
  console.log('Rutas de órdenes de trabajo cargadas exitosamente');
  console.log('/api/workorders/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de órdenes de trabajo:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de órdenes de trabajo');
}

// PERMISOS DE PRUEBA DE MANEJO / CONTROL DE CALIDAD
try {
  console.log('Cargando rutas de permisos de prueba de manejo...');
  const driveTestPermissionsRouter = require('./routes/driveTestPermissions');
  app.use('/api/drive-test-permissions', driveTestPermissionsRouter);
  console.log('Rutas de permisos de prueba de manejo cargadas exitosamente');
  console.log('/api/drive-test-permissions/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de permisos de prueba de manejo:', error.message);
  console.warn('El servidor continuará sin las rutas de permisos de prueba de manejo');
}

//IMPORTAR Y CONFIGURAR RUTAS DE ESTADOS DE OT
// DESHABILITADO - Ahora se maneja directamente en server.js con SQL Server
/*
try {
  console.log('Cargando rutas de estados de órdenes de trabajo...');
  const workOrderStatesRouter = require('./routes/workOrderStates');
  app.use('/api/workorder-states', workOrderStatesRouter);
  console.log('Rutas de estados de OT cargadas exitosamente');
} catch (error) {
  console.error('Error cargando rutas de estados de OT:', error.message);
  console.warn('El servidor continuará sin las rutas de estados de OT');
}
*/
console.log('Rutas de estados de OT: Usando endpoints SQL Server directos (más abajo en el código)');

//IMPORTAR Y CONFIGURAR RUTAS DE SOLICITUDES DE FIRMA
try {
  console.log('Cargando rutas de solicitudes de firma...');
  const signatureRequestsRouter = require('./routes/signatureRequests');
  app.use('/api/signature-requests', signatureRequestsRouter);
  console.log('Rutas de solicitudes de firma cargadas exitosamente');
} catch (error) {
  console.error('Error cargando rutas de solicitudes de firma:', error.message);
  console.warn('El servidor continuará sin las rutas de solicitudes de firma');
}

//IMPORTAR Y CONFIGURAR RUTAS DE LOGS
try {
  console.log('Cargando rutas de logs del sistema...');
  const logsRouter = require('./routes/logs');
  app.use('/api/logs', logsRouter);
  console.log('Rutas de logs cargadas exitosamente');
  console.log('/api/logs/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de logs:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de logs');
}

//IMPORTAR Y CONFIGURAR RUTAS DE RECORDATORIOS
try {
  console.log('Cargando rutas de recordatorios...');
  const remindersRouter = require('./routes/reminders');
  app.use('/api/reminders', remindersRouter);
  console.log('Rutas de recordatorios cargadas exitosamente');
  console.log('/api/reminders/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de recordatorios:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de recordatorios');
}

// Endpoint temporal de debug para verificar conectividad desde el frontend
app.post('/api/reminders-debug', (req, res) => {
  try {
    console.log('DEBUG POST /api/reminders-debug - body:', req.body);
    res.json({ success: true, received: req.body });
  } catch (err) {
    console.error('Error en /api/reminders-debug:', err);
    res.status(500).json({ success: false, message: 'Debug endpoint error', error: err.message });
  }
});


// IMPORTAR Y CONFIGURAR RUTAS DE TIPOS DE SERVICIO (SP)
try {
  console.log('Cargando rutas de tipos de servicio (SP)...');
  const serviceTypesRouter = require('./routes/serviceTypes');
  app.use('/api/service-types', serviceTypesRouter);
  console.log('Rutas de tipos de servicio (SP) cargadas exitosamente');
  console.log('/api/service-types/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de tipos de servicio (SP):', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de tipos de servicio (SP)');
}

// � IMPORTAR Y CONFIGURAR RUTAS DE PAGOS DE FACTURAS (JSON)
try {
  console.log('Cargando rutas de pagos de facturas...');
  const invoicePaymentsRouter = require('./routes/invoicePayments');
  app.use('/api/invoice-payments', invoicePaymentsRouter);
  console.log('Rutas de pagos de facturas cargadas exitosamente');
  console.log('/api/invoice-payments/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de pagos de facturas:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de pagos de facturas');
}

// ⚡ IMPORTAR Y CONFIGURAR RUTAS DE ITEMS DE FACTURA POS (Real-Time SP)
try {
  console.log('⚡ Cargando rutas de items de factura POS (Real-Time)...');
  const invoiceItemsRouter = require('./routes/invoiceItems');
  app.use('/api/invoice-items', invoiceItemsRouter);
  console.log('✅ Rutas de items de factura POS cargadas exitosamente');
  console.log('   📌 POST /api/invoice-items/add (SP_AGREGAR_ITEM_FACTURA_POS)');
  console.log('   📌 PUT /api/invoice-items/edit (SP_EDITAR_ITEM_FACTURA_POS)');
  console.log('   📌 DELETE /api/invoice-items/delete/:id (SP_ELIMINAR_ITEM_FACTURA_POS)');
} catch (error) {
  console.error('❌ Error cargando rutas de items de factura POS:', error.message);
  console.error('Stack:', error.stack);
  console.warn('⚠️ El servidor continuará sin las rutas de items de factura POS');
}

// IMPORTAR Y CONFIGURAR RUTAS DE FACTURAS (JSON)
try {
  console.log('Cargando rutas de facturas (JSON)...');
  const invoicesRouter = require('./routes/invoices');
  app.use('/api/invoices', invoicesRouter);
  console.log('Rutas de facturas cargadas exitosamente');
  console.log('/api/invoices/* endpoints disponibles');
} catch (error) {
  console.error('Error cargando rutas de facturas:', error.message);
  console.error('Stack:', error.stack);
  console.warn('El servidor continuará sin las rutas de facturas');
}

// =====================
// RUTAS SIMPLES DE PRODUCTS (JSON)
// =====================
const productsFile = path.join(__dirname, 'data', 'products.json');

app.get('/api/products', (req, res) => {
  try {
    if (!fs.existsSync(productsFile)) {
      fs.writeFileSync(productsFile, '[]', 'utf8');
    }
    const raw = fs.readFileSync(productsFile, 'utf8');
    const products = JSON.parse(raw || '[]');
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Error leyendo products.json', err);
    res.status(500).json({ success: false, message: 'Error leyendo productos' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.name) {
      return res.status(400).json({ success: false, message: 'Nombre requerido' });
    }
    const raw = fs.existsSync(productsFile) ? fs.readFileSync(productsFile, 'utf8') : '[]';
    const products = JSON.parse(raw || '[]');
    const newProduct = {
      id: uuidv4(),
      image: payload.image || '',
      name: payload.name,
      code: payload.code || payload.id || '',
      brand: payload.brand || '',
      model: payload.model || '',
      description: payload.description || '',
      price: Number(payload.price) || 0,
      cost: Number(payload.cost) || 0,
      isTaxed: !!payload.isTaxed,
      exento: !!payload.exento,
      exonerado: !!payload.exonerado,
      category: payload.category || 'GENERAL',
      type: payload.type || 'product',
      stock: Number(payload.stock) || 0,
      stockMin: Number(payload.stockMin) || 0,
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
    res.json({ success: true, data: newProduct });
  } catch (err) {
    console.error('Error guardando producto', err);
    res.status(500).json({ success: false, message: 'Error guardando producto' });
  }
});

// PUT - Editar producto por id
app.put('/api/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    if (!fs.existsSync(productsFile)) {
      return res.status(404).json({ success: false, message: 'products.json no encontrado' });
    }
    const raw = fs.readFileSync(productsFile, 'utf8');
    const products = JSON.parse(raw || '[]');
    const idx = products.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    // Actualizar solo campos permitidos
    const allowed = ['name','price','image','isTaxed','exento','exonerado','category','type','stock','brand','model','code','cost','description','stockMin'];
    allowed.forEach(k => {
      if (Object.prototype.hasOwnProperty.call(payload, k)) {
        products[idx][k] = payload[k];
      }
    });

    products[idx].updatedAt = new Date().toISOString();
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
    res.json({ success: true, data: products[idx] });
  } catch (err) {
    console.error('Error actualizando producto', err);
    res.status(500).json({ success: false, message: 'Error actualizando producto' });
  }
});

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

    console.log('Eliminando imagen de Spaces:', key);
    
    const result = await spacesService.deleteImage(key);
    
    if (result.success) {
      console.log('Imagen eliminada exitosamente de Spaces');
      res.json({ success: true, message: 'Imagen eliminada exitosamente' });
    } else {
      console.error('Error eliminando de Spaces:', result.error);
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Verificar si existen usuarios administradores en el sistema
app.get('/api/auth/has-admin-users', async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Usar SP_OBTENER_USUARIOS sin parámetro para obtener todos los usuarios
    const result = await pool.request()
      .input('usuario_id', sql.Int, null)
      .execute('SP_OBTENER_USUARIOS');
    
    // Filtrar usuarios administradores (sin verificar activo ya que el SP solo devuelve activos)
    const adminUsers = result.recordset.filter(user => 
      user.rol === 'Administrador' || user.rol === 'administrador' || user.rol === 'ADMINISTRADOR'
    );
    
    console.log(`📊 Total usuarios: ${result.recordset.length}, Administradores: ${adminUsers.length}`);
    
    res.json({
      success: true,
      hasAdminUsers: adminUsers.length > 0,
      adminCount: adminUsers.length
    });
  } catch (error) {
    console.error('Error verificando usuarios administradores:', error);
    res.status(500).json({
      success: false,
      hasAdminUsers: true, // Por seguridad, asumir que hay admins si falla
      error: 'Error verificando usuarios'
    });
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
  console.log('Registrar usuario:', req.body);
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
  console.log('Verificar código:', req.body);
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
  console.log('Registrar password para correo:', req.body.correo);
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
  console.log('Obteniendo roles...');
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
  console.log('Registrar usuario panel admin:', req.body);
  try {
    const { nombre_completo, correo, telefono, rol, registradoPor, rtn } = req.body;
    
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
      .input('rtn', sql.VarChar(20), rtn || null)
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
  console.log('Registrar cliente (frontend endpoint):', req.body);
  try {
    const { fullName, email, phone, rtn } = req.body;
    
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
      .input('rtn', sql.VarChar(20), rtn || null)
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
  console.log('Login attempt for:', req.body.correo);
  
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
// RECUPERACIÓN DE CONTRASEÑA
// ==============================================

const emailService = require('./services/emailService');

// 1. Iniciar recuperación de contraseña
// SP: SP_INICIAR_RECUPERACION_PASSWORD
// Params: @correo VARCHAR(100)
// Return: msg, allow (0, 1), token (CHAR(36))
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 Iniciando recuperación de contraseña para:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), email.toLowerCase())
      .execute('SP_INICIAR_RECUPERACION_PASSWORD');

    const response = result.recordset[0];
    console.log('📝 Respuesta del SP_INICIAR_RECUPERACION_PASSWORD:', response);

    // El SP devuelve: msg, allow (0 o 1), token (CHAR(36))
    if (response.allow === 1 && response.token) {
      console.log('✅ Token generado:', response.token);
      
      // Enviar email con el token (en desarrollo solo se registra en consola)
      try {
        const emailResult = await emailService.sendPasswordRecoveryEmail(
          email,
          response.token,
          email.split('@')[0] // Usar parte del email como nombre temporal
        );
        
        res.json({
          success: true,
          message: response.msg || 'Se ha enviado un enlace de recuperación a su correo',
          token: response.token, // En desarrollo, devolvemos el token directamente
          resetUrl: emailResult.resetUrl // URL completa para testing
        });
      } catch (emailError) {
        console.error('⚠️ Error enviando email:', emailError);
        // Aún así devolvemos éxito porque el token fue generado
        res.json({
          success: true,
          message: response.msg || 'Token generado (email no enviado en desarrollo)',
          token: response.token
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: response.msg || 'No se pudo iniciar la recuperación de contraseña'
      });
    }

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 2. Validar token de recuperación
// SP: SP_VALIDAR_TOKEN_RECUPERACION
// Params: @token CHAR(36)
// Return: msg, allow (0, 1)
app.post('/api/auth/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    console.log('🔍 Validando token de recuperación:', token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'El token es requerido'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('token', sql.Char(36), token)
      .execute('SP_VALIDAR_TOKEN_RECUPERACION');

    const response = result.recordset[0];
    console.log('📝 Respuesta del SP_VALIDAR_TOKEN_RECUPERACION:', response);

    // El SP devuelve: msg, allow (0 o 1)
    const isValid = response.allow === 1;

    res.json({
      success: isValid,
      message: response.msg,
      valid: isValid
    });

  } catch (error) {
    console.error('Error validando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. Completar recuperación de contraseña
// SP: SP_COMPLETAR_RECUPERACION_PASSWORD
// Params: @token CHAR(36), @password NVARCHAR(100)
// Return: msg, allow (0, 1)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log('🔄 Completando recuperación de contraseña con token:', token);

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'El token y la nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('token', sql.Char(36), token)
      .input('password', sql.NVarChar(100), newPassword)
      .execute('SP_COMPLETAR_RECUPERACION_PASSWORD');

    const response = result.recordset[0];
    console.log('📝 Respuesta del SP_COMPLETAR_RECUPERACION_PASSWORD:', response);

    // El SP devuelve: msg, allow (0 o 1)
    if (response.allow === 1) {
      console.log('✅ Contraseña actualizada exitosamente');
      res.json({
        success: true,
        message: response.msg || 'Contraseña actualizada exitosamente'
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.msg || 'No se pudo actualizar la contraseña'
      });
    }

  } catch (error) {
    console.error('Error completando recuperación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Data reset endpoints removed: functionality deprecated and UI removed.
// If needed in future, reintroduce with proper safeguards and database-backed implementation.

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
    
    // Debug: mostrar cada línea (sin datos sensibles)
    console.log(`Procesando ${dataLines.length} líneas de clientes`);
    
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

// ========================================
// ENDPOINTS DE CLIENTES
// ========================================
// IMPORTANTE: Los endpoints de clientes ahora se manejan en routes/clientsApi.js
// No agregar endpoints duplicados aquí para evitar conflictos
try {
  console.log(' Cargando rutas de clientes desde routes/clientsApi.js...');
  const clientsApiRouter = require('./routes/clientsApi');
  app.use('/api/clients', clientsApiRouter);
  console.log(' Rutas de clientes cargadas correctamente');
} catch (error) {
  console.error(' Error cargando rutas de clientes:', error.message);
}

// IMPORTAR Y CONFIGURAR RUTAS DE SESIONES DE CAJA (JSON)
try {
  console.log('Cargando rutas de sesiones de caja...');
  const cashRouter = require('./routes/cashSessions');
  app.use('/api/cash-sessions', cashRouter);
  console.log('Rutas de sesiones de caja cargadas exitosamente');
} catch (error) {
  console.error('Error cargando rutas de sesiones de caja:', error.message);
  console.warn('El servidor continuará sin rutas de sesiones de caja');
}

const PORT = process.env.PORT || 8080;

// ====== CHAT AVANZADO (usando SQL Server Stored Procedures) ======
io.on('connection', (socket) => {
  console.log(' Nuevo cliente conectado:', socket.id);

  // Unirse a una sala específica (sala_id)
  socket.on('joinRoom', async ({ sala_id, usuario_consultante }) => {
    console.log(' joinRoom llamado:', { sala_id, usuario_consultante, socket_id: socket.id });
    if (!sala_id) {
      console.log(' No se proporcionó sala_id');
      return;
    }
    socket.join(sala_id.toString());
    console.log(` Socket ${socket.id} unido a sala ${sala_id}`);
    
    // Cargar historial desde SQL Server
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('sala_id', sql.Int, parseInt(sala_id))
        .input('usuario_consultante', sql.Int, parseInt(usuario_consultante || 0))
        .execute('SP_OBTENER_HISTORIAL_SALA');
      
      console.log(' SP_OBTENER_HISTORIAL_SALA devolvió:', result.recordset.length, 'mensajes');
      
      // Mostrar detalles de mensajes con archivos
      const mensajesConArchivos = result.recordset.filter(m => m.archivo_url);
      if (mensajesConArchivos.length > 0) {
        console.log('  Mensajes con archivo_url:', mensajesConArchivos.length);
        mensajesConArchivos.forEach((m, i) => {
          console.log(`  [${i+1}] mensaje_id: ${m.mensaje_id}, archivo_url: ${m.archivo_url}`);
        });
      }
      
      const mensajes = result.recordset.map(m => {
        // Deducir tipo_archivo basándose en archivo_url (el SP no devuelve tipo_archivo)
        let tipo_archivo = null;
        if (m.archivo_url) {
          const url = m.archivo_url.toLowerCase();
          if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
            tipo_archivo = 'image/jpeg';
          }
        }
        
        return {
          mensaje_id: m.mensaje_id,
          sala_id: m.sala_id,
          usuario_id: m.usuario_id,
          remitente: m.remitente,
          rol: m.rol_remitente,
          rol_remitente: m.rol_remitente,
          contenido: m.contenido,
          archivo_url: m.archivo_url || null,
          tipo_archivo: tipo_archivo,
          es_sistema: m.es_sistema,
          enviado_en: m.enviado_en,
          leido: m.leido,
          es_mio: m.es_mio
        };
      });
      
      console.log(' Emitiendo historial con', mensajes.length, 'mensajes');
      if (mensajes.some(m => m.archivo_url)) {
        console.log(' Mensajes mapeados con archivos:', mensajes.filter(m => m.archivo_url).length);
      }
      socket.emit('chat:historial', { sala_id, mensajes });
    } catch (error) {
      console.error('Error cargando historial:', error);
      socket.emit('chat:error', { mensaje: 'Error cargando historial' });
    }
  });

  socket.on('leaveRoom', ({ sala_id }) => {
    if (!sala_id) return;
    socket.leave(sala_id);
    console.log(`Socket ${socket.id} salió de sala ${sala_id}`);
  });

  // Nuevo evento enviar mensaje estándar (usando SP)
  socket.on('chat:send', async (data) => {
    console.log(' Socket recibió chat:send con data:', JSON.stringify(data, null, 2));
    
    if (!data || !data.sala_id || !data.contenido || !data.usuario_id) {
      console.log(' Datos incompletos para enviar mensaje:', {
        data_exists: !!data,
        sala_id: data?.sala_id,
        contenido: data?.contenido,
        usuario_id: data?.usuario_id
      });
      return;
    }
    
    try {
      console.log(' Datos completos, ejecutando SP_ENVIAR_MENSAJE...');
      console.log(' archivo_url recibido:', data.archivo_url || 'null');
      console.log(' tipo_archivo recibido:', data.tipo_archivo || 'null');
      const pool = await getConnection();
      const result = await pool.request()
        .input('sala_id', sql.Int, parseInt(data.sala_id))
        .input('usuario_id', sql.Int, parseInt(data.usuario_id))
        .input('contenido', sql.NVarChar(1000), data.contenido)
        .input('archivo_url', sql.VarChar(255), data.archivo_url || null)
        .execute('SP_ENVIAR_MENSAJE');
      
      console.log('📊 SP_ENVIAR_MENSAJE ejecutado. Resultado:', result.recordset);
      const respuesta = result.recordset[0];
      
      if (respuesta) {
        console.log('📋 Respuesta del SP:');
        console.log('   - allow:', respuesta.allow);
        console.log('   - mensaje_id:', respuesta.mensaje_id);
        console.log('   - msg:', respuesta.msg);
      }
      
      if (respuesta && respuesta.allow === 1) {
        // Mensaje guardado exitosamente, consultar información del usuario
        try {
          const userResult = await pool.request()
            .input('obtener_todos', sql.Bit, 0)
            .input('usuario_id', sql.Int, parseInt(data.usuario_id))
            .execute('SP_OBTENER_USUARIOS');
          
          const usuario = userResult.recordset[0];
          
          // Mensaje completo con información del remitente
          const mensaje = {
            mensaje_id: respuesta.mensaje_id,
            sala_id: data.sala_id,
            usuario_id: data.usuario_id,
            remitente: usuario ? usuario.nombre_completo : 'Usuario',
            rol: usuario ? usuario.rol : (data.rol || 'client'),
            rol_remitente: usuario ? usuario.rol : (data.rol || 'client'),
            contenido: data.contenido,
            es_sistema: false,
            enviado_en: new Date().toISOString(),
            leido: false,
            archivo_url: data.archivo_url || null,
            tipo_archivo: data.tipo_archivo || null
          };
          console.log('📤 Emitiendo chat:mensaje a sala', data.sala_id);
          console.log('   👤 Usuario:', mensaje.remitente, '| Rol:', mensaje.rol);
          console.log('   📎 Archivo:', mensaje.archivo_url ? 'SÍ' : 'NO');
          if (mensaje.archivo_url) {
            console.log('   🔗 URL:', mensaje.archivo_url);
          }
          io.to(data.sala_id.toString()).emit('chat:mensaje', mensaje);
        } catch (userError) {
          console.error('⚠️ Error consultando usuario, enviando mensaje sin nombre:', userError);
          // Si falla consultar el usuario, enviar el mensaje de todos modos
          const mensaje = {
            mensaje_id: respuesta.mensaje_id,
            sala_id: data.sala_id,
            usuario_id: data.usuario_id,
            remitente: 'Usuario',
            rol: data.rol || 'client',
            rol_remitente: data.rol || 'client',
            contenido: data.contenido,
            es_sistema: false,
            enviado_en: new Date().toISOString(),
            leido: false,
            archivo_url: data.archivo_url || null,
            tipo_archivo: data.tipo_archivo || null
          };
          io.to(data.sala_id.toString()).emit('chat:mensaje', mensaje);
        }
      } else {
        console.log('⚠️ SP_ENVIAR_MENSAJE no permitió el envío:', respuesta);
        socket.emit('chat:error', { mensaje: respuesta?.msg || 'Error enviando mensaje' });
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      socket.emit('chat:error', { mensaje: 'Error enviando mensaje' });
    }
  });

  // Solicitar historial explícito
  socket.on('chat:historial:solicitar', async ({ sala_id, usuario_consultante }) => {
    if (!sala_id) return;
    
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('sala_id', sql.Int, parseInt(sala_id))
        .input('usuario_consultante', sql.Int, parseInt(usuario_consultante || 0))
        .execute('SP_OBTENER_HISTORIAL_SALA');
      
      console.log('📜 [SOLICITAR] SP_OBTENER_HISTORIAL_SALA devolvió:', result.recordset.length, 'mensajes');
      
      // Mostrar detalles de mensajes con archivos
      const mensajesConArchivos = result.recordset.filter(m => m.archivo_url);
      if (mensajesConArchivos.length > 0) {
        console.log('🖼️  [SOLICITAR] Mensajes con archivo_url:', mensajesConArchivos.length);
        mensajesConArchivos.forEach((m, i) => {
          console.log(`  [${i+1}] mensaje_id: ${m.mensaje_id}, archivo_url: ${m.archivo_url}`);
        });
      }
      
      const mensajes = result.recordset.map(m => {
        // Deducir tipo_archivo basándose en archivo_url (el SP no devuelve tipo_archivo)
        let tipo_archivo = null;
        if (m.archivo_url) {
          const url = m.archivo_url.toLowerCase();
          if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
            tipo_archivo = 'image/jpeg';
          }
        }
        
        return {
          mensaje_id: m.mensaje_id,
          sala_id: m.sala_id,
          usuario_id: m.usuario_id,
          remitente: m.remitente,
          rol: m.rol_remitente,
          rol_remitente: m.rol_remitente,
          contenido: m.contenido,
          archivo_url: m.archivo_url || null,
          tipo_archivo: tipo_archivo,
          es_sistema: m.es_sistema,
          enviado_en: m.enviado_en,
          leido: m.leido,
          es_mio: m.es_mio
        };
      });
      
      console.log('📤 [SOLICITAR] Emitiendo historial con', mensajes.length, 'mensajes');
      if (mensajes.some(m => m.archivo_url)) {
        console.log('✅ [SOLICITAR] Mensajes mapeados con archivos:', mensajes.filter(m => m.archivo_url).length);
      }
      socket.emit('chat:historial', { sala_id, mensajes });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      socket.emit('chat:error', { mensaje: 'Error obteniendo historial' });
    }
  });

  // Marcar mensajes como leídos
  socket.on('chat:leer', async ({ sala_id, usuario_id }) => {
    if (!sala_id || !usuario_id) return;
    
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('sala_id', sql.Int, parseInt(sala_id))
        .input('usuario_id', sql.Int, parseInt(usuario_id))
        .execute('SP_MARCAR_MENSAJES_LEIDOS');
      
      const respuesta = result.recordset[0];
      if (respuesta && respuesta.allow === 1) {
        io.to(sala_id.toString()).emit('chat:leido', { sala_id, usuario_id });
      }
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  });

  // Indicador escribiendo en el chat
  socket.on('chat:typing', ({ sala_id, rol, escribiendo }) => {
    if (!sala_id) return;
    socket.to(sala_id.toString()).emit('chat:typing', { sala_id, rol, escribiendo: !!escribiendo });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Registrar endpoint para historial desde factura pagada
try {
  console.log(' Cargando endpoint de historial desde factura pagada...');
  const serviceHistoryFromInvoiceRouter = require('./routes/serviceHistoryFromInvoice');
  app.use('/api/service-history', serviceHistoryFromInvoiceRouter);
  console.log(' Endpoint /api/service-history/from-invoice habilitado');
} catch (error) {
  console.error('Error cargando endpoint de historial desde factura pagada:', error.message);
}

// Registrar endpoints de chat (SQL SERVER - SP)
try {
  console.log('💬 Cargando endpoints de chat...');
  const chatRouter = require('./routes/chat');
  app.use('/api/chat', chatRouter);
  console.log('✅ Endpoints de chat habilitados');
} catch (error) {
  console.error('❌ Error cargando endpoints de chat:', error.message);
}

// ==================== ENDPOINT DE DIAGNÓSTICO CHAT ====================
app.get('/api/chat/diagnostico', async (req, res) => {
  try {
    const pool = await getConnection();
    const diagnostico = {
      stored_procedures_disponibles: [],
      chats_usuario_9: null,
      chats_usuario_13: null,
      errores: []
    };

    // 1. Verificar qué SPs de chat existen
    try {
      const sps = await pool.request().query(`
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_TYPE = 'PROCEDURE' 
        AND ROUTINE_NAME LIKE '%CHAT%' OR ROUTINE_NAME LIKE '%SALA%' OR ROUTINE_NAME LIKE '%MENSAJE%'
        ORDER BY ROUTINE_NAME
      `);
      diagnostico.stored_procedures_disponibles = sps.recordset.map(sp => sp.ROUTINE_NAME);
    } catch (error) {
      diagnostico.errores.push({ paso: 'listar_sps', error: error.message });
    }

    // 2. Probar SP_OBTENER_CHATS_USUARIO con usuario 9 (cliente)
    try {
      const chatsCliente = await pool.request()
        .input('usuario_id', sql.Int, 9)
        .execute('SP_OBTENER_CHATS_USUARIO');
      
      diagnostico.chats_usuario_9 = {
        total: chatsCliente.recordset.length,
        salas: chatsCliente.recordset
      };
    } catch (error) {
      diagnostico.chats_usuario_9 = { error: error.message };
    }

    // 3. Probar SP_OBTENER_CHATS_USUARIO con usuario 13 (admin)
    try {
      const chatsAdmin = await pool.request()
        .input('usuario_id', sql.Int, 13)
        .execute('SP_OBTENER_CHATS_USUARIO');
      
      diagnostico.chats_usuario_13 = {
        total: chatsAdmin.recordset.length,
        salas: chatsAdmin.recordset
      };
    } catch (error) {
      diagnostico.chats_usuario_13 = { error: error.message };
    }

    res.json({ success: true, diagnostico });

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ESTADOS DE OT (SQL SERVER - SP) ====================

// GET - Obtener todos los estados (usando SP_OBTENER_ORDENES_TRABAJO)
app.get('/api/workorder-states', async (req, res) => {
  try {
    console.log('Obteniendo todos los estados de órdenes de trabajo...');
    const pool = await getConnection();
    
    // Obtener todas las órdenes de trabajo usando el SP
    const result = await pool.request()
      .execute('SP_OBTENER_ORDENES_TRABAJO');
    
    // Convertir a formato { "1": "Abierta", "2": "En proceso", ... }
    const statesMap = {};
    result.recordset.forEach(row => {
      statesMap[row.ot_id] = row.estado_ot;
    });
    
    console.log(`${result.recordset.length} estados obtenidos`);
    res.json({ success: true, data: statesMap });
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estados', 
      error: error.message 
    });
  }
});

// PUT - Actualizar estado de una OT (usando SP_GESTIONAR_ESTADO_OT)
app.put('/api/workorder-states/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ 
        success: false, 
        message: 'El campo "estado" es requerido' 
      });
    }
    
    console.log(`Actualizando estado de OT ${otId} a: ${estado}`);
    
    // Obtener usuario actual (hardcoded por ahora, después vendrá del token)
    const registradoPor = req.user?.id || 1;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('nuevo_estado', sql.VarChar(50), estado)
      .input('registrado_por', sql.Int, registradoPor)
      .execute('SP_GESTIONAR_ESTADO_OT');
    
    const response = result.recordset[0];
    
    if (response.allow === 1) {
      console.log(`Estado de OT ${otId} actualizado exitosamente`);
      res.json({ 
        success: true, 
        message: response.msg,
        data: { otId, estado } 
      });
    } else {
      console.warn(`No se pudo actualizar estado: ${response.msg}`);
      res.status(400).json({ 
        success: false, 
        message: response.msg 
      });
    }
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar estado', 
      error: error.message 
    });
  }
});

// GET - Obtener estado de una OT específica (usando SP_OBTENER_ORDENES_TRABAJO)
app.get('/api/workorder-states/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    console.log(`Obteniendo estado de OT ${otId}...`);
    console.log(`. Obteniendo estado de OT ${otId}...`);    
    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .execute('SP_OBTENER_ORDENES_TRABAJO');
    
    const estado = result.recordset[0]?.estado_ot || null;
    
    if (estado) {
      console.log(`Estado de OT ${otId}: ${estado}`);
    } else {
      console.log(`OT ${otId} no encontrada`);
    }
    
    res.json({ 
      success: true, 
      data: { otId, estado } 
    });
  } catch (error) {
    console.error('Error leyendo estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al leer estado', 
      error: error.message 
    });
  }
});

console.log('Rutas de estados de OT cargadas: /api/workorder-states (usando SQL Server)');

// 404 - Debe estar AL FINAL, después de todas las rutas
app.use('*', (req, res) => {
  // Ruta no encontrada: respuesta 404 enviada (log suprimido)
  res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
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
