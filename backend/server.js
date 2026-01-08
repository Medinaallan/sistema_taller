const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const userRoutes = require('./routes/users');
const servicesRoutes = require('./routes/services');
const vehiclesRoutes = require('./routes/vehicles');
const excelImportRoutes = require('./routes/excelImport');
const serviceHistoryRoutes = require('./routes/serviceHistory');
const appointmentsRoutes = require('./routes/appointments');
const quotationsRoutes = require('./routes/quotations');
const logsRoutes = require('./routes/logs');
const workOrderStatesRoutes = require('./routes/workOrderStates');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
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
  origin: process.env.FRONTEND_URL || 'http://localhost:5176',
  credentials: true
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/excel-import', excelImportRoutes);
app.use('/api/service-history', serviceHistoryRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/logs', logsRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.DB_DATABASE
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === 'EREQUEST' && err.originalError) {
    // Error de SQL Server
    return res.status(500).json({
      success: false,
      message: 'Error en la base de datos',
      error: process.env.NODE_ENV === 'development' ? err.originalError.message : 'Error interno'
    });
  }
  
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


// Socket.IO: Chat básico
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  socket.on('chatMessage', (msg) => {
    // Reenviar el mensaje a todos los clientes conectados
    io.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Base de datos: ${process.env.DB_DATABASE}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
});
