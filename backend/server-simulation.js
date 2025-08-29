const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP por ventana
  message: 'Demasiadas peticiones desde esta IP, intente más tarde.'
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Importar simulación de stored procedures (temporal)
const storedProcedures = require('./simulation/storedProcedures');

// Routes para autenticación y registro - FLUJO EXACTO DE 4 PASOS

// PASO 1: Validar correo
app.post('/api/auth/validate-email', async (req, res) => {
  try {
    const { correo } = req.body;
    
    if (!correo) {
      return res.status(400).json({
        msg: 'Correo es requerido',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_VALIDAR_CORREO_USUARIO(correo);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/auth/validate-email:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// PASO 2: Registrar información del cliente
app.post('/api/auth/register-user-info', async (req, res) => {
  try {
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
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/auth/register-user-info:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// PASO 3: Verificar código de seguridad
app.post('/api/auth/verify-security-code', async (req, res) => {
  try {
    const { correo, codigo_seguridad } = req.body;
    
    if (!correo || !codigo_seguridad) {
      return res.status(400).json({
        msg: 'Correo y código de seguridad son requeridos',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_VERIFICAR_CODIGO_SEGURIDAD(correo, codigo_seguridad);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/auth/verify-security-code:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// PASO 4: Registrar contraseña
app.post('/api/auth/register-password', async (req, res) => {
  try {
    const { correo, password } = req.body;
    
    if (!correo || !password) {
      return res.status(400).json({
        msg: 'Correo y contraseña son requeridos',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_REGISTRAR_PASSWORD(correo, password);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/auth/register-password:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// Login - exactamente como especificaste
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    
    if (!correo || !password) {
      return res.status(400).json({
        allow: 0,
        msg: 'Correo y contraseña son requeridos'
      });
    }

    const result = await storedProcedures.SP_LOGIN(correo, password);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({
      allow: 0,
      msg: 'Error interno del servidor'
    });
  }
});

// Registro desde panel admin
app.post('/api/auth/register-admin-user', async (req, res) => {
  try {
    const { nombre_completo, correo, telefono, rol } = req.body;
    
    if (!nombre_completo || !correo || !telefono || !rol) {
      return res.status(400).json({
        msg: 'Todos los campos son requeridos',
        allow: 0
      });
    }

    const result = await storedProcedures.SP_REGISTRAR_USUARIO_PANEL_ADMIN(
      nombre_completo, correo, telefono, rol
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/auth/register-admin-user:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      allow: 0
    });
  }
});

// Routes para gestión de clientes
app.get('/api/clients', async (req, res) => {
  try {
    const result = await storedProcedures.SP_OBTENER_CLIENTES_REGISTRADOS();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in /api/clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener estadísticas (útil para debugging)
app.get('/api/stats', (req, res) => {
  const stats = storedProcedures.getStats();
  res.json({
    success: true,
    data: stats
  });
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mode: 'SIMULATION' // Indica que está en modo simulación
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Error interno'
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint no encontrado' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔧 Modo: SIMULACIÓN (usando stored procedures simulados)`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🔗 Backend URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
