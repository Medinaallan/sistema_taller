const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Ruta al archivo JSON de pagos de facturas
const PAYMENTS_FILE = path.join(__dirname, '../../src/data/invoicePayments.json');

/**
 * GET /api/invoice-payments
 * Obtener todos los estados de pago de facturas
 */
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
    const paymentsData = JSON.parse(data);
    
    res.json({
      paidInvoices: paymentsData.paidInvoices || [],
      pendingInvoices: paymentsData.pendingInvoices || []
    });
  } catch (error) {
    console.error('❌ Error leyendo estados de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al leer estados de pago',
      error: error.message
    });
  }
});

/**
 * POST /api/invoice-payments/mark-paid/:workOrderId
 * Marcar una factura como pagada
 */
router.post('/mark-paid/:workOrderId', async (req, res) => {
  try {
    const { workOrderId } = req.params;
    
    console.log(`💰 Marcando factura de OT ${workOrderId} como pagada...`);
    
    // Leer el archivo actual
    const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
    const paymentsData = JSON.parse(data);
    
    // Inicializar arrays si no existen
    if (!paymentsData.paidInvoices) paymentsData.paidInvoices = [];
    if (!paymentsData.pendingInvoices) paymentsData.pendingInvoices = [];
    
    // Agregar a pagadas y remover de pendientes
    if (!paymentsData.paidInvoices.includes(workOrderId)) {
      paymentsData.paidInvoices.push(workOrderId);
    }
    paymentsData.pendingInvoices = paymentsData.pendingInvoices.filter(id => id !== workOrderId);
    
    // Guardar de vuelta al archivo
    await fs.writeFile(PAYMENTS_FILE, JSON.stringify(paymentsData, null, 2), 'utf8');
    
    console.log(`✅ Factura de OT ${workOrderId} marcada como pagada`);
    
    res.json({
      success: true,
      message: 'Factura marcada como pagada',
      data: {
        workOrderId,
        totalPaid: paymentsData.paidInvoices.length,
        totalPending: paymentsData.pendingInvoices.length
      }
    });
  } catch (error) {
    console.error('❌ Error marcando factura como pagada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar factura como pagada',
      error: error.message
    });
  }
});

/**
 * POST /api/invoice-payments/mark-pending/:workOrderId
 * Marcar una factura como pendiente
 */
router.post('/mark-pending/:workOrderId', async (req, res) => {
  try {
    const { workOrderId } = req.params;
    
    console.log(`📋 Marcando factura de OT ${workOrderId} como pendiente...`);
    
    const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
    const paymentsData = JSON.parse(data);
    
    if (!paymentsData.paidInvoices) paymentsData.paidInvoices = [];
    if (!paymentsData.pendingInvoices) paymentsData.pendingInvoices = [];
    
    // Agregar a pendientes y remover de pagadas
    if (!paymentsData.pendingInvoices.includes(workOrderId)) {
      paymentsData.pendingInvoices.push(workOrderId);
    }
    paymentsData.paidInvoices = paymentsData.paidInvoices.filter(id => id !== workOrderId);
    
    await fs.writeFile(PAYMENTS_FILE, JSON.stringify(paymentsData, null, 2), 'utf8');
    
    console.log(`✅ Factura de OT ${workOrderId} marcada como pendiente`);
    
    res.json({
      success: true,
      message: 'Factura marcada como pendiente',
      data: { workOrderId }
    });
  } catch (error) {
    console.error('❌ Error marcando factura como pendiente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar factura como pendiente',
      error: error.message
    });
  }
});

/**
 * GET /api/invoice-payments/is-paid/:workOrderId
 * Verificar si una factura está pagada
 */
router.get('/is-paid/:workOrderId', async (req, res) => {
  try {
    const { workOrderId } = req.params;
    
    const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
    const paymentsData = JSON.parse(data);
    
    const isPaid = paymentsData.paidInvoices?.includes(workOrderId) || false;
    
    res.json({
      success: true,
      isPaid,
      workOrderId
    });
  } catch (error) {
    console.error('❌ Error verificando estado de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado de pago',
      error: error.message
    });
  }
});

module.exports = router;
