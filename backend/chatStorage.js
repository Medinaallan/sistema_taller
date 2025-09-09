// Almacenamiento simple de historial de chat en memoria + persistencia JSON.
// Esta capa se puede reemplazar posteriormente por base de datos SQL Server.

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'chat-history.json');

let historial = {
  // sala_id: [ mensajes ]
};

// Cargar si existe 
try {
  if (fs.existsSync(DATA_PATH)) {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    historial = JSON.parse(raw);
  }
} catch (e) {
  console.error('No se pudo cargar chat-history.json:', e.message);
}

function persistir() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(historial, null, 2));
  } catch (e) {
    console.error('Error persistiendo historial chat:', e.message);
  }
}

function guardarMensaje(msg) {
  const { sala_id } = msg;
  if (!sala_id) return;
  if (!historial[sala_id]) historial[sala_id] = [];
  historial[sala_id].push(msg);
  // Limitar a últimos 500 mensajes por sala para no crecer infinito.
  if (historial[sala_id].length > 500) {
    historial[sala_id] = historial[sala_id].slice(-500);
  }
  persistir();
}

function obtenerHistorial(sala_id) {
  return historial[sala_id] ? [...historial[sala_id]] : [];
}

function marcarLeidos(sala_id, rolLectura) {
  if (!historial[sala_id]) return;
  let cambios = 0;
  historial[sala_id] = historial[sala_id].map(m => {
    if (!m.leido && m.rol !== rolLectura) {
      cambios++;
      return { ...m, leido: true };
    }
    return m;
  });
  if (cambios > 0) persistir();
  return cambios;
}

module.exports = {
  guardarMensaje,
  obtenerHistorial,
  marcarLeidos
};
