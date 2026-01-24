const express = require('express');
const { sql, getConnection } = require('../config/database');
const notificationsService = require('../services/notificationsService');
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
  
  console.log(` Normalizando hora: "${time}" (tipo: ${typeof timeStr})`);
  
  // Si ya está en formato HH:mm:ss, validar y devolver
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    console.log(` Hora ya en formato correcto: ${time}`);
    return time;
  }
  
  // Si es H:mm:ss (una sola cifra en horas), agregar cero a la izquierda
  if (/^\d{1}:\d{2}:\d{2}$/.test(time)) {
    const formatted = '0' + time;
    console.log(` Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si es HH:mm (sin segundos), agregar :00
  if (/^\d{2}:\d{2}$/.test(time)) {
    const formatted = time + ':00';
    console.log(` Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si es H:mm (una sola cifra), formatear correctamente
  if (/^\d{1}:\d{2}$/.test(time)) {
    const formatted = '0' + time + ':00';
    console.log(` Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si es solo una hora (número), convertir a HH:00:00
  if (/^\d{1,2}$/.test(time)) {
    const formatted = String(time).padStart(2, '0') + ':00:00';
    console.log(` Convertido de ${time} a ${formatted}`);
    return formatted;
  }
  
  // Si el string contiene caracteres inválidos, loguear y devolver null
  console.warn(` Formato de hora inválido: ${time}`);
  return null;
}

// GET - Obtener órdenes de trabajo del cliente por usuario_id
router.get('/client/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`🔍 Buscando órdenes de trabajo para usuario_id: ${userId}`);
    
    const pool = await getConnection();
    
    // Paso 1: Obtener el usuario usando SP_OBTENER_USUARIOS
    const usuarioResult = await pool.request()
      .input('usuario_id', sql.Int, parseInt(userId))
      .execute('SP_OBTENER_USUARIOS');

    if (usuarioResult.recordset.length === 0) {
      console.log(`⚠️ Usuario ${userId} no encontrado`);
      return res.json({
        success: true,
        data: [],
        message: 'Usuario no encontrado'
      });
    }

    const usuario = usuarioResult.recordset[0];
    const cliente_id = usuario.usuario_id;
    
    console.log(`✅ Usuario encontrado: ${usuario.nombre_completo}, cliente_id: ${cliente_id}`);

    // Paso 2: Obtener las órdenes de trabajo del cliente
    const result = await pool.request()
      .input('ot_id', sql.Int, null)
      .input('cliente_id', sql.Int, cliente_id)
      .input('placa', sql.VarChar(50), null)
      .input('estado', sql.VarChar(50), null)
      .input('numero_ot', sql.VarChar(20), null)
      .execute('SP_OBTENER_ORDENES_TRABAJO');

    console.log(`✅ Órdenes de trabajo encontradas: ${result.recordset.length}`);
    if (result.recordset.length > 0) {
      console.log('📋 OTs:', result.recordset.map(ot => ({
        numero_ot: ot.numero_ot,
        estado: ot.estado_ot,
        vehiculo: ot.placa
      })));
    }

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('❌ Error al obtener órdenes de trabajo del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de trabajo del cliente',
      error: error.message
    });
  }
});

// GET - Obtener todas las órdenes de trabajo con filtros
router.get('/', async (req, res) => {
  const { ot_id, cliente_id, placa, estado, numero_ot } = req.query;

  try {
    console.log(' Llamada a GET /workorders con parámetros:', { ot_id, cliente_id, placa, estado, numero_ot });
    
    const pool = await getConnection();
    console.log(' Pool de conexión obtenido');
    
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
    console.error(' Error al obtener órdenes de trabajo:', error);
    console.error(' Detalles del error:', error.originalError || error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de trabajo',
      error: error.message,
      details: error.originalError?.message || null
    });
  }
});

// POST - Registrar una nueva orden de trabajo manualmente
router.post('/manual', async (req, res) => {
  const {
    cliente_id,
    vehiculo_id,
    cita_id = null,
    asesor_id = null,
    mecanico_encargado_id = null,
    odometro_ingreso = null,
    fecha_estimada = null,
    hora_estimada = null,
    notas_recepcion = null,
    registrado_por = null
  } = req.body;

  try {
    // Validar parámetros requeridos
    if (!cliente_id || !vehiculo_id) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros requeridos faltantes: cliente_id, vehiculo_id'
      });
    }

    const pool = await getConnection();

    // Normalizar el formato de hora
    const horaFormateada = normalizeTimeFormat(hora_estimada);

    console.log(` Registrando OT manual`);
    console.log('Parámetros originales:', {
      cliente_id,
      vehiculo_id,
      cita_id,
      asesor_id,
      mecanico_encargado_id,
      odometro_ingreso,
      fecha_estimada,
      hora_estimada,
      notas_recepcion,
      registrado_por
    });
    console.log('Parámetros procesados:', {
      cliente_id: parseInt(cliente_id),
      vehiculo_id: parseInt(vehiculo_id),
      cita_id,
      asesor_id,
      mecanico_encargado_id,
      odometro_ingreso,
      fecha_estimada,
      hora_estimada: horaFormateada,
      notas_recepcion,
      registrado_por
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
      .input('cliente_id', sql.Int, parseInt(cliente_id))
      .input('vehiculo_id', sql.Int, parseInt(vehiculo_id))
      .input('cita_id', sql.Int, cita_id ? parseInt(cita_id) : null)
      .input('asesor_id', sql.Int, asesor_id ? parseInt(asesor_id) : null)
      .input('mecanico_encargado_id', sql.Int, mecanico_encargado_id ? parseInt(mecanico_encargado_id) : null)
      .input('odometro_ingreso', sql.Decimal(10, 1), odometro_ingreso ? parseFloat(odometro_ingreso) : null)
      .input('fecha_estimada', sql.Date, fecha_estimada || null)
      .input('hora_estimada', sql.VarChar(8), horaFormateada || null)
      .input('notas_recepcion', sql.VarChar(500), notas_recepcion || null)
      .input('registrado_por', sql.Int, registrado_por ? parseInt(registrado_por) : null)
      .execute('SP_REGISTRAR_OT_MANUAL');

    console.log(' SP_REGISTRAR_OT_MANUAL ejecutado exitosamente');
    console.log('Recordset:', result.recordset);

    const output = result.recordset?.[0] || {};
    
    // Enviar notificación al cliente si la OT fue creada exitosamente
    if (output.allow && output.ot_id) {
      try {
        await notificationsService.notifyOTCreated(cliente_id, {
          ot_id: output.ot_id,
          numero_ot: output.numero_ot,
          vehiculo_id: vehiculo_id
        });
        console.log('✅ Notificación de OT creada enviada al cliente');
      } catch (notifError) {
        console.error('⚠️ Error al enviar notificación:', notifError);
        // No fallar la operación si la notificación falla
      }
    }
    
    res.status(200).json({
      success: output.allow || false,
      msg: output.msg || 'Orden de trabajo registrada',
      allow: output.allow || false,
      ot_id: output.ot_id,
      numero_ot: output.numero_ot,
      data: output
    });
  } catch (error) {
    console.error(' Error al registrar OT manual:', error);
    console.error('Detalles del error:', error.originalError || error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar orden de trabajo',
      error: error.message,
      details: error.originalError?.message || null
    });
  }
});

// POST - Crear orden de trabajo desde cotización aprobada
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

    console.log(` Generando OT desde cotización ${cotizacion_id}`);
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

    console.log(' SP_GENERAR_OT_DESDE_COTIZACION ejecutado exitosamente');
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
    console.error(' Error al generar OT desde cotización:', error);
    console.error('Detalles del error:', error.originalError || error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden desde cotización',
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔄 Actualizando orden de trabajo ${id}:`, updateData);

    const pool = await getConnection();
    
    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const request = pool.request().input('ot_id', sql.Int, parseInt(id));
    
    // Campos que se pueden actualizar
    if (updateData.estadoPago !== undefined) {
      updates.push('estado_pago = @estadoPago');
      request.input('estadoPago', sql.VarChar(50), updateData.estadoPago);
    }
    if (updateData.estado !== undefined) {
      updates.push('estado = @estado');
      request.input('estado', sql.VarChar(50), updateData.estado);
    }
    if (updateData.descripcion !== undefined) {
      updates.push('descripcion = @descripcion');
      request.input('descripcion', sql.VarChar(sql.MAX), updateData.descripcion);
    }
    if (updateData.costoTotal !== undefined) {
      updates.push('costo_total = @costoTotal');
      request.input('costoTotal', sql.Decimal(10, 2), parseFloat(updateData.costoTotal));
    }
    if (updateData.costoManoObra !== undefined) {
      updates.push('costo_mano_obra = @costoManoObra');
      request.input('costoManoObra', sql.Decimal(10, 2), parseFloat(updateData.costoManoObra));
    }
    if (updateData.costoPartes !== undefined) {
      updates.push('costo_partes = @costoPartes');
      request.input('costoPartes', sql.Decimal(10, 2), parseFloat(updateData.costoPartes));
    }
    
    // Si no hay nada que actualizar, devolver error
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }
    
    // Ejecutar la actualización
    const query = `
      UPDATE orden_trabajo 
      SET ${updates.join(', ')}, fecha_actualizacion = GETDATE()
      WHERE ot_id = @ot_id
    `;
    
    await request.query(query);
    
    // Obtener la orden actualizada
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          ot_id as id,
          cliente_id as clienteId,
          vehiculo_id as vehiculoId,
          servicio_id as servicioId,
          cita_id as citaId,
          cotizacion_id as cotizacionId,
          numero_ot as numeroOT,
          descripcion,
          estado,
          prioridad,
          tipo_servicio as tipoServicio,
          costo_estimado as costoEstimado,
          costo_total as costoTotal,
          costo_mano_obra as costoManoObra,
          costo_partes as costoPartes,
          estado_pago as estadoPago,
          fecha_inicio as fechaInicio,
          fecha_fin_estimada as fechaFinEstimada,
          fecha_fin_real as fechaFinReal,
          fecha_creacion as fechaCreacion,
          fecha_actualizacion as fechaActualizacion
        FROM orden_trabajo
        WHERE ot_id = @ot_id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de trabajo no encontrada'
      });
    }
    
    console.log('✅ Orden de trabajo actualizada exitosamente');
    
    res.json({
      success: true,
      message: 'Orden de trabajo actualizada exitosamente',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('❌ Error actualizando orden de trabajo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar orden de trabajo', 
      error: error.message 
    });
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

// ==================== GESTIÓN DE TAREAS DE OT ====================

// GET - Obtener todas las tareas de una orden de trabajo
router.get('/:id/tareas', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`📋 Obteniendo tareas de OT ${id}`);
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(id))
      .execute('SP_OBTENER_TAREAS_OT');

    console.log('✅ SP_OBTENER_TAREAS_OT ejecutado exitosamente');
    console.log('📊 Tareas encontradas:', result.recordset.length);

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('❌ Error al obtener tareas de OT:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas de la orden de trabajo',
      error: error.message
    });
  }
});

