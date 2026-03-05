// Middleware para auditoría automática de acciones en el sistema
// NOTA: El almacenamiento en JSON fue eliminado.
// Este middleware ahora es un no-op pass-through.
// En el futuro, conectar la auditoría directamente a la base de datos.

// No-op: ya no se escribe a archivo JSON
async function writeLog(logEntry) {
  // Almacenamiento JSON eliminado - no-op
}

async function ensureLogsDir() {
  // Almacenamiento JSON eliminado - no-op
}

// Middleware principal de auditoría - no-op pass-through
function auditMiddleware(req, res, next) {
  next();
}

module.exports = {
  auditMiddleware,
  writeLog,
  ensureLogsDir
};