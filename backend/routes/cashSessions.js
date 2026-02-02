const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Guardar JSON en la carpeta principal `src/data` del proyecto
const DB_FILE = path.join(__dirname, '..', '..', 'src', 'data', 'cash_sessions.json');

console.log('cashSessions router loaded, DB_FILE=', DB_FILE);

async function ensureDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ sessions: [], movements: [] }, null, 2), 'utf8');
    }
  } catch (err) {
    throw err;
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.promises.readFile(DB_FILE, 'utf8');
  return JSON.parse(raw || '{"sessions":[],"movements":[]}');
}

async function writeDb(data) {
  await ensureDb();
  await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// GET / - listar sesiones
router.get('/', async (req, res) => {
  try {
    const db = await readDb();
    res.json({ success: true, data: db.sessions });
  } catch (err) {
    console.error('Error reading cash DB', err);
    res.status(500).json({ success: false, message: 'Error leyendo cash DB' });
  }
});

// GET /open - obtener sesión abierta actual
router.get('/open', async (req, res) => {
  try {
    const db = await readDb();
    const open = db.sessions.find(s => s.status === 'open') || null;
    res.json({ success: true, data: open });
  } catch (err) {
    console.error('Error getting open session', err);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});



// GET /:id - obtener sesión por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();
    const session = db.sessions.find(s => s.id === id);
    if (!session) return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    res.json({ success: true, data: session });
  } catch (err) {
    console.error('Error getting session', err);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// GET /report - reporte resumido por sesión
router.get('/report/all', async (req, res) => {
  try {
    const db = await readDb();
    const invoicesFile = path.join(__dirname, '..', 'src', 'data', 'invoices.json');
    let invoices = [];
    if (fs.existsSync(invoicesFile)) {
      const rawInv = await fs.promises.readFile(invoicesFile, 'utf8');
      invoices = JSON.parse(rawInv || '[]');
    }

    const reports = db.sessions.map(session => {
      const openedAt = session.openedAt ? new Date(session.openedAt) : null;
      const closedAt = session.closedAt ? new Date(session.closedAt) : null;

      // ventas: sumar invoices pagadas en efectivo dentro del rango
      const sales = invoices.filter(inv => {
        try {
          const invDate = new Date(inv.createdAt || inv.fecha);
          const inRange = openedAt && invDate >= openedAt && (!closedAt || invDate <= closedAt);
          return inRange && (inv.metodoPago || inv.metodo) === 'Efectivo' && (inv.estado === 'pagada' || inv.estado === 'paid' || !inv.estado);
        } catch (e) {
          return false;
        }
      });
      const salesTotal = sales.reduce((s, i) => s + (Number(i.total) || 0), 0);

      // ingresos y egresos desde movimientos
      const movements = (db.movements || []).filter(m => m.sessionId === session.id);
      const incomes = movements.filter(m => m.type === 'in').reduce((s, m) => s + (Number(m.amount) || 0), 0);
      const outflows = movements.filter(m => m.type === 'out').reduce((s, m) => s + (Number(m.amount) || 0), 0);

      const expectedCash = (Number(session.openingAmount) || 0) + salesTotal + incomes - outflows;
      const counted = session.closingAmount != null ? Number(session.closingAmount) : null;
      const difference = counted != null ? counted - expectedCash : null;

      return {
        id: session.id,
        caja: session.id,
        cashier: session.cashier || session.openedBy || '---',
        openingTime: session.openingTime || session.openedAt,
        closingTime: session.closingTime || session.closedAt,
        openingAmount: Number(session.openingAmount) || 0,
        salesTotal,
        incomes,
        outflows,
        expectedCash,
        counted,
        difference,
        status: session.status || 'closed'
      };
    });

    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('Error generating cash report', err);
    res.status(500).json({ success: false, message: 'Error generando reporte' });
  }
});

// POST /open - abrir sesión
router.post('/open', async (req, res) => {
  try {
    const { openedBy, openingAmount, notes } = req.body;
    console.log('POST /api/cash-sessions/open body:', req.body);
    const db = await readDb();

    // No permitir abrir si ya hay una abierta
    const existingOpen = db.sessions.find(s => s.status === 'open');
    if (existingOpen) {
      return res.status(400).json({ success: false, message: 'Ya existe una sesión abierta' });
    }

    const newSession = {
      id: uuidv4(),
      openedBy: openedBy || 'unknown',
      cashier: openedBy || 'unknown',
      openingAmount: Number(openingAmount) || 0,
      openingNotes: notes || '',
      openedAt: new Date().toISOString(),
      openingTime: new Date().toISOString(),
      status: 'open',
      movements: [],
      closedAt: null,
      closingBy: null,
      closingAmount: null,
      closingNotes: null,
      shortages: 0,
      overages: 0
    };

    db.sessions.push(newSession);
    await writeDb(db);
    res.json({ success: true, data: newSession });
  } catch (err) {
    console.error('Error opening session', err);
    res.status(500).json({ success: false, message: 'Error abriendo sesión' });
  }
});

// POST /movement - registrar movimiento (entrada/salida)
router.post('/movement', async (req, res) => {
  try {
    const { sessionId, type, amount, reason, createdBy } = req.body;
    if (!sessionId || !type || !amount) return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    const db = await readDb();
    const session = db.sessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Sesión no encontrada' });

    const movement = {
      id: uuidv4(),
      sessionId,
      type: type === 'in' ? 'in' : 'out',
      amount: Number(amount) || 0,
      reason: reason || '',
      createdBy: createdBy || 'unknown',
      createdAt: new Date().toISOString()
    };

    // Agregar a movimientos global y a la sesión
    db.movements.push(movement);
    session.movements.push(movement);
    await writeDb(db);

    res.json({ success: true, data: movement });
  } catch (err) {
    console.error('Error creating movement', err);
    res.status(500).json({ success: false, message: 'Error creando movimiento' });
  }
});

// POST /close - cerrar sesión
router.post('/close', async (req, res) => {
  try {
    const { sessionId, closingBy, countedCash, shortages, overages, closingNotes } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId requerido' });

    const db = await readDb();
    const session = db.sessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    if (session.status !== 'open') return res.status(400).json({ success: false, message: 'Sesión no está abierta' });

    session.closedAt = new Date().toISOString();
    session.closingTime = new Date().toISOString();
    session.closingBy = closingBy || 'unknown';
    session.closedBy = closingBy || 'unknown';
    session.closingAmount = Number(countedCash) || 0;
    session.shortages = Number(shortages) || 0;
    session.overages = Number(overages) || 0;
    session.closingNotes = closingNotes || '';
    session.status = 'closed';

    await writeDb(db);

    res.json({ success: true, data: session });
  } catch (err) {
    console.error('Error closing session', err);
    res.status(500).json({ success: false, message: 'Error cerrando sesión' });
  }
});

module.exports = router;
