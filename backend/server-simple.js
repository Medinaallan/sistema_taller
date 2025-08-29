const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// CORS para permitir conexiones del frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));

// Importar simulación de stored procedures
const storedProcedures = require('./simulation/storedProcedures');

console.log('✅ Stored procedures cargados:', Object.keys(storedProcedures));

// PASO 1: Validar correo
app.post('/api/auth/validate-email', async (req, res) => {
  try {
    console.log('📧 POST /api/auth/validate-email - Body:', req.body);
    const { correo } = req.body;
    
    if (!correo) {
      return res.status(400).json({
        msg: 'Correo es requerido',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_VALIDAR_CORREO_USUARIO(correo);
    console.log('📧 Resultado validación:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/auth/validate-email:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// PASO 2: Registrar información del cliente
app.post('/api/auth/register-user-info', async (req, res) => {
  try {
    console.log('👤 POST /api/auth/register-user-info - Body:', req.body);
    const { nombre_completo, correo, telefono } = req.body;
    
    if (!nombre_completo || !correo || !telefono) {
      return res.status(400).json({
        msg: 'Todos los campos son requeridos',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_REGISTRAR_USUARIO_CLIENTE(
      nombre_completo, correo, telefono
    );
    
    console.log('👤 Resultado registro:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/auth/register-user-info:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// PASO 3: Verificar código de seguridad
app.post('/api/auth/verify-security-code', async (req, res) => {
  try {
    console.log('🔑 POST /api/auth/verify-security-code - Body:', req.body);
    const { correo, codigo_seguridad } = req.body;
    
    if (!correo || !codigo_seguridad) {
      return res.status(400).json({
        msg: 'Correo y código de seguridad son requeridos',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_VERIFICAR_CODIGO_SEGURIDAD(correo, codigo_seguridad);
    console.log('🔑 Resultado verificación:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/auth/verify-security-code:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// PASO 4: Registrar contraseña
app.post('/api/auth/register-password', async (req, res) => {
  try {
    console.log('🔐 POST /api/auth/register-password - Body:', req.body);
    const { correo, password } = req.body;
    
    if (!correo || !password) {
      return res.status(400).json({
        msg: 'Correo y contraseña son requeridos',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_REGISTRAR_PASSWORD(correo, password);
    console.log('🔐 Resultado contraseña:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/auth/register-password:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// Login - exactamente como especificaste
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🚪 POST /api/auth/login - Body:', req.body);
    const { correo, password } = req.body;
    
    if (!correo || !password) {
      return res.status(400).json({
        allow: 0,
        msg: 'Correo y contraseña son requeridos'
      });
    }

    const result = await storedProcedures.SP_LOGIN(correo, password);
    console.log('🚪 Resultado login:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/auth/login:', error);
    res.status(500).json({
      allow: 0,
      msg: 'Error interno del servidor'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 GET /api/health');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mode: 'SIMULATION'
  });
});

// Stats para debugging
app.get('/api/stats', (req, res) => {
  console.log('📊 GET /api/stats');
  const stats = storedProcedures.getStats();
  res.json({
    success: true,
    data: stats
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('💥 Error general:', err);
  res.status(500).json({
    msg: 'Error interno del servidor'
  });
});

// 404
app.use('*', (req, res) => {
  console.log('❓ 404 - Ruta no encontrada:', req.originalUrl);
  res.status(404).json({ 
    msg: 'Endpoint no encontrado' 
  });
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log('🚀 Servidor iniciado exitosamente');
  console.log(`🌍 Puerto: ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log('✅ Listo para recibir peticiones');
});
