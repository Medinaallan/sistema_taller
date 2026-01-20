const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Ruta al archivo JSON de autorizaciones
const AUTHORIZATIONS_FILE = path.join(__dirname, '../../src/data/workOrderAuthorizations.json');

/**
 * GET /api/workorder-authorizations
 * Obtener todas las autorizaciones
 */
router.get('/', async (req, res) => {
  try {
    console.log('📂 Leyendo autorizaciones desde:', AUTHORIZATIONS_FILE);
    const data = await fs.readFile(AUTHORIZATIONS_FILE, 'utf8');
    const authData = JSON.parse(data);
    
    res.json({
      success: true,
      data: authData.authorizations || {}
    });
  } catch (error) {
    console.error('❌ Error leyendo autorizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer autorizaciones',
      error: error.message
    });
  }
});

/**
 * GET /api/workorder-authorizations/client/:clienteId
 * Obtener autorizaciones pendientes de un cliente específico
 */
router.get('/client/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    console.log(`🔍 Buscando autorizaciones del cliente ${clienteId}`);
    
    const data = await fs.readFile(AUTHORIZATIONS_FILE, 'utf8');
    const authData = JSON.parse(data);
    
    // Filtrar autorizaciones del cliente que estén pendientes
    const clientAuths = Object.values(authData.authorizations || {})
      .filter(auth => auth.clienteId === clienteId && auth.estado === 'pending');
    
    console.log(`✅ Encontradas ${clientAuths.length} autorizaciones pendientes`);
    
    res.json({
      success: true,
      data: clientAuths
    });
  } catch (error) {
    console.error('❌ Error leyendo autorizaciones del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer autorizaciones del cliente',
      error: error.message
    });
  }
});

/**
 * GET /api/workorder-authorizations/ot/:otId
 * Obtener autorización de una OT específica
 */
router.get('/ot/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    console.log(`🔍 Buscando autorización de OT ${otId}`);
    
    const data = await fs.readFile(AUTHORIZATIONS_FILE, 'utf8');
    const authData = JSON.parse(data);
    
    const authorization = authData.authorizations?.[otId] || null;
    
    res.json({
      success: true,
      data: authorization
    });
  } catch (error) {
    console.error('❌ Error leyendo autorización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer autorización',
      error: error.message
    });
  }
});

/**
 * POST /api/workorder-authorizations
 * Crear/Enviar nueva autorización al cliente
 */
router.post('/', async (req, res) => {
  try {
    const {
      otId,
      otNumero,
      clienteId,
      clienteNombre,
      vehiculoInfo,
      motivo,
      detalles,
      costoEstimado,
      enviadoPor,
      enviadoPorNombre
    } = req.body;
    
    // Validar campos requeridos
    if (!otId || !clienteId || !motivo || !detalles) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: otId, clienteId, motivo, detalles'
      });
    }
    
    console.log(`📤 Creando autorización para OT ${otId}`);
    
    // Leer el archivo actual
    const data = await fs.readFile(AUTHORIZATIONS_FILE, 'utf8');
    const authData = JSON.parse(data);
    
    // Verificar si ya existe una autorización pendiente para esta OT
    if (authData.authorizations?.[otId]?.estado === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una autorización pendiente para esta OT'
      });
    }
    
    // Crear nueva autorización
    const newAuth = {
      otId,
      otNumero,
      clienteId,
      clienteNombre,
      vehiculoInfo,
      motivo,
      detalles,
      costoEstimado,
      fechaEnvio: new Date().toISOString(),
      estado: 'pending',
      enviadoPor,
      enviadoPorNombre
    };
    
    // Guardar en el JSON
    if (!authData.authorizations) {
      authData.authorizations = {};
    }
    authData.authorizations[otId] = newAuth;
    
    await fs.writeFile(AUTHORIZATIONS_FILE, JSON.stringify(authData, null, 2), 'utf8');
    
    console.log(`✅ Autorización creada para OT ${otId}`);
    
    res.json({
      success: true,
      message: 'Autorización enviada al cliente',
      data: newAuth
    });
  } catch (error) {
    console.error('❌ Error creando autorización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear autorización',
      error: error.message
    });
  }
});

/**
 * PUT /api/workorder-authorizations/:otId/respond
 * Responder a una autorización (aprobar/rechazar)
 */
router.put('/:otId/respond', async (req, res) => {
  try {
    const { otId } = req.params;
    const { estado, comentariosCliente } = req.body;
    
    // Validar estado
    if (!estado || !['approved', 'rejected'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser "approved" o "rejected"'
      });
    }
    
    console.log(`📝 Respondiendo autorización de OT ${otId}: ${estado}`);
    
    // Leer el archivo actual
    const data = await fs.readFile(AUTHORIZATIONS_FILE, 'utf8');
    const authData = JSON.parse(data);
    
    // Verificar que existe la autorización
    if (!authData.authorizations?.[otId]) {
      return res.status(404).json({
        success: false,
        message: 'Autorización no encontrada'
      });
    }
    
    // Actualizar la autorización
    authData.authorizations[otId] = {
      ...authData.authorizations[otId],
      estado,
      comentariosCliente,
      fechaRespuesta: new Date().toISOString()
    };
    
    await fs.writeFile(AUTHORIZATIONS_FILE, JSON.stringify(authData, null, 2), 'utf8');
    
    console.log(`✅ Autorización actualizada: ${estado}`);
    
    res.json({
      success: true,
      message: `Autorización ${estado === 'approved' ? 'aprobada' : 'rechazada'}`,
      data: authData.authorizations[otId]
    });
  } catch (error) {
    console.error('❌ Error respondiendo autorización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al responder autorización',
      error: error.message
    });
  }
});

/**
 * DELETE /api/workorder-authorizations/:otId
 * Eliminar una autorización (solo si no está respondida)
 */
router.delete('/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    console.log(`🗑️ Eliminando autorización de OT ${otId}`);
    
    const data = await fs.readFile(AUTHORIZATIONS_FILE, 'utf8');
    const authData = JSON.parse(data);
    
    if (!authData.authorizations?.[otId]) {
      return res.status(404).json({
        success: false,
        message: 'Autorización no encontrada'
      });
    }
    
    // No permitir eliminar si ya fue respondida
    if (authData.authorizations[otId].estado !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una autorización ya respondida'
      });
    }
    
    delete authData.authorizations[otId];
    
    await fs.writeFile(AUTHORIZATIONS_FILE, JSON.stringify(authData, null, 2), 'utf8');
    
    console.log(`✅ Autorización eliminada`);
    
    res.json({
      success: true,
      message: 'Autorización eliminada'
    });
  } catch (error) {
    console.error('❌ Error eliminando autorización:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar autorización',
      error: error.message
    });
  }
});

module.exports = router;
