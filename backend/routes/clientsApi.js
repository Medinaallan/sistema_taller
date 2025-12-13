const express = require('express');
const { getConnection, sql } = require('../config/database');
const router = express.Router();

/**
 * 🗃️ API ENDPOINTS PARA CLIENTES - CRUD CON STORED PROCEDURES
 * 
 * Endpoints que trabajan directamente con la base de datos:
 * GET    /api/clients/registered - Obtener todos los clientes registrados (SP_OBTENER_USUARIOS)
 * GET    /api/clients/:id        - Obtener un cliente específico (SP_OBTENER_USUARIOS con ID)
 * POST   /api/clients            - Crear nuevo cliente (SP_REGISTRAR_USUARIO_CLIENTE)
 * PUT    /api/clients/:id        - Actualizar cliente (SP_EDITAR_USUARIO)
 * DELETE /api/clients/:id        - Eliminar cliente (por implementar)
 */

/**
 * 📋 GET /api/clients/registered - Obtener todos los clientes registrados
 * Usa SP_OBTENER_USUARIOS sin parámetros para obtener todos los usuarios
 */
router.get('/registered', async (req, res) => {
  try {
    console.log('📋 GET /api/clients/registered - Obteniendo todos los clientes desde BD');
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, null)
      .execute('SP_OBTENER_USUARIOS');
    
    console.log('📊 Resultado del SP_OBTENER_USUARIOS:', result.recordset);
    
    // Transformar datos para el frontend
    const clients = result.recordset.map(user => ({
      id: user.usuario_id?.toString(),
      name: user.nombre_completo,
      email: user.correo,
      phone: user.telefono,
      role: user.rol,
      createdAt: new Date(), // Podríamos agregar fecha_creacion al SP si la necesitamos
      updatedAt: new Date()
    }));
    
    res.json({
      success: true,
      data: clients,
      total: clients.length
    });
    
    console.log(`✅ Enviados ${clients.length} clientes desde BD`);
  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * 👤 GET /api/clients/:id - Obtener un cliente específico
 * Usa SP_OBTENER_USUARIOS con parámetro @usuario_id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 GET /api/clients/${id} - Obteniendo cliente específico desde BD`);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, parseInt(id))
      .execute('SP_OBTENER_USUARIOS');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const user = result.recordset[0];
    const client = {
      id: user.usuario_id?.toString(),
      name: user.nombre_completo,
      email: user.correo,
      phone: user.telefono,
      role: user.rol,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: client
    });
    
    console.log(`✅ Cliente encontrado: ${client.name}`);
  } catch (error) {
    console.error('❌ Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * ➕ POST /api/clients - Crear nuevo cliente
 * Usa SP_REGISTRAR_USUARIO_CLIENTE
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, usuario_id } = req.body;
    console.log('➕ POST /api/clients - Creando nuevo cliente:', name);
    
    // Validaciones básicas
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y teléfono son requeridos'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('nombre_completo', sql.VarChar(100), name)
      .input('correo', sql.VarChar(100), email.toLowerCase())
      .input('telefono', sql.VarChar(30), phone)
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');
    
    const response = result.recordset[0];
    
    if (response.allow === 0) {
      return res.status(400).json({
        success: false,
        error: response.msg
      });
    }
    
    // Usar usuario_id del request (del localStorage del frontend)
    res.status(201).json({
      success: true,
      data: {
        id: usuario_id?.toString() || Math.random().toString(),
        name: name,
        email: email.toLowerCase(),
        phone: phone
      },
      message: response.msg || 'Cliente creado exitosamente'
    });
    
    console.log(`✅ Cliente creado: ${name} (ID: ${response.id_usuario})`);
  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * ✏️ PUT /api/clients/:id - Actualizar cliente
 * Usa SP_EDITAR_USUARIO
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    console.log(`✏️ PUT /api/clients/${id} - Actualizando cliente`);
    
    // Validaciones básicas
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y teléfono son requeridos'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, parseInt(id))
      .input('nombre_completo', sql.VarChar(100), name)
      .input('correo', sql.VarChar(100), email.toLowerCase())
      .input('telefono', sql.VarChar(30), phone)
      .execute('SP_EDITAR_USUARIO');
    
    const response = result.recordset[0];
    
    if (response.response !== '200 OK') {
      return res.status(400).json({
        success: false,
        error: response.msg
      });
    }
    
    res.json({
      success: true,
      data: {
        id: id,
        name: name,
        email: email.toLowerCase(),
        phone: phone
      },
      message: response.msg || 'Cliente actualizado exitosamente'
    });
    
    console.log(`✅ Cliente actualizado: ${name} (ID: ${id})`);
  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * 🗑️ DELETE /api/clients/:id - Eliminar cliente
 * Nota: Implementación básica, se puede mejorar con SP específico
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/clients/${id} - Eliminando cliente`);
    
    // Por ahora, responder que la eliminación no está implementada con SP
    // Se puede implementar con un SP_ELIMINAR_USUARIO más adelante
    res.status(501).json({
      success: false,
      error: 'Eliminación de clientes no implementada por seguridad',
      message: 'Contacte al administrador para eliminar clientes'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;