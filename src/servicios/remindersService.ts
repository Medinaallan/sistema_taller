// Servicio para gestión de recordatorios de mantenimiento

const API_BASE = 'http://localhost:8080/api';

export interface Reminder {
  id: string;
  vehicleId: string | null;
  clientId: string;
  type: 'date' | 'mileage';
  title: string;
  description: string;
  triggerValue: number | Date | string;
  currentValue?: number;
  isActive: boolean;
  isCompleted: boolean;
  services: string[];
  notificationSent?: boolean;
  createdAt: string | Date;
  triggerDate?: string | Date | null;
  createdBy?: string | null;
  updatedAt?: string;
  completedAt?: string;
  lastNotificationSent?: string;
}

export interface ReminderResponse {
  success: boolean;
  data?: Reminder | Reminder[];
  count?: number;
  message?: string;
  error?: string;
  notificationDetails?: {
    reminderId: string;
    title: string;
    clientId: string;
    type: string;
  };
}

class RemindersService {
  /**
   * Obtener todos los recordatorios
   */
  async obtenerRecordatorios(): Promise<ReminderResponse> {
    try {
      console.log('📋 Obteniendo todos los recordatorios...');
      
      const response = await fetch(`${API_BASE}/reminders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('✅ Recordatorios obtenidos:', data);

      return data;
    } catch (error) {
      console.error('❌ Error al obtener recordatorios:', error);
      return {
        success: false,
        message: 'Error al obtener recordatorios',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener recordatorios de un cliente específico
   */
  async obtenerRecordatoriosPorCliente(clientId: string): Promise<ReminderResponse> {
    try {
      console.log(`📋 Obteniendo recordatorios del cliente ${clientId}...`);
      
      const response = await fetch(`${API_BASE}/reminders/client/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('✅ Recordatorios del cliente obtenidos:', data);

      return data;
    } catch (error) {
      console.error('❌ Error al obtener recordatorios del cliente:', error);
      return {
        success: false,
        message: 'Error al obtener recordatorios del cliente',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener recordatorios próximos a vencer
   */
  async obtenerRecordatoriosProximos(dias: number = 7): Promise<ReminderResponse> {
    try {
      console.log(`📅 Obteniendo recordatorios próximos (${dias} días)...`);
      
      const response = await fetch(`${API_BASE}/reminders/upcoming?days=${dias}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('✅ Recordatorios próximos obtenidos:', data);

      return data;
    } catch (error) {
      console.error('❌ Error al obtener recordatorios próximos:', error);
      return {
        success: false,
        message: 'Error al obtener recordatorios próximos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener recordatorios vencidos
   */
  async obtenerRecordatoriosVencidos(): Promise<ReminderResponse> {
    try {
      console.log('⏰ Obteniendo recordatorios vencidos...');
      
      const response = await fetch(`${API_BASE}/reminders/expired`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('✅ Recordatorios vencidos obtenidos:', data);

      return data;
    } catch (error) {
      console.error('❌ Error al obtener recordatorios vencidos:', error);
      return {
        success: false,
        message: 'Error al obtener recordatorios vencidos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear un nuevo recordatorio
   */
  async crearRecordatorio(reminderData: Partial<Reminder>): Promise<ReminderResponse> {
    try {
      console.log('➕ Creando nuevo recordatorio:', reminderData);
      
      const response = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Recordatorio creado exitosamente:', data.data);
      } else {
        console.error('❌ Error al crear recordatorio:', data.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Error al crear recordatorio:', error);
      return {
        success: false,
        message: 'Error al crear recordatorio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar un recordatorio existente
   */
  async actualizarRecordatorio(id: string, updateData: Partial<Reminder>): Promise<ReminderResponse> {
    try {
      console.log(`✏️ Actualizando recordatorio ${id}:`, updateData);
      
      const response = await fetch(`${API_BASE}/reminders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Recordatorio actualizado exitosamente:', data.data);
      } else {
        console.error('❌ Error al actualizar recordatorio:', data.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Error al actualizar recordatorio:', error);
      return {
        success: false,
        message: 'Error al actualizar recordatorio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar un recordatorio
   */
  async eliminarRecordatorio(id: string): Promise<ReminderResponse> {
    try {
      console.log(`🗑️ Eliminando recordatorio ${id}...`);
      
      const response = await fetch(`${API_BASE}/reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Recordatorio eliminado exitosamente');
      } else {
        console.error('❌ Error al eliminar recordatorio:', data.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Error al eliminar recordatorio:', error);
      return {
        success: false,
        message: 'Error al eliminar recordatorio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Marcar recordatorio como completado
   */
  async completarRecordatorio(id: string): Promise<ReminderResponse> {
    try {
      console.log(`✔️ Marcando recordatorio ${id} como completado...`);
      
      const response = await fetch(`${API_BASE}/reminders/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Recordatorio marcado como completado');
      } else {
        console.error('❌ Error al completar recordatorio:', data.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Error al completar recordatorio:', error);
      return {
        success: false,
        message: 'Error al completar recordatorio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Alternar estado activo del recordatorio
   */
  async alternarEstadoRecordatorio(id: string): Promise<ReminderResponse> {
    try {
      console.log(`🔄 Alternando estado del recordatorio ${id}...`);
      
      const response = await fetch(`${API_BASE}/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Estado del recordatorio actualizado');
      } else {
        console.error('❌ Error al cambiar estado del recordatorio:', data.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Error al cambiar estado del recordatorio:', error);
      return {
        success: false,
        message: 'Error al cambiar estado del recordatorio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Enviar notificación de recordatorio al cliente
   */
  async enviarNotificacion(id: string): Promise<ReminderResponse> {
    try {
      console.log(`📧 Enviando notificación para recordatorio ${id}...`);
      
      const response = await fetch(`${API_BASE}/reminders/${id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Notificación enviada exitosamente:', data.notificationDetails);
      } else {
        console.error('❌ Error al enviar notificación:', data.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Error al enviar notificación:', error);
      return {
        success: false,
        message: 'Error al enviar notificación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

export default new RemindersService();
