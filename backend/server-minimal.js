const express = require('express');
const app = express();

// Middleware básico
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Cargar stored procedures
let storedProcedures;
try {
  storedProcedures = require('./simulation/storedProcedures');
  console.log('✅ Stored procedures cargados correctamente');
} catch (error) {
  console.error('❌ Error cargando stored procedures:', error.message);
  process.exit(1);
}

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check solicitado');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Validar email (Paso 1)
app.post('/api/auth/validate-email', async (req, res) => {
  console.log('📧 Validar email:', req.body);
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.json({ msg: 'Correo requerido', allow: 0 });
    }
    const result = await storedProcedures.SP_VALIDAR_CORREO_USUARIO(correo);
    console.log('📧 Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error validando email:', error);
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
    const result = await storedProcedures.SP_REGISTRAR_USUARIO_CLIENTE(nombre_completo, correo, telefono);
    console.log('👤 Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error registrando usuario:', error);
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
    const result = await storedProcedures.SP_VERIFICAR_CODIGO_SEGURIDAD(correo, codigo_seguridad);
    console.log('🔑 Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error verificando código:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Registrar password (Paso 4)
app.post('/api/auth/register-password', async (req, res) => {
  console.log('🔐 Registrar password:', req.body);
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.json({ msg: 'Correo y password requeridos', allow: 0 });
    }
    const result = await storedProcedures.SP_REGISTRAR_PASSWORD(correo, password);
    console.log('🔐 Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error registrando password:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  console.log('🚪 Login:', req.body);
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.json({ allow: 0, msg: 'Credenciales requeridas' });
    }
    const result = await storedProcedures.SP_LOGIN(correo, password);
    console.log('🚪 Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.json({ allow: 0, msg: 'Error interno' });
  }
});

// 404
app.use('*', (req, res) => {
  console.log('❓ Ruta no encontrada:', req.originalUrl);
  res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

const PORT = 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
    process.exit(1);
  } else {
    console.error('❌ Error del servidor:', error);
  }
});
