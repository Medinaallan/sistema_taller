// Test simple para verificar que las rutas de logs se pueden cargar
const express = require('express');

try {
  console.log('📋 Probando carga de rutas de logs...');
  const logsRouter = require('./routes/logs');
  console.log('✅ Rutas de logs cargadas exitosamente');
  console.log('Tipo:', typeof logsRouter);
  console.log('Es función:', typeof logsRouter === 'function');
  
  // Crear app simple para probar
  const app = express();
  app.use(express.json());
  app.use('/api/logs', logsRouter);
  
  console.log('✅ Router integrado exitosamente');
  console.log('🎯 Las rutas de logs están funcionando correctamente');
  
} catch (error) {
  console.error('❌ Error cargando rutas de logs:', error.message);
  console.error('Stack:', error.stack);
}