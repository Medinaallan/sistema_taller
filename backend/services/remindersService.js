const { getConnection, sql } = require('../config/database.js');

// Helper: normalizar fila del SP a la estructura usada por el frontend
function mapRecord(r) {
  return {
    id: r.recordatorio_id ? r.recordatorio_id.toString() : undefined,
    usuario_id: r.usuario_id,
    clientId: r.usuario_id ? r.usuario_id.toString() : null,
    nombre_cliente: r.nombre_cliente,
    vehicleId: r.vehiculo_id ? r.vehiculo_id.toString() : null,
    info_vehiculo: r.info_vehiculo,
    title: r.titulo,
    description: r.descripcion,
    triggerValue: r.fecha_recordatorio,
    estado: r.estado,
    prioridad: r.prioridad,
    dias_restantes: r.dias_restantes,
    type: r.fecha_recordatorio ? 'date' : 'mileage',
    isActive: r.estado ? String(r.estado).toLowerCase() !== 'inactivo' : true,
    isCompleted: r.estado ? String(r.estado).toLowerCase() === 'completado' : false,
    createdAt: r.fecha_creacion || new Date().toISOString(),
    services: []
  };
}

// Leer todos los recordatorios
async function getAllReminders() {
  try {
    const pool = await getConnection();
    const request = pool.request();
    // No filters -> obtener todos
    request.input('recordatorio_id', sql.Int, null);
    request.input('usuario_id', sql.Int, null);
    request.input('vehiculo_id', sql.Int, null);
    request.input('estado', sql.VarChar(50), null);
    request.input('filtro_fecha', sql.VarChar(20), null);

    const result = await request.execute('SP_OBTENER_RECORDATORIOS');
    if (result && result.recordset) {
      return result.recordset.map(mapRecord);
    }
    return [];
  } catch (error) {
    console.error('Error en getAllReminders (SP):', error.message);
    throw error;
  }
}

