const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Obtener todos los roles disponibles (ya que no hay SP para obtener usuarios)
router.get('/roles', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .execute('SP_OBTENER_ROLES');

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });

  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Validar correo de usuario
router.post('/validate-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), email)
      .execute('SP_VALIDAR_CORREO_USUARIO');

    res.json({
      success: true,
      data: result.recordset[0] || null
    });

  } catch (error) {
    console.error('Error validando correo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Crear usuario administrador
router.post('/admin', async (req, res) => {
  try {
    const { nombre_completo, correo, telefono, registradoPor } = req.body;

    if (!nombre_completo || !correo || !telefono) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo, correo y teléfono son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre_completo', sql.VarChar(100), nombre_completo)
      .input('correo', sql.VarChar(100), correo)
      .input('telefono', sql.VarChar(30), telefono)
      .input('rol', sql.VarChar(50), 'Administrador')
      .input('registradoPor', sql.Int, registradoPor || 1)
      .execute('SP_REGISTRAR_USUARIO_PANEL_ADMIN');

    res.status(201).json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      data: result.recordset[0] || null
    });

  } catch (error) {
    console.error('Error creando administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
