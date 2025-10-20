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

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check solicitado');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// PROBAR IMPORTACIÓN DE CLIENTES API
try {
  console.log('Intentando cargar clientsApi...');
  const clientsApiRouter = require('./routes/clientsApi');
  console.log('clientsApi cargado exitosamente');
  
  // Usar rutas
  app.use('/api/clients', clientsApiRouter);
  console.log('Rutas de clientes registradas');
  
} catch (error) {
  console.error('Error cargando clientsApi:', error.message);
  console.error('Stack:', error.stack);
}

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Servidor de prueba iniciado en puerto ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Clientes: http://localhost:${PORT}/api/clients`);
});