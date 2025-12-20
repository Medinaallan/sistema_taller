// Servicio para manejar logs del sistema
import type { Log } from '../tipos';

const API_URL = 'http://localhost:8080/api';

export interface LogFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  entity?: string;
  severity?: string;
  search?: string;
}

export interface LogsResponse {
  logs: Log[];
  total: number;
  page: number;
  totalPages: number;
}

class LogService {
  // Obtener logs con filtros y paginación
  async getLogs(page: number = 1, limit: number = 50, filters?: LogFilters): Promise<LogsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await fetch(`${API_URL}/logs?${params}`);
    if (!response.ok) {
      throw new Error('Error fetching logs');
    }
    return response.json();
  }

  // Crear un nuevo log
  async createLog(logData: Omit<Log, 'id' | 'timestamp'>): Promise<Log> {
    const response = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      throw new Error('Error creating log');
    }
    return response.json();
  }

  // Exportar logs como archivo
  async exportLogs(filters?: LogFilters): Promise<Blob> {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_URL}/logs/export?${params}`);
    
    if (!response.ok) {
      throw new Error('Error exporting logs');
    }
    return response.blob();
  }

  // Limpiar logs antiguos
  async cleanOldLogs(daysOld: number = 90): Promise<{ deleted: number }> {
    const response = await fetch(`${API_URL}/logs/clean`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ daysOld }),
    });

    if (!response.ok) {
      throw new Error('Error cleaning logs');
    }
    return response.json();
  }

  // Helper para crear logs comunes
  createUserLog(action: Log['action'], entity: string, description: string, entityId?: string, severity: Log['severity'] = 'MEDIUM'): Omit<Log, 'id' | 'timestamp'> {
    return {
      userId: 'current-user', // Se reemplazará en el backend con el usuario real
      userName: 'Current User',
      userRole: 'admin',
      action,
      entity,
      entityId,
      description,
      severity,
      ipAddress: '', // Se añadirá en el backend
      userAgent: navigator.userAgent
    };
  }
}

export const logService = new LogService();