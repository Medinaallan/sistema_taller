const express = require('express');
const ServiceHistoryService = require('../services/serviceHistoryService');

const router = express.Router();
const serviceHistoryService = new ServiceHistoryService();

/**
 * GET /api/service-history
 * Obtener historial completo de servicios (para administradores)
 */
router.get('/', async (req, res) => {
    try {
        const result = await serviceHistoryService.getAdminServiceHistory();
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo historial completo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * GET /api/service-history/client/:clientId
 * Obtener historial de servicios para un cliente específico
 */
router.get('/client/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        
        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente requerido'
            });
        }

        const result = await serviceHistoryService.getClientServiceHistory(clientId);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo historial del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * GET /api/service-history/client/:clientId/stats
 * Obtener estadísticas detalladas de un cliente
 */
router.get('/client/:clientId/stats', async (req, res) => {
    try {
        const { clientId } = req.params;
        
        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente requerido'
            });
        }

        const result = await serviceHistoryService.getClientStats(clientId);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo estadísticas del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * GET /api/service-history/stats
 * Obtener estadísticas generales del historial de servicios
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await serviceHistoryService.getAdminServiceHistory();
        
        if (!result.success) {
            return res.status(500).json(result);
        }

        // Devolver solo las estadísticas
        res.json({
            success: true,
            data: result.stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas generales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;