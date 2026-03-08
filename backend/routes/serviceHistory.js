const express = require('express');
const ServiceHistoryService = require('../services/serviceHistoryService');
const { sql, getConnection } = require('../config/database');

console.log('🔄 Cargando serviceHistory.js router...');

const router = express.Router();
const serviceHistoryService = new ServiceHistoryService();

console.log('✅ ServiceHistoryService instanciado correctamente');

/**
 * Mapea un registro del SP_OBTENER_ORDENES_TRABAJO al formato ServiceRecord del cliente.
 */
function mapOTtoServiceRecord(ot) {
    const estadoMap = {
        'completado': 'completed',
        'finalizado': 'completed',
        'en garantia': 'warranty',
        'garantia': 'warranty',
        'pendiente pago': 'pending-payment',
        'pago pendiente': 'pending-payment',
    };
    const estadoRaw = (ot.estado_ot || '').toLowerCase().trim();
    const status = estadoMap[estadoRaw] || 'completed';

    const vehicleName = [ot.vehiculo_info, ot.placa ? `- ${ot.placa}` : '']
        .filter(Boolean).join(' ').trim();

    return {
        id: String(ot.ot_id),
        numero_ot: ot.numero_ot,
        vehicleId: ot.vehiculo_id != null ? String(ot.vehiculo_id) : null,
        vehicleName: vehicleName || ot.placa || '',
        placa: ot.placa,
        serviceType: ot.numero_ot || `OT-${ot.ot_id}`,
        description: ot.notas_recepcion || '',
        date: ot.fecha_recepcion ? new Date(ot.fecha_recepcion).toISOString().split('T')[0] : null,
        fechaEstimada: ot.fecha_estimada ? new Date(ot.fecha_estimada).toISOString().split('T')[0] : null,
        odometro: ot.odometro_ingreso,
        cost: parseFloat(ot.costo) || 0,
        totalTareas: ot.total_tareas || 0,
        technician: ot.nombre_mecanico || ot.nombre_asesor || '',
        asesor: ot.nombre_asesor || '',
        status,
        clientId: ot.cliente_id != null ? String(ot.cliente_id) : null,
        clientName: ot.nombre_cliente || '',
        clientPhone: ot.telefono_cliente || '',
        fotoVehiculo: ot.foto_vehiculo || null,
    };
}

/**
 * GET /api/service-history
 * Obtener historial completo de servicios (para administradores)
 */
router.get('/', async (req, res) => {
    console.log('📍 GET /api/service-history - Solicitado');
    try {
        const result = await serviceHistoryService.getAdminServiceHistory();
        console.log(`✅ Enviando historial completo con ${result.data?.length || 0} registros`);
        res.json(result);
    } catch (error) {
        console.error('❌ Error obteniendo historial completo:', error);
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

        const pool = await getConnection();
        const spResult = await pool.request()
            .input('ot_id', sql.Int, null)
            .input('cliente_id', sql.Int, parseInt(clientId))
            .input('placa', sql.VarChar(50), null)
            .input('estado', sql.VarChar(50), null)
            .input('numero_ot', sql.VarChar(20), null)
            .execute('SP_OBTENER_ORDENES_TRABAJO');

        const records = (spResult.recordset || []).map(mapOTtoServiceRecord);
        console.log(`✅ Historial de cliente ${clientId}: ${records.length} OTs`);

        res.json({
            success: true,
            data: records,
            count: records.length
        });
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
 * POST /api/service-history
 * Agregar nuevo registro al historial de servicios
 */
router.post('/', async (req, res) => {
    try {
        const historyData = req.body;
        
        if (!historyData) {
            return res.status(400).json({
                success: false,
                message: 'Datos del historial requeridos'
            });
        }

        const result = await serviceHistoryService.addServiceHistory(historyData);
        res.json(result);
    } catch (error) {
        console.error('Error agregando registro al historial:', error);
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