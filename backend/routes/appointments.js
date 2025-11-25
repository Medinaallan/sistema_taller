
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');


// GET /api/appointments - Obtener todas las citas (SP_OBTENER_CITAS)
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('cita_id', sql.Int, req.query.cita_id || null)
      .input('cliente_id', sql.Int, req.query.cliente_id || null)
      .input('vehiculo_id', sql.Int, req.query.vehiculo_id || null)
      .input('estado', sql.VarChar(50), req.query.estado || null)
      .input('fecha_inicio', sql.Date, req.query.fecha_inicio || null)
      .input('numero_cita', sql.VarChar(20), req.query.numero_cita || null)
      .execute('SP_OBTENER_CITAS');
    res.json({
      success: true,
      data: result.recordset,
      message: `${result.recordset.length} citas encontradas`
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
});


// POST /api/appointments - Crear nueva cita (SP_REGISTRAR_CITA)
router.post('/', async (req, res) => {
  try {
    console.log('Datos recibidos para crear cita:', req.body);
    const { cliente_id, vehiculo_id, tipo_servicio_id, fecha_inicio, asesor_id, notas_cliente, canal_origen, registrado_por } = req.body;
    console.log('Campos extraídos:', {
      cliente_id, vehiculo_id, tipo_servicio_id, fecha_inicio, asesor_id, notas_cliente, canal_origen, registrado_por
    });
    if (!cliente_id || !vehiculo_id || !tipo_servicio_id || !fecha_inicio || !canal_origen || !registrado_por) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos para registrar la cita'
      });
    }
    const pool = await getConnection();
    const result = await pool.request()
      .input('cliente_id', sql.Int, cliente_id)
      .input('vehiculo_id', sql.Int, vehiculo_id)
      .input('tipo_servicio_id', sql.Int, tipo_servicio_id)
      .input('fecha_inicio', sql.Date, fecha_inicio)
      .input('asesor_id', sql.Int, asesor_id || null)
      .input('notas_cliente', sql.VarChar(400), notas_cliente || null)
      .input('canal_origen', sql.VarChar(20), canal_origen)
      .input('registrado_por', sql.Int, registrado_por)
      .execute('SP_REGISTRAR_CITA');
    console.log('Resultado SP_REGISTRAR_CITA:', result);
    res.status(201).json({
      success: true,
      data: result.recordset[0],
      message: result.recordset[0]?.msg || 'Cita registrada'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cita',
      error: error.message
    });
  }
});


// GET /api/appointments/:id - Obtener cita por ID (SP_OBTENER_CITAS)
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('cita_id', sql.Int, req.params.id)
      .execute('SP_OBTENER_CITAS');
    if (!result.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Cita encontrada'
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cita',
      error: error.message
    });
  }
});


// PUT /api/appointments/:id - Editar cita (SP_EDITAR_CITA)
router.put('/:id', async (req, res) => {
  try {
    const { tipoServicioId, fechaInicio, notasCliente, editadoPor } = req.body;
    if (!tipoServicioId || !fechaInicio || !editadoPor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos para editar la cita'
      });
    }
    const pool = await getConnection();
    const result = await pool.request()
      .input('cita_id', sql.Int, req.params.id)
      .input('tipo_servicio_id', sql.Int, tipoServicioId)
      .input('fecha_inicio', sql.Date, fechaInicio)
      .input('notas_cliente', sql.VarChar(400), notasCliente || null)
      .input('editado_por', sql.Int, editadoPor)
      .execute('SP_EDITAR_CITA');
    res.json({
      success: true,
      data: result.recordset[0],
      message: result.recordset[0]?.msg || 'Cita editada'
    });
  } catch (error) {
    console.error('Error editing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar cita',
      error: error.message
    });
  }
});


// PUT /api/appointments/:id/status - Cambiar estado de cita (SP_CAMBIAR_ESTADO_CITA)
router.put('/:id/status', async (req, res) => {
  try {
    const { nuevoEstado, comentario, registradoPor } = req.body;
    if (!nuevoEstado || !registradoPor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos para cambiar el estado de la cita'
      });
    }
    const pool = await getConnection();
    const result = await pool.request()
      .input('cita_id', sql.Int, req.params.id)
      .input('nuevo_estado', sql.VarChar(50), nuevoEstado)
      .input('comentario', sql.VarChar(300), comentario || null)
      .input('registrado_por', sql.Int, registradoPor)
      .execute('SP_CAMBIAR_ESTADO_CITA');
    res.json({
      success: true,
      data: result.recordset[0],
      message: result.recordset[0]?.msg || 'Estado de cita actualizado'
    });
  } catch (error) {
    console.error('Error changing appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de cita',
      error: error.message
    });
  }
});

module.exports = router;