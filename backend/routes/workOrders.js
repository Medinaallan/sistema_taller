const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CSV_FILE_PATH = path.join(__dirname, '../data/workorders/workorders.csv');
const CSV_DIR = path.dirname(CSV_FILE_PATH);

// Asegurar que el directorio existe
if (!fs.existsSync(CSV_DIR)) {
  fs.mkdirSync(CSV_DIR, { recursive: true });
}

// Función para escapar valores CSV que contengan comas
function escapeCSVValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Función para parsear una línea CSV manejando valores entre comillas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Doble comilla escapada
        current += '"';
        i++; // Saltar la siguiente comilla
      } else {
        // Cambiar estado de comillas
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Separador de campo
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Agregar el último campo
  result.push(current);
  return result;
}

// Función para leer el CSV
function readWorkOrdersCSV() {
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      // Crear archivo con headers si no existe
      const headers = 'id,quotationId,appointmentId,clienteId,vehiculoId,servicioId,descripcion,problema,diagnostico,tipoServicio,fechaEstimadaCompletado,fechaInicioReal,costoManoObra,costoPartes,costoTotal,costoEstimado,notas,recomendaciones,estadoPago,estado,fechaCreacion,fechaActualizacion\n';
      fs.writeFileSync(CSV_FILE_PATH, headers, 'utf8');
      return [];
    }

    const data = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = data.trim().split('\n');
    
    if (lines.length <= 1) {
      return [];
    }

    const workOrders = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 22) {
        workOrders.push({
          id: values[0],
          quotationId: values[1],
          appointmentId: values[2],
          clienteId: values[3],
          vehiculoId: values[4],
          servicioId: values[5],
          descripcion: values[6],
          problema: values[7],
          diagnostico: values[8],
          tipoServicio: values[9],
          fechaEstimadaCompletado: values[10],
          fechaInicioReal: values[11],
          costoManoObra: parseFloat(values[12]) || 0,
          costoPartes: parseFloat(values[13]) || 0,
          costoTotal: parseFloat(values[14]) || 0,
          costoEstimado: parseFloat(values[15]) || 0,
          notas: values[16],
          recomendaciones: values[17],
          estadoPago: values[18],
          estado: values[19],
          fechaCreacion: values[20],
          fechaActualizacion: values[21]
        });
      }
    }
    
    return workOrders;
  } catch (error) {
    console.error('Error leyendo CSV de órdenes de trabajo:', error);
    return [];
  }
}

// Función para escribir al CSV
function writeWorkOrdersCSV(workOrders) {
  try {
    const headers = 'id,quotationId,appointmentId,clienteId,vehiculoId,servicioId,descripcion,problema,diagnostico,tipoServicio,fechaEstimadaCompletado,fechaInicioReal,costoManoObra,costoPartes,costoTotal,costoEstimado,notas,recomendaciones,estadoPago,estado,fechaCreacion,fechaActualizacion\n';
    
    const csvContent = headers + workOrders.map(order => [
      escapeCSVValue(order.id),
      escapeCSVValue(order.quotationId),
      escapeCSVValue(order.appointmentId),
      escapeCSVValue(order.clienteId),
      escapeCSVValue(order.vehiculoId),
      escapeCSVValue(order.servicioId),
      escapeCSVValue(order.descripcion),
      escapeCSVValue(order.problema),
      escapeCSVValue(order.diagnostico),
      escapeCSVValue(order.tipoServicio),
      escapeCSVValue(order.fechaEstimadaCompletado),
      escapeCSVValue(order.fechaInicioReal),
      escapeCSVValue(order.costoManoObra),
      escapeCSVValue(order.costoPartes),
      escapeCSVValue(order.costoTotal),
      escapeCSVValue(order.costoEstimado),
      escapeCSVValue(order.notas),
      escapeCSVValue(order.recomendaciones),
      escapeCSVValue(order.estadoPago),
      escapeCSVValue(order.estado),
      escapeCSVValue(order.fechaCreacion),
      escapeCSVValue(order.fechaActualizacion)
    ].join(',')).join('\n');

    fs.writeFileSync(CSV_FILE_PATH, csvContent, 'utf8');
    return true;
  } catch (error) {
    console.error('Error escribiendo CSV de órdenes de trabajo:', error);
    return false;
  }
}

