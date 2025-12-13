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
// SP: SP_VERIFICAR_CODIGO_SEGURIDAD
// Params: @correo VARCHAR(100), @codigo_seguridad VARCHAR(6)
// Return: msg, allow (0, 1)
router.post('/verify-security-code', async (req, res) => {
  try {
    const { email, securityCode } = req.body;
    
    console.log('🔐 Verificando código de seguridad:', { email, securityCode });

    if (!email || !securityCode) {
      return res.status(400).json({
        success: false,
        message: 'Email y código de seguridad son requeridos'
      });
    }

    const pool = await getConnection();
    
    console.log('📤 Ejecutando SP_VERIFICAR_CODIGO_SEGURIDAD con params:', {
      correo: email.toLowerCase(),
      codigo_seguridad: securityCode.trim()
    });
    
    const result = await pool.request()
      .input('correo', sql.VarChar(100), email.toLowerCase())
      .input('codigo_seguridad', sql.VarChar(6), securityCode.trim())
      .execute('SP_VERIFICAR_CODIGO_SEGURIDAD');

    const response = result.recordset[0];
    console.log('📝 Respuesta COMPLETA del SP:', JSON.stringify(response, null, 2));
    console.log('📊 allow:', response.allow, 'tipo:', typeof response.allow);
    console.log('📊 msg:', response.msg);

    // El SP devuelve: msg, allow (0 o 1)
    const isValid = response.allow === 1;
    console.log('✅ ¿Es válido?', isValid);

    const responseData = {
      success: isValid,
      message: response.msg,
      allow: response.allow
    };
    
    console.log('📤 Respuesta enviada al frontend:', responseData);
    
    res.json(responseData);

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
// SP: SP_REGISTRAR_USUARIO_CLIENTE
// Params: @nombre_completo VARCHAR(100), @correo VARCHAR(100), @telefono VARCHAR(30)
// Return: '200 OK' as response, 'Usuario registrado con éxito' as msg, codigo_seguridad
router.post('/register-client', async (req, res) => {
  try {
    const { email, fullName, phone } = req.body;
    
    console.log('➕ Registrando cliente:', { fullName, email, phone });

    // Validaciones básicas (solo los 3 campos requeridos por el SP)
    if (!email || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo, email y teléfono son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre_completo', sql.VarChar(100), fullName)
      .input('correo', sql.VarChar(100), email.toLowerCase())
      .input('telefono', sql.VarChar(30), phone)
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');

    const response = result.recordset[0];
    console.log('📝 Respuesta del SP:', response);

    // El SP devuelve: response ('200 OK'), msg, codigo_seguridad
    if (response.response === '200 OK') {
      res.status(201).json({
        success: true,
        message: response.msg,
        data: {
          codigo_seguridad: response.codigo_seguridad
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.msg || 'Error al registrar cliente'
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
