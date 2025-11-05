// Hook para facilitar el uso de business logs en componentes
import { useCallback } from 'react';
import { businessLogService } from '../servicios/businessLogService';
import type { Client, Vehicle, Appointment, Quotation, WorkOrder, Service } from '../tipos';

export const useBusinessLogs = () => {
  // Logs para clientes
  const logClientCreated = useCallback(async (client: Client) => {
    await businessLogService.logClientCreated(client);
  }, []);

  const logClientUpdated = useCallback(async (client: Client, changes?: any) => {
    await businessLogService.logClientUpdated(client.id, client.name, changes);
  }, []);

  const logClientDeleted = useCallback(async (clientId: string, clientName: string) => {
    await businessLogService.logClientDeleted(clientId, clientName);
  }, []);

  // Logs para vehículos
  const logVehicleCreated = useCallback(async (vehicle: Vehicle, clientName?: string) => {
    const vehicleData = {
      ...vehicle,
      clientName: clientName || `Cliente ID: ${vehicle.clientId}`
    };
    await businessLogService.logVehicleCreated(vehicleData);
  }, []);

  const logVehicleUpdated = useCallback(async (vehicle: Vehicle, changes?: any) => {
    const vehicleInfo = `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
    await businessLogService.logVehicleUpdated(vehicle.id, vehicleInfo, changes);
  }, []);

  // Logs para citas
  const logAppointmentCreated = useCallback(async (appointment: Appointment, clientName?: string, vehicleInfo?: string) => {
    const appointmentData = {
      ...appointment,
      clientName: clientName || `Cliente ID: ${appointment.clientId}`,
      vehicleInfo: vehicleInfo || `Vehículo ID: ${appointment.vehicleId}`
    };
    await businessLogService.logAppointmentCreated(appointmentData);
  }, []);

  const logAppointmentApproved = useCallback(async (appointment: Appointment, clientName?: string) => {
    const appointmentInfo = `${clientName || 'Cliente'} - ${appointment.date} ${appointment.time}`;
    await businessLogService.logAppointmentApproved(appointment.id, appointmentInfo);
  }, []);

  const logAppointmentCancelled = useCallback(async (appointment: Appointment, clientName?: string, reason?: string) => {
    const appointmentInfo = `${clientName || 'Cliente'} - ${appointment.date} ${appointment.time}`;
    await businessLogService.logAppointmentCancelled(appointment.id, appointmentInfo, reason);
  }, []);

  // Logs para cotizaciones
  const logQuotationCreated = useCallback(async (quotation: Quotation, clientName?: string) => {
    const quotationData = {
      ...quotation,
      clientName: clientName || `Cliente ID: ${quotation.clientId}`
    };
    await businessLogService.logQuotationCreated(quotationData);
  }, []);

  const logQuotationSent = useCallback(async (quotation: Quotation, clientName?: string, method: string = 'email') => {
    const quotationInfo = `${clientName || 'Cliente'} - Cotización #${quotation.id}`;
    await businessLogService.logQuotationSent(quotation.id, quotationInfo, method);
  }, []);

  const logQuotationApproved = useCallback(async (quotation: Quotation, clientName?: string) => {
    const quotationInfo = `${clientName || 'Cliente'} - Cotización #${quotation.id} ($${quotation.total})`;
    await businessLogService.logQuotationApproved(quotation.id, quotationInfo);
  }, []);

  // Logs para órdenes de trabajo
  const logWorkOrderCreated = useCallback(async (workOrder: WorkOrder, clientName?: string, quotationId?: string) => {
    const workOrderData = {
      ...workOrder,
      clientName: clientName || `Cliente ID: ${workOrder.clientId}`,
      quotationId: quotationId
    };
    await businessLogService.logWorkOrderCreated(workOrderData);
  }, []);

  const logWorkOrderStatusChanged = useCallback(async (workOrder: WorkOrder, newStatus: string, oldStatus?: string, clientName?: string) => {
    const workOrderInfo = `${clientName || 'Cliente'} - Orden #${workOrder.id}`;
    await businessLogService.logWorkOrderStatusChanged(workOrder.id, workOrderInfo, newStatus, oldStatus);
  }, []);

  const logWorkOrderCompleted = useCallback(async (workOrder: WorkOrder, clientName?: string) => {
    const workOrderInfo = `${clientName || 'Cliente'} - Orden #${workOrder.id}`;
    await businessLogService.logWorkOrderCompleted(workOrder.id, workOrderInfo);
  }, []);

  // Logs para servicios
  const logServiceCreated = useCallback(async (service: Service) => {
    await businessLogService.logServiceCreated(service);
  }, []);

  // Log genérico para acciones personalizadas
  const logCustomAction = useCallback(async (action: string, entity: string, entityId: string, description: string, details?: any) => {
    await businessLogService.createBusinessLog({
      action: action as any,
      entity,
      entityId,
      description,
      details,
      severity: 'MEDIUM'
    });
  }, []);

  return {
    // Logs de clientes
    logClientCreated,
    logClientUpdated,
    logClientDeleted,
    
    // Logs de vehículos
    logVehicleCreated,
    logVehicleUpdated,
    
    // Logs de citas
    logAppointmentCreated,
    logAppointmentApproved,
    logAppointmentCancelled,
    
    // Logs de cotizaciones
    logQuotationCreated,
    logQuotationSent,
    logQuotationApproved,
    
    // Logs de órdenes de trabajo
    logWorkOrderCreated,
    logWorkOrderStatusChanged,
    logWorkOrderCompleted,
    
    // Logs de servicios
    logServiceCreated,
    
    // Log genérico
    logCustomAction
  };
};

export default useBusinessLogs;