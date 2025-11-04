// Test del middleware de auditoría
const express = require('express');
const { auditMiddleware } = require('./middleware/auditMiddleware');

const app = express();
app.use(express.json());

// Agregar middleware de auditoría
app.use(auditMiddleware);

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'Test exitoso', timestamp: new Date().toISOString() });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Servidor de test corriendo en puerto ${port}`);
  console.log('Haz una request a http://localhost:3001/test para probar el middleware');
});