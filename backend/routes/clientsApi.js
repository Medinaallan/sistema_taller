const express = require('express');
const { getConnection, sql } = require('../config/database');
const router = express.Router();
const usersRouter = require('./users');

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
 * . GET /api/clients/registered - Obtener todos los clientes registrados
 * 
 * SP: SP_OBTENER_USUARIOS (obtiene TODOS los usuarios)
 * Params: @usuario_id INT 
 * Return: usuario_id, nombre_completo, correo, telefono, rol
 */
router.get('/registered', async (req, res) => {
  try {
    console.log('. GET /api/clients/registered - Obteniendo todos los clientes desde BD');
    
    const pool = await getConnection();
    
    // SP_OBTENER_USUARIOS obtiene todos los usuarios
    const result = await pool.request()
      .input('usuario_id', sql.Int, null)
      .execute('SP_OBTENER_USUARIOS');
    
    console.log(`📊 SP_OBTENER_USUARIOS devolvió ${result.recordset.length} usuarios`);
    
    // Transformar datos al formato esperado por el frontend
    const clients = result.recordset.map(user => ({
      id: user.usuario_id?.toString(),
      name: user.nombre_completo,
      email: user.correo,
      phone: user.telefono || '',
      role: user.rol,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    res.json({
      success: true,
      data: clients,
      total: clients.length
    });
    
    console.log(`✅ Enviados ${clients.length} clientes al frontend`);
    
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
 * 
 * SP: SP_OBTENER_USUARIOS
 * Params: @usuario_id INT
 * Return: usuario_id, nombre_completo, correo, telefono, rol
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = parseInt(id);
    
    if (isNaN(usuarioId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente inválido'
      });
    }
    
    console.log(`👤 GET /api/clients/${usuarioId} - Obteniendo cliente específico`);
    
    const pool = await getConnection();
    
    // Usar SP con solo @usuario_id
    const result = await pool.request()
      .input('usuario_id', sql.Int, usuarioId)
      .execute('SP_OBTENER_USUARIOS');
    
    if (result.recordset.length === 0) {
      console.log(`⚠️ Cliente no encontrado: ID ${usuarioId}`);
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const user = result.recordset[0];
    const client = {
      id: user.usuario_id.toString(),
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
    
    console.log(`✅ Cliente encontrado: ${client.name} (${client.email})`);
    
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
 * Usa SP_REGISTRAR_USUARIO_CLIENTE y luego busca el cliente creado
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    console.log('➕ POST /api/clients - Creando nuevo cliente:', name);
    
    // Validaciones básicas
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y teléfono son requeridos'
      });
    }
    
    const pool = await getConnection();
    
    // PASO 1: Registrar el cliente usando SP_REGISTRAR_USUARIO_CLIENTE
    // Retorna: '200 OK' as response, 'Usuario registrado con éxito' as msg, codigo_seguridad
    const createResult = await pool.request()
      .input('nombre_completo', sql.VarChar(100), name)
      .input('correo', sql.VarChar(100), email.toLowerCase())
      .input('telefono', sql.VarChar(30), phone)
      .execute('SP_REGISTRAR_USUARIO_CLIENTE');
    
    const createResponse = createResult.recordset[0];
    console.log('📝 Respuesta del SP:', createResponse);
    
    // Verificar si hubo error (el SP devuelve response diferente a '200 OK' si falla)
    if (createResponse.response !== '200 OK') {
      return res.status(400).json({
        success: false,
        error: createResponse.msg || 'Error al crear cliente'
      });
    }
    
    // PASO 2: Buscar el cliente recién creado por correo para obtener su ID
    // Como el SP no devuelve el ID, necesitamos buscarlo
    const findResult = await pool.request()
      .input('obtener_todos', sql.Bit, 1)
      .input('usuario_id', sql.Int, null)
      .execute('SP_OBTENER_USUARIOS');
    
    // Buscar el cliente por correo en los resultados
    const clienteCreado = findResult.recordset.find(
      user => user.correo.toLowerCase() === email.toLowerCase()
    );
    
    if (!clienteCreado) {
      // Esto no debería pasar, pero por seguridad...
      console.error('⚠️ Cliente creado pero no encontrado en la búsqueda');
      return res.status(201).json({
        success: true,
        message: createResponse.msg,
        data: {
          name: name,
          email: email.toLowerCase(),
          phone: phone,
          codigo_seguridad: createResponse.codigo_seguridad
        }
      });
    }
    
    // PASO 3: Devolver los datos completos del cliente con su ID real
    const clientData = {
      id: clienteCreado.usuario_id.toString(),
      name: clienteCreado.nombre_completo,
      email: clienteCreado.correo,
      phone: clienteCreado.telefono,
      role: clienteCreado.rol,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      data: clientData,
      message: createResponse.msg || 'Cliente creado exitosamente',
      codigo_seguridad: createResponse.codigo_seguridad
    });
    
    // Invalidar cache de usuarios para que aparezca inmediatamente en listas
    if (usersRouter.invalidarCacheUsuarios) {
      usersRouter.invalidarCacheUsuarios();
    }
    
    console.log(`✅ Cliente creado exitosamente: ${clientData.name} (ID: ${clientData.id})`);
    
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
    
    // Invalidar cache de usuarios para reflejar cambios inmediatamente
    if (usersRouter.invalidarCacheUsuarios) {
      usersRouter.invalidarCacheUsuarios();
    }
    
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