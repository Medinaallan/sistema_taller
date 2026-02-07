const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const notificationsService = require('../services/notificationsService');

// ========== FACTURAS AHORA USAN BASE DE DATOS (NO JSON) ==========
// GET /api/invoices - Obtener facturas desde BD usando SP_OBTENER_FACTURAS
router.get('/', async (req, res) => {
  try {
    const { factura_id, cliente_id, numero, estado, fecha_inicio, fecha_fin } = req.query;
    
    console.log(' Obteniendo facturas desde BD...');
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('factura_id', sql.Int, factura_id ? parseInt(factura_id) : null)
      .input('cliente_id', sql.Int, cliente_id ? parseInt(cliente_id) : null)
      .input('numero', sql.VarChar(40), numero || null)
      .input('estado', sql.VarChar(50), estado || null)
      .input('fecha_inicio', sql.Date, fecha_inicio || null)
      .input('fecha_fin', sql.Date, fecha_fin || null)
      .execute('SP_OBTENER_FACTURAS');
    
    const facturas = result.recordset || [];
    console.log(`  facturas obtenidas desde BD`);
    
    res.json({ 
      success: true, 
      data: facturas,
      count: facturas.length 
    });
  } catch (error) {
    console.error(' Error obteniendo facturas desde BD:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo facturas desde BD', 
      error: error.message 
    });
  }
});

// GET /api/invoices/:id - Obtener una factura específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(` Obteniendo factura  desde BD...`);
    
    const pool = await getConnection();
    
    // Intentar buscar por factura_id primero
    let result = await pool.request()
      .input('factura_id', sql.Int, !isNaN(parseInt(id)) ? parseInt(id) : null)
      .input('cliente_id', sql.Int, null)
      .input('numero', sql.VarChar(40), null)
      .input('estado', sql.VarChar(50), null)
      .input('fecha_inicio', sql.Date, null)
      .input('fecha_fin', sql.Date, null)
      .execute('SP_OBTENER_FACTURAS');
    
    // Si no se encontró por ID, buscar por número
    if (!result.recordset || result.recordset.length === 0) {
      result = await pool.request()
        .input('factura_id', sql.Int, null)
        .input('cliente_id', sql.Int, null)
        .input('numero', sql.VarChar(40), id)
        .input('estado', sql.VarChar(50), null)
        .input('fecha_inicio', sql.Date, null)
        .input('fecha_fin', sql.Date, null)
        .execute('SP_OBTENER_FACTURAS');
    }
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Factura no encontrada' 
      });
    }
    
    console.log(` Factura  encontrada`);
    
    res.json({ 
      success: true, 
      data: result.recordset[0] 
    });
  } catch (error) {
    console.error(' Error obteniendo factura:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo factura', 
      error: error.message 
    });
  }
});

// GET /api/invoices/:id/items - Obtener items de una factura usando SP_OBTENER_ITEMS_FACTURA
router.get('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 Obteniendo items de factura ${id}...`);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('factura_id', sql.Int, parseInt(id))
      .execute('SP_OBTENER_ITEMS_FACTURA');
    
    const items = result.recordset || [];
    console.log(`✅ ${items.length} items encontrados`);
    
    res.json({ 
      success: true, 
      data: items
    });
  } catch (error) {
    console.error('❌ Error obteniendo items de factura:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo items de factura', 
      error: error.message 
    });
  }
});

// POST /api/invoices/generate-from-ot - Generar factura desde OT usando SP
router.post('/generate-from-ot', async (req, res) => {
  try {
    const { ot_id, registrado_por } = req.body;
    
    if (!ot_id) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro ot_id es requerido'
      });
    }
    
    console.log(` Generando factura desde OT ...`);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(ot_id))
      .input('registrado_por', sql.Int, registrado_por || 1)
      .execute('SP_GENERAR_FACTURA_DESDE_OT');
    
    const response = result.recordset[0];
    
    if (response.allow === 1) {
      console.log(` Factura generada:  (ID: )`);
      
      // Intentar enviar notificación al cliente
      try {
        const otInfo = await pool.request()
          .input('ot_id', sql.Int, parseInt(ot_id))
          .input('cliente_id', sql.Int, null)
          .input('placa', sql.VarChar(50), null)
          .input('estado', sql.VarChar(50), null)
          .input('numero_ot', sql.VarChar(20), null)
          .execute('SP_OBTENER_ORDENES_TRABAJO');
        
        if (otInfo.recordset.length > 0) {
          const ot = otInfo.recordset[0];
          await notificationsService.notifyInvoiceGenerated(ot.cliente_id, {
            factura_id: response.factura_id,
            numero_factura: response.numero_factura,
            ot_id: ot_id,
            numero_ot: ot.numero_ot
          });
          console.log(' Notificación de factura generada enviada');
        }
      } catch (notifError) {
        console.error(' Error al enviar notificación de factura:', notifError);
        // No fallar la operación si la notificación falla
      }
      
      res.json({
        success: true,
        message: response.msg,
        data: {
          factura_id: response.factura_id,
          numero_factura: response.numero_factura,
          ot_id: ot_id
        }
      });
    } else {
      console.warn(` No se pudo generar factura: `);
      res.status(400).json({
        success: false,
        message: response.msg
      });
    }
  } catch (error) {
    console.error(' Error generando factura desde OT:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar factura desde OT',
      error: error.message
    });
  }
});

// POST /api/invoices/register-payment - Registrar pago de factura usando SP
router.post('/register-payment', async (req, res) => {
  try {
    const { factura_id, monto, metodo_pago, referencia, registrado_por } = req.body;
    
    if (!factura_id || !monto || !metodo_pago) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros factura_id, monto y metodo_pago son requeridos'
      });
    }
    
    // Validar que el método de pago sea uno de los permitidos
    const metodosValidos = ['Efectivo', 'Tarjeta', 'Transferencia'];
    if (!metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({
        success: false,
        message: `Método de pago inválido. Debe ser uno de: ${metodosValidos.join(', ')}`
      });
    }
    
    console.log(`💰 Registrando pago de L.${monto} para factura ${factura_id} (${metodo_pago})...`);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('factura_id', sql.Int, parseInt(factura_id))
      .input('monto', sql.Decimal(10, 2), parseFloat(monto))
      .input('metodo_pago', sql.VarChar(30), metodo_pago)
      .input('referencia', sql.VarChar(100), referencia || null)
      .input('registrado_por', sql.Int, registrado_por || 1)
      .execute('SP_REGISTRAR_PAGO');
    
    const response = result.recordset[0];
    
    console.log('📋 Respuesta del SP_REGISTRAR_PAGO:', response);
    
    // Verificar si el SP devolvió éxito
    const isSuccess = response.allow === 1 || response.allow === '1' || response[''] === '200 OK';
    const message = response.msg || response.message || response[''] || 'Pago registrado';
    
    if (isSuccess) {
      console.log(`✅ Pago registrado exitosamente: ${message}`);
      
      res.json({
        success: true,
        message: message,
        data: {
          factura_id: factura_id,
          monto: monto,
          metodo_pago: metodo_pago
        }
      });
    } else {
      console.warn(`⚠️ No se pudo registrar pago: ${message}`);
      res.status(400).json({
        success: false,
        message: message
      });
    }
  } catch (error) {
    console.error('❌ Error registrando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
      error: error.message
    });
  }
});

module.exports = router;
