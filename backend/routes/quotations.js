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

module.exports = router;
