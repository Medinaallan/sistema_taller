const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CSV_FILE_PATH = path.join(__dirname, '../data/financial/quotations.csv');
const CSV_HEADERS = ['id', 'appointmentId', 'clienteId', 'vehiculoId', 'servicioId', 'descripcion', 'precio', 'notas', 'estado', 'fechaCreacion', 'fechaActualizacion'];

// Función para generar ID único
function generateId() {
  return 'QUOT-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Función para asegurar que el directorio y archivo CSV existen
function ensureCSVFile() {
  const dir = path.dirname(CSV_FILE_PATH);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    const headers = CSV_HEADERS.join(',') + '\n';
    fs.writeFileSync(CSV_FILE_PATH, headers, 'utf8');
  }
}

// Función para leer cotizaciones del CSV
function readQuotationsCSV() {
  try {
    ensureCSVFile();
    
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length <= 1) {
      return [];
    }
    
    const quotations = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',').map(value => value.trim());
        
        if (values.length >= CSV_HEADERS.length) {
          quotations.push({
            id: values[0],
            appointmentId: values[1],
            clienteId: values[2],
            vehiculoId: values[3],
            servicioId: values[4],
            descripcion: values[5],
            precio: parseFloat(values[6]) || 0,
            notas: values[7] || '',
            estado: values[8],
            fechaCreacion: values[9],
            fechaActualizacion: values[10] || values[9]
          });
        }
      }
    }
    
    return quotations;
  } catch (error) {
    console.error('Error reading quotations CSV:', error);
    return [];
  }
}

// Función para escribir cotizaciones al CSV
function writeQuotationsCSV(quotations) {
  try {
    ensureCSVFile();
    
    let csvContent = CSV_HEADERS.join(',') + '\n';
    
    quotations.forEach(quotation => {
      const values = [
        quotation.id,
        quotation.appointmentId,
        quotation.clienteId,
        quotation.vehiculoId,
        quotation.servicioId,
        quotation.descripcion,
        quotation.precio,
        quotation.notas || '',
        quotation.estado,
        quotation.fechaCreacion,
        quotation.fechaActualizacion
      ];
      csvContent += values.join(',') + '\n';
    });
    
    fs.writeFileSync(CSV_FILE_PATH, csvContent, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing quotations CSV:', error);
    return false;
  }
}

// GET /quotations - Obtener todas las cotizaciones
router.get('/', (req, res) => {
  try {
    const quotations = readQuotationsCSV();
    res.json({
      success: true,
      data: quotations
    });
  } catch (error) {
    console.error('Error getting quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las cotizaciones'
    });
  }
});

// GET /quotations/:id - Obtener una cotización específica
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quotations = readQuotationsCSV();
    const quotation = quotations.find(q => q.id === id);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error getting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la cotización'
    });
  }
});

// POST /quotations - Crear nueva cotización
router.post('/', (req, res) => {
  try {
    const { appointmentId, clienteId, vehiculoId, servicioId, descripcion, precio, notas, estado } = req.body;
    
    // Validación básica
    if (!appointmentId || !clienteId || !vehiculoId || !servicioId || !descripcion || precio === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }
    
    const quotations = readQuotationsCSV();
    const newQuotation = {
      id: generateId(),
      appointmentId,
      clienteId,
      vehiculoId,
      servicioId,
      descripcion,
      precio: parseFloat(precio),
      notas: notas || '',
      estado: estado || 'draft',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaActualizacion: new Date().toISOString().split('T')[0]
    };
    
    quotations.push(newQuotation);
    
    if (writeQuotationsCSV(quotations)) {
      res.status(201).json({
        success: true,
        data: newQuotation,
        message: 'Cotización creada exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al guardar la cotización'
      });
    }
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la cotización'
    });
  }
});

// PUT /quotations/:id - Actualizar cotización
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const quotations = readQuotationsCSV();
    const quotationIndex = quotations.findIndex(q => q.id === id);
    
    if (quotationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    
    // Actualizar campos
    const updatedQuotation = {
      ...quotations[quotationIndex],
      ...updateData,
      fechaActualizacion: new Date().toISOString().split('T')[0]
    };
    
    quotations[quotationIndex] = updatedQuotation;
    
    if (writeQuotationsCSV(quotations)) {
      res.json({
        success: true,
        data: updatedQuotation,
        message: 'Cotización actualizada exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la cotización'
      });
    }
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la cotización'
    });
  }
});

// DELETE /quotations/:id - Eliminar cotización
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const quotations = readQuotationsCSV();
    const quotationIndex = quotations.findIndex(q => q.id === id);
    
    if (quotationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    
    const deletedQuotation = quotations.splice(quotationIndex, 1)[0];
    
    if (writeQuotationsCSV(quotations)) {
      res.json({
        success: true,
        data: deletedQuotation,
        message: 'Cotización eliminada exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la cotización'
      });
    }
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la cotización'
    });
  }
});

module.exports = router;