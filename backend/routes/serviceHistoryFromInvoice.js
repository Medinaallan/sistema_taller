const express = require('express');
const router = express.Router();
const ServiceHistoryService = require('../services/serviceHistoryService');
const serviceHistoryService = new ServiceHistoryService();

// Endpoint para agregar historial de servicio desde una factura pagada
router.post('/from-invoice', async (req, res) => {
  try {
    const invoice = req.body;
    if (!invoice || invoice.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Factura inválida o no pagada' });
    }
    // Mapeo básico de campos
    const historyData = {
      workOrderId: invoice.workOrderId,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      vehicleId: invoice.vehicleId,
      vehicleName: invoice.vehicleName,
      date: invoice.date,
      status: 'completed',
      paymentStatus: 'paid',
      invoiceId: invoice.id,
      invoiceTotal: invoice.total,
      notes: invoice.notes || '',
      items: invoice.items || [],
      createdAt: invoice.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await serviceHistoryService.addServiceHistory(historyData);
    if (result.success) {
      return res.status(201).json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error agregando historial desde factura:', error);
    res.status(500).json({ success: false, message: 'Error interno', error: error.message });
  }
});

module.exports = router;
