import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import workOrdersService, { type WorkOrderData } from '../../servicios/workOrdersService';
import { obtenerClientes } from '../../servicios/clientesApiService';
import { vehiclesService } from '../../servicios/apiService';
import invoicesService from '../../servicios/invoicesService';
import { showError, showSuccess, showConfirm } from '../../utilidades/sweetAlertHelpers';
import type { Invoice } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';

// Interfaz para las facturas generadas desde órdenes completadas
interface GeneratedInvoice extends Invoice {
  workOrderId: string;
  clientName: string;
  vehicleName: string;
  laborCost: number;
  partsCost: number;
}

const columns: ColumnDef<GeneratedInvoice>[] = [
  { 
    accessorKey: 'id', 
    header: 'Factura #',
    cell: ({ getValue }) => `FAC-${(getValue() as string).slice(-8)}`
  },
  { 
    accessorKey: 'workOrderId', 
    header: 'Orden de Trabajo',
    cell: ({ getValue }) => `#${(getValue() as string).slice(-12)}`
  },
  { 
    accessorKey: 'clientName', 
    header: 'Cliente'
  },
  { 
    accessorKey: 'vehicleName', 
    header: 'Vehículo'
  },
  { 
    accessorKey: 'date', 
    header: 'Fecha de Facturación',
    cell: ({ getValue }) => formatDate(new Date(getValue() as string))
  },
  { 
    accessorKey: 'laborCost', 
    header: 'Mano de Obra',
    cell: ({ getValue }) => formatCurrency(getValue() as number)
  },
  { 
    accessorKey: 'partsCost', 
    header: 'Repuestos',
    cell: ({ getValue }) => formatCurrency(getValue() as number)
  },
  { 
    accessorKey: 'total', 
    header: 'Total',
    cell: ({ getValue }) => (
      <span className="font-bold text-green-600">
        {formatCurrency(getValue() as number)}
      </span>
    )
  },
  { 
    accessorKey: 'status', 
    header: 'Estado',
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <Badge 
          variant={status === 'paid' ? 'success' : status === 'pending' ? 'warning' : 'default'}
          size="sm"
        >
          {status === 'paid' ? 'Pagada' : 
           status === 'pending' ? 'Pendiente' : 
           'Cancelada'}
        </Badge>
      );
    }
  },
];

