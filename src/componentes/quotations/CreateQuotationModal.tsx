import { useState, useEffect } from 'react';
import { Modal, Button, TextArea, Select, Input } from '../comunes/UI';
import { showError, showSuccess, showWarning, showConfirm } from '../../utilidades/sweetAlertHelpers';
import quotationsService from '../../servicios/quotationsService';
import { servicesService, appointmentsService } from '../../servicios/apiService';
import { getDisplayNames } from '../../utilidades/dataMappers';
import type { Appointment } from '../../tipos';

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

interface QuotationItem {
  cot_item_id?: string;
  tipo_item: 'Servicio' | 'Repuesto';
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_unitario: number;
  total_linea: number;
  tipo_servicio_id?: string | null;
}

const CreateQuotationModal = ({ isOpen, onClose, appointment, onSuccess }: CreateQuotationModalProps) => {
  const [step, setStep] = useState<'info' | 'items' | 'summary'>('info');
  const [loading, setLoading] = useState(false);
  const [cotizacionId, setCotizacionId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Datos del formulario - Paso 1: Información
  const [formData, setFormData] = useState({
    fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    comentario: ''
  });

  // Datos del formulario - Paso 2: Items
  const [itemForm, setItemForm] = useState({
    tipo_item: 'Servicio' as 'Servicio' | 'Repuesto',
    descripcion: '',
    cantidad: 1,
    precio_unitario: 0,
    descuento_unitario: 0,
    tipo_servicio_id: '',
    producto_id: ''
  });

  // Items agregados
  const [items, setItems] = useState<QuotationItem[]>([]);

  // Nombres descriptivos
  const [displayNames, setDisplayNames] = useState({
    clientName: 'Cargando...',
    vehicleName: 'Cargando...',
    serviceName: 'Cargando...'
  });

  // Handler para cuando cambia el servicio seleccionado
  const handleServiceChange = (servicioId: string) => {
    setItemForm(prev => ({ ...prev, tipo_servicio_id: servicioId }));
    
    if (servicioId) {
      // Buscar el servicio seleccionado
      const servicioSeleccionado = services.find(s => 
        (s.tipo_servicio_id?.toString() || s.id?.toString()) === servicioId
      );
      
      if (servicioSeleccionado) {
        const precio = parseFloat(servicioSeleccionado.precio_base || servicioSeleccionado.basePrice || 0);
        const descripcion = servicioSeleccionado.nombre || servicioSeleccionado.name || '';
        
        setItemForm(prev => ({
          ...prev,
          descripcion: descripcion,
          precio_unitario: precio
        }));
        
        console.log(`💰 Servicio seleccionado: ${descripcion} - Precio: L${precio}`);
      }
    }
  };

  // Handler para cuando cambia el producto seleccionado
  const handleProductChange = (productoId: string) => {
    setItemForm(prev => ({ ...prev, producto_id: productoId }));
    
    if (productoId) {
      // Buscar el producto seleccionado
      const productoSeleccionado = products.find(p => p.id === productoId);
      
      if (productoSeleccionado) {
        const precio = parseFloat(productoSeleccionado.price || 0);
        const descripcion = productoSeleccionado.name || '';
        
        setItemForm(prev => ({
          ...prev,
          descripcion: descripcion,
          precio_unitario: precio
        }));
        
        console.log(`📦 Producto seleccionado: ${descripcion} - Precio: L${precio}`);
      }
    }
  };

  // Cargar servicios y productos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadServices();
      loadProducts();
      loadDisplayNames();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const base = API_BASE_URL.replace(/\/api$/, '');
      const url = base.endsWith('/api') ? `${base}/products` : `${base}/api/products`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const validProducts = Array.isArray(result.data) ? result.data : [];
          setProducts(validProducts);
          console.log(`📦 ${validProducts.length} productos cargados`);
        } else {
          console.error('Error en respuesta de productos:', result);
          setProducts([]);
        }
      } else {
        console.error('Error al cargar productos:', response.statusText);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await servicesService.getAll();
      if (response.success && response.data) {
        const validServices = Array.isArray(response.data) ? response.data : [];
        setServices(validServices);
      } else {
        console.warn('No se pudieron cargar los servicios:', response);
        setServices([]);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadDisplayNames = async () => {
    if (appointment) {
      try {
        const names = await getDisplayNames({
          clientId: appointment.clientId,
          vehicleId: appointment.vehicleId,
          serviceId: appointment.serviceTypeId
        });
        setDisplayNames(names);
      } catch (error) {
        console.error('Error cargando nombres:', error);
        setDisplayNames({
          clientName: `Cliente #${appointment.clientId}`,
          vehicleName: `Vehículo #${appointment.vehicleId}`,
          serviceName: `Servicio #${appointment.serviceTypeId}`
        });
      }
    }
  };

  // Paso 1: Crear cotización
  const handleCreateQuotation = async () => {
    if (!appointment) return;

    try {
      setLoading(true);
      const usuario_id = localStorage.getItem('usuario_id');

      const response = await quotationsService.createQuotation({
        cita_id: typeof appointment.id === 'string' ? parseInt(appointment.id) : appointment.id,
        ot_id: null,
        fecha_vencimiento: formData.fecha_vencimiento,
        comentario: formData.comentario,
        registrado_por: usuario_id ? parseInt(usuario_id) : null
      });

      if (response && response.cotizacion_id) {
        setCotizacionId(String(response.cotizacion_id));
        setStep('items');
      } else {
        showError('Error: No se recibió ID de cotización. Respuesta: ' + JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error creando cotización:', error);
      showError('Error creando cotización: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Cargar items desde el servidor
  const loadQuotationItems = async (quotationId: string) => {
    try {
      const itemsData = await quotationsService.getQuotationItems(quotationId);
      setItems(itemsData as QuotationItem[]);
    } catch (error) {
      console.error('Error cargando items:', error);
    }
  };

  // Paso 2: Agregar item a la cotización
  const handleAddItem = async () => {
    if (!cotizacionId) return;
    if (!itemForm.descripcion.trim()) {
      showWarning('La descripción es requerida');
      return;
    }
    if (itemForm.cantidad <= 0) {
      showWarning('La cantidad debe ser mayor a 0');
      return;
    }
    if (itemForm.precio_unitario <= 0) {
      showWarning('El precio unitario debe ser mayor a 0');
      return;
    }
    if (itemForm.tipo_item === 'Servicio' && (!itemForm.tipo_servicio_id || itemForm.tipo_servicio_id.trim() === '')) {
      showWarning('Debe seleccionar un tipo de servicio');
      return;
    }

    try {
      setLoading(true);
      const usuario_id = localStorage.getItem('usuario_id');

      await quotationsService.addItemToQuotation({
        cotizacion_id: cotizacionId,
        tipo_item: itemForm.tipo_item,
        descripcion: itemForm.descripcion,
        cantidad: itemForm.cantidad,
        precio_unitario: itemForm.precio_unitario,
        descuento_unitario: itemForm.descuento_unitario,
        tipo_servicio_id: itemForm.tipo_item === 'Servicio' ? itemForm.tipo_servicio_id : null,
        registrado_por: usuario_id ? parseInt(usuario_id) : null
      });

      // Recargar items desde el servidor para sincronizar
      await loadQuotationItems(cotizacionId);

      // Limpiar formulario de item
      setItemForm({
        tipo_item: 'Servicio',
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        descuento_unitario: 0,
        tipo_servicio_id: '',
        producto_id: ''
      });

      showSuccess('Item agregado exitosamente');
    } catch (error) {
      console.error('Error agregando item:', error);
      showError('Error agregando item: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Eliminar item
  const handleRemoveItem = async (index: number) => {
    const item = items[index];
    if (!item.cot_item_id) {
      // Si no tiene ID, es un item local sin guardar aún
      setItems(items.filter((_, i) => i !== index));
      return;
    }

    try {
      setLoading(true);
      const usuario_id = localStorage.getItem('usuario_id');

      await quotationsService.removeItemFromQuotation({
        cot_item_id: item.cot_item_id,
        eliminado_por: usuario_id ? parseInt(usuario_id) : null
      });

      // Recargar items desde el servidor para sincronizar
      if (cotizacionId) {
        await loadQuotationItems(cotizacionId);
      }

      showSuccess('Item eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando item:', error);
      showError('Error eliminando item: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Calcular total
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_linea, 0);
  };

  // Finalizar cotización
  const handleFinish = async () => {
    if (items.length === 0) {
      showWarning('Debe agregar al menos un item a la cotización');
      return;
    }

    try {
      setLoading(true);
      
      console.log(`🎯 Finalizando cotización #${cotizacionId}`);
      
      // Cambiar estado de la cita a "aprobada" cuando se finaliza la cotización
      if (appointment && appointment.id) {
        try {
          const usuario_id = localStorage.getItem('usuario_id');
          console.log(`📋 Cambiando estado de cita ${appointment.id} a "aprobada"`);
          
          await appointmentsService.changeStatus(
            typeof appointment.id === 'string' ? parseInt(appointment.id, 10) : appointment.id,
            {
              nuevo_estado: 'aprobada',
              comentario: 'Cotización finalizada',
              registrado_por: usuario_id ? parseInt(usuario_id) : 0
            }
          );
          
          console.log('✅ Estado de cita actualizado a "aprobada"');
        } catch (error) {
          console.error('⚠️ Error al cambiar estado de cita:', error);
          // Continuar aunque falle el cambio de estado
        }
      }
      
      showSuccess('Cotización creada exitosamente');
      onSuccess();
      resetModal();
      onClose();
    } catch (error) {
      console.error('Error al finalizar cotización:', error);
      showError('Error al finalizar la cotización');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('info');
    setCotizacionId(null);
    setFormData({
      fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      comentario: ''
    });
    setItemForm({
      tipo_item: 'Servicio',
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento_unitario: 0,
      tipo_servicio_id: ''
    });
    setItems([]);
  };

  const handleClose = async () => {
    if (step !== 'info' && !await showConfirm('¿Descartar los cambios?')) {
      return;
    }
    resetModal();
    onClose();
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Crear Cotización - Cita #${String(appointment.id).substring(0, 8)}`}
      size="lg"
    >
      {/* PASO 1: Información de la Cotización */}
      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">Información de la cita</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Cliente:</span>
                <div className="font-medium">{displayNames.clientName}</div>
              </div>
              <div>
                <span className="text-gray-600">Vehículo:</span>
                <div className="font-medium">{displayNames.vehicleName}</div>
              </div>
              <div>
                <span className="text-gray-600">Servicio:</span>
                <div className="font-medium">{displayNames.serviceName}</div>
              </div>
              <div>
                <span className="text-gray-600">Fecha:</span>
                <div className="font-medium">{appointment.date.toLocaleDateString('es-ES')}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Vencimiento *
            </label>
            <Input
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios
            </label>
            <TextArea
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              placeholder="Comentarios adicionales sobre la cotización..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.comentario.length}/300</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={loading}
              disabled={loading}
              onClick={handleCreateQuotation}
            >
              Siguiente: Agregar Items
            </Button>
          </div>
        </div>
      )}

      {/* PASO 2: Agregar Items */}
      {step === 'items' && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900">
              Cotización #{cotizacionId?.substring(0, 8)}
            </h4>
            <p className="text-sm text-green-800">Agregue items (servicios o repuestos)</p>
          </div>

          {/* Formulario para agregar items */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Agregar nuevo item</h5>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Item *
                </label>
                <Select
                  value={itemForm.tipo_item}
                  onChange={(e) => setItemForm({ ...itemForm, tipo_item: e.target.value as 'Servicio' | 'Repuesto', tipo_servicio_id: '', producto_id: '', descripcion: '', precio_unitario: 0 })}
                  options={[
                    { value: 'Servicio', label: 'Servicio' },
                    { value: 'Repuesto', label: 'Repuesto' }
                  ]}
                />
              </div>

              {itemForm.tipo_item === 'Servicio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Servicio *
                  </label>
                  <Select
                    value={itemForm.tipo_servicio_id}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    options={
                      loadingServices 
                        ? [{ value: '', label: 'Cargando servicios...' }]
                        : [
                            { value: '', label: '-- Seleccionar servicio --' },
                            ...(Array.isArray(services) ? services.map((s) => ({
                              value: s.tipo_servicio_id?.toString() || s.id?.toString() || '',
                              label: `${s.nombre || s.name || 'Servicio sin nombre'} - L${(s.precio_base || s.basePrice || 0).toLocaleString()}`
                            })).filter(opt => opt.value) : [])
                          ]
                    }
                    disabled={loadingServices}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Al seleccionar un servicio, el precio y descripción se completarán automáticamente
                  </p>
                </div>
              )}

              {itemForm.tipo_item === 'Repuesto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto *
                  </label>
                  <Select
                    value={itemForm.producto_id}
                    onChange={(e) => handleProductChange(e.target.value)}
                    options={
                      loadingProducts 
                        ? [{ value: '', label: 'Cargando productos...' }]
                        : [
                            { value: '', label: '-- Seleccionar producto --' },
                            ...(Array.isArray(products) ? products.map((p) => ({
                              value: p.id || '',
                              label: `${p.name || 'Producto sin nombre'} - L${(p.price || 0).toLocaleString()} ${p.stock !== undefined ? `(Stock: ${p.stock})` : ''}`
                            })).filter(opt => opt.value) : [])
                          ]
                    }
                    disabled={loadingProducts}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Al seleccionar un producto, el precio y descripción se completarán automáticamente
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <TextArea
                  value={itemForm.descripcion}
                  onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })}
                  placeholder="Descripción del servicio o repuesto..."
                  rows={2}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {itemForm.tipo_item === 'Servicio' ? 'Se completa automáticamente al seleccionar servicio' : 'Describe el repuesto'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={itemForm.cantidad}
                    onChange={(e) => setItemForm({ ...itemForm, cantidad: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unitario * {itemForm.tipo_item === 'Servicio' && '(bloqueado)'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.precio_unitario}
                    onChange={(e) => setItemForm({ ...itemForm, precio_unitario: parseFloat(e.target.value) || 0 })}
                    placeholder={itemForm.tipo_item === 'Servicio' ? 'Se completa al seleccionar servicio' : 'Se completa al seleccionar producto'}
                    readOnly={(itemForm.tipo_item === 'Servicio' && itemForm.precio_unitario > 0) || (itemForm.tipo_item === 'Repuesto' && itemForm.precio_unitario > 0)}
                    className={(itemForm.tipo_item === 'Servicio' && itemForm.precio_unitario > 0) || (itemForm.tipo_item === 'Repuesto' && itemForm.precio_unitario > 0) ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  {itemForm.tipo_item === 'Servicio' && itemForm.precio_unitario > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Precio del servicio: L{itemForm.precio_unitario.toLocaleString()} (no editable)
                    </p>
                  )}
                  {itemForm.tipo_item === 'Repuesto' && itemForm.precio_unitario > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Precio del producto: L{itemForm.precio_unitario.toLocaleString()} (no editable)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Unitario
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.descuento_unitario}
                  onChange={(e) => setItemForm({ ...itemForm, descuento_unitario: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <Button
                type="button"
                onClick={handleAddItem}
                loading={loading}
                disabled={loading}
                className="w-full"
              >
                Agregar Item
              </Button>
            </div>
          </div>

          {/* Lista de items agregados */}
          {items.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h5 className="font-medium text-blue-900 mb-3">Items agregados ({items.length})</h5>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.descripcion}</p>
                      <p className="text-sm text-gray-600">
                        {item.tipo_item} • {item.cantidad} x L {item.precio_unitario.toFixed(2)}
                        {item.descuento_unitario > 0 && ` - L ${item.descuento_unitario.toFixed(2)} desc.`}
                      </p>
                      <p className="text-sm font-semibold text-blue-600">
                        Total: L {item.total_linea.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={loading}
                    >
                      ✕ Eliminar
                    </Button>
                  </div>
                ))}

                <div className="border-t border-blue-200 pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total de la Cotización:</span>
                    <span className="text-lg text-green-600">L {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep('summary')}
              disabled={items.length === 0 || loading}
            >
              Ver Resumen
            </Button>
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3: Resumen */}
      {step === 'summary' && (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">Resumen de la Cotización</h4>
            <p className="text-sm text-purple-800">Cotización #{cotizacionId?.substring(0, 8)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Cliente</span>
              <p className="font-medium">{displayNames.clientName}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Vehículo</span>
              <p className="font-medium">{displayNames.vehicleName}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Vencimiento</span>
              <p className="font-medium">{new Date(formData.fecha_vencimiento).toLocaleDateString('es-ES')}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Items</span>
              <p className="font-medium">{items.length}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Items incluidos:</h5>
            <div className="space-y-2 text-sm">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.descripcion}</p>
                    <p className="text-xs text-gray-600">{item.tipo_item} • {item.cantidad} x L {item.precio_unitario.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">L {item.total_linea.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg font-semibold text-lg">
                <span>Total:</span>
                <span className="text-green-600">L {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {formData.comentario && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-600 font-medium">Comentarios:</p>
              <p className="text-sm text-yellow-800">{formData.comentario}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep('items')}
              disabled={loading}
            >
              Volver a Editar
            </Button>
            <Button
              type="button"
              loading={loading}
              disabled={loading}
              onClick={handleFinish}
            >
              Finalizar Cotización
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateQuotationModal;
