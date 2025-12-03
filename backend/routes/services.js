const express = require('express');
const { sql, getConnection } = require('../config/database');
const router = express.Router();

// GET - Obtener todos los servicios
router.get('/', (req, res) => {
  try {
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_OBTENER_SERVICIOS'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener servicios', error: error.message });
  }
});

// POST - Crear nuevo servicio
router.post('/', (req, res) => {
  try {
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_CREAR_SERVICIO'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear servicio', error: error.message });
  }
});

// GET - Obtener servicio por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_OBTENER_SERVICIO_POR_ID',
      serviceId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener servicio', error: error.message });
  }
});

// PUT - Actualizar servicio
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_ACTUALIZAR_SERVICIO',
      serviceId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar servicio', error: error.message });
  }
});

// DELETE - Eliminar servicio
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    res.status(501).json({ 
      success: false, 
      message: 'Este endpoint necesita ser implementado con SP (Stored Procedure)',
      note: 'Por favor, crear SP_ELIMINAR_SERVICIO',
      serviceId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar servicio', error: error.message });
  }
});

module.exports = router;
