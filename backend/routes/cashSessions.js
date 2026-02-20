const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

console.log('cashSessions router loaded (SQL Server)');

// POST /open - Abrir caja (SP_ABRIR_CAJA)
router.post('/open', async (req, res) => {
  try {
    const { usuario_id, monto_inicial } = req.body;
    
    if (!usuario_id || monto_inicial === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros: usuario_id y monto_inicial' 
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, usuario_id)
      .input('monto_inicial', sql.Decimal(10, 2), monto_inicial)
      .execute('SP_ABRIR_CAJA');

    const data = result.recordset[0];
    
    res.json({
      success: data.allow === 1,
      message: data.msg,
      data: {
        response: data.response,
        allow: data.allow,
        arqueo_id: data.arqueo_id
      }
    });

  } catch (err) {
    console.error('Error abriendo caja:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al abrir caja: ' + err.message 
    });
  }
});

// GET /status - Verificar estado de caja (SP_VERIFICAR_ESTADO_CAJA)
router.get('/status', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    
    if (!usuario_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta parámetro: usuario_id' 
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, usuario_id)
      .execute('SP_VERIFICAR_ESTADO_CAJA');

    const data = result.recordset[0];
    
    res.json({
      success: true,
      data: {
        estado: data.estado,
        arqueo_id: data.arqueo_id,
        fecha_apertura: data.fecha_apertura
      }
    });

  } catch (err) {
    console.error('Error verificando estado de caja:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al verificar estado: ' + err.message 
    });
  }
});

// GET /current-summary - Resumen de caja actual (SP_OBTENER_RESUMEN_CAJA_ACTUAL)
router.get('/current-summary', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    
    if (!usuario_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta parámetro: usuario_id' 
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, usuario_id)
      .execute('SP_OBTENER_RESUMEN_CAJA_ACTUAL');

    const data = result.recordset[0] || null;
    
    res.json({
      success: true,
      data: data ? {
        arqueo_id: data.arqueo_id,
        fecha_apertura: data.fecha_apertura,
        monto_inicial: data.monto_inicial,
        ventas_efectivo: data.ventas_efectivo,
        ventas_otros: data.ventas_otros,
        total_esperado_en_caja: data.total_esperado_en_caja
      } : null
    });

  } catch (err) {
    console.error('Error obteniendo resumen de caja:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener resumen: ' + err.message 
    });
  }
});

// POST /close - Cerrar caja (SP_CERRAR_CAJA)
router.post('/close', async (req, res) => {
  try {
    const { usuario_id, monto_final_real, observaciones } = req.body;
    
    if (!usuario_id || monto_final_real === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros: usuario_id y monto_final_real' 
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, usuario_id)
      .input('monto_final_real', sql.Decimal(10, 2), monto_final_real)
      .input('observaciones', sql.VarChar(500), observaciones || '')
      .execute('SP_CERRAR_CAJA');

    const data = result.recordset[0];
    
    res.json({
      success: data.allow === 1,
      message: data.msg,
      data: {
        response: data.response,
        allow: data.allow,
        diferencia: data.diferencia
      }
    });

  } catch (err) {
    console.error('Error cerrando caja:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cerrar caja: ' + err.message 
    });
  }
});

// GET /history - Historial de arqueos (SP_OBTENER_HISTORIAL_ARQUEOS)
router.get('/history', async (req, res) => {
  try {
    const { usuario_id, fecha_inicio, fecha_fin } = req.query;

    const pool = await getConnection();
    const request = pool.request();
    
    if (usuario_id) {
      request.input('usuario_id', sql.Int, usuario_id);
    } else {
      request.input('usuario_id', sql.Int, null);
    }
    
    if (fecha_inicio) {
      request.input('fecha_inicio', sql.Date, fecha_inicio);
    } else {
      request.input('fecha_inicio', sql.Date, null);
    }
    
    if (fecha_fin) {
      request.input('fecha_fin', sql.Date, fecha_fin);
    } else {
      request.input('fecha_fin', sql.Date, null);
    }

    const result = await request.execute('SP_OBTENER_HISTORIAL_ARQUEOS');
    
    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error('Error obteniendo historial de arqueos:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial: ' + err.message 
    });
  }
});

module.exports = router;
