const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CSV_FILE_PATH = path.join(__dirname, '../data/services/services.csv');

// Función para leer el CSV
function readServicesCSV() {
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      // Crear el archivo con headers si no existe
      const headers = 'id,nombre,descripcion,precio,duracion,categoria\n';
      fs.writeFileSync(CSV_FILE_PATH, headers);
      return [];
    }
    
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length <= 1) return []; // Solo headers o archivo vacío
    
    const headers = lines[0].split(',');
    const services = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const service = {};
        headers.forEach((header, index) => {
          service[header] = values[index];
        });
        services.push(service);
      }
    }
    
    return services;
  } catch (error) {
    console.error('Error reading services CSV:', error);
    return [];
  }
}

// Función para escribir al CSV
function writeServicesCSV(services) {
  try {
    const headers = 'id,nombre,descripcion,precio,duracion,categoria\n';
    const csvContent = headers + services.map(service => 
      `${service.id},${service.nombre},${service.descripcion},${service.precio},${service.duracion},${service.categoria}`
    ).join('\n');
    
    fs.writeFileSync(CSV_FILE_PATH, csvContent);
    return true;
  } catch (error) {
    console.error('Error writing services CSV:', error);
    return false;
  }
}

// Función para generar ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// GET - Obtener todos los servicios
router.get('/', (req, res) => {
  try {
    const services = readServicesCSV();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener servicios', error: error.message });
  }
});

// POST - Crear nuevo servicio
router.post('/', (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion, categoria } = req.body;
    
    // Validaciones básicas
    if (!nombre || !precio) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y precio son campos requeridos' 
      });
    }
    
    const services = readServicesCSV();
    
    const newService = {
      id: generateId(),
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : '',
      precio: parseFloat(precio),
      duracion: duracion ? duracion.trim() : '',
      categoria: categoria ? categoria.trim() : ''
    };
    
    services.push(newService);
    
    if (writeServicesCSV(services)) {
      res.json({ 
        success: true, 
        message: 'Servicio creado exitosamente',
        data: newService 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error al guardar el servicio' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear servicio', 
      error: error.message 
    });
  }
});

// PUT - Actualizar servicio
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, duracion, categoria } = req.body;
    
    const services = readServicesCSV();
    const serviceIndex = services.findIndex(service => service.id === id);
    
    if (serviceIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Servicio no encontrado' 
      });
    }
    
    // Actualizar solo los campos proporcionados
    if (nombre !== undefined) services[serviceIndex].nombre = nombre.trim();
    if (descripcion !== undefined) services[serviceIndex].descripcion = descripcion.trim();
    if (precio !== undefined) services[serviceIndex].precio = parseFloat(precio);
    if (duracion !== undefined) services[serviceIndex].duracion = duracion.trim();
    if (categoria !== undefined) services[serviceIndex].categoria = categoria.trim();
    
    if (writeServicesCSV(services)) {
      res.json({ 
        success: true, 
        message: 'Servicio actualizado exitosamente',
        data: services[serviceIndex] 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el servicio' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar servicio', 
      error: error.message 
    });
  }
});

// DELETE - Eliminar servicio
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const services = readServicesCSV();
    const serviceIndex = services.findIndex(service => service.id === id);
    
    if (serviceIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Servicio no encontrado' 
      });
    }
    
    const deletedService = services.splice(serviceIndex, 1)[0];
    
    if (writeServicesCSV(services)) {
      res.json({ 
        success: true, 
        message: 'Servicio eliminado exitosamente',
        data: deletedService 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el servicio' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar servicio', 
      error: error.message 
    });
  }
});

module.exports = router;