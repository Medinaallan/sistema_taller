// Servicio para gestión de notificaciones automáticas a clientes
const fs = require('fs').promises;
const path = require('path');

const NOTIFICATIONS_FILE = path.join(__dirname, '../data/notifications.json');

class NotificationsService {
  constructor() {
    this.initializeFile();
  }

  async initializeFile() {
    try {
      await fs.access(NOTIFICATIONS_FILE);
    } catch {
      // Si el archivo no existe, crear uno nuevo
      await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify({ notifications: [] }, null, 2));
      console.log('✅ Archivo de notificaciones creado');
    }
  }

  async readNotifications() {
    try {
      const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error leyendo notificaciones:', error);
      return { notifications: [] };
    }
  }

  async writeNotifications(data) {
    try {
      await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error escribiendo notificaciones:', error);
      return false;
    }
  }

  /**
   * Crear una notificación
   * @param {Object} notificationData - Datos de la notificación
   * @param {string} notificationData.clientId - ID del cliente
   * @param {string} notificationData.type - Tipo de notificación (ot_created, ot_status_change, task_status_change, appointment_approved)
   * @param {string} notificationData.title - Título de la notificación
   * @param {string} notificationData.message - Mensaje de la notificación
   * @param {Object} notificationData.metadata - Metadata adicional (otId, taskId, appointmentId, etc.)
   */
  async createNotification(notificationData) {
    try {
      const data = await this.readNotifications();
      
      const newNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientId: notificationData.clientId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        metadata: notificationData.metadata || {},
        isRead: false,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString()
      };

      data.notifications.push(newNotification);
      await this.writeNotifications(data);
      
      console.log(`✅ Notificación creada para cliente ${notificationData.clientId}: ${notificationData.title}`);
      return newNotification;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un cliente
   */
  async getClientNotifications(clientId) {
    try {
      const data = await this.readNotifications();
      const clientNotifications = data.notifications.filter(n => n.clientId === clientId);
      
      // Ordenar por fecha descendente (más recientes primero)
      clientNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return clientNotifications;
    } catch (error) {
      console.error('Error obteniendo notificaciones del cliente:', error);
      return [];
    }
  }

  /**
   * Obtener todas las notificaciones
   */
  async getAllNotifications() {
    try {
      const data = await this.readNotifications();
      return data.notifications || [];
    } catch (error) {
      console.error('Error obteniendo todas las notificaciones:', error);
      return [];
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId) {
    try {
      const data = await this.readNotifications();
      const notification = data.notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        throw new Error('Notificación no encontrada');
      }
      
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
      
      await this.writeNotifications(data);
      return notification;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones de un cliente como leídas
   */
  async markAllAsRead(clientId) {
    try {
      const data = await this.readNotifications();
      let count = 0;
      
      data.notifications.forEach(n => {
        if (n.clientId === clientId && !n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
          count++;
        }
      });
      
      await this.writeNotifications(data);
      return count;
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId) {
    try {
      const data = await this.readNotifications();
      const index = data.notifications.findIndex(n => n.id === notificationId);
      
      if (index === -1) {
        throw new Error('Notificación no encontrada');
      }
      
      data.notifications.splice(index, 1);
      await this.writeNotifications(data);
      return true;
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  }

  // ============= MÉTODOS DE NOTIFICACIÓN AUTOMÁTICA =============

  /**
   * Notificar cuando se crea una OT
   */
  async notifyOTCreated(clientId, otData) {
    return this.createNotification({
      clientId: clientId.toString(),
      type: 'ot_created',
      title: 'Nueva Orden de Trabajo Creada',
      message: `Se ha creado la orden de trabajo #${otData.numero_ot || otData.ot_id} para su vehículo${otData.placa ? ' ' + otData.placa : ''}.`,
      metadata: {
        otId: otData.ot_id,
        numeroOt: otData.numero_ot,
        vehicleId: otData.vehiculo_id,
        placa: otData.placa
      }
    });
  }

  /**
   * Notificar cuando cambia el estado de una OT
   */
  async notifyOTStatusChange(clientId, otData, newStatus) {
    const statusMessages = {
      'Pendiente': 'Su orden de trabajo está pendiente de revisión.',
      'En Proceso': 'Su vehículo está siendo atendido en este momento.',
      'En Espera': 'Su orden de trabajo está en espera.',
      'Completada': '¡Su vehículo está listo! La orden de trabajo ha sido completada.',
      'Cancelada': 'La orden de trabajo ha sido cancelada.',
      'Facturada': 'La orden de trabajo ha sido facturada.',
      'Entregada': 'Su vehículo ha sido entregado.'
    };

    return this.createNotification({
      clientId: clientId.toString(),
      type: 'ot_status_change',
      title: `OT ${otData.numero_ot || otData.ot_id}: ${newStatus}`,
      message: statusMessages[newStatus] || `El estado de su orden de trabajo ha cambiado a: ${newStatus}`,
      metadata: {
        otId: otData.ot_id,
        numeroOt: otData.numero_ot,
        newStatus: newStatus,
        vehicleId: otData.vehiculo_id,
        placa: otData.placa
      }
    });
  }

  /**
   * Notificar cuando cambia el estado de una tarea
   */
  async notifyTaskStatusChange(clientId, taskData, newStatus) {
    const statusMessages = {
      'pendiente': 'Una tarea de su orden de trabajo está pendiente.',
      'en_proceso': 'Se está trabajando en una tarea de su orden de trabajo.',
      'completada': '¡Una tarea de su orden de trabajo ha sido completada!'
    };

    return this.createNotification({
      clientId: clientId.toString(),
      type: 'task_status_change',
      title: `Tarea: ${newStatus.replace('_', ' ').toUpperCase()}`,
      message: statusMessages[newStatus] || `El estado de una tarea ha cambiado a: ${newStatus}`,
      metadata: {
        taskId: taskData.tarea_id || taskData.id,
        newStatus: newStatus,
        otId: taskData.ot_id,
        serviceName: taskData.servicio || taskData.nombre_servicio
      }
    });
  }

  /**
   * Notificar cuando una cita es aprobada
   */
  async notifyAppointmentApproved(clientId, appointmentData) {
    return this.createNotification({
      clientId: clientId.toString(),
      type: 'appointment_approved',
      title: 'Cita Aprobada',
      message: `Su cita #${appointmentData.numero_cita} ha sido aprobada para el ${new Date(appointmentData.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      metadata: {
        appointmentId: appointmentData.cita_id,
        numeroCita: appointmentData.numero_cita,
        fechaInicio: appointmentData.fecha_inicio,
        tipoServicio: appointmentData.tipo_servicio
      }
    });
  }

  /**
   * Notificar cuando una cita cambia de estado
   */
  async notifyAppointmentStatusChange(clientId, appointmentData, newStatus) {
    const statusMessages = {
      'Pendiente': 'Su cita está pendiente de confirmación.',
      'Confirmada': 'Su cita ha sido confirmada.',
      'En Proceso': 'Su cita está en proceso.',
      'Completada': 'Su cita ha sido completada.',
      'Cancelada': 'Su cita ha sido cancelada.',
      'No Asistió': 'Hemos notado que no asistió a su cita.'
    };

    return this.createNotification({
      clientId: clientId.toString(),
      type: 'appointment_status_change',
      title: `Cita ${appointmentData.numero_cita}: ${newStatus}`,
      message: statusMessages[newStatus] || `El estado de su cita ha cambiado a: ${newStatus}`,
      metadata: {
        appointmentId: appointmentData.cita_id,
        numeroCita: appointmentData.numero_cita,
        newStatus: newStatus,
        fechaInicio: appointmentData.fecha_inicio
      }
    });
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(clientId) {
    try {
      const notifications = await this.getClientNotifications(clientId);
      return notifications.filter(n => !n.isRead).length;
    } catch (error) {
      console.error('Error obteniendo conteo de no leídas:', error);
      return 0;
    }
  }
}

module.exports = new NotificationsService();
