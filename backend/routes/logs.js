const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Ruta del archivo de logs
const LOGS_FILE = path.join(__dirname, '../data/logs/system-logs.json');
const LOGS_DIR = path.dirname(LOGS_FILE);

// Asegurar que el directorio existe
async function ensureLogsDir() {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating logs directory:', error);
  }
}

// Leer logs del archivo
async function readLogs() {
  try {
    await ensureLogsDir();
    const data = await fs.readFile(LOGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Escribir logs al archivo
async function writeLogs(logs) {
  try {
    await ensureLogsDir();
    await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing logs:', error);
    throw error;
  }
}

// Obtener logs con filtros y paginación
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      userId,
      action,
      entity,
      severity,
      search
    } = req.query;

    let logs = await readLogs();

    // Aplicar filtros
    if (startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    if (action) {
      logs = logs.filter(log => log.action === action);
    }
    if (entity) {
      logs = logs.filter(log => log.entity === entity);
    }
    if (severity) {
      logs = logs.filter(log => log.severity === severity);
    }
    if (search) {
      const searchTerm = search.toLowerCase();
      logs = logs.filter(log => 
        log.description.toLowerCase().includes(searchTerm) ||
        log.userName.toLowerCase().includes(searchTerm) ||
        log.entity.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar por timestamp descendente (más reciente primero)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginación
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = logs.slice(startIndex, endIndex);

    res.json({
      logs: paginatedLogs,
      total,
      page: parseInt(page),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear un nuevo log
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId,
      description,
      details,
      severity = 'MEDIUM'
    } = req.body;

    // Validar campos requeridos
    if (!userId || !action || !entity || !description) {
      return res.status(400).json({ 
        error: 'Campos requeridos: userId, action, entity, description' 
      });
    }

    const newLog = {
      id: uuidv4(),
      userId,
      userName: userName || 'Unknown User',
      userRole: userRole || 'unknown',
      action,
      entity,
      entityId: entityId || null,
      description,
      details: details || null,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date().toISOString(),
      severity
    };

    const logs = await readLogs();
    logs.push(newLog);
    await writeLogs(logs);

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Exportar logs como CSV
router.get('/export', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      action,
      entity,
      severity
    } = req.query;

    let logs = await readLogs();

    // Aplicar los mismos filtros que en GET /
    if (startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    if (action) {
      logs = logs.filter(log => log.action === action);
    }
    if (entity) {
      logs = logs.filter(log => log.entity === entity);
    }
    if (severity) {
      logs = logs.filter(log => log.severity === severity);
    }

    // Ordenar por timestamp descendente
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Generar CSV
    const csvHeader = 'ID,Usuario,Rol,Accion,Entidad,ID_Entidad,Descripcion,Severidad,IP,Timestamp\n';
    const csvRows = logs.map(log => [
      log.id,
      log.userName,
      log.userRole,
      log.action,
      log.entity,
      log.entityId || '',
      `"${log.description.replace(/"/g, '""')}"`, // Escapar comillas
      log.severity,
      log.ipAddress || '',
      log.timestamp
    ].join(',')).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="system-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Limpiar logs antiguos
router.delete('/clean', async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let logs = await readLogs();
    const initialCount = logs.length;
    
    logs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
    
    await writeLogs(logs);

    const deleted = initialCount - logs.length;

    // Log esta acción
    const cleanLog = {
      id: uuidv4(),
      userId: 'system',
      userName: 'System',
      userRole: 'system',
      action: 'DELETE',
      entity: 'logs',
      entityId: null,
      description: `Logs cleanup: deleted ${deleted} logs older than ${daysOld} days`,
      details: { deleted, daysOld },
      ipAddress: req.ip || 'system',
      userAgent: 'system',
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM'
    };

    logs.push(cleanLog);
    await writeLogs(logs);

    res.json({ deleted });
  } catch (error) {
    console.error('Error cleaning logs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de logs
router.get('/stats', async (req, res) => {
  try {
    const logs = await readLogs();
    
    const stats = {
      total: logs.length,
      byAction: {},
      byEntity: {},
      bySeverity: {},
      byUser: {},
      last24Hours: 0,
      lastWeek: 0
    };

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      
      // Contar por categorías
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      stats.byUser[log.userName] = (stats.byUser[log.userName] || 0) + 1;

      // Contar por tiempo
      if (logDate >= last24h) stats.last24Hours++;
      if (logDate >= lastWeek) stats.lastWeek++;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting log stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;