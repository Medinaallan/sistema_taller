import { appConfig } from '../config/config';
// Servicio para gestión de recordatorios de mantenimiento

const API_BASE = appConfig.apiBaseUrl;

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
      const response = await fetch(`${API_BASE}/reminders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      return data;
    } catch (error) {
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
      const response = await fetch(`${API_BASE}/reminders/client/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      return data;
    } catch (error) {
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
      const response = await fetch(`${API_BASE}/reminders/upcoming?days=${dias}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      return data;
    } catch (error) {
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
      const response = await fetch(`${API_BASE}/reminders/expired`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      return data;
    } catch (error) {
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
      const response = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (err) {
        const text = await response.text().catch(() => '');
        return { success: false, message: `HTTP ${response.status}`, error: text };
      }

      if (!response.ok) {
        return { success: false, message: data?.message || data?.msg || `HTTP ${response.status}`, error: data };
      }

      if (data.success) {
      } else {
      }

      return data;
    } catch (error) {
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
      const payload: any = {
        recordatorio_id: id ? parseInt(id) : null,
        titulo: updateData.title || updateData.titulo || '',
        descripcion: updateData.description || updateData.descripcion || '',
        fecha_recordatorio: typeof updateData.triggerValue === 'string' && updateData.triggerValue.length === 10
          ? `${updateData.triggerValue}T00:00:00`
          : updateData.triggerValue || null,
        prioridad: (updateData as any).priority ?? (updateData as any).prioridad ?? 3,
        editado_por: (updateData as any).editedBy || (updateData as any).editado_por || null
      };

      const response = await fetch(`${API_BASE}/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Error al actualizar recordatorio', error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Eliminar un recordatorio
   */
  async eliminarRecordatorio(id: string): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${API_BASE}/reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
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
      const payload = {
        recordatorio_id: id ? parseInt(id) : null,
        nuevo_estado: 'Completado',
        editado_por: null
      };

      const response = await fetch(`${API_BASE}/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Error al completar recordatorio', error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Alternar estado activo del recordatorio
   */
  async alternarEstadoRecordatorio(id: string): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${API_BASE}/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Error al cambiar estado del recordatorio', error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async alternarEstadoRecordatorioWithPayload(id: string, nuevoEstado?: string | null, editadoPor?: number | null): Promise<ReminderResponse> {
    try {
      const payload = {
        recordatorio_id: id ? parseInt(id) : null,
        nuevo_estado: nuevoEstado ?? null,
        editado_por: editadoPor ?? null
      };

      const response = await fetch(`${API_BASE}/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Error al cambiar estado del recordatorio', error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Enviar notificación de recordatorio al cliente
   */
  async enviarNotificacion(id: string): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${API_BASE}/reminders/${id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar notificación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

export default new RemindersService();
