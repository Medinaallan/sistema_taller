const express = require('express');
const csvService = require('../services/csvService');
const router = express.Router();

/**
 * 👥 API ENDPOINTS PARA CLIENTES - CRUD COMPLETO
 * 
 * Endpoints que trabajan directamente con CSV:
 * GET    /api/clients        - Obtener todos los clientes
 * GET    /api/clients/:id    - Obtener un cliente específico
 * POST   /api/clients        - Crear nuevo cliente
 * PUT    /api/clients/:id    - Actualizar cliente
 * DELETE /api/clients/:id    - Eliminar cliente
 * GET    /api/clients/search - Buscar clientes con filtros
 */

// Headers del CSV de clientes
const CLIENT_HEADERS = [
  'id', 'name', 'email', 'phone', 'address', 'password_hash', 
  'status', 'registration_date', 'last_visit', 'total_visits', 
  'total_spent', 'notes', 'created_at', 'updated_at'
];

// Archivo CSV de clientes
const CSV_FILE = 'clients.csv';
const MODULE = 'clients';

/**
 * 📋 GET /api/clients - Obtener todos los clientes
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/clients - Obteniendo todos los clientes');
    
    const clients = await csvService.readCSV(MODULE, CSV_FILE);
    
    // Transformar datos para el frontend (ocultar password_hash)
    const clientsForFrontend = clients.map(client => ({
      ...client,
      password_hash: undefined // No enviar password al frontend
    }));
    
    res.json({
      success: true,
      data: clientsForFrontend,
      total: clientsForFrontend.length
    });
    
    console.log(`✅ Enviados ${clientsForFrontend.length} clientes`);
  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 🔍 GET /api/clients/search - Buscar clientes con filtros
 */
router.get('/search', async (req, res) => {
  try {
    const filters = req.query;
    console.log('🔍 GET /api/clients/search - Buscando clientes con filtros:', filters);
    
    const clients = await csvService.searchRecords(MODULE, CSV_FILE, filters);
    
    // Ocultar passwords
    const clientsForFrontend = clients.map(client => ({
      ...client,
      password_hash: undefined
    }));
    
    res.json({
      success: true,
      data: clientsForFrontend,
      total: clientsForFrontend.length,
      filters: filters
    });
    
    console.log(`✅ Encontrados ${clientsForFrontend.length} clientes`);
  } catch (error) {
    console.error('❌ Error buscando clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 📊 GET /api/clients/stats - Estadísticas de clientes
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/clients/stats - Obteniendo estadísticas');
    
    const stats = await csvService.getStats(MODULE, CSV_FILE);
    const clients = await csvService.readCSV(MODULE, CSV_FILE);
    
    const extendedStats = {
      ...stats,
      activeClients: clients.filter(c => c.status === 'active').length,
      inactiveClients: clients.filter(c => c.status === 'inactive').length,
      totalSpent: clients.reduce((sum, c) => sum + (parseFloat(c.total_spent) || 0), 0),
      averageVisits: clients.length > 0 ? clients.reduce((sum, c) => sum + (parseInt(c.total_visits) || 0), 0) / clients.length : 0
    };
    
    res.json({
      success: true,
      data: extendedStats
    });
    
    console.log('✅ Estadísticas enviadas');
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 🔍 GET /api/clients/:id - Obtener un cliente específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /api/clients/${id} - Obteniendo cliente específico`);
    
    const clients = await csvService.readCSV(MODULE, CSV_FILE);
    const client = clients.find(c => c.id === id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Ocultar password
    const clientForFrontend = { ...client, password_hash: undefined };
    
    res.json({
      success: true,
      data: clientForFrontend
    });
    
    console.log(`✅ Cliente encontrado: ${client.name}`);
  } catch (error) {
    console.error('❌ Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * ➕ POST /api/clients - Crear nuevo cliente
 */
router.post('/', async (req, res) => {
  try {
    const clientData = req.body;
    console.log('➕ POST /api/clients - Creando nuevo cliente:', clientData.name);
    
    // Validaciones básicas
    if (!clientData.name || !clientData.email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y email son requeridos'
      });
    }
    
    // Verificar email único
    const existingClients = await csvService.readCSV(MODULE, CSV_FILE);
    const emailExists = existingClients.some(c => c.email.toLowerCase() === clientData.email.toLowerCase());
    
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un cliente con este email'
      });
    }
    
    // Preparar datos del cliente
    const newClient = {
      name: clientData.name,
      email: clientData.email.toLowerCase(),
      phone: clientData.phone || '',
      address: clientData.address || '',
      password_hash: clientData.password || 'default123', // En producción usar hash real
      status: 'active',
      registration_date: new Date().toISOString(),
      last_visit: '',
      total_visits: 0,
      total_spent: 0,
      notes: clientData.notes || ''
    };
    
    // Crear cliente en CSV
    const createdClient = await csvService.createRecord(MODULE, CSV_FILE, newClient, CLIENT_HEADERS);
    
    // Respuesta (sin password)
    const clientForFrontend = { ...createdClient, password_hash: undefined };
    
    res.status(201).json({
      success: true,
      data: clientForFrontend,
      message: 'Cliente creado exitosamente'
    });
    
    console.log(`✅ Cliente creado: ${createdClient.name} (${createdClient.id})`);
  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 📝 PUT /api/clients/:id - Actualizar cliente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`📝 PUT /api/clients/${id} - Actualizando cliente`);
    
    // Validaciones
    if (updates.email) {
      const existingClients = await csvService.readCSV(MODULE, CSV_FILE);
      const emailExists = existingClients.some(c => c.email.toLowerCase() === updates.email.toLowerCase() && c.id !== id);
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe otro cliente con este email'
        });
      }
      updates.email = updates.email.toLowerCase();
    }
    
    // No permitir actualizar campos de sistema
    delete updates.id;
    delete updates.created_at;
    delete updates.registration_date;
    
    // Actualizar cliente
    const updatedClient = await csvService.updateRecord(MODULE, CSV_FILE, id, updates, CLIENT_HEADERS);
    
    // Respuesta (sin password)
    const clientForFrontend = { ...updatedClient, password_hash: undefined };
    
    res.json({
      success: true,
      data: clientForFrontend,
      message: 'Cliente actualizado exitosamente'
    });
    
    console.log(`✅ Cliente actualizado: ${updatedClient.name}`);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    console.error('❌ Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 🗑️ DELETE /api/clients/:id - Eliminar cliente
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/clients/${id} - Eliminando cliente`);
    
    await csvService.deleteRecord(MODULE, CSV_FILE, id, CLIENT_HEADERS);
    
    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
    
    console.log(`✅ Cliente eliminado: ${id}`);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;