const InvoicesPage = () => {
  const [data, setData] = useState<GeneratedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);

  // Funciones de mapeo
  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.name : clienteId?.substring(0, 20) || 'Cliente no encontrado';
  };

  const getVehicleName = (vehiculoId: string) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    return vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa}` : vehiculoId?.substring(0, 20) || 'Vehículo no encontrado';
  };

  // Cargar datos de referencia
  const loadClientes = async () => {
    try {
      const clientesData = await obtenerClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const loadVehiculos = async () => {
    try {
      const response = await vehiclesService.getAll();
      if (response.success) {
        setVehiculos(response.data);
      }
    } catch (error) {
      console.error('Error cargando vehículos:', error);
    }
  };

  // Cargar órdenes completadas y convertirlas a facturas
  const loadCompletedWorkOrdersAsInvoices = async () => {
    try {
      setLoading(true);
      console.log('Cargando órdenes de trabajo completadas para facturas...');
      
      // Obtener todas las órdenes de trabajo
      const allWorkOrders = await workOrdersService.getAllWorkOrders();
      
      // Filtrar solo las completadas
      const completedOrders = allWorkOrders.filter(order => order.estado === 'completed');
      console.log('Órdenes completadas encontradas:', completedOrders.length);

      // Convertir órdenes a facturas
      const invoices: GeneratedInvoice[] = completedOrders.map((order: WorkOrderData) => {
        // Determinar estado de pago basado en estado de la orden
        let invoiceStatus: 'pending' | 'paid' | 'cancelled' = 'pending';
        
        if (order.estadoPago === 'completed') {
          invoiceStatus = 'paid';
        } else if (order.estadoPago === 'partial') {
          invoiceStatus = 'pending'; // Mapear partial a pending
        } else if (order.estadoPago === 'pending') {
          invoiceStatus = 'pending';
        }

        const invoiceData: GeneratedInvoice = {
          id: `INV-${order.id}`,
          workOrderId: order.id || '',
          clientId: order.clienteId,
          clientName: getClienteName(order.clienteId),
          vehicleName: getVehicleName(order.vehiculoId),
          date: new Date(order.fechaCreacion || new Date()),
          laborCost: order.costoManoObra || 0,
          partsCost: order.costoPartes || 0,
          total: order.costoTotal || 0,
          status: invoiceStatus,
          
          // Propiedades requeridas por Invoice
          invoiceNumber: `FAC-${order.id?.slice(-8) || Date.now()}`,
          subtotal: (order.costoManoObra || 0) + (order.costoPartes || 0),
          tax: 0, // Sin impuestos por ahora
          createdAt: new Date(order.fechaCreacion || new Date()),
          updatedAt: new Date(),
          
          items: [
            {
              id: `item-1-${order.id}`,
              description: 'Mano de obra',
              quantity: 1,
              unitPrice: order.costoManoObra || 0,
              total: order.costoManoObra || 0
            },
            {
              id: `item-2-${order.id}`,
              description: 'Repuestos y materiales',
              quantity: 1,
              unitPrice: order.costoPartes || 0,
              total: order.costoPartes || 0
            }
          ]
        };

        return invoiceData;
      });

      console.log(' Facturas generadas:', invoices.length);
      setData(invoices);
      
    } catch (error) {
      console.error(' Error cargando órdenes completadas:', error);
      showError('Error cargando facturas: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await loadClientes();
      await loadVehiculos();
      await loadCompletedWorkOrdersAsInvoices();
    };
    
    loadAllData();
  }, []);

  const handleEdit = async (item: GeneratedInvoice) => {
    const { value: action } = await Swal.fire({
      title: `Factura ${item.invoiceNumber}`,
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Cliente:</strong> ${item.clientName}</p>
          <p><strong>Vehículo:</strong> ${item.vehicleName}</p>
          <p><strong>Orden de Trabajo:</strong> #${item.workOrderId?.slice(-12)}</p>
          <p><strong>Total:</strong> ${formatCurrency(item.total)}</p>
          <hr style="margin: 15px 0;">
          <p style="font-size: 14px; color: #666;">Seleccione una acción:</p>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '🖨️ Formato Carta',
      denyButtonText: '🧾 Formato Ticket',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      denyButtonColor: '#10b981',
      width: 500
    });

    if (action === true) {
      // Imprimir formato carta
      invoicesService.printInvoiceCarta(item);
    } else if (action === false) {
      // Imprimir formato ticket
      invoicesService.printInvoiceTicket(item);
    }
  };
  
  const handleDelete = async (item: GeneratedInvoice) => {
    if (await showConfirm(`¿Estás seguro de que quieres eliminar la factura ${item.invoiceNumber}?`)) {
      setData(data.filter(d => d.id !== item.id));
      showSuccess('Factura eliminada exitosamente');
    }
  };


  // Estadísticas
  const totalInvoices = data.length;
  const paidInvoices = data.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = data.filter(inv => inv.status === 'pending').length;
  const totalRevenue = data.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600">Facturas generadas automáticamente desde órdenes completadas</p>
          <p className="text-sm text-blue-600">
            {loading ? 'Cargando...' : `${totalInvoices} facturas generadas desde órdenes completadas`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadCompletedWorkOrdersAsInvoices} 
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <span> Actualizar Facturas</span>
          </Button>
          
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalInvoices}</div>
            <div className="text-sm text-blue-500">Total Facturas</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
            <div className="text-sm text-green-500">Pagadas</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingInvoices}</div>
            <div className="text-sm text-orange-500">Pendientes</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-purple-500">Ingresos Totales</div>
          </div>
        </Card>
      </div>

      {/* Tabla de Facturas */}
      <Card title="Facturas Generadas">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando facturas desde órdenes completadas...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron órdenes de trabajo completadas.</p>
            <p className="text-sm text-gray-400 mt-2">
              Las facturas se generan automáticamente cuando se completan las órdenes de trabajo.
            </p>
          </div>
        ) : (
          <TanStackCrudTable 
            columns={columns} 
            data={data} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        )}
      </Card>
    </div>
  );
};

export default InvoicesPage;
