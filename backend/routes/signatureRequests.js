const express = require('express');
const router = express.Router();
const path = require('path');
const { getConnection, sql } = require('../config/database');

const spacesService = require('../services/spacesService');

const REQUESTS_FILE = path.join(__dirname, '../../src/data/signatureRequests.json');

// GET - Obtener solicitudes pendientes de un cliente
router.get('/client/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const data = await fs.readFile(REQUESTS_FILE, 'utf8');
    const requestsData = JSON.parse(data);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('permiso_id', sql.Int, null)
      .input('ot_id', sql.Int, null)
      .input('cliente_id', sql.Int, parseInt(clienteId))
      .input('estado', sql.VarChar(50), 'Pendiente')
      .input('fecha_inicio', sql.Date, null)
      .input('fecha_fin', sql.Date, null)
      .execute('SP_OBTENER_PERMISO_PRUEBA_MANEJO');

    const rows = result.recordset || [];
    const clientRequests = rows.map(r => ({
      otId: String(r.ot_id || r.otId || r.orden_trabajo_id || ''),
      clienteId: String(r.cliente_id || r.client_id || r.usuario_id || ''),
      clienteNombre: r.nombre_cliente || r.nombre || r.cliente_nombre || '',
      vehiculoInfo: r.vehiculo_info || r.vehiculo || r.vehiculo_nombre || '',
      descripcion: r.descripcion || r.descripcion_solicitud || '',
      fechaSolicitud: r.fecha_hora_solicitud ? new Date(r.fecha_hora_solicitud).toISOString() : (r.fecha_solicitud || new Date().toISOString()),
      estado: (r.estado || 'Pendiente').toLowerCase() === 'pendiente' ? 'pending' : ((r.estado || '').toLowerCase() === 'aprobado' ? 'signed' : 'rejected'),
      firmadoPor: r.firmado_por || null,
      firmaImagen: r.firma_url || null,
      fechaFirma: r.fecha_hora_resolucion ? new Date(r.fecha_hora_resolucion).toISOString() : null
    }));

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
    // Registrar permiso de prueba en la BD usando el SP
    // El SP espera: ot_id, descripcion, registrado_por
    const registradoPor = req.body.registradoPor || 1; // fallback

    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('descripcion', sql.VarChar(300), descripcion || null)
      .input('registrado_por', sql.Int, parseInt(registradoPor))
      .execute('SP_REGISTRAR_PERMISO_PRUEBA_MANEJO');

    const response = result.recordset?.[0] || { allow: 0, msg: 'SP no retornó respuesta' };

    if (response.allow === 1) {
      return res.json({ success: true, message: response.msg, data: { permisoId: response.permiso_id } });
    }

    return res.status(400).json({ success: false, message: response.msg || 'No se pudo crear solicitud' });
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
    // Resolver permiso de prueba en la BD usando el SP_RESOLVER_PERMISO_PRUEBA_MANEJO
    const firmadoPorId = firmadoPor || 1;
    let firmaUrl = null;

    if (firmaImagen) {
      try {
        const base64Data = String(firmaImagen).replace(/^data:image\/\w+;base64,/, '');
        const signatureBuffer = Buffer.from(base64Data, 'base64');
        const uploadResult = await spacesService.uploadImage(
          signatureBuffer,
          `firma-solicitud-ot${otId}.png`,
          'image/png',
          'drive-test-signatures'
        );

        if (uploadResult.success) {
          firmaUrl = uploadResult.url;
        } else {
          console.error('Error subiendo firma:', uploadResult.error);
        }
      } catch (uploadErr) {
        console.error('Error procesando la firma:', uploadErr);
      }
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('estado_resolucion', sql.VarChar(50), 'Aprobado')
      .input('firmado_por', sql.Int, parseInt(firmadoPorId))
      .input('firma_url', sql.VarChar(255), firmaUrl)
      .execute('SP_RESOLVER_PERMISO_PRUEBA_MANEJO');

    const response = result.recordset?.[0] || { allow: 0, msg: 'SP no retornó respuesta' };

    if (response.allow === 1) {
      // Intentar mover OT a Control de calidad (no fatal)
      try {
        const stateRes = await pool.request()
          .input('ot_id', sql.Int, parseInt(otId))
          .input('nuevo_estado', sql.VarChar(50), 'Control de calidad')
          .input('registrado_por', sql.Int, parseInt(firmadoPorId))
          .execute('SP_GESTIONAR_ESTADO_OT');

        const stateResp = stateRes.recordset?.[0];
        if (stateResp && stateResp.allow !== 1) {
          console.warn('No se pudo actualizar estado de OT:', stateResp.msg);
        }
      } catch (stateError) {
        console.error('Error actualizando estado de OT:', stateError);
      }

      return res.json({ success: true, message: response.msg, data: { otId, firmaUrl } });
    }

    return res.status(400).json({ success: false, message: response.msg || 'No se pudo firmar la solicitud' });
  } catch (error) {
    console.error('Error firmando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error al firmar' });
  }
});

// PUT - Rechazar solicitud
router.put('/:otId/reject', async (req, res) => {
  try {
    const { otId } = req.params;
    // Resolver como Denegado
    const registradoPor = req.body.registradoPor || 1;
    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('estado_resolucion', sql.VarChar(50), 'Denegado')
      .input('firmado_por', sql.Int, parseInt(registradoPor))
      .input('firma_url', sql.VarChar(255), null)
      .execute('SP_RESOLVER_PERMISO_PRUEBA_MANEJO');

    const response = result.recordset?.[0] || { allow: 0, msg: 'SP no retornó respuesta' };

    if (response.allow === 1) {
      return res.json({ success: true, message: response.msg });
    }

    return res.status(400).json({ success: false, message: response.msg || 'No se pudo rechazar la solicitud' });
  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error al rechazar' });
  }
});

module.exports = router;
