import { useState, useEffect } from 'react';
import workOrdersService, { type WorkOrderData } from '../servicios/workOrdersService';

interface PendingInvoice extends WorkOrderData {
  clientName: string;
  vehicleName: string;
  totalAmount: number;
}

export const usePendingInvoices = () => {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingInvoices = async () => {
      try {
        setLoading(true);
        // Obtener órdenes de trabajo completadas pero no facturadas
        const workOrders = await workOrdersService.getAllWorkOrders();
        
        // Filtrar órdenes completadas que no tienen factura
        const completed = workOrders.filter((order: WorkOrderData) => 
          order.estado === 'completed' && order.estadoPago !== 'completed'
        );

        // Transformar a formato de facturas pendientes
        const pending: PendingInvoice[] = completed.map((order: WorkOrderData) => ({
          ...order,
          clientName: order.clienteId, // Aquí deberías obtener el nombre real del cliente
          vehicleName: `${order.vehiculoId}`, // Aquí deberías obtener los datos del vehículo
          totalAmount: order.costoTotal
        }));

        setPendingInvoices(pending);
      } catch (error) {
        console.error('Error fetching pending invoices:', error);
        setPendingInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingInvoices();
  }, []);

  const markAsInvoiced = async (workOrderId: string) => {
    try {
      // Actualizar la orden como facturada
      const updateData = { estadoPago: 'completed' as const };
      await workOrdersService.updateWorkOrder(workOrderId, updateData);
      
      // Actualizar el estado local
      setPendingInvoices(prev => 
        prev.filter(invoice => invoice.id !== workOrderId)
      );
      
      return true;
    } catch (error) {
      console.error('Error marking as invoiced:', error);
      return false;
    }
  };

  const refreshPendingInvoices = async () => {
    setLoading(true);
    try {
      const workOrders = await workOrdersService.getAllWorkOrders();
      const completed = workOrders.filter((order: WorkOrderData) => 
        order.estado === 'completed' && order.estadoPago !== 'completed'
      );

      const pending: PendingInvoice[] = completed.map((order: WorkOrderData) => ({
        ...order,
        clientName: order.clienteId,
        vehicleName: `${order.vehiculoId}`,
        totalAmount: order.costoTotal
      }));

      setPendingInvoices(pending);
    } catch (error) {
      console.error('Error refreshing pending invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    pendingInvoices,
    loading,
    markAsInvoiced,
    refreshPendingInvoices
  };
};

export default usePendingInvoices;