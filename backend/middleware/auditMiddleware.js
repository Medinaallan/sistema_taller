// Middleware para auditoría automática de acciones en el sistema
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ruta del archivo de logs
const LOGS_FILE = path.join(__dirname, '../data/logs/system-logs.json');
const LOGS_DIR = path.dirname(LOGS_FILE);

// Asegurar que el directorio de logs existe
async function ensureLogsDir() {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    // Si ya existe, no hay problema
    if (error.code !== 'EEXIST') {
      console.error('Error creating logs directory:', error);
    }
  }
}

// Escribir log al archivo
async function writeLog(logEntry) {
  try {
    await ensureLogsDir();
    
    // Leer logs existentes
    let logs = [];
    try {
      const data = await fs.readFile(LOGS_FILE, 'utf8');
      logs = JSON.parse(data);
    } catch (error) {
      // Si el archivo no existe, empezar con array vacío
      if (error.code !== 'ENOENT') {
        console.error('Error reading logs file:', error);
      }
    }
    
    // Agregar nuevo log
    logs.push(logEntry);
    
    // Mantener solo los últimos 10000 logs para evitar archivos muy grandes
    if (logs.length > 10000) {
      logs = logs.slice(-10000);
    }
    
    // Escribir de vuelta al archivo
    await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing to logs file:', error);
  }
}

// Mapeo de rutas a entidades
const routeToEntity = {
  '/api/clients': 'client',
  '/api/users': 'user',
  '/api/vehicles': 'vehicle',
  '/api/services': 'service',
  '/api/appointments': 'appointment',
  '/api/quotations': 'quotation',
  '/api/workorders': 'workorder',
  '/api/logs': 'logs',
  '/api/auth': 'auth'
};

// Mapeo de métodos a acciones
const methodToAction = {
  'GET': 'VIEW',
  'POST': 'CREATE',
  'PUT': 'UPDATE',
  'PATCH': 'UPDATE',
  'DELETE': 'DELETE'
};

// Mapeo de rutas a severidad
const routeToSeverity = {
  '/api/auth/login': 'HIGH',
  '/api/auth/logout': 'MEDIUM',
  '/api/auth/register': 'HIGH',
  '/api/users': 'HIGH',
  '/api/logs/clean': 'CRITICAL',
  '/api/admin': 'HIGH'
};

// Determinar si una ruta debe ser logueada
function shouldLogRoute(req) {
  const { method, path } = req;
  
  // No loguear health checks
  if (path.includes('/api/health')) return false;
  
  // No loguear requests estáticos
  if (path.includes('/static') || path.includes('/assets')) return false;
  
  // No loguear logs para evitar recursión infinita en algunos casos
  if (path === '/api/logs' && method === 'GET') return false;
  
  // Loguear todo lo demás que empiece con /api
  return path.startsWith('/api');
}

// Obtener información del usuario de la request (si está disponible)
function getUserInfo(req) {
  // Aquí puedes extraer información del usuario de diferentes fuentes:
  // - JWT token en headers
  // - Session
  // - Query params, etc.
  
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Si tienes JWT implementado, decodificar aquí
    // Por ahora, usar valores por defecto
  }
  
  // Valores por defecto si no hay usuario autenticado
  return {
    userId: req.headers['x-user-id'] || 'anonymous',
    userName: req.headers['x-user-name'] || 'Usuario Anónimo',
    userRole: req.headers['x-user-role'] || 'guest'
  };
}

// Extraer ID de entidad de la URL
function extractEntityId(path) {
  // Buscar patrones como /api/clients/123, /api/users/456, etc.
  const match = path.match(/\/api\/[^/]+\/([^/?]+)/);
  return match ? match[1] : null;
}

// Determinar la entidad basada en la ruta
function getEntity(path) {
  for (const route in routeToEntity) {
    if (path.startsWith(route)) {
      return routeToEntity[route];
    }
  }
  return 'unknown';
}

// Generar descripción del log
function generateDescription(req, res) {
  const { method, path } = req;
  const entity = getEntity(path);
  const action = methodToAction[method] || method;
  const entityId = extractEntityId(path);
  const statusCode = res.statusCode;
  
  let description = `${action} en ${entity}`;
  
  if (entityId && entityId !== 'undefined') {
    description += ` (ID: ${entityId})`;
  }
  
  if (statusCode >= 400) {
    description += ` - ERROR ${statusCode}`;
  } else if (statusCode >= 200 && statusCode < 300) {
    description += ` - EXITOSO`;
  }
  
  // Agregar detalles específicos para ciertas rutas
  if (path.includes('/login')) {
    description = statusCode < 400 ? 'Login exitoso' : 'Intento de login fallido';
  } else if (path.includes('/register')) {
    description = statusCode < 400 ? 'Registro de usuario exitoso' : 'Intento de registro fallido';
  } else if (path.includes('/logout')) {
    description = 'Logout de usuario';
  }
  
  return description;
}

// Middleware principal de auditoría
function auditMiddleware(req, res, next) {
  // Continuar con la request
  next();
  
  // Capturar la respuesta usando el evento 'finish'
  res.on('finish', async () => {
    try {
      // Verificar si debemos loguear esta ruta
      if (!shouldLogRoute(req)) return;
      
      const userInfo = getUserInfo(req);
      const entity = getEntity(req.path);
      const action = methodToAction[req.method] || 'CUSTOM';
      const entityId = extractEntityId(req.path);
      const description = generateDescription(req, res);
      
      // Determinar severidad
      let severity = routeToSeverity[req.path] || 'MEDIUM';
      
      // Ajustar severidad basada en el status code
      if (res.statusCode >= 500) {
        severity = 'CRITICAL';
      } else if (res.statusCode >= 400) {
        severity = 'HIGH';
      } else if (req.method === 'GET') {
        severity = 'LOW';
      }
      
      // Crear entrada de log
      const logEntry = {
        id: uuidv4(),
        userId: userInfo.userId,
        userName: userInfo.userName,
        userRole: userInfo.userRole,
        action,
        entity,
        entityId,
        description,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
          responseTime: res.get('X-Response-Time') || null
        },
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date().toISOString(),
        severity
      };
      
      // Escribir al archivo de logs de forma asíncrona
      await writeLog(logEntry);
      
      // Log para debug: solo si se habilita explícitamente DEBUG_AUDIT=true
      if (process.env.DEBUG_AUDIT === 'true') {
        console.log(`LOG: ${userInfo.userName} - ${description}`);
      }
      
    } catch (error) {
      // No fallar la request si hay error en el logging
      console.error('Error en middleware de auditoría:', error);
    }
  });
}

module.exports = {
  auditMiddleware,
  writeLog,
  ensureLogsDir
};