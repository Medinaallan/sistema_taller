const express = require('express');
const { sql, getConnection } = require('../config/database');
const router = express.Router();


// Función para generar ID único
function generateId() {
  return 'wo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Función para normalizar el formato de hora a HH:mm:ss
function normalizeTimeFormat(timeStr) {
  if (!timeStr) return null;
  
  // Convertir a string y trim
  let time = String(timeStr).trim();
  
  console.log(`⏰ Normalizando hora: "${time}" (tipo: ${typeof timeStr})`);
  
  // Si ya está en formato HH:mm:ss, validar y devolver
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    console.log(`✅ Hora ya en formato correcto: ${time}`);
    return time;
  }
  
  // Si es H:mm:ss (una sola cifra en horas), agregar cero a la izquierda
  if (/^\d{1}:\d{2}:\d{2}$/.test(time)) {
    const formatted = '0' + time;
    console.log(`✅ Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si es HH:mm (sin segundos), agregar :00
  if (/^\d{2}:\d{2}$/.test(time)) {
    const formatted = time + ':00';
    console.log(`✅ Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si es H:mm (una sola cifra), formatear correctamente
  if (/^\d{1}:\d{2}$/.test(time)) {
    const formatted = '0' + time + ':00';
    console.log(`✅ Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si es solo una hora (número), convertir a HH:00:00
  if (/^\d{1,2}$/.test(time)) {
    const formatted = String(time).padStart(2, '0') + ':00:00';
    console.log(`✅ Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si el string contiene caracteres inválidos, loguear y devolver null
  console.warn(`⚠️ Formato de hora inválido: ${time}`);
  return null;
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

    console.log('SP_OBTENER_ORDENES_TRABAJO ejecutado exitosamente');
    console.log('Registros retornados:', result.recordset.length);
    console.log('Datos:', result.recordset);

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

// POST - Crear orden de trabajo desde cotización aprobada (SP_GENERAR_OT_DESDE_COTIZACION)
router.post('/from-quotation', async (req, res) => {
  const {
    cotizacion_id,
    asesor_id,
    mecanico_encargado_id = null,
    odometro_ingreso = null,
    fecha_estimada = null,
    hora_estimada = null, // formato: HH:mm:ss (horas de trabajo estimadas)
    generado_por = null
  } = req.body;

  try {
    // Validar parámetros requeridos
    if (!cotizacion_id || !asesor_id) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros requeridos faltantes: cotizacion_id, asesor_id'
      });
    }

    const pool = await getConnection();

    // Normalizar el formato de hora
    const horaFormateada = normalizeTimeFormat(hora_estimada);

    console.log(`📋 Generando OT desde cotización ${cotizacion_id}`);
    console.log('Parámetros originales:', {
      cotizacion_id,
      asesor_id,
      mecanico_encargado_id,
      odometro_ingreso,
      fecha_estimada,
      hora_estimada,
      generado_por
    });
    console.log('Parámetros procesados:', {
      cotizacion_id: parseInt(cotizacion_id),
      asesor_id: parseInt(asesor_id),
      mecanico_encargado_id,
      odometro_ingreso,
      fecha_estimada,
      hora_estimada: horaFormateada,
      generado_por
    });

    // Validar que la hora esté en formato válido
    if (hora_estimada && !horaFormateada) {
      return res.status(400).json({
        success: false,
        message: 'Formato de hora inválido. Use HH:mm:ss o HH:mm o H:mm',
        receivedValue: hora_estimada
      });
    }

    const result = await pool.request()
      .input('cotizacion_id', sql.Int, parseInt(cotizacion_id))
      .input('asesor_id', sql.Int, parseInt(asesor_id))
      .input('mecanico_encargado_id', sql.Int, mecanico_encargado_id ? parseInt(mecanico_encargado_id) : null)
      .input('odometro_ingreso', sql.Decimal(10, 1), odometro_ingreso ? parseFloat(odometro_ingreso) : null)
      .input('fecha_estimada', sql.Date, fecha_estimada || null)
      .input('hora_estimada', sql.VarChar(8), horaFormateada || null)
      .input('generado_por', sql.Int, generado_por ? parseInt(generado_por) : null)
      .execute('SP_GENERAR_OT_DESDE_COTIZACION');

    console.log('✅ SP_GENERAR_OT_DESDE_COTIZACION ejecutado exitosamente');
    console.log('Recordset:', result.recordset);

    const output = result.recordset?.[0] || {};
    
    res.status(200).json({
      success: output.allow || false,
      msg: output.msg || 'Orden de trabajo generada',
      allow: output.allow || false,
      ot_id: output.ot_id,
      numero_ot: output.numero_ot,
      data: output
    });
  } catch (error) {
    console.error('❌ Error al generar OT desde cotización:', error);
    console.error('Detalles del error:', error.originalError || error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden desde cotización',
      error: error.message,
      details: error.originalError?.message || null
    });
  }
});

module.exports = router;