// Función para generar ID único
function generateId() {
  return 'wo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// GET - Obtener todas las órdenes de trabajo
router.get('/', (req, res) => {
  try {
    const workOrders = readWorkOrdersCSV();
    res.json({ success: true, data: workOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener órdenes de trabajo', error: error.message });
  }
});

// GET - Obtener orden de trabajo por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const workOrders = readWorkOrdersCSV();
    const workOrder = workOrders.find(wo => wo.id === id);
    
    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    }
    
    res.json({ success: true, data: workOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener orden de trabajo', error: error.message });
  }
});

// POST - Crear nueva orden de trabajo
router.post('/', (req, res) => {
  try {
    const { 
      quotationId, 
      appointmentId, 
      clienteId, 
      vehiculoId, 
      servicioId, 
      descripcion, 
      problema, 
      diagnostico,
      tipoServicio = 'corrective',
      fechaEstimadaCompletado,
      costoManoObra = 0,
      costoPartes = 0,
      costoTotal = 0,
      costoEstimado = 0,
      notas,
      recomendaciones,
      estadoPago = 'pending'
    } = req.body;
    
    // Validaciones básicas
    if (!clienteId || !vehiculoId || !servicioId || !descripcion) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos obligatorios: clienteId, vehiculoId, servicioId, descripcion' 
      });
    }

    const workOrders = readWorkOrdersCSV();
    const now = new Date().toISOString();
    
    const newWorkOrder = {
      id: generateId(),
      quotationId: quotationId || '',
      appointmentId: appointmentId || '',
      clienteId,
      vehiculoId,
      servicioId,
      descripcion,
      problema: problema || '',
      diagnostico: diagnostico || '',
      tipoServicio,
      fechaEstimadaCompletado: fechaEstimadaCompletado || '',
      fechaInicioReal: '',
      costoManoObra,
      costoPartes,
      costoTotal,
      costoEstimado,
      notas: notas || '',
      recomendaciones: recomendaciones || '',
      estadoPago,
      estado: 'pending', // pending, in-progress, completed, cancelled
      fechaCreacion: now,
      fechaActualizacion: now
    };

    workOrders.push(newWorkOrder);
    
    if (writeWorkOrdersCSV(workOrders)) {
      res.status(201).json({ success: true, data: newWorkOrder });
    } else {
      res.status(500).json({ success: false, message: 'Error al guardar orden de trabajo' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear orden de trabajo', error: error.message });
  }
});

// PUT - Actualizar orden de trabajo
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const workOrders = readWorkOrdersCSV();
    const workOrderIndex = workOrders.findIndex(wo => wo.id === id);
    
    if (workOrderIndex === -1) {
      return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    }
    
    // Actualizar campos
    const updatedWorkOrder = {
      ...workOrders[workOrderIndex],
      ...updateData,
      fechaActualizacion: new Date().toISOString()
    };
    
    workOrders[workOrderIndex] = updatedWorkOrder;
    
    if (writeWorkOrdersCSV(workOrders)) {
      res.json({ success: true, data: updatedWorkOrder });
    } else {
      res.status(500).json({ success: false, message: 'Error al actualizar orden de trabajo' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar orden de trabajo', error: error.message });
  }
});

// DELETE - Eliminar orden de trabajo
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const workOrders = readWorkOrdersCSV();
    const workOrderIndex = workOrders.findIndex(wo => wo.id === id);
    
    if (workOrderIndex === -1) {
      return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    }
    
    workOrders.splice(workOrderIndex, 1);
    
    if (writeWorkOrdersCSV(workOrders)) {
      res.json({ success: true, message: 'Orden de trabajo eliminada exitosamente' });
    } else {
      res.status(500).json({ success: false, message: 'Error al eliminar orden de trabajo' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar orden de trabajo', error: error.message });
  }
});

// POST - Crear orden de trabajo desde cotización aprobada
router.post('/from-quotation', (req, res) => {
  try {
    const { quotation } = req.body;
    
    if (!quotation || !quotation.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos de cotización requeridos' 
      });
    }

    const workOrders = readWorkOrdersCSV();
    const now = new Date().toISOString();
    
    // Crear orden de trabajo basada en la cotización
    const newWorkOrder = {
      id: generateId(),
      quotationId: quotation.id,
      appointmentId: quotation.appointmentId || '',
      clienteId: quotation.clienteId,
      vehiculoId: quotation.vehiculoId,
      servicioId: quotation.servicioId,
      descripcion: quotation.descripcion,
      problema: `Servicio derivado de cotización aprobada: ${quotation.descripcion}`,
      diagnostico: 'Orden generada automáticamente desde cotización aprobada',
      tipoServicio: 'corrective',
      fechaEstimadaCompletado: '', // Se puede calcular basado en el servicio
      fechaInicioReal: '',
      costoManoObra: 0,
      costoPartes: 0,
      costoTotal: quotation.precio,
      costoEstimado: quotation.precio,
      notas: quotation.notas || 'Orden creada automáticamente desde cotización aprobada',
      recomendaciones: '',
      estadoPago: 'pending',
      estado: 'pending',
      fechaCreacion: now,
      fechaActualizacion: now
    };

    workOrders.push(newWorkOrder);
    
    if (writeWorkOrdersCSV(workOrders)) {
      res.status(201).json({ 
        success: true, 
        data: newWorkOrder,
        message: 'Orden de trabajo creada exitosamente desde cotización' 
      });
    } else {
      res.status(500).json({ success: false, message: 'Error al guardar orden de trabajo' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear orden desde cotización', error: error.message });
  }
});

module.exports = router;