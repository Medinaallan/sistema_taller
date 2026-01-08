const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../config/database');

// POST /quotations - Registrar nueva cotización
router.post('/', async (req, res) => {
	const { cita_id, fecha_vencimiento, comentario, registrado_por } = req.body;

	try {
		const pool = await getConnection();
		const result = await pool.request()
			.input('cita_id', sql.Int, cita_id || null)
			.input('fecha_vencimiento', sql.DateTime, fecha_vencimiento)
			.input('comentario', sql.VarChar(300), comentario || '')
			.input('registrado_por', sql.Int, registrado_por)
			.execute('SP_REGISTRAR_COTIZACION');

		const output = result.recordset?.[0] || {};
		res.status(200).json({
			success: true,
			msg: output.msg || 'Cotización registrada',
			allow: output.allow,
			cotizacion_id: output.cotizacion_id
		});
	} catch (error) {
		console.error('Error al registrar cotización:', error);
		res.status(500).json({
			success: false,
			message: 'Error al registrar cotización',
			error: error.message
		});
	}
});



// GET /quotations - Obtener cotizaciones con filtros
router.get('/', async (req, res) => {
	const {
		cotizacion_id = null,
		cita_id = null,
		ot_id = null,
		estado = null,
		numero_cotizacion = null
	} = req.query;

	try {
		const pool = await getConnection();
		const result = await pool.request()
			.input('cotizacion_id', sql.Int, cotizacion_id ? parseInt(cotizacion_id) : null)
			.input('cita_id', sql.Int, cita_id ? parseInt(cita_id) : null)
			.input('ot_id', sql.Int, ot_id ? parseInt(ot_id) : null)
			.input('estado', sql.VarChar(50), estado || null)
			.input('numero_cotizacion', sql.VarChar(20), numero_cotizacion || null)
			.execute('SP_OBTENER_COTIZACIONES');

		res.json({
			success: true,
			data: result.recordset
		});
	} catch (error) {
		console.error('Error al obtener cotizaciones:', error);
		res.status(500).json({
			success: false,
			message: 'Error al obtener cotizaciones',
			error: error.message
		});
	}
});

// GET /quotations/:cotizacionId - Obtener una cotización específica
router.get('/:cotizacionId', async (req, res) => {
	const { cotizacionId } = req.params;

	try {
		const pool = await getConnection();
		const result = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.input('cita_id', sql.Int, null)
			.input('ot_id', sql.Int, null)
			.input('estado', sql.VarChar(50), null)
			.input('numero_cotizacion', sql.VarChar(20), null)
			.execute('SP_OBTENER_COTIZACIONES');

		if (result.recordset.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Cotización no encontrada'
			});
		}

		res.json({
			success: true,
			data: result.recordset[0]
		});
	} catch (error) {
		console.error('Error al obtener cotización:', error);
		res.status(500).json({
			success: false,
			message: 'Error al obtener cotización',
			error: error.message
		});
	}
});

// POST /quotations/:cotizacionId/items - Agregar item a cotización
router.post('/:cotizacionId/items', async (req, res) => {
	const { cotizacionId } = req.params;
	const {
		tipo_item,
		descripcion,
		cantidad,
		precio_unitario,
		descuento_unitario = 0,
		tipo_servicio_id = null,
		registrado_por = null
	} = req.body;

	console.log(`✅ POST /api/quotations/${cotizacionId}/items recibido`);
	console.log('Parámetros recibidos:', req.body);

	try {
		const pool = await getConnection();
		console.log('Pool de conexión obtenido');
		
		// Validar y convertir valores numéricos correctamente
		const tipoServicioId = tipo_servicio_id && tipo_servicio_id !== 'null' ? parseInt(tipo_servicio_id) : null;
		const registradoPor = registrado_por && registrado_por !== 'null' ? parseInt(registrado_por) : null;
		const cantidadNum = parseFloat(cantidad);
		const precioUnitarioNum = parseFloat(precio_unitario);
		const descuentoNum = parseFloat(descuento_unitario) || 0;
		
		console.log('Valores para SP:', {
			cotizacion_id: parseInt(cotizacionId),
			tipo_item: tipo_item,
			descripcion: descripcion,
			cantidad: cantidadNum,
			precio_unitario: precioUnitarioNum,
			descuento_unitario: descuentoNum,
			tipo_servicio_id: tipoServicioId,
			registrado_por: registradoPor
		});

		const result = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.input('tipo_item', sql.VarChar(50), tipo_item)
			.input('descripcion', sql.VarChar(200), descripcion)
			.input('cantidad', sql.Decimal(10, 2), cantidadNum)
			.input('precio_unitario', sql.Decimal(10, 2), precioUnitarioNum)
			.input('descuento_unitario', sql.Decimal(10, 2), descuentoNum)
			.input('tipo_servicio_id', sql.Int, tipoServicioId)
			.input('registrado_por', sql.Int, registradoPor)
			.execute('SP_AGREGAR_ITEM_COTIZACION');

		console.log('SP ejecutado exitosamente. Recordset:', result.recordset);
		const output = result.recordset?.[0] || {};
		res.status(200).json({
			success: true,
			msg: output.msg || 'Item agregado',
			allow: output.allow
		});
	} catch (error) {
		console.error('❌ Error al agregar item a cotización:', error);
		console.error('Detalles del error:', error.originalError || error);
		res.status(500).json({
			success: false,
			message: 'Error al agregar item a cotización',
			error: error.message
		});
	}
});

