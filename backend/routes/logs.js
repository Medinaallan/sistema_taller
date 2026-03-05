const express = require('express');
const router = express.Router();

// NOTA: El almacenamiento en JSON fue eliminado.
// Todas las rutas devuelven datos vacíos por ahora.
// En el futuro, conectar estos endpoints a la base de datos.

// Obtener logs (vacío - sin almacenamiento JSON)
router.get('/', async (req, res) => {
  try {
    res.json({
      logs: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear un nuevo log (no-op - sin almacenamiento JSON)
router.post('/', async (req, res) => {
  try {
    res.status(201).json({ message: 'Log recibido (almacenamiento JSON deshabilitado)' });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Exportar logs como CSV (vacío)
router.get('/export', async (req, res) => {
  try {
    const csvHeader = 'ID,Usuario,Rol,Accion,Entidad,ID_Entidad,Descripcion,Severidad,IP,Timestamp\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="system-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader);
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Limpiar logs (no-op)
router.delete('/clean', async (req, res) => {
  try {
    res.json({ deleted: 0 });
  } catch (error) {
    console.error('Error cleaning logs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de logs (vacío)
router.get('/stats', async (req, res) => {
  try {
    res.json({
      total: 0,
      byAction: {},
      byEntity: {},
      bySeverity: {},
      byUser: {},
      last24Hours: 0,
      lastWeek: 0
    });
  } catch (error) {
    console.error('Error getting log stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;