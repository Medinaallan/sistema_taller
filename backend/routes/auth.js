const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const emailService = require('../services/emailService');

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

// ========================================
// RECUPERACIÓN DE CONTRASEÑA
// ========================================

// 1. Iniciar recuperación de contraseña
// SP: SP_INICIAR_RECUPERACION_PASSWORD
// Params: @correo VARCHAR(100)
// Return: msg, allow (0, 1), token (CHAR(36))
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 Iniciando recuperación de contraseña para:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('correo', sql.VarChar(100), email.toLowerCase())
      .execute('SP_INICIAR_RECUPERACION_PASSWORD');

    const response = result.recordset[0];
    console.log('📝 Respuesta del SP_INICIAR_RECUPERACION_PASSWORD:', response);

    // El SP devuelve: msg, allow (0 o 1), token (CHAR(36))
    if (response.allow === 1 && response.token) {
      console.log('✅ Token generado:', response.token);
      
      // Enviar email con el token (en desarrollo solo se registra en consola)
      try {
        const emailResult = await emailService.sendPasswordRecoveryEmail(
          email,
          response.token,
          email.split('@')[0] // Usar parte del email como nombre temporal
        );
        
        res.json({
          success: true,
          message: response.msg || 'Se ha enviado un enlace de recuperación a su correo',
          token: response.token, // En desarrollo, devolvemos el token directamente
          resetUrl: emailResult.resetUrl // URL completa para testing
        });
      } catch (emailError) {
        console.error('⚠️ Error enviando email:', emailError);
        // Aún así devolvemos éxito porque el token fue generado
        res.json({
          success: true,
          message: response.msg || 'Token generado (email no enviado en desarrollo)',
          token: response.token
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: response.msg || 'No se pudo iniciar la recuperación de contraseña'
      });
    }

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 2. Validar token de recuperación
// SP: SP_VALIDAR_TOKEN_RECUPERACION
// Params: @token CHAR(36)
// Return: msg, allow (0, 1)
router.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    console.log('🔍 Validando token de recuperación:', token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'El token es requerido'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('token', sql.Char(36), token)
      .execute('SP_VALIDAR_TOKEN_RECUPERACION');

    const response = result.recordset[0];
    console.log('📝 Respuesta del SP_VALIDAR_TOKEN_RECUPERACION:', response);

    // El SP devuelve: msg, allow (0 o 1)
    const isValid = response.allow === 1;

    res.json({
      success: isValid,
      message: response.msg,
      valid: isValid
    });

  } catch (error) {
    console.error('Error validando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. Completar recuperación de contraseña
// SP: SP_COMPLETAR_RECUPERACION_PASSWORD
// Params: @token CHAR(36), @password NVARCHAR(100)
// Return: msg, allow (0, 1)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log('🔄 Completando recuperación de contraseña con token:', token);

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'El token y la nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('token', sql.Char(36), token)
      .input('password', sql.NVarChar(100), newPassword)
      .execute('SP_COMPLETAR_RECUPERACION_PASSWORD');

    const response = result.recordset[0];
    console.log('📝 Respuesta del SP_COMPLETAR_RECUPERACION_PASSWORD:', response);

    // El SP devuelve: msg, allow (0 o 1)
    if (response.allow === 1) {
      console.log('✅ Contraseña actualizada exitosamente');
      res.json({
        success: true,
        message: response.msg || 'Contraseña actualizada exitosamente'
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.msg || 'No se pudo actualizar la contraseña'
      });
    }

  } catch (error) {
    console.error('Error completando recuperación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
