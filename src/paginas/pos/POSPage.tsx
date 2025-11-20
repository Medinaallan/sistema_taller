import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package, FileText, Wrench, User } from 'lucide-react';
import type { Client } from '../../tipos';
import usePendingInvoices from '../../hooks/usePendingInvoices';
import { serviceHistoryService } from '../../servicios/serviceHistoryService';
import { obtenerClientes } from '../../servicios/clientesApiService';
import { vehiclesService } from '../../servicios/apiService';

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
  type: 'product' | 'service';
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
  discount: number;
  selectedCategory: string;
  activeTab: 'products' | 'pending-invoices';
}

// Productos de muestra
const sampleProducts: POSItem[] = [
  { id: '1', name: 'ACEITE DE MOTOR 10W-30', price: 12.50, quantity: 1, category: 'LUBRICANTES', type: 'product' },
  { id: '2', name: 'ACEITE SINTÉTICO 5W-40', price: 15.30, quantity: 1, category: 'LUBRICANTES', type: 'product' },
  { id: '3', name: 'BATERÍA ACDELCO 12V', price: 899.99, quantity: 1, category: 'ELECTRÓNICA AUTOMOTRIZ', type: 'product' },
  { id: '4', name: 'ADITIVO PARA MOTOR ANTIFRICCIÓN', price: 45.60, quantity: 1, category: 'ADITIVOS', type: 'product' },
  { id: '5', name: 'ALICATE UNIVERSAL MECÁNICO', price: 28.75, quantity: 1, category: 'HERRAMIENTAS', type: 'product' },
  { id: '6', name: 'ESCÁNER AUTOMOTRIZ BÁSICO OBD2', price: 599.99, quantity: 1, category: 'ELECTRÓNICA AUTOMOTRIZ', type: 'product' },
  { id: '7', name: 'ESCÁNER PROFESIONAL MULTIMARCA', price: 1299.99, quantity: 1, category: 'EQUIPO DIAGNÓSTICO', type: 'product' },
  { id: '8', name: 'PASTILLAS DE FRENO DELANTERAS', price: 8.90, quantity: 1, category: 'FRENOS', type: 'product' },
  { id: '9', name: 'ATORNILLADOR ELÉCTRICO PARA MECÁNICA', price: 65.45, quantity: 1, category: 'HERRAMIENTAS', type: 'product' },
  { id: '10', name: 'LLAVE CRUZ PARA LLANTAS', price: 24.30, quantity: 1, category: 'HERRAMIENTAS', type: 'product' },
  { id: '11', name: 'LÍQUIDO DE FRENOS DOT 4', price: 18.75, quantity: 1, category: 'FLUIDOS', type: 'product' },
  { id: '12', name: 'LÍQUIDO REFRIGERANTE ROJO', price: 22.60, quantity: 1, category: 'FLUIDOS', type: 'product' },
  { id: '13', name: 'LIMPIADOR DE CARBURADOR', price: 3.25, quantity: 1, category: 'LIMPIEZA AUTOMOTRIZ', type: 'product' },
  { id: '14', name: 'LIMPIADOR DE INYECTORES', price: 12.45, quantity: 1, category: 'ADITIVOS', type: 'product' },
  { id: '15', name: 'SELLADOR DE JUNTAS PARA MOTOR', price: 16.80, quantity: 1, category: 'MANTENIMIENTO', type: 'product' }
];

const categories = [
  'LUBRICANTES',
  'ELECTRÓNICA AUTOMOTRIZ',
  'ADITIVOS',
  'HERRAMIENTAS',
  'EQUIPO DIAGNÓSTICO',
  
];

