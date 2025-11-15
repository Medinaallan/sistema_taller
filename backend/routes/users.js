const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Obtener lista de usuarios usando SP_OBTENER_USUARIOS
router.get('/list', async (req, res) => {
  console.log('👥 [ROUTER] Obteniendo lista de usuarios...');
  
  try {
    const pool = await getConnection();
    const usuarios = [];
    
    console.log('🔍 [ROUTER] Buscando usuarios por ID...');
    
    // Buscar usuarios en un rango de IDs
    for (let id = 1; id <= 100; id++) {
      try {
        const result = await pool.request()
          .input('usuario_id', sql.Int, id)
          .execute('SP_OBTENER_USUARIOS');
        
        if (result.recordset.length > 0) {
          const usuario = result.recordset[0];
          usuarios.push(usuario);
          console.log(`✅ [ROUTER] Usuario ID ${id}: ${usuario.nombre_completo} (${usuario.correo})`);
        }
      } catch (error) {
        // Ignorar errores individuales
      }
    }
    
    console.log(`✅ [ROUTER] Total usuarios encontrados: ${usuarios.length}`);
    
    res.json({
      success: true,
      data: usuarios,
      count: usuarios.length,
      message: usuarios.length > 0 ? 'Usuarios obtenidos exitosamente' : 'No se encontraron usuarios'
    });
    
  } catch (error) {
    console.error('❌ [ROUTER] Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener usuario específico por ID
router.get('/:id', async (req, res) => {
  console.log('👤 [ROUTER] Obteniendo usuario por ID:', req.params.id);
  
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de usuario inválido' 
      });
    }
    
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('usuario_id', sql.Int, userId)
      .execute('SP_OBTENER_USUARIOS');
    
    const user = result.recordset[0];
    
    if (user) {
      console.log('✅ [ROUTER] Usuario encontrado:', user.nombre_completo);
      res.json({
        success: true,
        data: user
      });
    } else {
      console.log('❌ [ROUTER] Usuario no encontrado');
      res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
  } catch (error) {
    console.error('❌ [ROUTER] Error obteniendo usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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

// Crear usuario mecánico
router.post('/mecanico', async (req, res) => {
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
      .input('rol', sql.VarChar(50), 'Mecánico')
      .input('registradoPor', sql.Int, registradoPor || 1)
      .execute('SP_REGISTRAR_USUARIO_PANEL_ADMIN');

    res.status(201).json({
      success: true,
      message: 'Usuario mecánico creado exitosamente',
      data: result.recordset[0] || null
    });

  } catch (error) {
    console.error('Error creando mecánico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Crear usuario de cualquier tipo para el panel (endpoint genérico)
router.post('/panel', async (req, res) => {
  try {
    const { nombre_completo, correo, telefono, rol, registradoPor } = req.body;

    if (!nombre_completo || !correo || !telefono || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo, correo, teléfono y rol son requeridos'
      });
    }

    // Validar que el rol sea válido para el panel
    const rolesValidos = ['Administrador', 'Mecánico', 'Recepcionista'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Roles válidos: ${rolesValidos.join(', ')}`
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre_completo', sql.VarChar(100), nombre_completo)
      .input('correo', sql.VarChar(100), correo)
      .input('telefono', sql.VarChar(30), telefono)
      .input('rol', sql.VarChar(50), rol)
      .input('registradoPor', sql.Int, registradoPor || 1)
      .execute('SP_REGISTRAR_USUARIO_PANEL_ADMIN');

    res.status(201).json({
      success: true,
      message: `Usuario ${rol.toLowerCase()} creado exitosamente`,
      data: result.recordset[0] || null
    });

  } catch (error) {
    console.error('Error creando usuario del panel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