// POST - Agregar nueva tarea a una orden de trabajo
router.post('/:id/tareas', async (req, res) => {
  const { id } = req.params;
  const {
    tipo_servicio_id,
    descripcion = null,
    horas_estimadas = null,
    horas_reales = null,
    prioridad = 3, // Normal por defecto
    registrado_por = null
  } = req.body;

  try {
    console.log(`➕ Agregando tarea a OT ${id}`);
    console.log('Datos de tarea:', { tipo_servicio_id, descripcion, horas_estimadas, prioridad });

    // Validar parámetros requeridos
    if (!tipo_servicio_id) {
      return res.status(400).json({
        success: false,
        message: 'El campo tipo_servicio_id es requerido'
      });
    }

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(id))
      .input('tipo_servicio_id', sql.Int, parseInt(tipo_servicio_id))
      .input('descripcion', sql.VarChar(300), descripcion)
      .input('horas_estimadas', sql.Decimal(9, 2), horas_estimadas ? parseFloat(horas_estimadas) : null)
      .input('horas_reales', sql.Decimal(9, 2), horas_reales ? parseFloat(horas_reales) : null)
      .input('prioridad', sql.TinyInt, prioridad)
      .input('registrado_por', sql.Int, registrado_por ? parseInt(registrado_por) : null)
      .execute('SP_AGREGAR_TAREA_OT');

    console.log('✅ SP_AGREGAR_TAREA_OT ejecutado exitosamente');
    console.log('Resultado:', result.recordset);

    const output = result.recordset?.[0] || {};
    
    res.status(200).json({
      success: output.allow || false,
      msg: output.msg || 'Tarea agregada exitosamente',
      allow: output.allow || false,
      ot_tarea_id: output.ot_tarea_id,
      data: output
    });
  } catch (error) {
    console.error('❌ Error al agregar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar tarea a la orden de trabajo',
      error: error.message
    });
  }
});