// Guardar recordatorios
async function saveReminders(reminders) {
  await fs.writeFile(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

// Obtener recordatorios por cliente
// Obtener recordatorios por cliente usando SP_OBTENER_RECORDATORIOS
async function getRemindersByClient(clientId) {
  try {
    const pool = await getConnection();
    console.log('\n  Obteniendo recordatorios para cliente:', clientId);

    const request = pool.request();
    // SP params: @recordatorio_id, @usuario_id, @vehiculo_id, @estado, @filtro_fecha
    request.input('recordatorio_id', sql.Int, null);
    request.input('usuario_id', sql.Int, clientId ? parseInt(clientId) : null);
    request.input('vehiculo_id', sql.Int, null);
    request.input('estado', sql.VarChar(50), null);
    request.input('filtro_fecha', sql.VarChar(20), null);

    const result = await request.execute('SP_OBTENER_RECORDATORIOS');

    if (result && result.recordset) {
      return result.recordset.map(mapRecord);
    }

    return [];
  } catch (error) {
    console.log('Error obteniendo recordatorios por cliente:', error.message);
    throw error;
  }
}

// Crear recordatorio con SP_CREAR_RECORDATORIO
// Crear recordatorio. Si es por fecha -> usar SP_CREAR_RECORDATORIO. Si es por kilometraje -> guardar en JSON.
async function createReminder(reminderData) {
  // reminderData expected keys: type ('date'|'mileage'), clientId, vehicleId, title, description, triggerValue, priority, createdBy
  try {
    if (reminderData.type === 'date') {
      const pool = await getConnection();

      const usuario_id = reminderData.clientId ? parseInt(reminderData.clientId) : null;
      const vehiculo_id = reminderData.vehicleId ? parseInt(reminderData.vehicleId) : null;
      const titulo = reminderData.title || reminderData.titulo || '';
      const descripcion = reminderData.description || reminderData.descripcion || '';
      const fecha_recordatorio = reminderData.triggerValue ? new Date(reminderData.triggerValue) : null;
      const prioridad = reminderData.priority ? parseInt(reminderData.priority) : 3;
      const creado_por = reminderData.createdBy || reminderData.creado_por || 0;

      const request = pool.request();
      request.input('usuario_id', sql.Int, usuario_id);
      request.input('vehiculo_id', sql.Int, vehiculo_id);
      request.input('titulo', sql.NVarChar(100), titulo);
      request.input('descripcion', sql.NVarChar(400), descripcion);
      request.input('fecha_recordatorio', sql.DateTime, fecha_recordatorio);
      request.input('prioridad', sql.TinyInt, prioridad);
      request.input('creado_por', sql.Int, creado_por);

      const result = await request.execute('SP_CREAR_RECORDATORIO');

      if (result && result.recordset && result.recordset[0]) {
        return result.recordset[0];
      }

      return { response: '200 OK', msg: 'Creado', allow: 1 };
    }

    // Siempre usar SP_CREAR_RECORDATORIO (no fallback a JSON)
    const pool2 = await getConnection();
    const req2 = pool2.request();
    const usuario_id = reminderData.clientId ? parseInt(reminderData.clientId) : null;
    const vehiculo_id = reminderData.vehicleId ? parseInt(reminderData.vehicleId) : null;
    const titulo = reminderData.title || '';
    const descripcion = reminderData.description || '';
    const fecha_recordatorio = reminderData.triggerValue ? new Date(reminderData.triggerValue) : null;
    const prioridad2 = reminderData.priority ? parseInt(reminderData.priority) : 3;
    const creado_por2 = reminderData.createdBy || reminderData.creado_por || 0;

    req2.input('usuario_id', sql.Int, usuario_id);
    req2.input('vehiculo_id', sql.Int, vehiculo_id);
    req2.input('titulo', sql.NVarChar(100), titulo);
    req2.input('descripcion', sql.NVarChar(400), descripcion);
    req2.input('fecha_recordatorio', sql.DateTime, fecha_recordatorio);
    req2.input('prioridad', sql.TinyInt, prioridad2);
    req2.input('creado_por', sql.Int, creado_por2);

    const resSP = await req2.execute('SP_CREAR_RECORDATORIO');
    if (resSP && resSP.recordset && resSP.recordset[0]) {
      return resSP.recordset[0];
    }
    return { response: '200 OK', msg: 'Creado', allow: 1 };
  } catch (error) {
    console.error('Error en createReminder:', error);
    throw error;
  }
}

// Actualizar recordatorio - pendiente: implementar SP correspondiente
async function updateReminder(id, updateData) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    const recordatorio_id = id ? parseInt(id) : null;
    const titulo = updateData.title || updateData.titulo || null;
    const descripcion = updateData.description || updateData.descripcion || null;
    // Accept both frontend field names and SP-style names
    const fecha_recordatorio = (updateData.fecha_recordatorio)
      ? new Date(updateData.fecha_recordatorio)
      : (updateData.triggerValue ? new Date(updateData.triggerValue) : null);
    const prioridad = (updateData.prioridad !== undefined && updateData.prioridad !== null)
      ? parseInt(updateData.prioridad)
      : (updateData.priority !== undefined && updateData.priority !== null)
        ? parseInt(updateData.priority)
        : null;
    const editado_por = updateData.editedBy || updateData.editado_por || updateData.editadoPor || null;

    request.input('recordatorio_id', sql.Int, recordatorio_id);
    request.input('titulo', sql.NVarChar(100), titulo);
    request.input('descripcion', sql.NVarChar(400), descripcion);
    request.input('fecha_recordatorio', sql.DateTime, fecha_recordatorio);
    request.input('prioridad', sql.TinyInt, prioridad);
    request.input('editado_por', sql.Int, editado_por);

    const result = await request.execute('SP_ACTUALIZAR_RECORDATORIO');
    if (result && result.recordset && result.recordset[0]) {
      return result.recordset[0];
    }
    return { response: '200 OK', msg: 'Actualizado', allow: 1 };
  } catch (error) {
    throw error;
  }
}

// Eliminar recordatorio - pendiente: implementar SP correspondiente
async function deleteReminder(id) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    const recordatorio_id = id ? parseInt(id) : null;

    request.input('recordatorio_id', sql.Int, recordatorio_id);
    request.input('eliminado_por', sql.Int, null);

    const result = await request.execute('SP_ELIMINAR_RECORDATORIO');
    if (result && result.recordset && result.recordset[0]) {
      return result.recordset[0];
    }
    return { response: '200 OK', msg: 'Eliminado', allow: 1 };
  } catch (error) {
    throw error;
  }
}

