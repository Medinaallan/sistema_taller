
const express = require('express');
const router = express.Router();
const mssql = require('mssql');
const dbConfig = require('../config/database');

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
		const pool = await mssql.connect(dbConfig);
		const result = await pool.request()
			.input('cotizacion_id', mssql.Int, cotizacion_id ? parseInt(cotizacion_id) : null)
			.input('cita_id', mssql.Int, cita_id ? parseInt(cita_id) : null)
			.input('ot_id', mssql.Int, ot_id ? parseInt(ot_id) : null)
			.input('estado', mssql.VarChar(50), estado || null)
			.input('numero_cotizacion', mssql.VarChar(20), numero_cotizacion || null)
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
