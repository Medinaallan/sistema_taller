const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Registrar tipo de servicio
router.post('/register', async (req, res) => {
  const { nombre, descripcion, registrado_por } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre', sql.VarChar(100), nombre)
      .input('descripcion', sql.VarChar(200), descripcion)
      .input('registrado_por', sql.Int, registrado_por)
      .execute('SP_REGISTRAR_TIPO_SERVICIO');
    res.json(result.recordset[0] || { response: '200 OK', msg: 'Registrado', allow: 1 });
  } catch (error) {
    res.status(500).json({ response: '500 ERROR', msg: error.message, allow: 0 });
  }
});

// Obtener tipos de servicio
router.get('/', async (req, res) => {
  const { tipo_servicio_id, nombre, obtener_activos } = req.query;
  try {
    const pool = await getConnection();
    const request = pool.request();
    if (tipo_servicio_id) request.input('tipo_servicio_id', sql.Int, tipo_servicio_id);
    if (nombre) request.input('nombre', sql.VarChar(100), nombre);
    if (obtener_activos !== undefined) request.input('obtener_activos', sql.Bit, obtener_activos);
    const result = await request.execute('SP_OBTENER_TIPOS_SERVICIO');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// Editar estado tipo de servicio
router.put('/estado/:id', async (req, res) => {
  const { id } = req.params;
  const { activo, editado_por } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('tipo_servicio_id', sql.Int, id)
      .input('activo', sql.Bit, activo)
      .input('editado_por', sql.Int, editado_por)
      .execute('SP_EDITAR_ESTADO_TIPO_SERVICIO');
    res.json(result.recordset[0] || { response: '200 OK', msg: 'Estado editado' });
  } catch (error) {
    res.status(500).json({ response: '500 ERROR', msg: error.message });
  }
});

module.exports = router;
