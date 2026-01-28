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
    accessorKey: 'invoiceNumber',
    header: 'Factura #',
    cell: ({ getValue }) => (getValue() as string) || ''
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
  const [persistedData, setPersistedData] = useState<GeneratedInvoice[]>([]);
  const [filteredData, setFilteredData] = useState<GeneratedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  // Filtros
  const [filterNumber, setFilterNumber] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

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
      return invoices;
      
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
      const generated = await loadCompletedWorkOrdersAsInvoices();

      // Cargar facturas persistidas desde invoicesService (localStorage)
      try {
        const persisted = await invoicesService.getAllInvoices();
        const mapped: GeneratedInvoice[] = persisted.map(inv => ({
          id: inv.id,
          workOrderId: '',
          clientId: inv.clientId || null,
          clientName: inv.clientName || (inv.clientId ? getClienteName(inv.clientId) : 'CONSUMIDOR FINAL'),
          vehicleName: '',
          laborCost: 0,
          partsCost: 0,
          date: new Date(inv.fecha),
          total: inv.total,
          status: inv.estado === 'pagada' ? 'paid' : inv.estado === 'pendiente' ? 'pending' : 'cancelled',
          // Invoice fields required by existing UI
          invoiceNumber: inv.numero,
          subtotal: inv.subtotal,
          tax: inv.tax,
          createdAt: new Date(inv.createdAt || new Date()).toISOString(),
          // Preserve discount/exento/exonerado for printing
          discount: inv.discount || 0,
          exento: inv.exento || 0,
          exonerado: inv.exonerado || 0,
          updatedAt: new Date().toISOString(),
          items: (inv.items || []).map(it => ({
            id: it.id,
            description: it.name || (it as any).description || '',
            quantity: it.quantity || 1,
            unitPrice: it.price || 0,
            total: it.total || 0,
            // preserve original type if present
            type: (it as any).type || 'product'
          }))
        }));

        // Unir generadas + persistidas evitando duplicados por `id`
        const combinedMap = new Map<string, GeneratedInvoice>();
        (generated || []).forEach(i => combinedMap.set(i.id, i));
        mapped.forEach(i => combinedMap.set(i.id, i));
        const combined = Array.from(combinedMap.values());

        setPersistedData(combined);
        setFilteredData(combined);
        setData(combined);
      } catch (err) {
        console.error('Error cargando facturas persistidas:', err);
      }
    };
    
    loadAllData();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    const apply = () => {
      let list = persistedData.slice();

      if (filterNumber.trim()) {
        const q = filterNumber.trim().toLowerCase();
        list = list.filter(inv => (inv.invoiceNumber || inv.id || '').toLowerCase().includes(q));
      }

      if (filterClient) {
        const q = filterClient.toLowerCase();
        list = list.filter(inv => (inv.clientName || '').toLowerCase().includes(q) || (inv.clientId || '').toLowerCase() === q);
      }

      if (filterFrom) {
        const from = new Date(filterFrom);
        list = list.filter(inv => new Date(inv.date) >= from);
      }

      if (filterTo) {
        // include whole day
        const to = new Date(filterTo);
        to.setHours(23,59,59,999);
        list = list.filter(inv => new Date(inv.date) <= to);
      }

      setFilteredData(list);
    };

    apply();
  }, [filterNumber, filterClient, filterFrom, filterTo, persistedData]);

  const handleEdit = async (item: GeneratedInvoice) => {
    const result = await Swal.fire({
      title: `Factura ${item.invoiceNumber || item.id}`,
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Cliente:</strong> ${item.clientName}</p>
          <p><strong>Vehículo:</strong> ${item.vehicleName}</p>
          <p><strong>Orden de Trabajo:</strong> #${item.workOrderId?.slice(-12) || ''}</p>
          <p><strong>Total:</strong> ${formatCurrency(item.total)}</p>
          <hr style="margin: 15px 0;">
          <p style="font-size: 14px; color: #666;">Seleccione una acción:</p>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Formato Carta',
      denyButtonText: 'Formato Ticket',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      denyButtonColor: '#10b981',
      width: 500
    });

    // Mapear GeneratedInvoice -> Invoice que espera invoicesService
    const invoiceForPrint = {
      id: item.id,
      numero: (item as any).invoiceNumber || (item as any).numero || item.id,
      fecha: (item.date instanceof Date) ? item.date.toISOString() : new Date(item.date).toISOString(),
      clientId: (item as any).clientId || null,
      clientName: item.clientName || 'CONSUMIDOR FINAL',
      items: (item.items || []).map(it => ({
        id: it.id || `it-${Math.random().toString(36).slice(2,9)}`,
        name: (it as any).description || (it as any).name || '',
        quantity: (it as any).quantity || 1,
        price: (it as any).unitPrice || (it as any).price || 0,
        total: (it as any).total || ((it as any).quantity || 1) * ((it as any).unitPrice || (it as any).price || 0),
        // infer type from mapped item if available, default to 'product'
        type: (it as any).type ? (String((it as any).type).toLowerCase().includes('serv') ? 'service' : 'product') : 'product'
      })),
      subtotal: (item.subtotal as number) || (item.total as number) || 0,
      tax: (item.tax as number) || 0,
      // Preserve persisted discount/exento/exonerado when available
      discount: (item as any).discount || 0,
      exento: (item as any).exento || 0,
      exonerado: (item as any).exonerado || 0,
      total: (item.total as number) || 0,
      metodoPago: (item as any).metodoPago || 'Efectivo',
      estado: item.status === 'paid' ? 'pagada' : item.status === 'pending' ? 'pendiente' : 'anulada',
      createdAt: (item.createdAt && typeof item.createdAt === 'string') ? item.createdAt : new Date().toISOString(),
      createdBy: ''
    };

    if (result.isConfirmed) {
      invoicesService.printInvoiceCarta(invoiceForPrint as any);
    } else if (result.isDenied) {
      invoicesService.printInvoiceTicket(invoiceForPrint as any);
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
      {/* Filtros de búsqueda */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-3 md:space-y-0">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">Número de Factura</label>
            <input value={filterNumber} onChange={e => setFilterNumber(e.target.value)} placeholder="Ej: FAC-00000001 o 001-001-01-00000001" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Cliente</label>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="border rounded px-2 py-1">
              <option value="">-- Todos --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Desde</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Hasta</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => { /* los filtros se aplican automaticamente */ }} variant="primary">Buscar</Button>
            <Button onClick={() => { setFilterNumber(''); setFilterClient(''); setFilterFrom(''); setFilterTo(''); setFilteredData(persistedData); }} variant="secondary">Limpiar</Button>
          </div>
        </div>
      </Card>

      {/* Tabla de Facturas */}
      <Card title="Facturas Generadas">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando facturas desde órdenes completadas...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron facturas con los criterios indicados.</p>
            <p className="text-sm text-gray-400 mt-2">Ajusta los filtros para ampliar la búsqueda.</p>
          </div>
        ) : (
          <TanStackCrudTable 
            columns={columns} 
            data={filteredData} 
            onEdit={handleEdit} 
              showDelete={false} 
              editLabel="Imprimir" 
          />
        )}
      </Card>
    </div>
  );
};

export default InvoicesPage;