// GET /quotations/:cotizacionId/items - Obtener items de una cotización
router.get('/:cotizacionId/items', async (req, res) => {
	const { cotizacionId } = req.params;

	try {
		const pool = await getConnection();
		const result = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.execute('SP_OBTENER_ITEMS_COTIZACION');

		res.json({
			success: true,
			data: result.recordset
		});
	} catch (error) {
		console.error('Error al obtener items de cotización:', error);
		res.status(500).json({
			success: false,
			message: 'Error al obtener items de cotización',
			error: error.message
		});
	}
});

// DELETE /quotations/items/:cotItemId - Eliminar item de cotización
router.delete('/items/:cotItemId', async (req, res) => {
	const { cotItemId } = req.params;
	const { eliminado_por = null } = req.body;

	try {
		const pool = await getConnection();
		const result = await pool.request()
			.input('cot_item_id', sql.Int, parseInt(cotItemId))
			.input('eliminado_por', sql.Int, eliminado_por)
			.execute('SP_ELIMINAR_ITEM_COTIZACION');

		const output = result.recordset?.[0] || {};
		res.status(200).json({
			success: true,
			msg: output.msg || 'Item eliminado',
			allow: output.allow
		});
	} catch (error) {
		console.error('Error al eliminar item de cotización:', error);
		res.status(500).json({
			success: false,
			message: 'Error al eliminar item de cotización',
			error: error.message
		});
	}
});

// PUT /quotations/:cotizacionId - Actualizar estado de cotización
// PUT /quotations/:cotizacionId - Actualizar estado de cotización usando SP
router.put('/:cotizacionId', async (req, res) => {
	const { cotizacionId } = req.params;
	const { decision, usuario_id, comentario = '' } = req.body;

	try {
		const pool = await getConnection();
		
		console.log(`📝 Actualizando cotización ${cotizacionId}`);
		console.log('Parámetros:', { cotizacion_id: parseInt(cotizacionId), usuario_id, decision, comentario });

		// Solo usar el SP para decisiones válidas
		if (decision !== 'Aprobada' && decision !== 'Rechazada') {
			return res.status(400).json({
				success: false,
				message: 'Decisión inválida. Use: Aprobada o Rechazada'
			});
		}

		const result = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.input('usuario_id', sql.Int, usuario_id)
			.input('decision', sql.VarChar(50), decision)
			.input('comentario', sql.VarChar(300), comentario || '')
			.execute('SP_GESTIONAR_APROBACION_COTIZACION');

		console.log('SP ejecutado exitosamente. Recordset:', result.recordset);
		const output = result.recordset?.[0] || {};
		
		res.json({
			success: true,
			msg: output.msg || 'Estado actualizado',
			allow: output.allow,
			data: output
		});
	} catch (error) {
		console.error('❌ Error al actualizar cotización:', error);
		console.error('Detalles del error:', error.originalError || error);
		res.status(500).json({
			success: false,
			message: 'Error al actualizar cotización',
			error: error.message
		});
	}
});

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

