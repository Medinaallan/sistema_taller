import { useState, useEffect } from 'react';
import workOrdersService, { type WorkOrderData } from '../servicios/workOrdersService';
import { obtenerClientes } from '../servicios/clientesApiService';
import { vehiclesService } from '../servicios/apiService';

interface PendingInvoice extends WorkOrderData {
  clientName: string;
  vehicleName: string;
  totalAmount: number;
  clientEmail?: string;
  clientPhone?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
}

export const usePendingInvoices = () => {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientAndVehicleInfo = async (workOrders: WorkOrderData[]): Promise<PendingInvoice[]> => {
    const enrichedOrders: PendingInvoice[] = [];

    for (const order of workOrders) {
      // Los datos ya vienen correctamente mapeados del workOrdersService
      enrichedOrders.push({
        ...order,
        clientName: order.nombreCliente || 'Cliente no especificado',
        vehicleName: order.nombreVehiculo || 'Vehículo no especificado',
        totalAmount: order.costoTotal || 0,
        clientEmail: '',
        clientPhone: '',
        vehiclePlate: '',
        vehicleColor: ''
      });
    }

    return enrichedOrders;
  };

  useEffect(() => {
    const fetchPendingInvoices = async () => {
      try {
        setLoading(true);
        // Obtener órdenes de trabajo completadas pero no facturadas
        const workOrders = await workOrdersService.getAllWorkOrders();
        
        // Filtrar órdenes completadas que no tienen factura
        const completed = workOrders.filter((order: WorkOrderData) => 
          order.estado === 'Completada' && order.estadoPago !== 'completed'
        );

        // Enriquecer con información de clientes y vehículos
        const enrichedInvoices = await fetchClientAndVehicleInfo(completed);
        setPendingInvoices(enrichedInvoices);
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
        order.estado === 'Completada' && order.estadoPago !== 'completed'
      );

      const enrichedInvoices = await fetchClientAndVehicleInfo(completed);
      setPendingInvoices(enrichedInvoices);
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