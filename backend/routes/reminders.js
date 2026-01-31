const express = require('express');
const router = express.Router();
const remindersService = require('../services/remindersService');

console.log('Reminders routes loaded from routes/reminders.js');

// Middleware simple de autenticación (opcional - ajusta según tu sistema)
const authenticate = (req, res, next) => {
  // Por ahora permitimos todas las peticiones
  // Aquí podrías agregar validación de token JWT si lo necesitas
  next();
};

// GET /api/reminders - Obtener todos los recordatorios
router.get('/', authenticate, async (req, res) => {
  try {
    const reminders = await remindersService.getAllReminders();
    res.json({ success: true, data: reminders, count: reminders.length });
  } catch (error) {
    console.error('Error al obtener recordatorios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener recordatorios', error: error.message });
  }
});

// GET /api/reminders/client/:clientId - Obtener recordatorios de un cliente
router.get('/client/:clientId', authenticate, async (req, res) => {
  try {
    const { clientId } = req.params;
    const reminders = await remindersService.getRemindersByClient(clientId);
    res.json({ success: true, data: reminders, count: reminders.length });
  } catch (error) {
    console.error('Error al obtener recordatorios del cliente:', error);
    res.status(500).json({ success: false, message: 'Error al obtener recordatorios del cliente', error: error.message });
  }
});

// GET /api/reminders/upcoming - Obtener recordatorios próximos
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 7;
    const reminders = await remindersService.getUpcomingReminders(daysAhead);
    res.json({ success: true, data: reminders, count: reminders.length });
  } catch (error) {
    console.error('Error al obtener recordatorios próximos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener recordatorios próximos', error: error.message });
  }
});

// GET /api/reminders/expired - Obtener recordatorios vencidos
router.get('/expired', authenticate, async (req, res) => {
  try {
    const reminders = await remindersService.getExpiredReminders();
    res.json({ success: true, data: reminders, count: reminders.length });
  } catch (error) {
    console.error('Error al obtener recordatorios vencidos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener recordatorios vencidos', error: error.message });
  }
});

// POST /api/reminders - Crear nuevo recordatorio
router.post('/', authenticate, async (req, res) => {
  try {
    const reminderData = req.body;
    console.log('POST /api/reminders - body:', reminderData);
    
    // Validaciones básicas (solo recordatorios por fecha desde admin)
    if (!reminderData.clientId || !reminderData.title || !reminderData.triggerValue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos: clientId, title, triggerValue' 
      });
    }
    
    const newReminder = await remindersService.createReminder(reminderData);
    res.status(201).json({ success: true, data: newReminder, message: 'Recordatorio creado exitosamente' });
  } catch (error) {
    console.error('Error al crear recordatorio:', error);
    res.status(500).json({ success: false, message: 'Error al crear recordatorio', error: error.message });
  }
});

// PUT /api/reminders/:id - Actualizar recordatorio
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedReminder = await remindersService.updateReminder(id, updateData);
    res.json({ success: true, data: updatedReminder, message: 'Recordatorio actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar recordatorio:', error);
    const statusCode = error.message === 'Recordatorio no encontrado' ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// DELETE /api/reminders/:id - Eliminar recordatorio
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await remindersService.deleteReminder(id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error al eliminar recordatorio:', error);
    const statusCode = error.message === 'Recordatorio no encontrado' ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// PATCH /api/reminders/:id/complete - Marcar como completado
router.patch('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReminder = await remindersService.completeReminder(id);
    res.json({ success: true, data: updatedReminder, message: 'Recordatorio marcado como completado' });
  } catch (error) {
    console.error('Error al completar recordatorio:', error);
    const statusCode = error.message === 'Recordatorio no encontrado' ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// PATCH /api/reminders/:id/toggle - Alternar estado activo
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updatedReminder = await remindersService.toggleReminderActive(id, payload);
    res.json({ success: true, data: updatedReminder, message: 'Estado del recordatorio actualizado' });
  } catch (error) {
    console.error('Error al cambiar estado del recordatorio:', error);
    const statusCode = error.message === 'Recordatorio no encontrado' ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// POST /api/reminders/:id/notify - Enviar notificación
router.post('/:id/notify', authenticate, async (req, res) => {
  // Notificación por fuera del alcance del backend (no hay SP para marcar enviada)
  res.status(501).json({ success: false, message: 'Not implemented: notification sending not available' });
});

module.exports = router;
