const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CSV_FILE_PATH = path.join(__dirname, '../data/appointments/appointments.csv');

// Función para leer el CSV de citas
function readAppointmentsCSV() {
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      // Crear el archivo con headers si no existe
      const headers = 'id,clienteId,vehiculoId,fecha,hora,servicio,estado,notas\n';
      fs.writeFileSync(CSV_FILE_PATH, headers);
      return [];
    }
    
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length <= 1) return []; // Solo headers o archivo vacío
    
    const headers = lines[0].split(',');
    const appointments = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const appointment = {};
        headers.forEach((header, index) => {
          appointment[header] = values[index];
        });
        appointments.push(appointment);
      }
    }
    
    return appointments;
  } catch (error) {
    console.error('Error reading appointments CSV:', error);
    return [];
  }
}

// Función para escribir al CSV de citas
function writeAppointmentsCSV(appointments) {
  try {
    const headers = 'id,clienteId,vehiculoId,fecha,hora,servicio,estado,notas\n';
    const csvContent = headers + appointments.map(appointment => 
      `${appointment.id},${appointment.clienteId},${appointment.vehiculoId},${appointment.fecha},${appointment.hora},${appointment.servicio},${appointment.estado},"${appointment.notas || ''}"`
    ).join('\n');
    
    fs.writeFileSync(CSV_FILE_PATH, csvContent);
    return true;
  } catch (error) {
    console.error('Error writing appointments CSV:', error);
    return false;
  }
}

// Función para generar ID único
function generateId() {
  return 'APPT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// GET /api/appointments - Obtener todas las citas
router.get('/', (req, res) => {
  try {
    const appointments = readAppointmentsCSV();
    res.json({
      success: true,
      data: appointments,
      message: `${appointments.length} citas encontradas`
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
});

// POST /api/appointments - Crear nueva cita
router.post('/', (req, res) => {
  try {
    const { clienteId, vehiculoId, fecha, hora, servicio, estado, notas } = req.body;
    
    // Validaciones básicas
    if (!clienteId || !vehiculoId || !fecha || !hora || !servicio) {
      return res.status(400).json({
        success: false,
        message: 'Los campos clienteId, vehiculoId, fecha, hora y servicio son requeridos'
      });
    }
    
    const newAppointment = {
      id: generateId(),
      clienteId,
      vehiculoId,
      fecha,
      hora,
      servicio,
      estado: estado || 'pending',
      notas: notas || ''
    };
    
    // Escribir directamente al CSV sin leer primero
    try {
      const csvLine = `\n${newAppointment.id},${newAppointment.clienteId},${newAppointment.vehiculoId},${newAppointment.fecha},${newAppointment.hora},${newAppointment.servicio},${newAppointment.estado},"${newAppointment.notas}"`;
      fs.appendFileSync(CSV_FILE_PATH, csvLine);
      
      res.status(201).json({
        success: true,
        data: newAppointment,
        message: 'Cita creada exitosamente'
      });
    } catch (writeError) {
      console.error('Error writing to CSV:', writeError);
      res.status(500).json({
        success: false,
        message: 'Error al guardar la cita'
      });
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cita',
      error: error.message
    });
  }
});

// GET /api/appointments/:id - Obtener cita por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appointments = readAppointmentsCSV();
    const appointment = appointments.find(a => a.id === id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: appointment,
      message: 'Cita encontrada'
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cita',
      error: error.message
    });
  }
});

// PUT /api/appointments/:id - Actualizar cita
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { clienteId, vehiculoId, fecha, hora, servicio, estado, notas } = req.body;
    
    const appointments = readAppointmentsCSV();
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    
    // Actualizar solo los campos proporcionados
    const updatedAppointment = {
      ...appointments[appointmentIndex],
      ...(clienteId && { clienteId }),
      ...(vehiculoId && { vehiculoId }),
      ...(fecha && { fecha }),
      ...(hora && { hora }),
      ...(servicio && { servicio }),
      ...(estado && { estado }),
      ...(notas !== undefined && { notas })
    };
    
    appointments[appointmentIndex] = updatedAppointment;
    
    if (writeAppointmentsCSV(appointments)) {
      res.json({
        success: true,
        data: updatedAppointment,
        message: 'Cita actualizada exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la cita'
      });
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cita',
      error: error.message
    });
  }
});

// DELETE /api/appointments/:id - Eliminar cita
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appointments = readAppointmentsCSV();
    const initialLength = appointments.length;
    
    const filteredAppointments = appointments.filter(a => a.id !== id);
    
    if (filteredAppointments.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    
    if (writeAppointmentsCSV(filteredAppointments)) {
      res.json({
        success: true,
        message: 'Cita eliminada exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la cita'
      });
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cita',
      error: error.message
    });
  }
});

module.exports = router;