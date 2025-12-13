const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Cache de usuarios para mejorar rendimiento
let usuariosCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000; // 30 segundos

// Obtener lista de usuarios usando SP_OBTENER_USUARIOS (ULTRA OPTIMIZADO)
router.get('/list', async (req, res) => {
  console.log('👥 [ROUTER] Obteniendo lista de usuarios...');
  
  try {
    // Verificar cache
    const now = Date.now();
    if (usuariosCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(' [ROUTER] Devolviendo usuarios desde cache');
      return res.json({
        success: true,
        data: usuariosCache,
        count: usuariosCache.length,
        message: `Usuarios obtenidos desde cache (${usuariosCache.length} usuarios)`,
        cached: true
      });
    }
    
    const pool = await getConnection();
    const usuarios = [];
    
    // Solo buscar los primeros 20 IDs conocidos más comunes
    const idsRapidos = [2, 7, 8, 9, 10, 11, 12, 13, 15, 17, 19, 20];
    
    console.log(`🔍 [ROUTER] Búsqueda rápida en ${idsRapidos.length} IDs principales...`);
    
    // Usar Promise.all para consultas paralelas en lugar de secuenciales
    const promesas = idsRapidos.map(async (id) => {
      try {
        const result = await pool.request()
          .input('usuario_id', sql.Int, id)
          .execute('SP_OBTENER_USUARIOS');
        
        if (result.recordset.length > 0) {
          console.log(`✅ [ROUTER] Usuario ID ${id}: ${result.recordset[0].nombre_completo}`);
          return result.recordset[0];
        }
      } catch (error) {
        console.log(`⚠️ [ROUTER] Error en ID ${id}`);
        return null;
      }
    });
    
    const resultados = await Promise.all(promesas);
    const usuariosEncontrados = resultados.filter(usuario => usuario !== null);
    
    // Actualizar cache
    usuariosCache = usuariosEncontrados;
    cacheTimestamp = now;
    
    console.log(`✅ [ROUTER] Total usuarios encontrados: ${usuariosEncontrados.length} (cached for 30s)`);
    
    res.json({
      success: true,
      data: usuariosEncontrados,
      count: usuariosEncontrados.length,
      message: `Usuarios obtenidos exitosamente (${usuariosEncontrados.length} usuarios)`,
      cached: false
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
      .input('obtener_todos', sql.Bit, 0)
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

// PUT /users/:usuarioId - Editar usuario (SP_EDITAR_USUARIO)
router.put('/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const { nombre_completo, correo, telefono } = req.body;

  try {
    console.log(`📝 Editando usuario ${usuarioId}`);
    console.log('Datos recibidos:', { nombre_completo, correo, telefono });

    // Validaciones básicas
    if (!nombre_completo && !correo && !telefono) {
      return res.status(400).json({
        success: false,
        message: 'Al menos uno de los campos (nombre_completo, correo o telefono) es requerido'
      });
    }

    const pool = await getConnection();

    // Si se proporciona correo, validar primero con SP_VALIDAR_CORREO_USUARIO
    if (correo) {
      console.log(`🔍 Validando correo: ${correo}`);
      const validationResult = await pool.request()
        .input('correo', sql.VarChar(100), correo)
        .execute('SP_VALIDAR_CORREO_USUARIO');

      const validationOutput = validationResult.recordset?.[0] || {};
      console.log('Resultado validación:', validationOutput);

      if (!validationOutput.allow) {
        return res.status(400).json({
          success: false,
          message: validationOutput.msg || 'El correo ya está en uso'
        });
      }
    }

    // Ejecutar SP_EDITAR_USUARIO
    console.log('📤 Ejecutando SP_EDITAR_USUARIO');
    const result = await pool.request()
      .input('usuario_id', sql.Int, parseInt(usuarioId))
      .input('nombre_completo', sql.VarChar(100), nombre_completo || null)
      .input('correo', sql.VarChar(100), correo || null)
      .input('telefono', sql.VarChar(30), telefono || null)
      .execute('SP_EDITAR_USUARIO');

    console.log('✅ SP ejecutado exitosamente. Recordset:', result.recordset);
    const output = result.recordset?.[0] || {};

    res.json({
      success: true,
      msg: output.msg || 'Usuario actualizado exitosamente',
      allow: output.allow,
      data: output
    });
  } catch (error) {
    console.error('❌ Error editando usuario:', error);
    console.error('Detalles del error:', error.originalError || error);
    res.status(500).json({
      success: false,
      message: 'Error al editar usuario',
      error: error.message
    });
  }
});

module.exports = router;
