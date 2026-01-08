const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Ruta al archivo JSON de estados (en el frontend)
const STATES_FILE = path.join(__dirname, '../../src/data/workOrders.json');

/**
 * GET /api/workorder-states
 * Obtener todos los estados de OT desde el JSON
 */
router.get('/', async (req, res) => {
  try {
    console.log('📂 Leyendo estados desde:', STATES_FILE);
    const data = await fs.readFile(STATES_FILE, 'utf8');
    const statesData = JSON.parse(data);
    
    res.json({
      success: true,
      data: statesData.workOrderStates || {}
    });
  } catch (error) {
    console.error('❌ Error leyendo estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer estados de OT',
      error: error.message
    });
  }
});

/**
 * PUT /api/workorder-states/:otId
 * Actualizar el estado de una OT específica en el JSON
 */
router.put('/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El campo "estado" es requerido'
      });
    }
    
    console.log(`💾 Actualizando estado de OT ${otId} a: ${estado}`);
    
    // Leer el archivo actual
    const data = await fs.readFile(STATES_FILE, 'utf8');
    const statesData = JSON.parse(data);
    
    // Actualizar el estado
    if (!statesData.workOrderStates) {
      statesData.workOrderStates = {};
    }
    statesData.workOrderStates[otId] = estado;
    
    // Guardar de vuelta al archivo
    await fs.writeFile(STATES_FILE, JSON.stringify(statesData, null, 2), 'utf8');
    
    console.log(`✅ Estado de OT ${otId} actualizado a: ${estado}`);
    
    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      data: {
        otId,
        estado
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de OT',
      error: error.message
    });
  }
});

/**
 * GET /api/workorder-states/:otId
 * Obtener el estado de una OT específica
 */
router.get('/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    
    const data = await fs.readFile(STATES_FILE, 'utf8');
    const statesData = JSON.parse(data);
    
    const estado = statesData.workOrderStates?.[otId] || null;
    
    res.json({
      success: true,
      data: {
        otId,
        estado
      }
    });
  } catch (error) {
    console.error('❌ Error leyendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer estado de OT',
      error: error.message
    });
  }
});

module.exports = router;
