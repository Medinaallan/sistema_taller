const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../config/database');
const notificationsService = require('../services/notificationsService');

// POST /quotations - Registrar nueva cotización (desde cita o desde OT)
router.post('/', async (req, res) => {
	const { cita_id, ot_id, fecha_vencimiento, comentario, registrado_por } = req.body;

	// Validación: debe tener cita_id O ot_id, no ambos ni ninguno
	if ((!cita_id && !ot_id) || (cita_id && ot_id)) {
		return res.status(400).json({
			success: false,
			message: 'Debe proporcionar cita_id O ot_id, no ambos'
		});
	}

	try {
		const pool = await getConnection();

		// SI se proporciona ot_id, validar el estado de la OT ANTES de llamar al SP
		if (ot_id) {
			console.log(`🔍 Validando estado de OT ${ot_id} antes de crear cotización...`);
			
			const otResult = await pool.request()
				.input('ot_id', sql.Int, parseInt(ot_id))
				.input('cliente_id', sql.Int, null)
				.input('placa', sql.VarChar(50), null)
				.input('estado', sql.VarChar(50), null)
				.input('numero_ot', sql.VarChar(20), null)
				.execute('SP_OBTENER_ORDENES_TRABAJO');

			if (otResult.recordset.length === 0) {
				console.log(`❌ OT ${ot_id} no encontrada`);
				return res.status(404).json({
					success: false,
					message: 'Orden de trabajo no encontrada'
				});
			}

			const ot = otResult.recordset[0];
			const estadosNoPermitidos = ['Cerrada', 'Cancelada', 'Facturada'];
			
			if (estadosNoPermitidos.includes(ot.estado_ot)) {
				console.log(`❌ No se puede crear cotización para OT con estado "${ot.estado_ot}"`);
				return res.status(400).json({
					success: false,
					message: `No se puede crear una cotización para una orden de trabajo con estado "${ot.estado_ot}"`,
					estadoActual: ot.estado_ot,
					numeroOT: ot.numero_ot
				});
			}

			console.log(`✅ OT ${ot.numero_ot} en estado "${ot.estado_ot}" - puede recibir cotizaciones`);
		}

		// Llamar al SP con ambos parámetros (cita_id o ot_id)
		console.log(`📝 Creando cotización ${ot_id ? `para OT ${ot_id}` : `para cita ${cita_id}`}`);
		
		const result = await pool.request()
			.input('cita_id', sql.Int, cita_id || null)
			.input('ot_id', sql.Int, ot_id || null)
			.input('fecha_vencimiento', sql.DateTime, fecha_vencimiento)
			.input('comentario', sql.VarChar(300), comentario || '')
			.input('registrado_por', sql.Int, registrado_por)
			.execute('SP_REGISTRAR_COTIZACION');

		const output = result.recordset?.[0] || {};

		console.log('🔵 [DEBUG] Resultado del SP_REGISTRAR_COTIZACION:');
		console.log('  - cita_id:', cita_id);
		console.log('  - ot_id:', ot_id);
		console.log('  - result.recordset:', result.recordset);
		console.log('  - output completo:', JSON.stringify(output, null, 2));
		console.log('  - output.cotizacion_id:', output?.cotizacion_id);
		console.log('  - output.allow:', output?.allow);
		console.log('  - output.msg:', output?.msg);

		// Manejar correctamente la respuesta del SP
		if (output.allow === 0 || output.allow === false) {
			console.log(`⚠️ SP rechazó la operación: ${output.msg}`);
			return res.status(400).json({
				success: false,
				message: output.msg || 'El SP rechazó la operación',
				allow: false
			});
		}

		console.log(`✅ Cotización ${output.cotizacion_id} creada exitosamente`);

		// Intentar notificar al cliente que la cotización fue creada
		try {
			if (output.cotizacion_id) {
				const cotRes = await pool.request()
					.input('cotizacion_id', sql.Int, parseInt(output.cotizacion_id))
					.input('cita_id', sql.Int, null)
					.input('ot_id', sql.Int, null)
					.input('estado', sql.VarChar(50), null)
					.input('numero_cotizacion', sql.VarChar(20), null)
					.execute('SP_OBTENER_COTIZACIONES');

				const cot = cotRes.recordset && cotRes.recordset[0] ? cotRes.recordset[0] : null;
				if (cot && cot.cliente_id) {
					const tipoCotizacion = ot_id ? 'adicional' : 'inicial';
					await notificationsService.notifyQuotationStatusChange(cot.cliente_id, cot, `Creada (${tipoCotizacion})`);
				}
			}
		} catch (notifErr) {
			console.error('Error enviando notificación de cotización creada:', notifErr);
		}

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



// GET /quotations/client/:userId - Obtener cotizaciones de un cliente específico por usuario
router.get('/client/:userId', async (req, res) => {
	const { userId } = req.params;

	try {
		const pool = await getConnection();
		
		console.log(`🔍 Buscando cotizaciones para usuario_id: ${userId}`);
		
		// Paso 1: Obtener el usuario específico usando SP_OBTENER_USUARIOS
		const usuarioResult = await pool.request()
			.input('usuario_id', sql.Int, parseInt(userId))
			.execute('SP_OBTENER_USUARIOS');

		console.log(`👤 Resultado SP_OBTENER_USUARIOS:`, usuarioResult.recordset);

		if (usuarioResult.recordset.length === 0) {
			console.log(`⚠️ Usuario ${userId} no encontrado en SP_OBTENER_USUARIOS`);
			return res.json({
				success: true,
				data: [],
				message: 'Usuario no encontrado'
			});
		}

		const usuario = usuarioResult.recordset[0];
		const cliente_id = usuario.usuario_id; // En tu sistema, usuario_id es el cliente_id
		
		console.log(`✅ Usuario encontrado: ${usuario.nombre_completo}, usando cliente_id: ${cliente_id}`);

		// Paso 2: Obtener las citas del cliente usando SP_OBTENER_CITAS
		const citasResult = await pool.request()
			.input('cita_id', sql.Int, null)
			.input('cliente_id', sql.Int, cliente_id)
			.input('vehiculo_id', sql.Int, null)
			.input('estado', sql.VarChar(50), null)
			.input('fecha_inicio', sql.Date, null)
			.input('numero_cita', sql.VarChar(20), null)
			.execute('SP_OBTENER_CITAS');

		console.log(`. Citas encontradas para cliente_id ${cliente_id}: ${citasResult.recordset.length}`);

		// Obtener los IDs de las citas del cliente
		const citaIds = citasResult.recordset.map(cita => cita.cita_id);
		console.log(`🎯 IDs de citas a buscar: ${citaIds.join(', ')}`);

		// Paso 2.5: Obtener las OTs del cliente usando SP_OBTENER_ORDENES_TRABAJO
		const otsResult = await pool.request()
			.input('ot_id', sql.Int, null)
			.input('cliente_id', sql.Int, cliente_id)
			.input('placa', sql.VarChar(50), null)
			.input('estado', sql.VarChar(50), null)
			.input('numero_ot', sql.VarChar(20), null)
			.execute('SP_OBTENER_ORDENES_TRABAJO');

		console.log(`🔧 OTs encontradas para cliente_id ${cliente_id}: ${otsResult.recordset.length}`);

				// Obtener los IDs de las OTs del cliente
				const otRows = otsResult.recordset || [];
				const otIds = otRows.map(ot => ot.ot_id);

				// Determinar OTs cerradas (no queremos mostrar cotizaciones ligadas a OTs cerradas)
				const estadosNoPermitidos = ['Cerrada', 'Cancelada', 'Facturada'];
				const closedOtIds = otRows
					.filter(ot => estadosNoPermitidos.includes((ot.estado_ot || '').toString()))
					.map(ot => ot.ot_id);

				// Mapear posibles relaciones OT -> cita (si el SP devuelve campo cita_id en OT)
				const otByCita = {};
				otRows.forEach(ot => {
					if (ot.cita_id) otByCita[String(ot.cita_id)] = ot;
				});
		console.log(`🎯 IDs de OTs a buscar: ${otIds.join(', ')}`);

		if (citasResult.recordset.length === 0 && otsResult.recordset.length === 0) {
			console.log(`⚠️ No hay citas ni OTs para el cliente_id ${cliente_id}`);
			return res.json({
				success: true,
				data: [],
				message: 'No se encontraron citas ni órdenes de trabajo para este cliente'
			});
		}

		// Paso 3: Obtener todas las cotizaciones
		const cotizacionesResult = await pool.request()
			.input('cotizacion_id', sql.Int, null)
			.input('cita_id', sql.Int, null)
			.input('ot_id', sql.Int, null)
			.input('estado', sql.VarChar(50), null)
			.input('numero_cotizacion', sql.VarChar(20), null)
			.execute('SP_OBTENER_COTIZACIONES');

		console.log(`💼 Total cotizaciones en sistema: ${cotizacionesResult.recordset.length}`);

		// Paso 4: Filtrar las cotizaciones que pertenecen a las citas o a las OTs del cliente
		// Además, excluir cotizaciones ligadas a OTs que están en estado cerrado/cancelado/facturado
		const cotizacionesCliente = cotizacionesResult.recordset.filter(cot => {
			// Si la cotización está ligada a una OT cerrada, excluirla
			if (cot.ot_id && closedOtIds.includes(cot.ot_id)) {
				return false;
			}

			// Cotización inicial (con cita_id) -> incluir solo si la cita pertenece al cliente
			// y no está asociada a una OT cerrada
			if (cot.cita_id && citaIds.includes(cot.cita_id)) {
				// Si existe una OT relacionada con esta cita y está cerrada, excluir
				const relatedOt = otByCita[String(cot.cita_id)];
				if (relatedOt && estadosNoPermitidos.includes((relatedOt.estado_ot || '').toString())) {
					return false;
				}
				return true;
			}

			// Cotización adicional (con ot_id)
			if (cot.ot_id && otIds.includes(cot.ot_id)) {
				return true;
			}

			return false;
		});

		console.log(`✅ Cotizaciones del cliente: ${cotizacionesCliente.length}`);
		if (cotizacionesCliente.length > 0) {
			console.log('📄 Cotizaciones encontradas:', cotizacionesCliente.map(c => ({
				numero: c.numero_cotizacion,
				cita_id: c.cita_id,
				ot_id: c.ot_id,
				tipo: c.cita_id ? 'inicial' : 'adicional',
				cliente: c.nombre_cliente
			})));
		}

		res.json({
			success: true,
			data: cotizacionesCliente
		});
	} catch (error) {
		console.error('❌ Error al obtener cotizaciones del cliente:', error);
		res.status(500).json({
			success: false,
			message: 'Error al obtener cotizaciones del cliente',
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

		// Primero, obtener información de la cotización para saber si es adicional (tiene ot_id)
		const cotRes = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.input('cita_id', sql.Int, null)
			.input('ot_id', sql.Int, null)
			.input('estado', sql.VarChar(50), null)
			.input('numero_cotizacion', sql.VarChar(20), null)
			.execute('SP_OBTENER_COTIZACIONES');

		const cotizacion = cotRes.recordset && cotRes.recordset[0] ? cotRes.recordset[0] : null;
		if (!cotizacion) {
			return res.status(404).json({
				success: false,
				message: 'Cotización no encontrada'
			});
		}

		const esAdicional = cotizacion.ot_id !== null;
		console.log(`\n${'='.repeat(80)}`);
		console.log(`${esAdicional ? '🔧 Cotización ADICIONAL' : '. Cotización INICIAL'}`);
		console.log(`Cotización ID: ${cotizacionId}`);
		console.log(`OT: ${cotizacion.ot_id || 'N/A'}`);
		console.log(`Decisión: ${decision}`);
		console.log(`Total cotización: L${cotizacion.total}`);
		console.log(`${'='.repeat(80)}\n`);

		// Si es adicional y se va a aprobar, consultar DIRECTAMENTE la tabla para ver el costo actual
		if (esAdicional && cotizacion.ot_id && decision === 'Aprobada') {
			try {
				console.log(`🔍 Consultando DIRECTAMENTE la tabla OrdenesTrabajoTable para OT #${cotizacion.ot_id}...`);
				const directQuery = await pool.request()
					.input('ot_id', sql.Int, cotizacion.ot_id)
					.query('SELECT * FROM OrdenesTrabajoTable WHERE ot_id = @ot_id');
				
				if (directQuery.recordset && directQuery.recordset.length > 0) {
					const otDirecta = directQuery.recordset[0];
					console.log('📊 Columnas disponibles:', Object.keys(otDirecta));
					console.log('📊 Datos OT (consulta directa):', JSON.stringify(otDirecta, null, 2));
				} else {
					console.error('❌ No se encontró la OT en la tabla');
				}
			} catch (directErr) {
				console.error('Error en consulta directa:', directErr.message);
			}
		}

		// Si es adicional, obtener el costo actual de la OT antes de aprobar
		let costoAntes = null;
		if (esAdicional && cotizacion.ot_id && decision === 'Aprobada') {
			console.log(`🔍 Buscando OT #${cotizacion.ot_id} ANTES de aprobar...`);
			const otAntesRes = await pool.request()
				.input('ot_id', sql.Int, cotizacion.ot_id)
				.input('cliente_id', sql.Int, null)
				.input('placa', sql.VarChar(50), null)
				.input('estado', sql.VarChar(50), null)
				.input('numero_ot', sql.VarChar(20), null)
				.execute('SP_OBTENER_ORDENES_TRABAJO');
			
			console.log('📊 Resultado SP_OBTENER_ORDENES_TRABAJO:', otAntesRes.recordset);
			console.log('📊 Cantidad de registros:', otAntesRes.recordset?.length);
			
			if (otAntesRes.recordset && otAntesRes.recordset.length > 0) {
				const ot = otAntesRes.recordset[0];
				console.log('📊 Campos disponibles en OT:', Object.keys(ot));
				console.log('📊 Datos completos OT:', JSON.stringify(ot, null, 2));
				
				// Buscar el campo correcto para el costo
				costoAntes = ot.costo_estimado || ot.costoEstimado || ot.costo_total || ot.total || ot.monto_total || 0;
				console.log(`💰 Costo ANTES de aprobar: L${costoAntes} | Cotización adicional: L${cotizacion.total}`);
			} else {
				console.error('❌ ERROR: SP_OBTENER_ORDENES_TRABAJO no devolvió resultados para ot_id:', cotizacion.ot_id);
				console.error('Esto es un problema crítico - la OT debería existir');
			}
		}

		// Ejecutar el SP de aprobación
		const result = await pool.request()
			.input('cotizacion_id', sql.Int, parseInt(cotizacionId))
			.input('usuario_id', sql.Int, usuario_id)
			.input('decision', sql.VarChar(50), decision)
			.input('comentario', sql.VarChar(300), comentario || '')
			.execute('SP_GESTIONAR_APROBACION_COTIZACION');

		console.log('SP ejecutado exitosamente. Recordset:', result.recordset);
		const output = result.recordset?.[0] || {};

		// Si es adicional, verificar el costo DESPUÉS de aprobar
		if (esAdicional && cotizacion.ot_id && decision === 'Aprobada' && costoAntes !== null) {
			const otDespuesRes = await pool.request()
				.input('ot_id', sql.Int, cotizacion.ot_id)
				.input('cliente_id', sql.Int, null)
				.input('placa', sql.VarChar(50), null)
				.input('estado', sql.VarChar(50), null)
				.input('numero_ot', sql.VarChar(20), null)
				.execute('SP_OBTENER_ORDENES_TRABAJO');
			
			if (otDespuesRes.recordset && otDespuesRes.recordset[0]) {
				const ot = otDespuesRes.recordset[0];
				const costoDespues = ot.costo_estimado || ot.costoEstimado || ot.costo_total || ot.total || ot.monto_total || 0;
				const esperado = parseFloat(costoAntes) + parseFloat(cotizacion.total);
				console.log(`\n💰 VERIFICACIÓN DE COSTOS:`);
				console.log(`   Costo ANTES:     L${costoAntes}`);
				console.log(`   Cotización:      L${cotizacion.total}`);
				console.log(`   Costo ESPERADO:  L${esperado.toFixed(2)} (ANTES + Cotización)`);
				console.log(`   Costo DESPUÉS:   L${costoDespues}`);
				
				if (Math.abs(costoDespues - esperado) > 0.01) {
					console.error(`   ⚠️ ERROR: El costo NO se sumó correctamente en SP_GESTIONAR_APROBACION_COTIZACION!`);
					console.error(`   El SP está REEMPLAZANDO (${costoDespues}) en lugar de SUMAR (${esperado.toFixed(2)})`);
					console.error(`   🔧 SOLUCIÓN: Modificar SP_GESTIONAR_APROBACION_COTIZACION para que haga:`);
					console.error(`      UPDATE OrdenesTrabajoTable SET costo_estimado = costo_estimado + @total_cotizacion WHERE ot_id = @ot_id`);
				} else {
					console.log(`   ✅ Costo sumado correctamente`);
				}
				console.log(`${'='.repeat(80)}\n`);
			}
		}

		console.log(`\n✅ Cotización ${decision === 'Aprobada' ? 'aprobada' : 'rechazada'} exitosamente`);
		console.log(`Tipo: ${esAdicional ? 'Adicional (OT #' + cotizacion.ot_id + ')' : 'Inicial'}`);
		console.log(`💡 Nota: Si es aprobada, use el endpoint /generar-ot para procesarla a OT\n`);

		// Notificar al cliente
		if (output.allow) {
			try {
				if (cotizacion && cotizacion.cliente_id) {
					await notificationsService.notifyQuotationStatusChange(cotizacion.cliente_id, cotizacion, decision);
				}
			} catch (notifErr) {
				console.error('Error enviando notificación de cambio de estado de cotización:', notifErr);
			}
		}

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
		console.log('. Paso 1: Obteniendo información de la cotización...');
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
		
		// Detectar si es cotización adicional (tiene ot_id)
		const esAdicional = cotizacion.ot_id !== null;
		
		if (esAdicional) {
			console.log(`\n${'='.repeat(80)}`);
			console.log('🔧 COTIZACIÓN ADICIONAL DETECTADA');
			console.log(`Cotización: ${cotizacion.numero_cotizacion}`);
			console.log(`Se agregará a OT existente: ${cotizacion.numero_ot || cotizacion.ot_id}`);
			console.log(`Total a agregar: L${cotizacion.total}`);
			console.log('El SP agregará las tareas automáticamente');
			console.log(`${'='.repeat(80)}\n`);
		}

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

		// Si es adicional, obtener costo ANTES de procesar
		let costoAntesGenerar = null;
		if (esAdicional && cotizacion.ot_id) {
			const otAntesGenerar = await pool.request()
				.input('ot_id', sql.Int, cotizacion.ot_id)
				.input('cliente_id', sql.Int, null)
				.input('placa', sql.VarChar(50), null)
				.input('estado', sql.VarChar(50), null)
				.input('numero_ot', sql.VarChar(20), null)
				.execute('SP_OBTENER_ORDENES_TRABAJO');
			
			if (otAntesGenerar.recordset && otAntesGenerar.recordset[0]) {
				const ot = otAntesGenerar.recordset[0];
				console.log('📊 Campos en OT (antes generar):', Object.keys(ot));
				costoAntesGenerar = ot.costo_estimado || ot.costoEstimado || ot.costo_total || ot.total || ot.monto_total || 0;
				console.log(`💰 Costo OT ANTES de generar: L${costoAntesGenerar}`);
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
		
		// Iniciar sala de chat para la OT si fue creada exitosamente
		if (output.allow && output.ot_id) {
			try {
				await pool.request()
					.input('ot_id', sql.Int, output.ot_id)
					.input('registrado_por', sql.Int, generado_por || null)
					.execute('SP_INICIAR_SALA_CHAT');
				console.log('✅ Sala de chat iniciada para OT:', output.ot_id);
			} catch (chatError) {
				console.error('⚠️ Error al iniciar sala de chat:', chatError);
				// No fallar la operación si la sala de chat falla
			}
		}
		
		// Log detallado del resultado
		if (esAdicional) {
			console.log(`\n✅ COTIZACIÓN ADICIONAL PROCESADA`);
			console.log(`Tareas agregadas a OT: ${output.numero_ot || cotizacion.numero_ot}`);
			console.log(`Estado OT actualizado: ${output.estado_ot || 'En Proceso'}`);
			console.log(`Respuesta SP:`, output);
			
			// Verificar costo DESPUÉS de procesar
			if (costoAntesGenerar !== null && output.ot_id) {
				const otDespuesGenerar = await pool.request()
					.input('ot_id', sql.Int, output.ot_id || cotizacion.ot_id)
					.input('cliente_id', sql.Int, null)
					.input('placa', sql.VarChar(50), null)
					.input('estado', sql.VarChar(50), null)
					.input('numero_ot', sql.VarChar(20), null)
					.execute('SP_OBTENER_ORDENES_TRABAJO');
				
				if (otDespuesGenerar.recordset && otDespuesGenerar.recordset[0]) {
					const ot = otDespuesGenerar.recordset[0];
					const costoDespuesGenerar = ot.costo_estimado || ot.costoEstimado || ot.costo_total || ot.total || ot.monto_total || 0;
					const esperado = parseFloat(costoAntesGenerar) + parseFloat(cotizacion.total);
					console.log(`\n💰 VERIFICACIÓN DE COSTOS (POST SP_GENERAR_OT):`);
					console.log(`   Costo ANTES:     L${costoAntesGenerar}`);
					console.log(`   Cotización:      L${cotizacion.total}`);
					console.log(`   Costo ESPERADO:  L${esperado.toFixed(2)}`);
					console.log(`   Costo DESPUÉS:   L${costoDespuesGenerar}`);
					
					if (Math.abs(costoDespuesGenerar - esperado) > 0.01) {
						console.error(`   ❌ ERROR EN SP_GENERAR_OT_DESDE_COTIZACION`);
						console.error(`   El SP está REEMPLAZANDO (${costoDespuesGenerar}) en lugar de SUMAR (${esperado.toFixed(2)})`);
						console.error(`   🔧 SOLUCIÓN: Modificar SP_GENERAR_OT_DESDE_COTIZACION para que cuando detecte ot_id != NULL haga:`);
						console.error(`      UPDATE OrdenesTrabajoTable SET costo_estimado = costo_estimado + (SELECT SUM(total) FROM CotizacionesItems WHERE cotizacion_id = @cotizacion_id)`);
					} else {
						console.log(`   ✅ Costo sumado correctamente`);
					}
				}
			}
			console.log(`${'='.repeat(80)}\n`);
		} else {
			console.log(`\n✅ NUEVA OT CREADA`);
			console.log(`Número OT: ${output.numero_ot}`);
			console.log(`ID OT: ${output.ot_id}`);
			console.log(`${'='.repeat(80)}\n`);
		}
		
		// Paso 3: Crear tarea inicial automáticamente si hay tipo de servicio (solo para cotizaciones iniciales)
		if (!esAdicional && output.allow && output.ot_id && tipoServicioId) {
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
