const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('Email', sql.VarChar(255), email)
      .input('Password', sql.VarChar(255), password)
      .execute('SP_LOGIN');

    const user = result.recordset[0];

    if (!user || !user.Success) {
      return res.status(401).json({
        success: false,
        message: user?.Message || 'Credenciales inválidas'
      });
    }

    res.json({
      success: true,
      message: user.Message,
      data: {
        userId: user.UserId,
        email: user.Email,
        fullName: user.FullName,
        userType: user.UserType
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verificar código de seguridad
router.post('/verify-security-code', async (req, res) => {
  try {
    const { email, securityCode } = req.body;

    if (!email || !securityCode) {
      return res.status(400).json({
        success: false,
        message: 'Email y código de seguridad son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('Email', sql.VarChar(255), email)
      .input('SecurityCode', sql.VarChar(10), securityCode)
      .execute('SP_VERIFICAR_CODIGO_SEGURIDAD');

    const response = result.recordset[0];

    res.json({
      success: response.Success,
      message: response.Message
    });

  } catch (error) {
    console.error('Error verificando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Registrar usuario cliente
router.post('/register-client', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      address,
      companyName
    } = req.body;

    // Validaciones básicas
    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({
         success: false,
        message: 'Email, contraseña, nombre completo y teléfono son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('Email', sql.VarChar(255), email)
      .input('Password', sql.VarChar(255), password)
      .input('FullName', sql.VarChar(255), fullName)
      .input('Phone', sql.VarChar(20), phone)
      .input('Address', sql.VarChar(500), address || '')
      .input('CompanyName', sql.VarChar(255), companyName || '')
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');

    const response = result.recordset[0];

    if (response.Success) {
      res.status(201).json({
        success: true,
        message: response.Message,
        data: {
          userId: response.UserId,
          securityCode: response.SecurityCode
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.Message
      });
    }

  } catch (error) {
    console.error('Error registrando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
