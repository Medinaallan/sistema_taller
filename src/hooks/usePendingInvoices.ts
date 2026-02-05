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
        clienteId: order.clienteId, // Preservar el clienteId original
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
        
        console.log('🔍 DEBUG - Total órdenes:', workOrders.length);
        console.log('🔍 DEBUG - Estados encontrados:', workOrders.map(wo => ({
          id: wo.id,
          estado: wo.estado,
          estadoRaw: `"${wo.estado}"`,
          tipo: typeof wo.estado
        })));
        
        // Filtrar órdenes completadas que NO están en la lista de pagadas
        // Normalizar el estado para evitar problemas con espacios o mayúsculas
        const completed = workOrders.filter((order: WorkOrderData) => {
          const estadoNormalizado = order.estado?.trim().toLowerCase();
          const esCompletada = estadoNormalizado === 'completada';
          const noEstaPagada = !paidInvoiceIds.includes(order.id || '');
          
          if (esCompletada) {
            console.log(`✅ OT ${order.id} está completada. ¿Pagada? ${!noEstaPagada}`);
          }
          
          return esCompletada && noEstaPagada;
        });

        console.log('📋 Facturas pendientes encontradas:', completed.length);
        
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

  const markAsInvoiced = async (workOrderId: string, registradoPor?: number) => {
    try {
      console.log(`🧾 Generando factura desde OT ${workOrderId}...`);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      
      // Llamar al endpoint que usa SP_GENERAR_FACTURA_DESDE_OT
      const response = await fetch(`${API_BASE_URL}/invoices/generate-from-ot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ot_id: parseInt(workOrderId),
          registrado_por: registradoPor || 1
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al generar factura');
      }
      
      console.log(`✅ Factura generada: ${result.data.numero_factura}`);
      
      // Actualizar el estado local
      setPendingInvoices(prev => 
        prev.filter(invoice => invoice.id !== workOrderId)
      );
      
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error generando factura desde OT:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const refreshPendingInvoices = async () => {
    setLoading(true);
    try {
      // Obtener IDs de facturas ya pagadas
      const paidInvoiceIds = await invoicePaymentManager.getAllPaid();
      
      const workOrders = await workOrdersService.getAllWorkOrders();
      
      console.log('🔄 REFRESH - Total órdenes:', workOrders.length);
      
      // Filtrar con estado normalizado
      const completed = workOrders.filter((order: WorkOrderData) => {
        const estadoNormalizado = order.estado?.trim().toLowerCase();
        const esCompletada = estadoNormalizado === 'completada';
        const noEstaPagada = !paidInvoiceIds.includes(order.id || '');
        return esCompletada && noEstaPagada;
      });

      console.log('🔄 REFRESH - Facturas pendientes:', completed.length);

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