const POSPage: React.FC = () => {
  const [posState, setPosState] = useState<POSState>({
    cart: [],
    selectedClient: null,
    searchQuery: '',
    total: 0,
    subtotal: 0,
    tax: 0,
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

  // Calcular totales
  useEffect(() => {
    const subtotal = posState.cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = subtotalAfterDiscount * taxRate;
    const total = subtotalAfterDiscount + tax;

    setPosState(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
      discount: discountAmount
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
    const invoiceItem: CartItem = {
      id: `invoice-${pendingInvoice.id}`,
      name: `Factura Pendiente - OT #${pendingInvoice.id?.slice(-8) || ''}`,
      price: pendingInvoice.totalAmount || pendingInvoice.costoTotal,
      quantity: 1,
      total: pendingInvoice.totalAmount || pendingInvoice.costoTotal,
      category: 'SERVICIOS',
      type: 'service'
    };

    setPosState(prev => {
      const existingItem = prev.cart.find(item => item.id === invoiceItem.id);
      
      if (!existingItem) {
        return {
          ...prev,
          cart: [...prev.cart, invoiceItem]
        };
      }
      
      return prev;
    });
  };

  const updateCartItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setPosState(prev => ({
      ...prev,
      cart: prev.cart.map(item =>
        item.id === id
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    }));
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

  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(posState.searchQuery.toLowerCase());
    const matchesCategory = !posState.selectedCategory || product.category === posState.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCheckout = async () => {
    if (posState.cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      // Separar productos y servicios (facturas pendientes)
      const productItems = posState.cart.filter(item => item.type === 'product');
      const serviceItems = posState.cart.filter(item => item.type === 'service');

      // Crear la factura
      const invoice = {
        id: Date.now().toString(),
        items: posState.cart,
        client: posState.selectedClient,
        subtotal: posState.subtotal,
        tax: posState.tax,
        discount: posState.discount,
        total: posState.total,
        date: new Date(),
        hasProducts: productItems.length > 0,
        hasServices: serviceItems.length > 0
      };

      console.log('Factura generada:', invoice);

      // Procesar servicios facturados (órdenes de trabajo)
      for (const serviceItem of serviceItems) {
        if (serviceItem.id.startsWith('invoice-')) {
          const workOrderId = serviceItem.id.replace('invoice-', '');
          
          try {
            // Marcar orden como facturada
            await markAsInvoiced(workOrderId);
            
            // Buscar la orden original para obtener información completa
            const originalInvoice = pendingInvoices.find(inv => inv.id === workOrderId);
            if (originalInvoice) {
              console.log('Datos de la factura original:', originalInvoice);
              
              // Registrar en el historial global de servicios
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
                serviceDuration: '1 hora', // Valor por defecto
                status: 'completed',
                paymentStatus: 'paid',
                invoiceId: invoice.id,
                invoiceTotal: posState.total,
                date: new Date().toISOString(),
                notes: `Facturado en POS el ${new Date().toLocaleDateString()} - Total: L.${posState.total.toFixed(2)}`
              };

              console.log('Datos a enviar al historial:', historyRecord);

              // Agregar al historial
              try {
                const historyResult = await serviceHistoryService.addServiceHistory(historyRecord);
                console.log('Resultado del historial:', historyResult);
                if (historyResult.success) {
                  console.log(`Servicio ${workOrderId} agregado al historial global exitosamente`);
                } else {
                  console.error('Error al agregar al historial:', historyResult.message);
                }
              } catch (historyError) {
                console.error('Error al agregar al historial:', historyError);
                // No fallar toda la operación por esto
              }
            } else {
              console.warn(`No se encontró la factura original para la orden ${workOrderId}`);
            }
            
            console.log(`Orden de trabajo ${workOrderId} marcada como facturada`);
          } catch (error) {
            console.error(`Error al marcar como facturada la orden ${workOrderId}:`, error);
            throw error; // Re-lanzar para manejar en el catch principal
          }
        }
      }

      alert(`Factura generada exitosamente por L.${posState.total.toFixed(2)}`);
      clearCart();
      setPosState(prev => ({ ...prev, selectedClient: null }));
      setDiscountPercentage(0);

      // Actualizar lista de facturas pendientes
      if (serviceItems.length > 0) {
        refreshPendingInvoices();
      }
      
    } catch (error) {
      console.error('Error durante el checkout:', error);
      alert('Error al procesar la factura. Por favor, inténtelo de nuevo.');
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
              <span>L.0.00</span>
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
              <span>L.0.00</span>
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
              {/* Aquí irían los clientes filtrados */}
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