// DELETE - Eliminar una tarea de OT
router.delete('/tareas/:tareaId', async (req, res) => {
  const { tareaId } = req.params;
  const { eliminado_por = null } = req.body;

  try {
    console.log(`🗑️ Eliminando tarea ${tareaId}`);

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('ot_tarea_id', sql.Int, parseInt(tareaId))
      .input('eliminado_por', sql.Int, eliminado_por ? parseInt(eliminado_por) : null)
      .execute('SP_ELIMINAR_TAREA_OT');

    console.log('✅ SP_ELIMINAR_TAREA_OT ejecutado exitosamente');
    console.log('Resultado:', result.recordset);

    const output = result.recordset?.[0] || {};
    
    res.status(200).json({
      success: output.allow || false,
      msg: output.msg || 'Tarea eliminada exitosamente',
      allow: output.allow || false
    });
  } catch (error) {
    console.error('❌ Error al eliminar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tarea',
      error: error.message
    });
  }
});

// PUT - Gestionar estado de una tarea
router.put('/tareas/:tareaId/estado', async (req, res) => {
  const { tareaId } = req.params;
  const {
    nuevo_estado,
    horas_estimadas = null,
    registrado_por = null
  } = req.body;

  try {
    console.log(`🔄 Gestionando estado de tarea ${tareaId} a ${nuevo_estado}`);

    // Validar parámetros requeridos
    if (!nuevo_estado) {
      return res.status(400).json({
        success: false,
        message: 'El campo nuevo_estado es requerido'
      });
    }

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('ot_tarea_id', sql.Int, parseInt(tareaId))
      .input('nuevo_estado', sql.VarChar(50), nuevo_estado)
      .input('horas_estimadas', sql.Decimal(9, 2), horas_estimadas ? parseFloat(horas_estimadas) : null)
      .input('registrado_por', sql.Int, registrado_por ? parseInt(registrado_por) : null)
      .execute('SP_GESTIONAR_ESTADO_TAREA');

    console.log('✅ SP_GESTIONAR_ESTADO_TAREA ejecutado exitosamente');
    console.log('Resultado:', result.recordset);

    const output = result.recordset?.[0] || {};
    
    // Enviar notificación al cliente si el estado cambió exitosamente
    if (output.allow) {
      try {
        // Obtener información de la OT y cliente
        const otInfo = await pool.request()
          .input('ot_id', sql.Int, null)
          .input('cliente_id', sql.Int, null)
          .input('placa', sql.VarChar(50), null)
          .input('estado', sql.VarChar(50), null)
          .input('numero_ot', sql.VarChar(20), null)
          .execute('SP_OBTENER_ORDENES_TRABAJO');
        
        // Buscar la OT relacionada con esta tarea
        const tareaInfo = await pool.request()
          .query(`SELECT ot_id, tipo_servicio_id FROM OT_Tareas WHERE ot_tarea_id = ${parseInt(tareaId)}`);
        
        if (tareaInfo.recordset.length > 0 && otInfo.recordset.length > 0) {
          const ot = otInfo.recordset.find(o => o.ot_id === tareaInfo.recordset[0].ot_id);
          if (ot) {
            await notificationsService.notifyTaskStatusChange(ot.cliente_id, {
              tarea_id: tareaId,
              ot_id: ot.ot_id,
              servicio: 'Servicio'
            }, nuevo_estado);
            console.log('✅ Notificación de cambio de estado de tarea enviada');
          }
        }
      } catch (notifError) {
        console.error('⚠️ Error al enviar notificación de tarea:', notifError);
        // No fallar la operación si la notificación falla
      }
    }
    
    res.status(200).json({
      success: output.allow || false,
      msg: output.msg || 'Estado de tarea gestionado exitosamente',
      allow: output.allow || false,
      data: output
    });
  } catch (error) {
    console.error('❌ Error al gestionar estado de tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al gestionar estado de tarea',
      error: error.message
    });
  }
});

module.exports = router;