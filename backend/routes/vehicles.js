const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CSV_FILE_PATH = path.join(__dirname, '../data/vehicles/vehicles.csv');

// Función para leer el CSV de vehículos
function readVehiclesCSV() {
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      // Crear el archivo con headers si no existe
      const headers = 'id,clienteId,marca,modelo,año,placa,color\n';
      fs.writeFileSync(CSV_FILE_PATH, headers);
      return [];
    }
    
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length <= 1) return []; // Solo headers o archivo vacío
    
    const headers = lines[0].split(',');
    const vehicles = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const vehicle = {};
        headers.forEach((header, index) => {
          vehicle[header] = values[index];
        });
        vehicles.push(vehicle);
      }
    }
    
    return vehicles;
  } catch (error) {
    console.error('Error reading vehicles CSV:', error);
    return [];
  }
}

// Función para escribir al CSV de vehículos
function writeVehiclesCSV(vehicles) {
  try {
    const headers = 'id,clienteId,marca,modelo,año,placa,color\n';
    const csvContent = headers + vehicles.map(vehicle => 
      `${vehicle.id},${vehicle.clienteId},${vehicle.marca},${vehicle.modelo},${vehicle.año},${vehicle.placa},${vehicle.color}`
    ).join('\n');
    
    fs.writeFileSync(CSV_FILE_PATH, csvContent);
    return true;
  } catch (error) {
    console.error('Error writing vehicles CSV:', error);
    return false;
  }
}

// Función para generar ID único
function generateId() {
  return 'VEH-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// GET /api/vehicles - Obtener todos los vehículos
router.get('/', (req, res) => {
  try {
    const vehicles = readVehiclesCSV();
    res.json({
      success: true,
      data: vehicles,
      message: `${vehicles.length} vehículos encontrados`
    });
  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vehículos',
      error: error.message
    });
  }
});

// POST /api/vehicles - Crear nuevo vehículo
router.post('/', (req, res) => {
  try {
    const { clienteId, marca, modelo, año, placa, color } = req.body;
    
    // Validaciones básicas
    if (!clienteId || !marca || !modelo || !año || !placa || !color) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }
    
    const newVehicle = {
      id: generateId(),
      clienteId,
      marca,
      modelo,
      año: parseInt(año),
      placa,
      color
    };
    
    // Escribir directamente al CSV sin leer primero
    try {
      const csvLine = `\n${newVehicle.id},${newVehicle.clienteId},${newVehicle.marca},${newVehicle.modelo},${newVehicle.año},${newVehicle.placa},${newVehicle.color}`;
      fs.appendFileSync(CSV_FILE_PATH, csvLine);
      
      res.status(201).json({
        success: true,
        data: newVehicle,
        message: 'Vehículo creado exitosamente'
      });
    } catch (writeError) {
      console.error('Error writing to CSV:', writeError);
      res.status(500).json({
        success: false,
        message: 'Error al guardar el vehículo'
      });
    }
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear vehículo',
      error: error.message
    });
  }
});

// PUT /api/vehicles/:id - Actualizar vehículo
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { clienteId, marca, modelo, año, placa, color } = req.body;
    
    const vehicles = readVehiclesCSV();
    const vehicleIndex = vehicles.findIndex(v => v.id === id);
    
    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }
    
    // Verificar que la placa no exista en otro vehículo
    const existingVehicle = vehicles.find(v => v.placa.toLowerCase() === placa.toLowerCase() && v.id !== id);
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otro vehículo con esta placa'
      });
    }
    
    vehicles[vehicleIndex] = {
      ...vehicles[vehicleIndex],
      clienteId,
      marca,
      modelo,
      año: parseInt(año),
      placa,
      color
    };
    
    if (writeVehiclesCSV(vehicles)) {
      res.json({
        success: true,
        data: vehicles[vehicleIndex],
        message: 'Vehículo actualizado exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el vehículo'
      });
    }
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar vehículo',
      error: error.message
    });
  }
});

// DELETE /api/vehicles/:id - Eliminar vehículo
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicles = readVehiclesCSV();
    const vehicleIndex = vehicles.findIndex(v => v.id === id);
    
    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }
    
    const deletedVehicle = vehicles.splice(vehicleIndex, 1)[0];
    
    if (writeVehiclesCSV(vehicles)) {
      res.json({
        success: true,
        data: deletedVehicle,
        message: 'Vehículo eliminado exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el vehículo'
      });
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar vehículo',
      error: error.message
    });
  }
});

module.exports = router;