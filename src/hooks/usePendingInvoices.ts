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
      let clientInfo: any = {};
      let vehicleInfo: any = {};

      try {
        // Obtener información del cliente
        const clients = await obtenerClientes();
        if (clients && Array.isArray(clients)) {
          const client = clients.find((c: any) => c.id === order.clienteId);
          if (client) {
            clientInfo = {
              name: client.name || 'Cliente no especificado',
              email: client.email || '',
              phone: client.phone || ''
            };
          }
        }
      } catch (error) {
        console.error('Error obteniendo cliente:', error);
        clientInfo = { name: 'Cliente no especificado', email: '', phone: '' };
      }

      try {
        // Obtener información del vehículo
        const vehiclesResponse = await vehiclesService.getAll();
        if (vehiclesResponse.success && vehiclesResponse.data) {
          const vehicle = vehiclesResponse.data.find((v: any) => v.id === order.vehiculoId);
          if (vehicle) {
            vehicleInfo = {
              name: `${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.anio || ''}`.trim(),
              plate: vehicle.placa || '',
              color: vehicle.color || ''
            };
          }
        }
      } catch (error) {
        console.error('Error obteniendo vehículo:', error);
        vehicleInfo = { name: 'Vehículo no especificado', plate: '', color: '' };
      }

      enrichedOrders.push({
        ...order,
        clientName: clientInfo.name || 'Cliente no especificado',
        clientEmail: clientInfo.email || '',
        clientPhone: clientInfo.phone || '',
        vehicleName: vehicleInfo.name || 'Vehículo no especificado',
        vehiclePlate: vehicleInfo.plate || '',
        vehicleColor: vehicleInfo.color || '',
        totalAmount: order.costoTotal
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
          order.estado === 'completed' && order.estadoPago !== 'completed'
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
        order.estado === 'completed' && order.estadoPago !== 'completed'
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