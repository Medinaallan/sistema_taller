const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Obtener todos los clientes registrados
router.get('/registered', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .execute('SP_OBTENER_CLIENTES_REGISTRADOS');

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });

  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener cliente por ID
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
      .input('ClientId', sql.Int, parseInt(clientId))
      .execute('SP_OBTENER_CLIENTE_POR_ID');

    const client = result.recordset[0];

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar información del cliente
router.put('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { fullName, phone, address, companyName } = req.body;

    const pool = await getConnection();
    const result = await pool.request()
      .input('ClientId', sql.Int, parseInt(clientId))
      .input('FullName', sql.VarChar(255), fullName)
      .input('Phone', sql.VarChar(20), phone)
      .input('Address', sql.VarChar(500), address || '')
      .input('CompanyName', sql.VarChar(255), companyName || '')
      .execute('SP_ACTUALIZAR_CLIENTE');

    const response = result.recordset[0];

    res.json({
      success: response.Success,
      message: response.Message
    });

  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
