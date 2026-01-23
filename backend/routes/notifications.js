const express = require('express');
const router = express.Router();
const notificationsService = require('../services/notificationsService');

/**
 * GET /api/notifications/client/:clientId
 * Obtener todas las notificaciones de un cliente
 */
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const notifications = await notificationsService.getClientNotifications(clientId);
    
    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
});

/**
 * GET /api/notifications
 * Obtener todas las notificaciones (admin)
 */
router.get('/', async (req, res) => {
  try {
    const notifications = await notificationsService.getAllNotifications();
    
    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error obteniendo todas las notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/client/:clientId/unread-count
 * Obtener conteo de notificaciones no leídas
 */
router.get('/client/:clientId/unread-count', async (req, res) => {
  try {
    const { clientId } = req.params;
    const count = await notificationsService.getUnreadCount(clientId);
    
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error obteniendo conteo de no leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conteo',
      error: error.message
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marcar una notificación como leída
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationsService.markAsRead(id);
    
    res.json({
      success: true,
      data: notification,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    const statusCode = error.message === 'Notificación no encontrada' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PATCH /api/notifications/client/:clientId/read-all
 * Marcar todas las notificaciones de un cliente como leídas
 */
router.patch('/client/:clientId/read-all', async (req, res) => {
  try {
    const { clientId } = req.params;
    const count = await notificationsService.markAllAsRead(clientId);
    
    res.json({
      success: true,
      count: count,
      message: `${count} notificaciones marcadas como leídas`
    });
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificaciones como leídas',
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Eliminar una notificación
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await notificationsService.deleteNotification(id);
    
    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    const statusCode = error.message === 'Notificación no encontrada' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/notifications
 * Crear una notificación manualmente (admin)
 */
router.post('/', async (req, res) => {
  try {
    const { clientId, type, title, message, metadata } = req.body;
    
    if (!clientId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: clientId, type, title, message'
      });
    }
    
    const notification = await notificationsService.createNotification({
      clientId,
      type,
      title,
      message,
      metadata
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notificación creada'
    });
  } catch (error) {
    console.error('Error creando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear notificación',
      error: error.message
    });
  }
});

module.exports = router;
