// Servicio para generar logs automáticos de acciones de negocio
import { logService } from './logService';
import type { Log } from '../tipos';

interface BusinessLogData {
  action: Log['action'];
  entity: string;
  entityId?: string;
  description: string;
  details?: any;
  severity?: Log['severity'];
}

class BusinessLogService {
  // Helper para obtener información del usuario actual (se puede mejorar con contexto real)
  private getCurrentUser() {
    return {
      userId: 'current-user', // TODO: obtener del contexto de autenticación
      userName: 'Usuario Actual', // TODO: obtener del contexto de autenticación  
      userRole: 'admin' // TODO: obtener del contexto de autenticación
    };
  }

  // Crear log de negocio
  async createBusinessLog(data: BusinessLogData): Promise<void> {
    try {
      const user = this.getCurrentUser();
      
      const logEntry: Omit<Log, 'id' | 'timestamp'> = {
        userId: user.userId,
        userName: user.userName,
        userRole: user.userRole as Log['userRole'],
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        details: data.details,
        severity: data.severity || 'MEDIUM',
        ipAddress: '', // Se añadirá en el backend
        userAgent: navigator.userAgent
      };

      await logService.createLog(logEntry);
    } catch (error) {
      console.error('Error creando log de negocio:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  }

  // Logs específicos para clientes
  async logClientCreated(clientData: any): Promise<void> {
    await this.createBusinessLog({
      action: 'CREATE',
      entity: 'client',
      entityId: clientData.id,
      description: `Nuevo cliente registrado: ${clientData.name || clientData.nombre}`,
      details: {
        name: clientData.name || clientData.nombre,
        email: clientData.email,
        phone: clientData.phone || clientData.telefono
      },
      severity: 'MEDIUM'
    });
  }

  async logClientUpdated(clientId: string, clientName: string, changes: any): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'client',
      entityId: clientId,
      description: `Cliente actualizado: ${clientName}`,
      details: { changes },
      severity: 'LOW'
    });
  }

  async logClientDeleted(clientId: string, clientName: string): Promise<void> {
    await this.createBusinessLog({
      action: 'DELETE',
      entity: 'client',
      entityId: clientId,
      description: `Cliente eliminado: ${clientName}`,
      severity: 'HIGH'
    });
  }

  // Logs específicos para vehículos
  async logVehicleCreated(vehicleData: any): Promise<void> {
    await this.createBusinessLog({
      action: 'CREATE',
      entity: 'vehicle',
      entityId: vehicleData.id,
      description: `Vehículo registrado: ${vehicleData.brand} ${vehicleData.model} (${vehicleData.licensePlate || vehicleData.plate})`,
      details: {
        brand: vehicleData.brand,
        model: vehicleData.model,
        year: vehicleData.year,
        licensePlate: vehicleData.licensePlate || vehicleData.plate,
        clientId: vehicleData.clientId
      },
      severity: 'MEDIUM'
    });
  }

  async logVehicleUpdated(vehicleId: string, vehicleInfo: string, changes: any): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'vehicle',
      entityId: vehicleId,
      description: `Vehículo actualizado: ${vehicleInfo}`,
      details: { changes },
      severity: 'LOW'
    });
  }

  // Logs específicos para citas
  async logAppointmentCreated(appointmentData: any): Promise<void> {
    await this.createBusinessLog({
      action: 'CREATE',
      entity: 'appointment',
      entityId: appointmentData.id,
      description: `Nueva cita programada para ${appointmentData.clientName} - ${appointmentData.date}`,
      details: {
        clientId: appointmentData.clientId,
        clientName: appointmentData.clientName,
        vehicleId: appointmentData.vehicleId,
        date: appointmentData.date,
        time: appointmentData.time,
        service: appointmentData.service
      },
      severity: 'MEDIUM'
    });
  }

  async logAppointmentApproved(appointmentId: string, appointmentInfo: string): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'appointment',
      entityId: appointmentId,
      description: `Cita aprobada: ${appointmentInfo}`,
      details: { status: 'approved' },
      severity: 'MEDIUM'
    });
  }

  async logAppointmentCancelled(appointmentId: string, appointmentInfo: string, reason?: string): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'appointment',
      entityId: appointmentId,
      description: `Cita cancelada: ${appointmentInfo}${reason ? ` - Razón: ${reason}` : ''}`,
      details: { status: 'cancelled', reason },
      severity: 'HIGH'
    });
  }

  // Logs específicos para cotizaciones
  async logQuotationCreated(quotationData: any): Promise<void> {
    await this.createBusinessLog({
      action: 'CREATE',
      entity: 'quotation',
      entityId: quotationData.id,
      description: `Cotización creada para ${quotationData.clientName} - Total: $${quotationData.total}`,
      details: {
        clientId: quotationData.clientId,
        clientName: quotationData.clientName,
        vehicleId: quotationData.vehicleId,
        total: quotationData.total,
        services: quotationData.services
      },
      severity: 'MEDIUM'
    });
  }

  async logQuotationSent(quotationId: string, quotationInfo: string, method: string): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'quotation',
      entityId: quotationId,
      description: `Cotización enviada ${method}: ${quotationInfo}`,
      details: { status: 'sent', method },
      severity: 'MEDIUM'
    });
  }

  async logQuotationApproved(quotationId: string, quotationInfo: string): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'quotation',
      entityId: quotationId,
      description: `Cotización aprobada por el cliente: ${quotationInfo}`,
      details: { status: 'approved' },
      severity: 'HIGH'
    });
  }

  // Logs específicos para órdenes de trabajo
  async logWorkOrderCreated(workOrderData: any): Promise<void> {
    await this.createBusinessLog({
      action: 'CREATE',
      entity: 'workorder',
      entityId: workOrderData.id,
      description: `Orden de trabajo creada desde cotización aprobada - Cliente: ${workOrderData.clientName}`,
      details: {
        quotationId: workOrderData.quotationId,
        clientId: workOrderData.clientId,
        clientName: workOrderData.clientName,
        vehicleId: workOrderData.vehicleId,
        total: workOrderData.total,
        services: workOrderData.services
      },
      severity: 'HIGH'
    });
  }

  async logWorkOrderStatusChanged(workOrderId: string, workOrderInfo: string, newStatus: string, oldStatus?: string): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'workorder',
      entityId: workOrderId,
      description: `Estado de orden de trabajo cambiado${oldStatus ? ` de "${oldStatus}"` : ''} a "${newStatus}": ${workOrderInfo}`,
      details: { oldStatus, newStatus },
      severity: newStatus === 'completed' ? 'HIGH' : 'MEDIUM'
    });
  }

  async logWorkOrderCompleted(workOrderId: string, workOrderInfo: string): Promise<void> {
    await this.createBusinessLog({
      action: 'UPDATE',
      entity: 'workorder',
      entityId: workOrderId,
      description: `Orden de trabajo completada: ${workOrderInfo}`,
      details: { status: 'completed' },
      severity: 'HIGH'
    });
  }

  // Logs específicos para servicios
  async logServiceCreated(serviceData: any): Promise<void> {
    await this.createBusinessLog({
      action: 'CREATE',
      entity: 'service',
      entityId: serviceData.id,
      description: `Nuevo servicio creado: ${serviceData.name} - $${serviceData.price}`,
      details: {
        name: serviceData.name,
        price: serviceData.price,
        category: serviceData.category,
        duration: serviceData.duration
      },
      severity: 'LOW'
    });
  }
}

export const businessLogService = new BusinessLogService();