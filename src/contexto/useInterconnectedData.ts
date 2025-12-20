// Hook personalizado para funciones de datos interconectados
import { useCallback } from 'react';
import { useApp } from './useApp';
import { agregarCliente, recargarClientes } from '../utilidades/BaseDatosJS';
import { businessLogService } from '../servicios/businessLogService';
import type { Client, Vehicle, WorkOrder, Invoice, Payment, Quotation, Appointment } from '../tipos/index';

export const useInterconnectedData = () => {
  const { state, dispatch } = useApp();

  // ========== FUNCIONES PARA OBTENER DATOS RELACIONADOS ==========

  // Obtener cliente por ID
  const getClientById = useCallback((clientId: string): Client | undefined => {
    return state.clients.find(client => client.id === clientId);
  }, [state.clients]);

  // Obtener vehículo por ID
  const getVehicleById = useCallback((vehicleId: string): Vehicle | undefined => {
    return state.vehicles.find(vehicle => vehicle.id === vehicleId);
  }, [state.vehicles]);

  // Obtener vehículos de un cliente
  const getVehiclesByClient = useCallback((clientId: string): Vehicle[] => {
    return state.vehicles.filter(vehicle => vehicle.clientId === clientId);
  }, [state.vehicles]);

  // Obtener órdenes de trabajo de un cliente
  const getWorkOrdersByClient = useCallback((clientId: string): WorkOrder[] => {
    return state.workOrders.filter(order => order.clientId === clientId);
  }, [state.workOrders]);

  // Obtener órdenes de trabajo de un vehículo
  const getWorkOrdersByVehicle = useCallback((vehicleId: string): WorkOrder[] => {
    return state.workOrders.filter(order => order.vehicleId === vehicleId);
  }, [state.workOrders]);

  // Obtener facturas de un cliente
  const getInvoicesByClient = useCallback((clientId: string): Invoice[] => {
    return state.invoices.filter(invoice => invoice.clientId === clientId);
  }, [state.invoices]);

  // Obtener pagos de una factura
  const getPaymentsByInvoice = useCallback((invoiceId: string): Payment[] => {
    return state.payments.filter(payment => payment.invoiceId === invoiceId);
  }, [state.payments]);

  // Obtener citas de un cliente
  const getAppointmentsByClient = useCallback((clientId: string): Appointment[] => {
    return state.appointments.filter(appointment => appointment.clientId === clientId);
  }, [state.appointments]);

  // Obtener citas de un vehículo
  const getAppointmentsByVehicle = useCallback((vehicleId: string): Appointment[] => {
    return state.appointments.filter(appointment => appointment.vehicleId === vehicleId);
  }, [state.appointments]);

  // Obtener cotizaciones de un cliente
  const getQuotationsByClient = useCallback((clientId: string): Quotation[] => {
    return state.quotations.filter(quotation => quotation.clientId === clientId);
  }, [state.quotations]);

  // ========== FUNCIONES PARA CALCULAR ESTADÍSTICAS ==========

  // Calcular total gastado por cliente
  const getTotalSpentByClient = useCallback((clientId: string): number => {
    const clientInvoices = getInvoicesByClient(clientId);
    return clientInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.total, 0);
  }, [getInvoicesByClient]);

  // Calcular deuda pendiente de un cliente
  const getPendingDebtByClient = useCallback((clientId: string): number => {
    const clientInvoices = getInvoicesByClient(clientId);
    return clientInvoices
      .filter(invoice => invoice.status === 'pending')
      .reduce((total, invoice) => total + invoice.total, 0);
  }, [getInvoicesByClient]);

  // Obtener estado financiero de un cliente
  const getClientFinancialStatus = useCallback((clientId: string) => {
    const totalSpent = getTotalSpentByClient(clientId);
    const pendingDebt = getPendingDebtByClient(clientId);
    const invoicesCount = getInvoicesByClient(clientId).length;
    const workOrdersCount = getWorkOrdersByClient(clientId).length;

    return {
      totalSpent,
      pendingDebt,
      invoicesCount,
      workOrdersCount,
      hasOutstandingBalance: pendingDebt > 0
    };
  }, [getTotalSpentByClient, getPendingDebtByClient, getInvoicesByClient, getWorkOrdersByClient]);

  // ========== FUNCIONES PARA ACCIONES INTERCONECTADAS ==========

  // Crear cliente con log automático
  const createClientWithLog = useCallback(async (client: Client) => {
    try {
      console.log('🔄 Creando cliente con log:', client.name);
      
      // Guardar cliente en base de datos vía API
      const clienteGuardado = await agregarCliente(client);
      
      if (clienteGuardado) {
        // Actualizar estado local con el cliente guardado (que incluye ID del servidor)
        dispatch({ type: 'ADD_CLIENT', payload: clienteGuardado });
        
        // Crear log de negocio usando el businessLogService
        await businessLogService.logClientCreated({
          id: clienteGuardado.id,
          name: clienteGuardado.name,
          email: clienteGuardado.email,
          phone: clienteGuardado.phone
        });
        
        // Refrescar estadísticas
        dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
        
        // Recargar datos para sincronizar
        setTimeout(async () => {
          await recargarClientes();
        }, 1000);
        
        console.log('✅ Cliente creado exitosamente:', clienteGuardado.name);
      } else {
        console.error('❌ Error creando cliente');
      }
    } catch (error) {
      console.error('❌ Error en createClientWithLog:', error);
    }
  }, [dispatch, state.user]);

  // Actualizar cliente con log automático
  const updateClientWithLog = useCallback(async (client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
    
    // Crear log de negocio usando el businessLogService
    await businessLogService.logClientUpdated(
      client.id, 
      client.name, 
      { name: client.name, email: client.email, phone: client.phone }
    );
    
    dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
  }, [dispatch, state.user]);

  // Eliminar cliente con todas sus relaciones
  const deleteClientWithRelations = useCallback((clientId: string) => {
    const client = getClientById(clientId);
    if (!client) return;

    // Eliminar vehículos relacionados
    const clientVehicles = getVehiclesByClient(clientId);
    clientVehicles.forEach(vehicle => {
      dispatch({ type: 'DELETE_VEHICLE', payload: vehicle.id });
    });

    // Eliminar órdenes de trabajo relacionadas
    const clientWorkOrders = getWorkOrdersByClient(clientId);
    clientWorkOrders.forEach(order => {
      dispatch({ type: 'DELETE_WORK_ORDER', payload: order.id });
    });

    // Eliminar cliente
    dispatch({ type: 'DELETE_CLIENT', payload: clientId });

    // Crear log de negocio usando el businessLogService
    businessLogService.logClientDeleted(clientId, client.name);

    dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
  }, [dispatch, state.user, getClientById, getVehiclesByClient, getWorkOrdersByClient]);

  // Eliminar vehículo con todas sus relaciones
  const deleteVehicleWithRelations = useCallback((vehicleId: string) => {
    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) return;

    // Eliminar órdenes de trabajo relacionadas
    const vehicleWorkOrders = getWorkOrdersByVehicle(vehicleId);
    vehicleWorkOrders.forEach(order => {
      dispatch({ type: 'DELETE_WORK_ORDER', payload: order.id });
    });

    // Eliminar citas relacionadas
    const vehicleAppointments = state.appointments.filter(app => app.vehicleId === vehicleId);
    vehicleAppointments.forEach(appointment => {
      dispatch({ type: 'DELETE_APPOINTMENT', payload: appointment.id });
    });

    // Eliminar vehículo
    dispatch({ type: 'DELETE_VEHICLE', payload: vehicleId });

    // Crear log de negocio usando el businessLogService
    businessLogService.createBusinessLog({
      action: 'DELETE',
      entity: 'vehicle',
      entityId: vehicleId,
      description: `Vehículo eliminado con todas sus relaciones: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
      details: {
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        workOrdersDeleted: vehicleWorkOrders.length,
        appointmentsDeleted: vehicleAppointments.length
      },
      severity: 'HIGH'
    });

    dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
  }, [dispatch, state.user, state.appointments, getVehicleById, getWorkOrdersByVehicle]);

  // Completar orden de trabajo y generar factura
  const completeWorkOrderWithInvoice = useCallback((workOrderId: string) => {
    const workOrder = state.workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder) return;

    // Actualizar orden de trabajo
    const updatedWorkOrder: WorkOrder = {
      ...workOrder,
      status: 'completed',
      actualCompletionDate: new Date(),
      paymentStatus: 'pending'
    };
    dispatch({ type: 'UPDATE_WORK_ORDER', payload: updatedWorkOrder });

    // Crear factura automáticamente
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Date.now()}`,
      clientId: workOrder.clientId,
      workOrderId: workOrder.id,
      date: new Date(),
      items: [
        {
          id: `item-${Date.now()}`,
          description: workOrder.description,
          quantity: 1,
          unitPrice: workOrder.totalCost,
          total: workOrder.totalCost
        }
      ],
      subtotal: workOrder.totalCost,
      tax: workOrder.totalCost * 0.15, // ISV 15%
      total: workOrder.totalCost * 1.15,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_INVOICE', payload: newInvoice });

    // Crear log de negocio usando el businessLogService
    businessLogService.createBusinessLog({
      action: 'UPDATE',
      entity: 'workorder',
      entityId: workOrderId,
      description: `Orden de trabajo completada y factura generada automáticamente`,
      details: {
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        totalAmount: newInvoice.total,
        clientId: workOrder.clientId
      },
      severity: 'HIGH'
    });

    dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
  }, [dispatch, state.user, state.workOrders]);

  return {
    // Datos del estado
    ...state,
    
    // Funciones para obtener datos relacionados
    getClientById,
    getVehicleById,
    getVehiclesByClient,
    getWorkOrdersByClient,
    getWorkOrdersByVehicle,
    getInvoicesByClient,
    getPaymentsByInvoice,
    getAppointmentsByClient,
    getAppointmentsByVehicle,
    getQuotationsByClient,
    
    // Funciones para calcular estadísticas
    getTotalSpentByClient,
    getPendingDebtByClient,
    getClientFinancialStatus,
    
    // Acciones interconectadas
    createClientWithLog,
    updateClientWithLog,
    deleteClientWithRelations,
    deleteVehicleWithRelations,
    completeWorkOrderWithInvoice,
    
    // Dispatch original para acciones directas
    dispatch
  };
};

export default useInterconnectedData;