// Marcar como completado - pendiente: implementar SP correspondiente
async function completeReminder(id) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    const recordatorio_id = id ? parseInt(id) : null;
    const nuevo_estado = 'Completado';

    request.input('recordatorio_id', sql.Int, recordatorio_id);
    request.input('nuevo_estado', sql.VarChar(50), nuevo_estado);
    request.input('editado_por', sql.Int, null);

    const result = await request.execute('SP_CAMBIAR_ESTADO_RECORDATORIO');
    if (result && result.recordset && result.recordset[0]) {
      return result.recordset[0];
    }
    return { response: '200 OK', msg: 'Actualizado', allow: 1 };
  } catch (error) {
    throw error;
  }
}

// Alternar estado activo - pendiente: implementar SP correspondiente
async function toggleReminderActive(id, payload = {}) {
  try {
    const pool = await getConnection();
    // If payload provides nuevo_estado or editado_por, use them; otherwise infer by reading current state
    let nuevo_estado = payload && payload.nuevo_estado ? String(payload.nuevo_estado) : null;
    const editado_por = payload && (payload.editado_por || payload.editadoPor) ? payload.editado_por || payload.editadoPor : null;

    if (!nuevo_estado) {
      // Obtener estado actual del recordatorio para inferir alternancia
      const lookupReq = pool.request();
      lookupReq.input('recordatorio_id', sql.Int, id ? parseInt(id) : null);
      lookupReq.input('usuario_id', sql.Int, null);
      lookupReq.input('vehiculo_id', sql.Int, null);
      lookupReq.input('estado', sql.VarChar(50), null);
      lookupReq.input('filtro_fecha', sql.VarChar(20), null);
      const lookupRes = await lookupReq.execute('SP_OBTENER_RECORDATORIOS');
      const row = lookupRes && lookupRes.recordset && lookupRes.recordset[0];
      const currentEstado = row ? row.estado : null;

      // Definir nuevo estado por defecto
      nuevo_estado = 'Cancelado';
      if (currentEstado) {
        const s = String(currentEstado).toLowerCase();
        if (s === 'pendiente') {
          nuevo_estado = 'Cancelado';
        } else {
          nuevo_estado = 'Pendiente';
        }
      }
    }

    const req = pool.request();
    req.input('recordatorio_id', sql.Int, id ? parseInt(id) : null);
    req.input('nuevo_estado', sql.VarChar(50), nuevo_estado);
    req.input('editado_por', sql.Int, editado_por);

    const result = await req.execute('SP_CAMBIAR_ESTADO_RECORDATORIO');
    if (result && result.recordset && result.recordset[0]) {
      return result.recordset[0];
    }
    return { response: '200 OK', msg: 'Actualizado', allow: 1 };
  } catch (error) {
    throw error;
  }
}

// Obtener recordatorios próximos a vencer usando SP_OBTENER_RECORDATORIOS
async function getUpcomingReminders() {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('recordatorio_id', sql.Int, null);
    request.input('usuario_id', sql.Int, null);
    request.input('vehiculo_id', sql.Int, null);
    request.input('estado', sql.VarChar(50), null);
    request.input('filtro_fecha', sql.VarChar(20), 'Proximos');

    const result = await request.execute('SP_OBTENER_RECORDATORIOS');
    if (result && result.recordset) {
      return result.recordset.map(mapRecord);
    }
    return [];
  } catch (error) {
    console.error('Error en getUpcomingReminders:', error.message);
    throw error;
  }
}

// Obtener recordatorios vencidos usando SP_OBTENER_RECORDATORIOS
async function getExpiredReminders() {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('recordatorio_id', sql.Int, null);
    request.input('usuario_id', sql.Int, null);
    request.input('vehiculo_id', sql.Int, null);
    request.input('estado', sql.VarChar(50), null);
    request.input('filtro_fecha', sql.VarChar(20), 'Vencidos');

    const result = await request.execute('SP_OBTENER_RECORDATORIOS');
    if (result && result.recordset) {
      return result.recordset.map(mapRecord);
    }
    return [];
  } catch (error) {
    console.error('Error en getExpiredReminders:', error.message);
    throw error;
  }
}

module.exports = {
  getAllReminders,
  getRemindersByClient,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  toggleReminderActive,
  getUpcomingReminders,
  getExpiredReminders
};
