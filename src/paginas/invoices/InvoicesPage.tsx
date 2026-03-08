import { useState, useEffect } from 'react';
import { appConfig } from '../../config/config';
import { Card, Button, Badge } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import { obtenerClientes } from '../../servicios/clientesApiService';
import { vehiclesService } from '../../servicios/apiService';
import invoicesService from '../../servicios/invoicesService';
import cashService from '../../servicios/cashService';
import { showError } from '../../utilidades/sweetAlertHelpers';
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
  const [currentSession, setCurrentSession] = useState<any>(null);
  // Filtros
  const [filterNumber, setFilterNumber] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [autoFilterBySession, setAutoFilterBySession] = useState(false); // Desactivado por defecto

  // Funciones de mapeo
  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.name : clienteId?.substring(0, 20) || 'Cliente no encontrado';
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
      await vehiclesService.getAll();
    } catch (error) {
      console.error('Error cargando vehículos:', error);
    }
  };

  // Cargar facturas desde BD usando SP_OBTENER_PAGOS (retorna pagos realizados)
  const loadPaidInvoicesFromDB = async () => {
    try {
      setLoading(true);
      
      
      const API_BASE_URL = appConfig.apiBaseUrl;
      
      // Obtener historial de pagos usando SP_OBTENER_PAGOS
      const response = await fetch(`${API_BASE_URL}/invoice-payments/history`);
      
      if (!response.ok) {
        throw new Error('Error al obtener historial de pagos');
      }
      
      const result = await response.json();
      const pagos = result.data as any[];
      
      
      
      // Agrupar pagos por factura (puede haber múltiples pagos para una factura)
      const facturaMap = new Map<number, any>();
      
      pagos.forEach(pago => {
        const facturaId = pago.factura_id;
        if (!facturaMap.has(facturaId)) {
          facturaMap.set(facturaId, {
            factura_id: facturaId,
            numero_factura: pago.numero_factura,
            estado_factura: pago.estado_factura,
            total_factura: pago.total_factura,
            cliente_id: pago.cliente_id,
            nombre_cliente: pago.nombre_cliente,
            fecha_creacion: pago.fecha_creacion,
            pagos: []
          });
        }
        facturaMap.get(facturaId).pagos.push({
          pago_id: pago.pago_id,
          monto: pago.monto,
          metodo_pago: pago.metodo_pago,
          referencia: pago.referencia,
          fecha_creacion: pago.fecha_creacion
        });
      });
      
      // Obtener items de cada factura en paralelo
      const facturasConItems = await Promise.all(
        Array.from(facturaMap.values()).map(async (factura) => {
          try {
            const itemsResponse = await fetch(`${API_BASE_URL}/invoices/${factura.factura_id}/items`);
            if (itemsResponse.ok) {
              const itemsResult = await itemsResponse.json();
              factura.items = itemsResult.data || [];
            } else {
              factura.items = [];
            }
          } catch (err) {
            console.warn(`⚠️ No se pudieron cargar items de factura ${factura.factura_id}:`, err);
            factura.items = [];
          }
          return factura;
        })
      );
      
      
      
      // Mapear facturas de BD a la interfaz GeneratedInvoice
      const invoices: GeneratedInvoice[] = facturasConItems.map(factura => {
        // Calcular costos de mano de obra y repuestos desde los items
        let laborCost = 0;
        let partsCost = 0;
        let subtotalCalculado = 0;
        
        (factura.items || []).forEach((item: any) => {
          const itemTotal = item.cantidad * item.precio_unitario;
          subtotalCalculado += itemTotal;
          
          // Verificar si es servicio: usar campo 'type' si está disponible (mapeado por backend)
          // o verificar tipo_servicio_id, tipo_item, tipo_item_inferido como fallback
          const esServicio = item.type === 'service' || 
                             !!item.tipo_servicio_id || 
                             item.tipo_item?.toLowerCase() === 'servicio' || 
                             item.tipo_item_inferido?.toLowerCase() === 'servicio';
          
          if (esServicio) {
            laborCost += itemTotal;
          } else {
            partsCost += itemTotal;
          }
        });
        
        // Calcular impuestos (15% ISV en Honduras)
        const taxCalculado = subtotalCalculado * 0.15;
        const totalCalculado = subtotalCalculado + taxCalculado;
        
        return {
          id: `INV-${factura.factura_id}`,
          workOrderId: '', // No disponible directamente en SP_OBTENER_PAGOS
          clientId: factura.cliente_id?.toString() || '',
          clientName: factura.nombre_cliente || 'Cliente no especificado',
          vehicleName: '', // No disponible en SP_OBTENER_PAGOS
          date: new Date(factura.fecha_creacion),
          laborCost,
          partsCost,
          total: factura.total_factura || totalCalculado,
          status: 'paid', // Todas son pagadas según SP_OBTENER_PAGOS
          
          // Propiedades requeridas por Invoice
          invoiceNumber: factura.numero_factura,
          subtotal: subtotalCalculado || factura.total_factura * 0.869565, // Revertir 15% si no hay items
          tax: taxCalculado || factura.total_factura * 0.130435, // 15% del total
          createdAt: new Date(factura.fecha_creacion),
          updatedAt: new Date(),
          
          // Mapear items con la estructura correcta
          items: (factura.items || []).map((item: any) => {
            // Usar campo 'type' si ya está mapeado por el backend, 
            // de lo contrario inferir desde otros campos
            let itemType = item.type;
            if (!itemType) {
              const esServicio = !!item.tipo_servicio_id || 
                                 item.tipo_item?.toLowerCase() === 'servicio' || 
                                 item.tipo_item_inferido?.toLowerCase() === 'servicio';
              itemType = esServicio ? 'service' : 'product';
            }
            
            return {
              id: item.item_id?.toString() || `item-${Math.random().toString(36).slice(2, 9)}`,
              description: item.descripcion || item.nombre || '',
              quantity: item.cantidad || 1,
              unitPrice: item.precio_unitario || 0,
              total: item.cantidad * item.precio_unitario,
              type: itemType
            };
          })
        };
      });

      
      setData(invoices);
      setPersistedData(invoices);
      setFilteredData(invoices);
      return invoices;
      
    } catch (error) {
      console.error('❌ Error cargando facturas pagadas:', error);
      showError('Error cargando facturas: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await loadClientes();
      await loadVehiculos();
      
      // Cargar sesión actual de caja usando nuevo endpoint
      /*
      try {
        if (state.user?.id) {
          const statusResp = await cashService.checkStatus(state.user.id);
          if (statusResp?.success && statusResp.data?.estado === 'Abierta') {
            const summaryResp = await cashService.getCurrentSummary(state.user.id);
            if (summaryResp?.success) {
              setCurrentSession(summaryResp.data);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ No se pudo cargar sesión de caja:', err);
      }
      */
      
      // Cargar facturas pagadas desde BD
      const dbInvoices = await loadPaidInvoicesFromDB();

      // También se pueden cargar facturas manuales desde localStorage si es necesario
      try {
        const persisted = await invoicesService.getAllInvoices();
        const mapped: GeneratedInvoice[] = persisted
          .filter(inv => inv.estado === 'pagada') // Solo mostrar pagadas
          .map(inv => {
            // Calcular laborCost y partsCost desde los items
            let laborCost = 0;
            let partsCost = 0;
            
            (inv.items || []).forEach(it => {
              const itemTotal = (it.quantity || 1) * (it.price || 0);
              const itemType = (it as any).type || 'product';
              
              if (itemType === 'service' || String(it.name || '').toLowerCase().includes('servicio')) {
                laborCost += itemTotal;
              } else {
                partsCost += itemTotal;
              }
            });
            
            return {
              id: inv.id,
              workOrderId: '',
              clientId: inv.clientId || '',
              clientName: inv.clientName || (inv.clientId ? getClienteName(inv.clientId) : 'CONSUMIDOR FINAL'),
              vehicleName: '',
              laborCost,
              partsCost,
              date: new Date(inv.fecha),
              total: inv.total,
              status: 'paid',
              // Invoice fields required by existing UI
              invoiceNumber: inv.numero,
              subtotal: inv.subtotal,
              tax: inv.tax,
              createdAt: new Date(inv.createdAt || new Date()),
              // Preserve discount/exento/exonerado for printing
              discount: inv.discount || 0,
              exento: inv.exento || 0,
              exonerado: inv.exonerado || 0,
              updatedAt: new Date(),
              items: (inv.items || []).map(it => ({
                id: it.id,
                description: it.name || (it as any).description || '',
                quantity: it.quantity || 1,
                unitPrice: it.price || 0,
                total: it.total || 0,
                // preserve original type if present
                type: (it as any).type || 'product'
              }))
            };
          });

        // Combinar facturas de BD + localStorage
        const combinedMap = new Map<string, GeneratedInvoice>();
        dbInvoices.forEach(i => combinedMap.set(i.id, i));
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

      // Filtro automático por turno en curso si está activado y hay sesión abierta
      // Los filtros manuales de fecha tienen prioridad
      const hasManualDateFilter = filterFrom.trim() !== '' || filterTo.trim() !== '';
      
      if (autoFilterBySession && currentSession && currentSession.status === 'open' && !hasManualDateFilter) {
        const sessionOpenedAt = new Date(currentSession.openedAt || currentSession.openingTime);
        
        // Filtrar desde la hora exacta de apertura del turno
        const filterStart = sessionOpenedAt;
        
        // Hasta la hora de cierre (si está cerrado) o hasta ahora (si está abierto)
        const filterEnd = currentSession.closedAt 
          ? new Date(currentSession.closedAt)
          : new Date(); // Hora actual si el turno está abierto
        
        
        
        list = list.filter(inv => {
          const invDate = new Date(inv.date);
          const passes = invDate >= filterStart && invDate <= filterEnd;
          
          
          
          return passes;
        });
        
        
      }

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
  }, [filterNumber, filterClient, filterFrom, filterTo, persistedData, currentSession, autoFilterBySession]);

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

  // Estadísticas - Calculadas con las facturas filtradas
  const totalInvoices = filteredData.length;
  const paidInvoices = filteredData.filter(inv => inv.status === 'paid').length;
  const totalRevenue = filteredData.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600">Historial de facturas pagadas con detalles completos</p>
          <p className="text-sm text-blue-600">
            {loading ? 'Cargando...' : `${totalInvoices} facturas registradas con pagos completados`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadPaidInvoicesFromDB} 
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <span> Actualizar Facturas</span>
          </Button>
          
        </div>
      </div>

      {/* Indicador de Turno en Curso */}
      {currentSession && currentSession.status === 'open' && (
        <div className={`${autoFilterBySession ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${autoFilterBySession ? 'bg-blue-500' : 'bg-gray-400'} rounded-full p-2`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold ${autoFilterBySession ? 'text-blue-900' : 'text-gray-700'}`}>
                  Fcaturas Generadas {autoFilterBySession ? '- Filtro por Hora de Apertura' : ''}
                </h3>
                <p className={`text-sm ${autoFilterBySession ? 'text-blue-700' : 'text-gray-600'}`}>
                  Apertura: {new Date(currentSession.openedAt || currentSession.openingTime).toLocaleString('es-HN')} • 
                  Cajero: {currentSession.cashier || currentSession.openedBy}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFilterBySession}
                  onChange={(e) => setAutoFilterBySession(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Filtrar desde hora de apertura</span>
              </label>
              <Badge variant={autoFilterBySession ? 'success' : 'default'}>
                {autoFilterBySession ? 'FILTRO ACTIVO' : 'TODAS LAS FACTURAS'}
              </Badge>
            </div>
          </div>
          {autoFilterBySession && (
            <p className="text-xs text-blue-600 mt-2">
              Mostrando facturas desde la apertura del turno: {new Date(currentSession.openedAt || currentSession.openingTime).toLocaleString('es-HN')}
            </p>
          )}
          {!autoFilterBySession && (
            <p className="text-xs text-gray-600 mt-2">
              Mostrando todas las facturas de todos los días
            </p>
          )}
        </div>
      )}

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
            <Button 
              onClick={() => { 
                setFilterNumber(''); 
                setFilterClient(''); 
                setFilterFrom(''); 
                setFilterTo(''); 
              }} 
              variant="secondary"
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla de Facturas */}
      <Card title="Facturas Generadas">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando facturas pagadas...</p>
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