// POST /quotations/:cotizacionId/generate-workorder - Generar OT desde cotización aprobada
router.post('/:cotizacionId/generate-workorder', async (req, res) => {
	const { cotizacionId } = req.params;
	const {
		asesor_id,
		mecanico_encargado_id = null,
		odometro_ingreso = null,
		fecha_estimada = null,
		hora_estimada = null, // horas de trabajo estimadas
		generado_por = null
	} = req.body;

	try {
		const pool = await getConnection();

		// Normalizar el formato de hora
		const horaFormateada = normalizeTimeFormat(hora_estimada);

		console.log(`Generando OT desde cotización ${cotizacionId}`);
		console.log('Parámetros originales:', {
			cotizacion_id: parseInt(cotizacionId),
			asesor_id,
			mecanico_encargado_id,
			odometro_ingreso,
			fecha_estimada,
			hora_estimada,
			generado_por
		});
		console.log('Parámetros procesados:', {
			cotizacion_id: parseInt(cotizacionId),
			asesor_id,
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

		// Paso 1: Obtener información de la cotización y cita para conocer el tipo de servicio
		console.log('📋 Paso 1: Obteniendo información de la cotización...');
		const cotizacionResult = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.input('cita_id', sql.Int, null)
			.input('ot_id', sql.Int, null)
			.input('estado', sql.VarChar(50), null)
			.input('numero_cotizacion', sql.VarChar(20), null)
			.execute('SP_OBTENER_COTIZACIONES');

		const cotizacion = cotizacionResult.recordset?.[0];
		if (!cotizacion) {
			return res.status(404).json({
				success: false,
				message: 'Cotización no encontrada'
			});
		}

		console.log('Cotización encontrada:', cotizacion);

		// Obtener la cita asociada para saber el tipo de servicio
		let tipoServicioId = null;
		let servicioNombre = 'Servicio inicial';
		
		if (cotizacion.cita_id) {
			console.log(`Obteniendo información de la cita ${cotizacion.cita_id}...`);
			const citaResult = await pool.request()
				.input('cita_id', sql.Int, cotizacion.cita_id)
				.input('cliente_id', sql.Int, null)
				.input('vehiculo_id', sql.Int, null)
				.input('estado', sql.VarChar(50), null)
				.input('fecha_inicio', sql.Date, null)
				.input('numero_cita', sql.VarChar(20), null)
				.execute('SP_OBTENER_CITAS');

			const cita = citaResult.recordset?.[0];
			if (cita && cita.tipo_servicio_id) {
				tipoServicioId = cita.tipo_servicio_id;
				servicioNombre = cita.servicio_nombre || 'Servicio inicial';
				console.log(`Tipo de servicio encontrado: ${servicioNombre} (ID: ${tipoServicioId})`);
			}
		}

		// Paso 2: Generar la orden de trabajo
		console.log('Paso 2: Generando orden de trabajo...');
		const result = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.input('asesor_id', sql.Int, asesor_id)
			.input('mecanico_encargado_id', sql.Int, mecanico_encargado_id || null)
			.input('odometro_ingreso', sql.Decimal(10, 1), odometro_ingreso || null)
			.input('fecha_estimada', sql.Date, fecha_estimada || null)
			.input('hora_estimada', sql.VarChar(8), horaFormateada || null)
			.input('generado_por', sql.Int, generado_por || null)
			.execute('SP_GENERAR_OT_DESDE_COTIZACION');

		console.log('SP_GENERAR_OT_DESDE_COTIZACION ejecutado exitosamente');
		console.log('Recordset:', result.recordset);

		const output = result.recordset?.[0] || {};
		
		// Paso 3: Crear tarea inicial automáticamente si hay tipo de servicio
		if (output.allow && output.ot_id && tipoServicioId) {
			console.log(`Paso 3: Creando tarea inicial para OT ${output.ot_id}...`);
			try {
				const tareaResult = await pool.request()
					.input('ot_id', sql.Int, output.ot_id)
					.input('tipo_servicio_id', sql.Int, tipoServicioId)
					.input('descripcion', sql.VarChar(300), `Tarea inicial: ${servicioNombre}`)
					.input('horas_estimadas', sql.Decimal(9, 2), horaFormateada ? parseFloat(hora_estimada) : null)
					.input('horas_reales', sql.Decimal(9, 2), null)
					.input('prioridad', sql.TinyInt, 3) // Prioridad media
					.input('registrado_por', sql.Int, generado_por || asesor_id)
					.execute('SP_AGREGAR_TAREA_OT');

				const tareaOutput = tareaResult.recordset?.[0] || {};
				if (tareaOutput.allow) {
					console.log(`Tarea inicial creada exitosamente (ID: ${tareaOutput.ot_tarea_id})`);
				} else {
					console.warn(`No se pudo crear tarea inicial: ${tareaOutput.msg}`);
				}
			} catch (tareaError) {
				// No fallar la creación de OT si la tarea falla
				console.error('Error al crear tarea inicial (no crítico):', tareaError);
			}
		} else if (!tipoServicioId) {
			console.warn('No se encontró tipo de servicio para crear tarea inicial');
		}
		
		res.status(200).json({
			success: true,
			msg: output.msg || 'Orden de trabajo generada',
			allow: output.allow,
			ot_id: output.ot_id,
			numero_ot: output.numero_ot,
			data: output
		});
	} catch (error) {
		console.error('Error al generar OT desde cotización:', error);
		console.error('Detalles del error:', error.originalError || error);
		res.status(500).json({
			success: false,
			message: 'Error al generar orden de trabajo',
			error: error.message
		});
	}
});

// DELETE /quotations/:cotizacionId - Eliminar cotización
router.delete('/:cotizacionId', async (req, res) => {
	const { cotizacionId } = req.params;

	try {
		const pool = await getConnection();
		
		// Primero eliminar items asociados
		await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.query('DELETE FROM CotizacionesItems WHERE cotizacion_id = @cotizacion_id');
		
		// Luego eliminar la cotización
		const result = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.query('DELETE FROM Cotizaciones WHERE cotizacion_id = @cotizacion_id');

		res.json({
			success: true,
			message: 'Cotización eliminada exitosamente'
		});
	} catch (error) {
		console.error('Error al eliminar cotización:', error);
		res.status(500).json({
			success: false,
			message: 'Error al eliminar cotización',
			error: error.message
		});
	}
});

module.exports = router;
