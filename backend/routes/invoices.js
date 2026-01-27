const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const INVOICES_FILE = path.join(__dirname, '../../src/data/invoices.json');

async function readInvoices() {
  try {
    const data = await fs.readFile(INVOICES_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeInvoices(list) {
  await fs.writeFile(INVOICES_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function generateInvoiceNumber(existing) {
  // Buscar último número (asume formato 001-001-01-XXXXXXXX)
  let last = 0;
  if (Array.isArray(existing) && existing.length > 0) {
    const nums = existing
      .map(i => (i.numero || '').split('-').pop())
      .map(s => parseInt(s || '0'))
      .filter(n => !isNaN(n));
    if (nums.length) last = Math.max(...nums);
  }
  const next = last + 1;
  return `001-001-01-${String(next).padStart(8, '0')}`;
}

// GET /api/invoices - list with optional filters
router.get('/', async (req, res) => {
  try {
    const { number, client, from, to } = req.query;
    let invoices = await readInvoices();

    if (number) {
      const q = String(number).toLowerCase();
      invoices = invoices.filter(i => (i.numero || '').toLowerCase().includes(q) || (i.id || '').toLowerCase().includes(q));
    }

    if (client) {
      const q = String(client).toLowerCase();
      invoices = invoices.filter(i => (i.clientName || '').toLowerCase().includes(q) || (i.clientId || '').toLowerCase() === q);
    }

    if (from) {
      const f = new Date(String(from));
      invoices = invoices.filter(i => new Date(i.fecha) >= f);
    }

    if (to) {
      const t = new Date(String(to));
      t.setHours(23,59,59,999);
      invoices = invoices.filter(i => new Date(i.fecha) <= t);
    }

    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error leyendo facturas:', error);
    res.status(500).json({ success: false, message: 'Error leyendo facturas', error: error.message });
  }
});

// GET by id
router.get('/:id', async (req, res) => {
  try {
    const invoices = await readInvoices();
    const inv = invoices.find(i => i.id === req.params.id || i.numero === req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    res.json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error leyendo factura', error: error.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const invoices = await readInvoices();

    const newInv = {
      id: `inv-${Date.now()}-${uuidv4().slice(0,6)}`,
      numero: generateInvoiceNumber(invoices),
      fecha: payload.fecha || new Date().toISOString(),
      clientId: payload.clientId || null,
      clientName: payload.clientName || 'CONSUMIDOR FINAL',
      items: payload.items || [],
      subtotal: payload.subtotal || 0,
      tax: payload.tax || 0,
      discount: payload.discount || 0,
      total: payload.total || 0,
      metodoPago: payload.metodoPago || 'Efectivo',
      estado: payload.estado || 'pagada',
      createdAt: new Date().toISOString(),
      createdBy: payload.createdBy || 'sistema'
    };

    invoices.push(newInv);
    await writeInvoices(invoices);

    res.status(201).json({ success: true, data: newInv });
  } catch (error) {
    console.error('Error creando factura:', error);
    res.status(500).json({ success: false, message: 'Error creando factura', error: error.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const invoices = await readInvoices();
    const idx = invoices.findIndex(i => i.id === req.params.id || i.numero === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Factura no encontrada' });

    invoices[idx] = { ...invoices[idx], ...req.body, updatedAt: new Date().toISOString() };
    await writeInvoices(invoices);
    res.json({ success: true, data: invoices[idx] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error actualizando factura', error: error.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const invoices = await readInvoices();
    const filtered = invoices.filter(i => !(i.id === req.params.id || i.numero === req.params.id));
    await writeInvoices(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error eliminando factura', error: error.message });
  }
});

module.exports = router;
