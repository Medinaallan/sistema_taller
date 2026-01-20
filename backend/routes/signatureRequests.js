const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const sql = require('mssql');

const REQUESTS_FILE = path.join(__dirname, '../../src/data/signatureRequests.json');

// GET - Obtener solicitudes pendientes de un cliente
router.get('/client/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const data = await fs.readFile(REQUESTS_FILE, 'utf8');
    const requestsData = JSON.parse(data);
    
    const clientRequests = Object.values(requestsData.signatureRequests || {})
      .filter(req => req.clienteId === clienteId && req.estado === 'pending');
    
    res.json({ success: true, data: clientRequests });
  } catch (error) {
    console.error('Error leyendo solicitudes:', error);
    res.status(500).json({ success: false, message: 'Error al leer solicitudes' });
  }
});

// POST - Crear solicitud de firma
router.post('/', async (req, res) => {
  try {
    const { otId, clienteId, clienteNombre, vehiculoInfo, descripcion } = req.body;
    
    if (!otId || !clienteId) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }
    
    const data = await fs.readFile(REQUESTS_FILE, 'utf8');
    const requestsData = JSON.parse(data);
    
    if (!requestsData.signatureRequests) {
      requestsData.signatureRequests = {};
    }
    
    requestsData.signatureRequests[otId] = {
      otId,
      clienteId,
      clienteNombre,
      vehiculoInfo,
      descripcion,
      fechaSolicitud: new Date().toISOString(),
      estado: 'pending'
    };
    
    await fs.writeFile(REQUESTS_FILE, JSON.stringify(requestsData, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Solicitud creada' });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error al crear solicitud' });
  }
});

// PUT - Firmar solicitud
router.put('/:otId/sign', async (req, res) => {
  try {
    const { otId } = req.params;
    const { firmadoPor, firmaImagen, fechaFirma } = req.body;
    
    const data = await fs.readFile(REQUESTS_FILE, 'utf8');
    const requestsData = JSON.parse(data);
    
    if (!requestsData.signatureRequests?.[otId]) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }
    
    requestsData.signatureRequests[otId] = {
      ...requestsData.signatureRequests[otId],
      estado: 'signed',
      firmadoPor,
      firmaImagen,
      fechaFirma
    };
    
    await fs.writeFile(REQUESTS_FILE, JSON.stringify(requestsData, null, 2), 'utf8');
    
    // Cambiar estado de la orden de trabajo a "Control de calidad"
    try {
      const pool = await sql.connect();
      await pool.request()
        .input('ordenTrabajoId', sql.UniqueIdentifier, otId)
        .input('nuevoEstado', sql.NVarChar, 'Control de calidad')
        .execute('sp_CambiarEstadoOrdenTrabajo');
      
      console.log(`Estado de OT ${otId} cambiado a "Control de calidad"`);
    } catch (dbError) {
      console.error('Error actualizando estado de OT:', dbError);
      // No fallar la firma si no se puede actualizar el estado
    }
    
    res.json({ success: true, message: 'Solicitud firmada y OT movida a Control de calidad' });
  } catch (error) {
    console.error('Error firmando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error al firmar' });
  }
});

// PUT - Rechazar solicitud
router.put('/:otId/reject', async (req, res) => {
  try {
    const { otId } = req.params;
    
    const data = await fs.readFile(REQUESTS_FILE, 'utf8');
    const requestsData = JSON.parse(data);
    
    if (!requestsData.signatureRequests?.[otId]) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }
    
    requestsData.signatureRequests[otId].estado = 'rejected';
    
    await fs.writeFile(REQUESTS_FILE, JSON.stringify(requestsData, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error al rechazar' });
  }
});

module.exports = router;
