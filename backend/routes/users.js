const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .execute('SP_OBTENER_TODOS_USUARIOS');

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
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
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre completo son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('Email', sql.VarChar(255), email)
      .input('Password', sql.VarChar(255), password)
      .input('FullName', sql.VarChar(255), fullName)
      .execute('SP_CREAR_USUARIO_ADMIN');

    const response = result.recordset[0];

    if (response.Success) {
      res.status(201).json({
        success: true,
        message: response.Message,
        data: {
          userId: response.UserId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.Message
      });
    }

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
