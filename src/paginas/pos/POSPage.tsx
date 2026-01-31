import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package, FileText, Wrench, User } from 'lucide-react';
import type { Client } from '../../tipos';
import usePendingInvoices from '../../hooks/usePendingInvoices';
import { serviceHistoryService } from '../../servicios/serviceHistoryService';
import Swal from 'sweetalert2';
import { cashService } from '../../servicios/cashService';
import invoicesService from '../../servicios/invoicesService';
import { useApp } from '../../contexto/useApp';

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
  type: 'product' | 'service';
  isTaxed?: boolean;
  exento?: boolean;
  exonerado?: boolean;
}

interface CartItem extends POSItem {
  total: number;
}

interface POSState {
  cart: CartItem[];
  selectedClient: Client | null;
  searchQuery: string;
  total: number;
  subtotal: number;
  tax: number;
  exentoAmount: number;
  exoneradoAmount: number;
  discount: number;
  selectedCategory: string;
  activeTab: 'products' | 'pending-invoices';
}



const categories = [
  'LUBRICANTES',
  'ELECTRÓNICA AUTOMOTRIZ',
  'ADITIVOS',
  'HERRAMIENTAS',
  'EQUIPO DIAGNÓSTICO',
  
];

const POSPage: React.FC = () => {
  const { state } = useApp();
  const [posState, setPosState] = useState<POSState>({
    cart: [],
    selectedClient: null,
    searchQuery: '',
    total: 0,
    subtotal: 0,
    tax: 0,
    exentoAmount: 0,
    exoneradoAmount: 0,
    discount: 0,
    selectedCategory: '',
    activeTab: 'products'
  });

  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [openingNotes, setOpeningNotes] = useState<string>('');
  const [cashierName, setCashierName] = useState<string>(state.user?.name || '');
  const [openingTime, setOpeningTime] = useState<string>(new Date().toLocaleString());
  const [closingCountedCash, setClosingCountedCash] = useState<number>(0);
  const [closingShortages, setClosingShortages] = useState<number>(0);
  const [closingOverages, setClosingOverages] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const taxRate = 0.15; // 15% ISV constante
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  
  // Hook para manejar facturas pendientes
  const { pendingInvoices, loading: pendingLoading, markAsInvoiced, refreshPendingInvoices } = usePendingInvoices();

  // Productos cargados desde backend /api/products
  const [products, setProducts] = useState<POSItem[]>([] as POSItem[]);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Cargar productos al montar (evitar doble /api) y cuando se actualizan
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const base = API_BASE.replace(/\/$/, '');
        const url = base.endsWith('/api') ? `${base}/products` : `${base}/api/products`;
        const res = await fetch(url);
        const json = await res.json();
        const list: POSItem[] = (json.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          quantity: 1,
          image: p.image || '',
          category: p.category || 'GENERAL',
          type: p.type || 'product',
          isTaxed: !!p.isTaxed,
          exento: !!p.exento,
          exonerado: !!p.exonerado
        }));
        setProducts(list);
      } catch (err) {
        console.error('Error cargando productos desde API', err);
      }
    };

    loadProducts();

    const onUpdated = () => { loadProducts(); };
    window.addEventListener('products:updated', onUpdated as EventListener);
    return () => { window.removeEventListener('products:updated', onUpdated as EventListener); };
  }, []);

  // Cargar sesión de caja abierta al montar
  useEffect(() => {
    const loadOpen = async () => {
      try {
        const resp = await cashService.getOpen();
        if (resp && resp.success) setCurrentSession(resp.data);
      } catch (err) {
        console.error('Error fetching open cash session', err);
      }
    };
    loadOpen();
  }, []);

  const loadReport = async () => {
    try {
      const resp = await cashService.getReport();
      if (resp && resp.success) setReportData(resp.data || []);
      else setReportData([]);
    } catch (err) {
      console.error('Error loading cash report', err);
      setReportData([]);
    }
  };

  // actualizar hora de apertura en tiempo real para mostrar en modal
  useEffect(() => {
    const t = setInterval(() => {
      setOpeningTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Calcular totales (considerando items exentos/exonerados)
  useEffect(() => {
    const totalConISV = posState.cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (totalConISV * discountPercentage) / 100;
    const totalAfterDiscount = totalConISV - discountAmount;

    const taxedTotal = posState.cart.filter(i => !!i.isTaxed).reduce((s, i) => s + i.total, 0);
    const exentoTotal = posState.cart.filter(i => !!i.exento).reduce((s, i) => s + i.total, 0);
    const exoneradoTotal = posState.cart.filter(i => !!i.exonerado).reduce((s, i) => s + i.total, 0);

    const taxedShareAfterDiscount = totalConISV > 0 ? taxedTotal - discountAmount * (taxedTotal / totalConISV) : 0;
    const exentoShareAfterDiscount = totalConISV > 0 ? exentoTotal - discountAmount * (exentoTotal / totalConISV) : 0;
    const exoneradoShareAfterDiscount = totalConISV > 0 ? exoneradoTotal - discountAmount * (exoneradoTotal / totalConISV) : 0;

    // Para ítems gravados: precio final incluye ISV, por tanto base = total/1.15
    const taxedBase = taxedShareAfterDiscount / (1 + taxRate || 1);
    const tax = taxedShareAfterDiscount - taxedBase;

    const subtotal = taxedBase; // Importe gravado (base)
    const total = totalAfterDiscount;

    setPosState(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
      discount: discountAmount,
      exentoAmount: exentoShareAfterDiscount,
      exoneradoAmount: exoneradoShareAfterDiscount
    }));
  }, [posState.cart, taxRate, discountPercentage]);

  const addToCart = (product: POSItem) => {
    setPosState(prev => {
      const existingItem = prev.cart.find(item => item.id === product.id);
      
      if (existingItem) {
        return {
          ...prev,
          cart: prev.cart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
              : item
          )
        };
      } else {
        return {
          ...prev,
          cart: [...prev.cart, { ...product, total: product.price }]
        };
      }
    });
  };

  const addPendingInvoiceToCart = (pendingInvoice: any) => {
    const precio = Number(pendingInvoice.totalAmount) || Number(pendingInvoice.costoTotal) || Number(pendingInvoice.costoEstimado) || 0;
    
    const descripcionServicio = `Servicio Automotriz - ${pendingInvoice.vehicleName || 'Vehículo'} | OT #${pendingInvoice.id?.slice(-8) || ''}`;
    
    const invoiceItem: CartItem = {
      id: `invoice-${pendingInvoice.id}`,
      name: descripcionServicio,
      price: precio,
      quantity: 1,
      total: precio,
      category: 'SERVICIOS',
      type: 'service',
      isTaxed: true,
      exento: false,
      exonerado: false
    };
    
    // Usar directamente los datos del pendingInvoice
    const clienteToSelect: Client | null = pendingInvoice.clienteId && pendingInvoice.clientName ? {
      id: pendingInvoice.clienteId,
      name: pendingInvoice.clientName,
      phone: pendingInvoice.clientPhone || '',
      email: pendingInvoice.clientEmail || '',
      address: '',
      password: '',
      vehicles: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as Client : null;

    setPosState(prev => {
      const existingItem = prev.cart.find(item => item.id === invoiceItem.id);
      
      if (!existingItem) {
        return {
          ...prev,
          cart: [...prev.cart, invoiceItem],
          selectedClient: clienteToSelect || prev.selectedClient
        };
      }
      
      return prev;
    });
  };

  const updateCartItemQuantity = (id: string, quantity: number) => {
    setPosState(prev => {
      const item = prev.cart.find(i => i.id === id);
      if (!item) return prev;

      // No permitir cambiar cantidad para servicios (siempre 1)
      if (item.type === 'service') {
        return prev;
      }

      if (quantity <= 0) {
        return { ...prev, cart: prev.cart.filter(i => i.id !== id) };
      }

      return {
        ...prev,
        cart: prev.cart.map(i =>
          i.id === id ? { ...i, quantity, total: quantity * i.price } : i
        )
      };
    });
  };

  const removeFromCart = (id: string) => {
    setPosState(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.id !== id)
    }));
  };

  const clearCart = () => {
    setPosState(prev => ({
      ...prev,
      cart: []
    }));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(posState.searchQuery.toLowerCase());
    const matchesCategory = !posState.selectedCategory || product.category === posState.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCheckout = async () => {
    // Requerir sesión de caja abierta antes de poder facturar
    if (!currentSession) {
      await Swal.fire({
        icon: 'warning',
        title: 'Caja no aperturada',
        text: 'Debe aperturar la caja antes de realizar una factura.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (posState.cart.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'No hay productos o servicios en el carrito',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Paso 1: Confirmar el cobro
    const confirmResult = await Swal.fire({
      title: '¿Confirmar Cobro?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${posState.selectedClient?.name || 'CONSUMIDOR FINAL'}</p>
          <p><strong>Subtotal:</strong> L ${posState.subtotal.toFixed(2)}</p>
          ${posState.discount > 0 ? `<p><strong>Descuento:</strong> - L ${posState.discount.toFixed(2)}</p>` : ''}
          <p><strong>ISV (15%):</strong> L ${posState.tax.toFixed(2)}</p>
          <p style="font-size: 1.2em; margin-top: 10px;"><strong>TOTAL:</strong> L ${posState.total.toFixed(2)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: '✓ Confirmar Cobro',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    // Paso 2: Mostrar animación de generando factura
    Swal.fire({
      title: 'Generando Factura...',
      html: '<div style="font-size: 3em;">📄</div>',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const serviceItems = posState.cart.filter(item => item.type === 'service');

      // Determinar el cliente final (priorizar el de la OT si existe)
      let finalClientId = posState.selectedClient?.id || null;
      let finalClientName = posState.selectedClient?.name || 'CONSUMIDOR FINAL';
      
      // Si hay items de servicio (OT), usar el cliente de la primera OT
      const firstServiceItem = serviceItems[0];
      if (firstServiceItem && firstServiceItem.id.startsWith('invoice-')) {
        const workOrderId = firstServiceItem.id.replace('invoice-', '');
        const originalInvoice = pendingInvoices.find(inv => inv.id === workOrderId);
        if (originalInvoice && originalInvoice.clienteId) {
          finalClientId = originalInvoice.clienteId;
          finalClientName = originalInvoice.clientName || finalClientName;
        }
      }
      
      // Crear la factura y guardarla
      const newInvoice = await invoicesService.createInvoice({
        fecha: new Date().toISOString(),
        clientId: finalClientId,
        clientName: finalClientName,
        items: posState.cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          type: item.type
        })),
        subtotal: posState.subtotal,
        exento: posState.exentoAmount,
        exonerado: posState.exoneradoAmount,
        tax: posState.tax,
        discount: posState.discount,
        total: posState.total,
        metodoPago: 'Efectivo',
        createdBy: state.user?.name || 'Usuario'
      });

      if (!newInvoice) {
        throw new Error('No se pudo crear la factura en el servidor');
      }

      // Registrar movimiento de entrada en la sesión de caja (venta en efectivo)
      try {
        if (currentSession) {
          await cashService.addMovement({
            sessionId: currentSession.id,
            type: 'in',
            amount: posState.total,
            reason: `Venta - ${newInvoice.numero || newInvoice.id}`,
            createdBy: state.user?.name || 'Usuario'
          });
        }
      } catch (movementErr) {
        console.error('Error registrando movimiento de caja:', movementErr);
      }

      // Procesar servicios facturados
      for (const serviceItem of serviceItems) {
        if (serviceItem.id.startsWith('invoice-')) {
          const workOrderId = serviceItem.id.replace('invoice-', '');
          
          try {
            await markAsInvoiced(workOrderId);
            
            const originalInvoice = pendingInvoices.find(inv => inv.id === workOrderId);
            if (originalInvoice) {
              const historyRecord = {
                workOrderId: workOrderId,
                clientId: originalInvoice.clienteId,
                clientName: originalInvoice.clientName || 'Cliente no especificado',
                clientEmail: originalInvoice.clientEmail || '',
                clientPhone: originalInvoice.clientPhone || '',
                vehicleId: originalInvoice.vehiculoId,
                vehicleName: originalInvoice.vehicleName || 'Vehículo no especificado',
                vehiclePlate: originalInvoice.vehiclePlate || '',
                vehicleColor: originalInvoice.vehicleColor || '',
                serviceId: originalInvoice.servicioId || 'general',
                serviceName: 'Servicio de Taller',
                serviceDescription: originalInvoice.descripcion || 'Servicio completado y facturado',
                serviceCategory: originalInvoice.tipoServicio || 'Mantenimiento',
                servicePrice: originalInvoice.costoTotal,
                serviceDuration: '1 hora',
                status: 'completed',
                paymentStatus: 'paid',
                invoiceId: newInvoice.id,
                invoiceTotal: posState.total,
                date: new Date().toISOString(),
                notes: `Facturado - Total: L.${posState.total.toFixed(2)}`
              };

              try {
                await serviceHistoryService.addServiceHistory(historyRecord);
              } catch (historyError) {
                console.error('Error al agregar al historial:', historyError);
              }
            }
          } catch (error) {
            console.error(`Error al marcar como facturada la orden ${workOrderId}:`, error);
          }
        }
      }

      // Limpiar carrito
      clearCart();
      setPosState(prev => ({ ...prev, selectedClient: null }));
      setDiscountPercentage(0);

      if (serviceItems.length > 0) {
        refreshPendingInvoices();
      }

      Swal.close();

      // Paso 3: Mostrar éxito y preguntar si quiere imprimir
      const printResult = await Swal.fire({
        icon: 'success',
        title: '¡Factura Generada!',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p><strong>Número de Factura:</strong> ${newInvoice.numero}</p>
            <p><strong>Total:</strong> L ${newInvoice.total.toFixed(2)}</p>
            <p style="margin-top: 15px;">¿Desea imprimir la factura?</p>
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        denyButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: ' Tamaño Carta ',
        denyButtonText: ' Ticket',
        cancelButtonText: 'No imprimir'
      });

      // Paso 4: Imprimir según el formato seleccionado
      if (printResult.isConfirmed) {
        invoicesService.printInvoiceCarta(newInvoice);
      } else if (printResult.isDenied) {
        invoicesService.printInvoiceTicket(newInvoice);
      }
      
    } catch (error) {
      console.error('Error durante el checkout:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al procesar la factura. Por favor, inténtelo de nuevo.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Panel de productos */}
      <div className="flex-1 flex flex-col">
        {/* Header con búsqueda y categorías */}
        <div className="bg-white p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              <ShoppingCart className="inline-block mr-2" />
              Punto de Venta
            </h1>
            <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-blue-600">ADMIN</span>
                <span className="text-sm text-gray-500">TALLER-POS</span>
                <button onClick={async () => { setShowReportModal(true); await loadReport(); }} className="ml-3 px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">Arqueos</button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ingrese Criterio para su Búsqueda"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={posState.searchQuery}
              onChange={(e) => setPosState(prev => ({ ...prev, searchQuery: e.target.value }))}
            />
          </div>

          {/* Categorías y Pestañas */}
          <div className="flex space-x-2">
            <button
              onClick={() => setPosState(prev => ({ ...prev, activeTab: 'products', selectedCategory: '' }))}
              className={`px-4 py-2 rounded-lg font-medium ${
                posState.activeTab === 'products'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Package className="inline-block mr-2 w-4 h-4" />
              PRODUCTOS
            </button>
            <button
              onClick={() => setPosState(prev => ({ ...prev, activeTab: 'pending-invoices' }))}
              className={`px-4 py-2 rounded-lg font-medium ${
                posState.activeTab === 'pending-invoices'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="inline-block mr-2 w-4 h-4" />
              FACTURAS PENDIENTES
              {pendingInvoices.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {pendingInvoices.length}
                </span>
              )}
            </button>
          </div>

          {posState.activeTab === 'products' && (
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => setPosState(prev => ({ ...prev, selectedCategory: '' }))}
                className={`px-4 py-2 rounded-lg font-medium ${
                  !posState.selectedCategory 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                TODOS
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setPosState(prev => ({ ...prev, selectedCategory: category }))}
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${
                    posState.selectedCategory === category
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid de productos y facturas pendientes */}
        <div className="flex-1 p-4 overflow-y-auto">
          {posState.activeTab === 'products' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer transition-shadow border border-gray-200"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <div className="mb-1 text-xs bg-green-500 text-white px-2 py-1 rounded">
                      {product.name}
                    </div>
                    <p className="font-semibold text-lg text-gray-800">
                      L.{product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Facturas Pendientes de Cobro</h3>
                <button
                  onClick={refreshPendingInvoices}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Actualizar
                </button>
              </div>
              
              {pendingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando facturas pendientes...</p>
                </div>
              ) : pendingInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No hay facturas pendientes</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingInvoices.map(invoice => (
                    <div
                      key={invoice.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <Wrench className="w-5 h-5 text-blue-600 mr-2" />
                          <span className="font-semibold text-sm">
                            OT #{invoice.id?.slice(-8) || 'N/A'}
                          </span>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Pendiente
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <p><strong>Cliente:</strong> {invoice.clientName}</p>
                        <p><strong>Vehículo:</strong> {invoice.vehicleName}</p>
                        <p><strong>Descripción:</strong> {invoice.descripcion}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-green-600">
                          L.{invoice.totalAmount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => addPendingInvoiceToCart(invoice)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel del carrito y facturación */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Header del carrito */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Nueva Venta</h2>
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <User className="w-4 h-4" />
              <span>
                {posState.selectedClient ? posState.selectedClient.name : 'CONSUMIDOR FINAL'}
              </span>
            </button>
          </div>
        </div>

        {/* Lista del carrito */}
        <div className="flex-1 overflow-y-auto p-4">
          {posState.cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>NO HAY DETALLES AGREGADOS</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posState.cart.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-green-600 font-bold">L.{item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      {item.type === 'service' ? (
                        <>
                          <button
                            disabled
                            className="w-6 h-6 bg-gray-200 rounded text-sm text-gray-400 cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            disabled
                            className="w-6 h-6 bg-gray-200 rounded text-sm text-gray-400 cursor-not-allowed"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                          >
                            +
                          </button>
                        </>
                      )}
                    </div>
                    <span className="font-bold">L.{item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="p-4 border-t">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Descontado:</span>
              <span>L.{posState.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Exonerado:</span>
              <span>L.{posState.exoneradoAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal ISV (15.00%):</span>
              <span>L.{posState.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>ISV (15.00%):</span>
              <span>L.{posState.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Exento:</span>
              <span>L.{posState.exentoAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Descuento Global:</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs"
                />
                <span>%</span>
              </div>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL A PAGAR EN L:</span>
              <span>{posState.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Aperturar Caja
            </button>
            <button
              onClick={() => setShowCloseModal(true)}
              className={`flex-1 ${currentSession ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-300 cursor-not-allowed'} text-white py-2 rounded`}
              disabled={!currentSession}
            >
              Cerrar Caja
            </button>
            <button
              onClick={handleCheckout}
              disabled={!currentSession}
              className={`flex-1 ${currentSession ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'} text-white py-2 rounded`}
            >
              Cobrar (F2)
            </button>
            <button
              onClick={clearCart}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Limpiar (F4)
            </button>
          </div>
        </div>
      </div>

      {/* Modal Apertura de Caja */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="text-lg font-bold mb-4">Apertura de Caja</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">Cajero</label>
              <input type="text" value={cashierName} onChange={(e) => setCashierName(e.target.value)} className="w-full px-2 py-1 border rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">Hora de Apertura (automático)</label>
              <input type="text" value={openingTime} readOnly className="w-full px-2 py-1 border rounded bg-gray-50" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">Monto Inicial</label>
              <input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(Number(e.target.value))} className="w-full px-2 py-1 border rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">Notas (opcional)</label>
              <textarea value={openingNotes} onChange={(e) => setOpeningNotes(e.target.value)} className="w-full px-2 py-1 border rounded" />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowOpenModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
              <button
                onClick={async () => {
                  try {
                    const resp = await cashService.openSession({ openedBy: cashierName || state.user?.name || 'Usuario', openingAmount, notes: openingNotes });
                    if (resp && resp.success) {
                      setCurrentSession(resp.data);
                      setShowOpenModal(false);
                      Swal.fire({ icon: 'success', title: 'Caja aperturada', text: `Monto inicial: L.${Number(openingAmount).toFixed(2)}` });
                    } else {
                      Swal.fire({ icon: 'error', title: 'Error', text: resp?.message || 'No se pudo aperturar la caja' });
                    }
                  } catch (err) {
                    console.error(err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Error conectando al servidor' });
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >Registrar Apertura</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cierre de Caja */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="text-lg font-bold mb-4">Cierre de Caja</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">Efectivo Contado</label>
              <input type="number" value={closingCountedCash} onChange={(e) => setClosingCountedCash(Number(e.target.value))} className="w-full px-2 py-1 border rounded" />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1">Faltantes</label>
                <input type="number" value={closingShortages} onChange={(e) => setClosingShortages(Number(e.target.value))} className="w-full px-2 py-1 border rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Sobrantes</label>
                <input type="number" value={closingOverages} onChange={(e) => setClosingOverages(Number(e.target.value))} className="w-full px-2 py-1 border rounded" />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">Notas (opcional)</label>
              <textarea value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} className="w-full px-2 py-1 border rounded" />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
              <button
                onClick={async () => {
                  if (!currentSession) return Swal.fire({ icon: 'warning', title: 'No hay sesión abierta' });
                  try {
                    const resp = await cashService.closeSession({ sessionId: currentSession.id, closingBy: state.user?.name || 'Usuario', countedCash: closingCountedCash, shortages: closingShortages, overages: closingOverages, closingNotes });
                    if (resp && resp.success) {
                      setCurrentSession(null);
                      setShowCloseModal(false);
                      Swal.fire({ icon: 'success', title: 'Caja cerrada', text: `Diferencia: L.${(Number(closingOverages) - Number(closingShortages)).toFixed(2)}` });
                    } else {
                      Swal.fire({ icon: 'error', title: 'Error', text: resp?.message || 'No se pudo cerrar la caja' });
                    }
                  } catch (err) {
                    console.error(err);
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Error conectando al servidor' });
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded"
              >Registrar Cierre</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reportes / Arqueos */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-auto py-10">
          <div className="bg-white rounded-lg w-[95%] max-w-6xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Arqueos de Caja</h3>
              <div className="space-x-2">
                <button onClick={() => { setShowReportModal(false); }} className="px-3 py-1 bg-gray-300 rounded">Cerrar</button>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button onClick={loadReport} className="px-3 py-1 bg-blue-600 text-white rounded">Actualizar</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Caja</th>
                    <th className="py-2 px-3">Responsable</th>
                    <th className="py-2 px-3">Hora Apertura</th>
                    <th className="py-2 px-3">Hora Cierre</th>
                    <th className="py-2 px-3">Monto Inicial</th>
                    <th className="py-2 px-3">Ventas</th>
                    <th className="py-2 px-3">Ingresos</th>
                    <th className="py-2 px-3">Efectivo</th>
                    <th className="py-2 px-3">Diferencia</th>
                    <th className="py-2 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, idx) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 align-top">{idx + 1}</td>
                      <td className="py-2 px-3 align-top">{r.caja}</td>
                      <td className="py-2 px-3 align-top">{r.cashier}</td>
                      <td className="py-2 px-3 align-top">{r.openingTime ? new Date(r.openingTime).toLocaleString() : '-'}</td>
                      <td className="py-2 px-3 align-top">{r.closingTime ? new Date(r.closingTime).toLocaleString() : '********'}</td>
                      <td className="py-2 px-3 align-top">L.{(r.openingAmount || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 align-top">L.{(r.salesTotal || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 align-top">L.{(r.incomes || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 align-top">L.{(r.expectedCash || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 align-top">{r.difference != null ? `L.${r.difference.toFixed(2)}` : '-'}</td>
                      <td className="py-2 px-3 align-top">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { Swal.fire({ title: 'Detalle de Sesión', html: `<pre style="text-align:left">${JSON.stringify(r, null, 2)}</pre>`, width: 800 }); }} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Ver</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="text-lg font-bold mb-4">Buscar Cliente</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o RTN"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {posState.selectedClient && (
                <div
                  onClick={() => {
                    setIsClientModalOpen(false);
                  }}
                  className="p-2 bg-blue-50 border-2 border-blue-500 cursor-pointer rounded"
                >
                  <p className="font-medium text-blue-900">{posState.selectedClient.name}</p>
                  <p className="text-sm text-blue-700">{posState.selectedClient.phone || 'Sin teléfono'}</p>
                </div>
              )}
              <div
                onClick={() => {
                  setPosState(prev => ({ ...prev, selectedClient: null }));
                  setIsClientModalOpen(false);
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer rounded border"
              >
                <p className="font-medium">CONSUMIDOR FINAL</p>
                <p className="text-sm text-gray-600">Sin RTN</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;