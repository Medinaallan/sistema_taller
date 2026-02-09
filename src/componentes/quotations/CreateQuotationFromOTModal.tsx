import { useState, useEffect } from 'react';
import { Modal, Button, TextArea, Select, Input } from '../comunes/UI';
import { showError, showSuccess, showWarning, showConfirm } from '../../utilidades/sweetAlertHelpers';
import quotationsService from '../../servicios/quotationsService';
import { servicesService } from '../../servicios/apiService';
import type { WorkOrderData } from '../../servicios/workOrdersService';

interface CreateQuotationFromOTModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderData | null;
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

const CreateQuotationFromOTModal = ({ isOpen, onClose, workOrder, onSuccess }: CreateQuotationFromOTModalProps) => {
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

  // Handler para cuando cambia el servicio seleccionado
  const handleServiceChange = (servicioId: string) => {
    setItemForm(prev => ({ ...prev, tipo_servicio_id: servicioId }));
    
    if (servicioId) {
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
          setProducts([]);
        }
      } else {
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
        setServices([]);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // Paso 1: Crear cotización adicional desde OT
  const handleCreateQuotation = async () => {
    if (!workOrder || !workOrder.id) return;

    try {
      setLoading(true);
      const usuario_id = localStorage.getItem('usuario_id');

      console.log(`📝 Creando cotización adicional para OT ${workOrder.id}`);

      const response = await quotationsService.createQuotation({
        cita_id: null,
        ot_id: parseInt(workOrder.id),
        fecha_vencimiento: formData.fecha_vencimiento,
        comentario: formData.comentario,
        registrado_por: usuario_id ? parseInt(usuario_id) : null
      });

      console.log('📥 Respuesta completa del backend:', response);
      console.log('🔍 cotizacion_id:', response?.cotizacion_id);
      console.log('🔍 allow:', response?.allow);
      console.log('🔍 msg:', response?.msg);

      if (response && response.cotizacion_id) {
        setCotizacionId(String(response.cotizacion_id));
        setStep('items');
        showSuccess('Cotización adicional creada. Ahora agregue los items.');
      } else {
        const errorMsg = response?.msg || 'No se recibió ID de cotización';
        console.error('❌ Error en respuesta:', { response, allow: response?.allow });
        showError(`Error: ${errorMsg}. Por favor revise la consola para más detalles.`);
      }
    } catch (error) {
      console.error('Error creando cotización adicional:', error);
      showError('Error creando cotización adicional: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
        tipo_servicio_id: (itemForm.tipo_item === 'Servicio' && itemForm.tipo_servicio_id) ? itemForm.tipo_servicio_id : null,
        registrado_por: usuario_id ? parseInt(usuario_id) : null
      });

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
      
      console.log(`🎯 Finalizando cotización adicional #${cotizacionId}`);
      
      showSuccess('Cotización adicional creada exitosamente. El cliente debe aprobarla para agregar los servicios/repuestos a la OT.');
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
      tipo_servicio_id: '',
      producto_id: ''
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

  if (!workOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Crear Cotización Adicional - OT #${workOrder.id?.slice(-8) || workOrder.id}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Información de la OT */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Información de la Orden de Trabajo</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Cliente:</span>{' '}
              <span className="text-gray-900">{workOrder.nombreCliente || `ID: ${workOrder.clienteId}`}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Vehículo:</span>{' '}
              <span className="text-gray-900">{workOrder.nombreVehiculo || `ID: ${workOrder.vehiculoId}`}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Estado OT:</span>{' '}
              <span className="font-semibold text-blue-600">{workOrder.estado}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Descripción:</span>{' '}
              <span className="text-gray-900">{workOrder.descripcion}</span>
            </div>
          </div>
        </div>

        {/* PASO 1: Información de la Cotización */}
        {step === 'info' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Paso 1: Información de la Cotización Adicional</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ℹ️ Esta cotización adicional requiere aprobación del cliente. Una vez aprobada, los servicios se agregarán como tareas y los repuestos se sumarán al costo.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <TextArea
                label="Comentarios Adicionales"
                value={formData.comentario}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setFormData(prev => ({ ...prev, comentario: e.target.value }))
                }
                placeholder="Explique los hallazgos adicionales durante el trabajo..."
                rows={4}
                maxLength={300}
              />
              <div className="text-xs text-gray-500 text-right">
                {formData.comentario.length}/300
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateQuotation} disabled={loading}>
                  {loading ? 'Creando...' : 'Siguiente: Agregar Items'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Agregar Items */}
        {step === 'items' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900">✅ Cotización #{cotizacionId} creada</h4>
              <p className="text-sm text-green-700 mt-1">
                Agregue items (servicios o repuestos) a la cotización
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">Agregar nuevo ítem</h3>

            {/* Tipo de Item */}
            <Select
              label="Tipo de Ítem *"
              value={itemForm.tipo_item}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                setItemForm(prev => ({ ...prev, tipo_item: e.target.value as 'Servicio' | 'Repuesto' }))
              }
              options={[
                { value: 'Servicio', label: 'Servicio' },
                { value: 'Repuesto', label: 'Repuesto' }
              ]}
            />

            {/* Si es Servicio, mostrar selector de servicios */}
            {itemForm.tipo_item === 'Servicio' && (
              <Select
                label="Tipo de Servicio *"
                value={itemForm.tipo_servicio_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleServiceChange(e.target.value)}
                options={[
                  { value: '', label: loadingServices ? 'Cargando servicios...' : '-- Seleccionar servicio --' },
                  ...services.map(s => ({
                    value: (s.tipo_servicio_id?.toString() || s.id?.toString()),
                    label: s.nombre || s.name
                  }))
                ]}
                required
                disabled={loadingServices}
              />
            )}

            {/* Si es Repuesto, mostrar selector de productos */}
            {itemForm.tipo_item === 'Repuesto' && (
              <Select
                label="Producto"
                value={itemForm.producto_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleProductChange(e.target.value)}
                options={[
                  { value: '', label: loadingProducts ? 'Cargando productos...' : '-- Seleccionar producto o escribir descripción --' },
                  ...products.map(p => ({
                    value: p.id,
                    label: `${p.name} - L${p.price}`
                  }))
                ]}
                disabled={loadingProducts}
              />
            )}

            {/* Descripción */}
            <TextArea
              label="Descripción *"
              value={itemForm.descripcion}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setItemForm(prev => ({ ...prev, descripcion: e.target.value }))
              }
              placeholder="Descripción del servicio o repuesto..."
              rows={2}
            />

            {/* Cantidad y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cantidad *"
                type="number"
                min="1"
                step="1"
                value={itemForm.cantidad}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setItemForm(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))
                }
              />
              <Input
                label="Precio Unitario * (bloqueado)"
                type="number"
                step="0.01"
                value={itemForm.precio_unitario}
                readOnly
                disabled
              />
            </div>

            {/* Descuento */}
            <Input
              label="Descuento Unitario"
              type="number"
              step="0.01"
              min="0"
              value={itemForm.descuento_unitario}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setItemForm(prev => ({ ...prev, descuento_unitario: parseFloat(e.target.value) || 0 }))
              }
            />

            <Button onClick={handleAddItem} disabled={loading} className="w-full">
              Agregar Item
            </Button>

            {/* Lista de Items Agregados */}
            {items.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Items agregados ({items.length})</h4>
                
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            item.tipo_item === 'Servicio' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.tipo_item}
                          </span>
                          <span className="font-medium text-gray-900">{item.descripcion}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {item.cantidad} x L{item.precio_unitario.toFixed(2)}
                          {item.descuento_unitario > 0 && ` - Descuento: L${item.descuento_unitario.toFixed(2)}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-green-600 text-lg">
                            L {item.total_linea.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                          disabled={loading}
                        >
                          ✕ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border-t-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total de la Cotización:</span>
                    <span className="text-2xl font-bold text-green-600">
                      L {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setStep('info')}
                >
                  ← Volver
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={loading || items.length === 0}
                >
                  Finalizar Cotización
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateQuotationFromOTModal;
