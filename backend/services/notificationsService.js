// Servicio de notificaciones usando SQL Server y SPs
const { getConnection, sql } = require('../config/database');

class NotificationsService {
  constructor() {}

  // Crear notificación (SP_CREAR_NOTIFICACION)
  async createNotification(usuario_id, titulo, cuerpo) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('usuario_id', sql.Int, usuario_id)
        .input('titulo', sql.NVarChar(100), titulo)
        .input('cuerpo', sql.NVarChar(400), cuerpo)
        .execute('SP_CREAR_NOTIFICACION');

      // El SP puede devolver recordset con response/msg/allow/notificacion_id
      return result.recordset && result.recordset[0] ? result.recordset[0] : { response: '200 OK', msg: 'Creado', allow: 1 };
    } catch (error) {
      console.error('Error ejecutando SP_CREAR_NOTIFICACION:', error);
      throw error;
    }
  }

  // Obtener notificaciones de usuario (SP_OBTENER_NOTIFICACIONES_USUARIO)
  async getClientNotifications(usuario_id, solo_no_leidas = 0) {
    try {
      const pool = await getConnection();
      const request = pool.request()
        .input('usuario_id', sql.Int, usuario_id)
        .input('solo_no_leidas', sql.Bit, solo_no_leidas ? 1 : 0);

      const result = await request.execute('SP_OBTENER_NOTIFICACIONES_USUARIO');
      const rows = result.recordset || [];
      // Normalizar campos para frontend
      const normalized = rows.map(r => {
        const createdRaw = r.fecha_creacion || r.created_at || r.createdAt || r.sent_at || r.enviado_en || r.fecha || null;
        let createdAt = null;
        if (createdRaw) {
          try {
            const d = new Date(createdRaw);
            if (!isNaN(d.getTime())) createdAt = d.toISOString();
          } catch (e) {
            createdAt = null;
          }
        }
        // Por seguridad, si no viene fecha desde el SP, usar ahora para evitar 'Invalid Date' en frontend
        if (!createdAt) createdAt = new Date().toISOString();

        return {
          id: r.notificacion_id || r.id || r.notification_id || null,
          clientId: r.usuario_id || r.client_id || r.usuarioId || null,
          type: r.tipo || r.type || null,
          title: r.titulo || r.title || r.subject || '',
          message: r.cuerpo || r.message || r.body || '',
          metadata: {
            otId: r.ot_id || r.orden_trabajo_id || null,
            numeroOt: r.numero_ot || r.numeroOT || null,
            taskId: r.tarea_id || r.ot_tarea_id || null,
            appointmentId: r.cita_id || r.appointment_id || null,
            numeroCita: r.numero_cita || null,
            newStatus: r.estado || r.new_status || null,
            vehicleId: r.vehiculo_id || r.vehicle_id || null,
            placa: r.placa || null,
            serviceName: r.servicio_nombre || r.tipo_servicio_nombre || null,
            raw: r
          },
          isRead: !!(r.leida === 1 || r.isRead === true || r.read === 1 || r.leido === 1),
          createdAt: createdAt,
          sentAt: createdAt,
          readAt: r.fecha_leida || r.read_at || r.leida_en || null
        };
      });

      return normalized;
    } catch (error) {
      console.error('Error ejecutando SP_OBTENER_NOTIFICACIONES_USUARIO:', error);
      throw error;
    }
  }

  // Obtener todas las notificaciones (admin) - llama al SP_OBTENER_NOTIFICACIONES_USUARIO con usuario_id = 0
  async getAllNotifications() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('usuario_id', sql.Int, 0)
        .input('solo_no_leidas', sql.Bit, 0)
        .execute('SP_OBTENER_NOTIFICACIONES_USUARIO');

      const rows = result.recordset || [];
      const normalized = rows.map(r => {
        const createdRaw = r.fecha_creacion || r.created_at || r.createdAt || r.sent_at || r.enviado_en || r.fecha || null;
        let createdAt = null;
        if (createdRaw) {
          try {
            const d = new Date(createdRaw);
            if (!isNaN(d.getTime())) createdAt = d.toISOString();
          } catch (e) {
            createdAt = null;
          }
        }
        if (!createdAt) createdAt = new Date().toISOString();

        return {
          id: r.notificacion_id || r.id || r.notification_id || null,
          clientId: r.usuario_id || r.client_id || r.usuarioId || null,
          type: r.tipo || r.type || null,
          title: r.titulo || r.title || r.subject || '',
          message: r.cuerpo || r.message || r.body || '',
          metadata: { raw: r },
          isRead: !!(r.leida === 1 || r.isRead === true || r.read === 1 || r.leido === 1),
          createdAt: createdAt,
          sentAt: createdAt,
          readAt: r.fecha_leida || r.read_at || r.leida_en || null
        };
      });

      return normalized;
    } catch (error) {
      console.error('Error obteniendo todas las notificaciones via SP_OBTENER_NOTIFICACIONES_USUARIO:', error);
      throw error;
    }
  }

  // Marcar notificación leída (SP_MARCAR_NOTIFICACION_LEIDA)
  async markAsRead(notificacion_id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('notificacion_id', sql.Int, notificacion_id)
        .execute('SP_MARCAR_NOTIFICACION_LEIDA');
      return result.recordset && result.recordset[0] ? result.recordset[0] : { response: '200 OK', msg: 'Marcado', allow: 1 };
    } catch (error) {
      console.error('Error ejecutando SP_MARCAR_NOTIFICACION_LEIDA:', error);
      throw error;
    }
  }

  // Marcar todas como leídas (SP_MARCAR_TODAS_NOTIFICACIONES_LEIDAS)
  async markAllAsRead(usuario_id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('usuario_id', sql.Int, usuario_id)
        .execute('SP_MARCAR_TODAS_NOTIFICACIONES_LEIDAS');
      return result.recordset && result.recordset[0] ? result.recordset[0] : { response: '200 OK', msg: 'Marcadas', allow: 1 };
    } catch (error) {
      console.error('Error ejecutando SP_MARCAR_TODAS_NOTIFICACIONES_LEIDAS:', error);
      throw error;
    }
  }

  // Eliminar notificación (SP_ELIMINAR_NOTIFICACION)
  async deleteNotification(notificacion_id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('notificacion_id', sql.Int, notificacion_id)
        .execute('SP_ELIMINAR_NOTIFICACION');
      return result.recordset && result.recordset[0] ? result.recordset[0] : { response: '200 OK', msg: 'Eliminado', allow: 1 };
    } catch (error) {
      console.error('Error ejecutando SP_ELIMINAR_NOTIFICACION:', error);
      throw error;
    }
  }

  // Obtener conteo de no leídas para compatibilidad
  async getUnreadCount(usuario_id) {
    try {
      const list = await this.getClientNotifications(parseInt(usuario_id, 10));
      return Array.isArray(list) ? list.filter(n => !n.isRead && !n.leida && !n.read && !n.leido).length : 0;
    } catch (error) {
      console.error('Error obteniendo conteo de notificaciones no leídas:', error);
      throw error;
    }
  }

  // Helpers para compatibilidad con llamadas existentes en routes
  async notifyOTCreated(clientId, otData) {
    const titulo = 'Nueva Orden de Trabajo creada';
    const numero = otData.numero_ot || otData.ot_id || otData.id || 'N/A';
    const placa = otData.placa || otData.vehiculo_placa || '';
    const cuerpo = `Se creó la Orden de Trabajo #${numero}${placa ? ` (vehículo ${placa})` : ''}. Revise el estado y los detalles.`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }

  async notifyOTStatusChange(clientId, otData, newStatus) {
    const numero = otData.numero_ot || otData.ot_id || otData.id || 'N/A';
    const titulo = `Orden #${numero}: estado ${newStatus}`;
    const mensajes = {
      'Pendiente': 'La orden quedó marcada como Pendiente.',
      'En Proceso': 'La orden está En Proceso. Nuestro equipo trabaja en su vehículo.',
      'En Espera': 'La orden se encuentra En Espera.',
      'Completada': 'La orden se ha completado. Revise detalles y próximos pasos.',
      'Cancelada': 'La orden ha sido cancelada.',
      'Facturada': 'La orden fue facturada.',
      'Entregada': 'La orden fue entregada al cliente.'
    };
    const cuerpo = mensajes[newStatus] || `El estado de la orden ha cambiado a: ${newStatus}`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }

  async notifyTaskStatusChange(clientId, taskData, newStatus) {
    const tareaNombre = taskData && (taskData.nombre || taskData.descripcion || taskData.title) ? (taskData.nombre || taskData.descripcion || taskData.title) : '';
    const otNumero = taskData && (taskData.numero_ot || taskData.ot_id) ? (taskData.numero_ot || taskData.ot_id) : '';
    const titulo = `Tarea ${tareaNombre ? `(${tareaNombre}) ` : ''} - ${String(newStatus).replace('_', ' ')}`;
    const mensajes = {
      'pendiente': `La tarea ${tareaNombre || ''} está pendiente.${otNumero ? ` (OT #${otNumero})` : ''}`,
      'en_proceso': `Se inició la tarea ${tareaNombre || ''}.${otNumero ? ` (OT #${otNumero})` : ''}`,
      'completada': `Se completó la tarea ${tareaNombre || ''}.${otNumero ? ` (OT #${otNumero})` : ''}`
    };
    const cuerpo = mensajes[newStatus] || `El estado de la tarea ha cambiado a: ${newStatus}${otNumero ? ` (OT #${otNumero})` : ''}`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }

  async notifyAppointmentApproved(clientId, appointmentData) {
    const titulo = 'Cita aprobada';
    const num = appointmentData.numero_cita || appointmentData.id || appointmentData.cita_id || 'N/A';
    const fecha = appointmentData.fecha_inicio ? new Date(appointmentData.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const cuerpo = `La cita #${num} fue aprobada${fecha ? ` para el ${fecha}` : ''}. Revise detalles en su panel.`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }

  async notifyAppointmentStatusChange(clientId, appointmentData, newStatus) {
    const num = appointmentData.numero_cita || appointmentData.id || appointmentData.cita_id || 'N/A';
    const titulo = `Cita #${num}: ${newStatus}`;
    const mensajes = {
      'Pendiente': 'La cita está pendiente.',
      'Confirmada': 'La cita ha sido confirmada.',
      'En Proceso': 'La cita está en proceso.',
      'Completada': 'La cita fue completada.',
      'Cancelada': 'La cita fue cancelada.',
      'No Asistió': 'No asistió a la cita programada.'
    };
    const cuerpo = mensajes[newStatus] || `El estado de la cita ha cambiado a: ${newStatus}`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }

  // Notificaciones para cotizaciones
  async notifyQuotationStatusChange(clientId, quotationData, newStatus) {
    const numero = quotationData && (quotationData.numero || quotationData.id || quotationData.cotizacion_id) ? (quotationData.numero || quotationData.id || quotationData.cotizacion_id) : 'N/A';
    const titulo = `Cotización #${numero}: ${newStatus}`;
    const cuerpo = `La cotización #${numero} cambió su estado a: ${newStatus}. Revise el detalle en su panel.`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }

  // Notificaciones para facturas
  async notifyInvoiceStatusChange(clientId, invoiceData, newStatus) {
    const numero = invoiceData && (invoiceData.numero || invoiceData.id || invoiceData.invoice_id) ? (invoiceData.numero || invoiceData.id || invoiceData.invoice_id) : 'N/A';
    const titulo = `Factura #${numero}: ${newStatus}`;
    const cuerpo = `La factura #${numero} cambió su estado a: ${newStatus}. Revise el comprobante y el historial.`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }

  // Notificación para vehículo agregado
  async notifyVehicleAdded(clientId, vehicleData) {
    const placa = vehicleData && (vehicleData.placa || vehicleData.vin || vehicleData.plate) ? (vehicleData.placa || vehicleData.vin || vehicleData.plate) : '';
    const modelo = vehicleData && (vehicleData.modelo || vehicleData.marca || vehicleData.model) ? (vehicleData.modelo || vehicleData.marca || vehicleData.model) : '';
    const titulo = 'Vehículo agregado';
    const cuerpo = `Se registró un nuevo vehículo${placa ? ` (placa ${placa})` : ''}${modelo ? ` - ${modelo}` : ''}. Ahora puede agendar servicios para este vehículo.`;
    return this.createNotification(parseInt(clientId, 10), titulo, cuerpo);
  }
}

module.exports = new NotificationsService();
