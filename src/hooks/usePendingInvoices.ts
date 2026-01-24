import { useState, useEffect } from 'react';
import workOrdersService, { type WorkOrderData } from '../servicios/workOrdersService';
import { obtenerClientes } from '../servicios/clientesApiService';
import { vehiclesService, servicesService } from '../servicios/apiService';
import invoicePaymentManager from '../servicios/invoicePaymentManager';

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
    
    const serviciosResponse = await servicesService.getAll();
    const servicios = serviciosResponse.success ? serviciosResponse.data : [];

    for (const order of workOrders) {
      let totalAmount = 0;
      
      if (order.id) {
        try {
          const tareas = await workOrdersService.getTareasByOT(order.id);
          totalAmount = tareas.reduce((sum, tarea) => {
            const servicio = servicios.find((s: any) => s.tipo_servicio_id === tarea.tipo_servicio_id);
            const precio = servicio ? parseFloat(servicio.precio_base || servicio.basePrice || 0) : 0;
            return sum + precio;
          }, 0);
        } catch (error) {
          console.error('Error calculando costo:', error);
        }
      }

      enrichedOrders.push({
        ...order,
        clientName: order.nombreCliente || 'Cliente no especificado',
        vehicleName: order.nombreVehiculo || 'Vehículo no especificado',
        totalAmount,
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
        
        // Inicializar el gestor de pagos
        await invoicePaymentManager.initialize();
        
        // Obtener IDs de facturas ya pagadas
        const paidInvoiceIds = await invoicePaymentManager.getAllPaid();
        
        // Obtener órdenes de trabajo completadas
        const workOrders = await workOrdersService.getAllWorkOrders();
        
        // Filtrar órdenes completadas que NO están en la lista de pagadas
        const completed = workOrders.filter((order: WorkOrderData) => 
          order.estado === 'Completada' && !paidInvoiceIds.includes(order.id || '')
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
      // Marcar como pagada en el JSON
      await invoicePaymentManager.markAsPaid(workOrderId);
      
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
      // Obtener IDs de facturas ya pagadas
      const paidInvoiceIds = await invoicePaymentManager.getAllPaid();
      
      const workOrders = await workOrdersService.getAllWorkOrders();
      const completed = workOrders.filter((order: WorkOrderData) => 
        order.estado === 'Completada' && !paidInvoiceIds.includes(order.id || '')
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