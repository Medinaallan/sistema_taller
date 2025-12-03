const express = require('express');
const { sql, getConnection } = require('../config/database');
const router = express.Router();


// Función para generar ID único
function generateId() {
  return 'wo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// GET - Obtener todas las órdenes de trabajo con filtros
router.get('/', async (req, res) => {
  const { ot_id, cliente_id, placa, estado, numero_ot } = req.query;

  try {
    console.log('📥 Llamada a GET /workorders con parámetros:', { ot_id, cliente_id, placa, estado, numero_ot });
    
    const pool = await getConnection();
    console.log('✅ Pool de conexión obtenido');
    
    const result = await pool.request()
      .input('ot_id', sql.Int, ot_id ? parseInt(ot_id) : null)
      .input('cliente_id', sql.Int, cliente_id ? parseInt(cliente_id) : null)
      .input('placa', sql.VarChar(50), placa || null)
      .input('estado', sql.VarChar(50), estado || null)
      .input('numero_ot', sql.VarChar(20), numero_ot || null)
      .execute('SP_OBTENER_ORDENES_TRABAJO');

    console.log('✅ SP_OBTENER_ORDENES_TRABAJO ejecutado exitosamente');
    console.log('📊 Registros retornados:', result.recordset.length);
    console.log('📋 Datos:', result.recordset);

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('❌ Error al obtener órdenes de trabajo:', error);
    console.error('📍 Detalles del error:', error.originalError || error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de trabajo',
      error: error.message,
      details: error.originalError?.message || null
    });
  }
});

// GET - Obtener orden de trabajo por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_OBTENER_ORDEN_TRABAJO_POR_ID',
      orderId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener orden de trabajo', error: error.message });
  }
});

// POST - Crear nueva orden de trabajo
router.post('/', (req, res) => {
  try {
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_CREAR_ORDEN_TRABAJO'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear orden de trabajo', error: error.message });
  }
});

// PUT - Actualizar orden de trabajo
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_ACTUALIZAR_ORDEN_TRABAJO',
      orderId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar orden de trabajo', error: error.message });
  }
});

// DELETE - Eliminar orden de trabajo
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_ELIMINAR_ORDEN_TRABAJO',
      orderId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar orden de trabajo', error: error.message });
  }
});

// POST - Crear orden de trabajo desde cotización aprobada
router.post('/from-quotation', (req, res) => {
  try {
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_CREAR_ORDEN_DESDE_COTIZACION'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear orden desde cotización', error: error.message });
  }
});

module.exports = router;