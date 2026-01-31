import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package, FileText, Wrench, User } from 'lucide-react';
import type { Client } from '../../tipos';
import usePendingInvoices from '../../hooks/usePendingInvoices';
import { serviceHistoryService } from '../../servicios/serviceHistoryService';
import Swal from 'sweetalert2';
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
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const taxRate = 0.15; // 15% ISV constante
  
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
              onClick={clearCart}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Aperturar Caja
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
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