// Servicio para gestión de notificaciones en el frontend
const API_BASE = 'http://localhost:8080/api/notifications';

export interface Notification {
  id: string;
  clientId: string;
  type: 'ot_created' | 'ot_status_change' | 'task_status_change' | 'appointment_approved' | 'appointment_status_change';
  title: string;
  message: string;
  metadata: {
    otId?: number;
    numeroOt?: string;
    taskId?: number;
    appointmentId?: number;
    numeroCita?: string;
    newStatus?: string;
    vehicleId?: number;
    placa?: string;
    serviceName?: string;
    fechaInicio?: string;
    tipoServicio?: string;
  };
  isRead: boolean;
  createdAt: string;
  sentAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification | Notification[];
  count?: number;
  unreadCount?: number;
  message?: string;
  error?: string;
}

class NotificationsService {
  /**
   * Obtener todas las notificaciones de un cliente
   */
  async getClientNotifications(clientId: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE}/client/${clientId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo notificaciones del cliente:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(clientId: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE}/client/${clientId}/unread-count`);
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error obteniendo conteo de no leídas:', error);
      return 0;
    }
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE}/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Marcar todas las notificaciones de un cliente como leídas
   */
  async markAllAsRead(clientId: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE}/client/${clientId}/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE}/${notificationId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener todas las notificaciones (admin)
   */
  async getAllNotifications(): Promise<NotificationResponse> {
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo todas las notificaciones:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear una notificación manualmente (admin)
   */
  async createNotification(notificationData: {
    clientId: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<NotificationResponse> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creando notificación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener icono según el tipo de notificación
   */
  getNotificationIcon(type: Notification['type']): string {
    const icons = {
      'ot_created': '🔧',
      'ot_status_change': '📋',
      'task_status_change': '✅',
      'appointment_approved': '📅',
      'appointment_status_change': '📆'
    };
    return icons[type] || '📬';
  }

  /**
   * Obtener color según el tipo de notificación
   */
  getNotificationColor(type: Notification['type']): string {
    const colors = {
      'ot_created': 'blue',
      'ot_status_change': 'purple',
      'task_status_change': 'green',
      'appointment_approved': 'green',
      'appointment_status_change': 'yellow'
    };
    return colors[type] || 'gray';
  }
}

export default new NotificationsService();
