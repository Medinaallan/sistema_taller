const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const notificationsService = require('../services/notificationsService');

/**
 * GET /api/workorder-states
 * Obtener todos los estados de OT desde la BD (usando SP_OBTENER_ORDENES_TRABAJO)
 * ⚠️ NOTA: Este endpoint ya no es necesario porque los estados vienen 
 * directamente con cada consulta de OT. Se mantiene por compatibilidad.
 */
router.get('/', async (req, res) => {
  try {
    console.log('📂 Obteniendo estados desde la BD...');
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('ot_id', sql.Int, null)
      .input('cliente_id', sql.Int, null)
      .input('placa', sql.VarChar(50), null)
      .input('estado', sql.VarChar(50), null)
      .input('numero_ot', sql.VarChar(20), null)
      .execute('SP_OBTENER_ORDENES_TRABAJO');
    
    // Crear un mapa de estados
    const statesMap = {};
    result.recordset.forEach(ot => {
      statesMap[ot.ot_id.toString()] = ot.estado_ot;
    });
    
    res.json({
      success: true,
      data: statesMap
    });
  } catch (error) {
    console.error('❌ Error leyendo estados desde BD:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer estados de OT desde BD',
      error: error.message
    });
  }
});

/**
 * PUT /api/workorder-states/:otId
 * Actualizar el estado de una OT usando SP_GESTIONAR_ESTADO_OT
 */
router.put('/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El campo "estado" es requerido'
      });
    }
    
    console.log(`💾 Actualizando estado de OT ${otId} a: ${estado} usando SP_GESTIONAR_ESTADO_OT`);
    
    const pool = await getConnection();
    
    // Obtener usuario actual (hardcoded por ahora, después vendrá del token)
    const registradoPor = req.user?.id || 1;
    
    // Ejecutar SP_GESTIONAR_ESTADO_OT
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('nuevo_estado', sql.VarChar(50), estado)
      .input('registrado_por', sql.Int, registradoPor)
      .execute('SP_GESTIONAR_ESTADO_OT');
    
    const response = result.recordset[0];
    
    if (response.allow === 1) {
      console.log(`✅ Estado de OT ${otId} actualizado a: ${estado}`);
      
      // Enviar notificación al cliente sobre el cambio de estado
      try {
        const otInfo = await pool.request()
          .input('ot_id', sql.Int, parseInt(otId))
          .input('cliente_id', sql.Int, null)
          .input('placa', sql.VarChar(50), null)
          .input('estado', sql.VarChar(50), null)
          .input('numero_ot', sql.VarChar(20), null)
          .execute('SP_OBTENER_ORDENES_TRABAJO');
        
        if (otInfo.recordset.length > 0) {
          const ot = otInfo.recordset[0];
          await notificationsService.notifyOTStatusChange(ot.cliente_id, {
            ot_id: ot.ot_id,
            numero_ot: ot.numero_ot,
            vehiculo_id: ot.vehiculo_id,
            placa: ot.placa
          }, estado);
          console.log('✅ Notificación de cambio de estado de OT enviada');
        }
      } catch (notifError) {
        console.error('⚠️ Error al enviar notificación de OT:', notifError);
        // No fallar la operación si la notificación falla
      }
      
      res.json({
        success: true,
        message: response.msg,
        data: {
          otId,
          estado
        }
      });
    } else {
      // El SP rechazó el cambio (ej: tareas pendientes)
      console.warn(`⚠️ No se pudo actualizar estado: ${response.msg}`);
      res.status(400).json({
        success: false,
        message: response.msg
      });
    }
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de OT',
      error: error.message
    });
  }
});

/**
 * GET /api/workorder-states/:otId
 * Obtener el estado de una OT específica desde la BD
 */
router.get('/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('cliente_id', sql.Int, null)
      .input('placa', sql.VarChar(50), null)
      .input('estado', sql.VarChar(50), null)
      .input('numero_ot', sql.VarChar(20), null)
      .execute('SP_OBTENER_ORDENES_TRABAJO');
    
    if (result.recordset.length > 0) {
      const estado = result.recordset[0].estado_ot;
      res.json({
        success: true,
        data: {
          otId,
          estado
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Orden de trabajo no encontrada'
      });
    }
  } catch (error) {
    console.error('❌ Error leyendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer estado de OT',
      error: error.message
    });
  }
});

module.exports = router;
