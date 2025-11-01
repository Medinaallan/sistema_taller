import { useState, useEffect } from 'react';
import { Modal, Input, TextArea, Button } from '../comunes/UI';
import type { Appointment, Product } from '../../tipos';
import { servicesService, productsService } from '../../servicios/apiService';
import { getDisplayNames } from '../../utilidades/dataMappers';

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quotationData: any) => void;
  appointment: Appointment | null;
  clientName: string;
  serviceName: string;
}

const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  clientName,
  serviceName,
}) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    precio: '',
    notas: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [servicePriceBase, setServicePriceBase] = useState('');
  const [loadingServicePrice, setLoadingServicePrice] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>([]);
  const [productsFromInventory, setProductsFromInventory] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductsSection, setShowProductsSection] = useState(false);
  const [displayNames, setDisplayNames] = useState({
    clientName: clientName || 'Cargando...',
    vehicleName: 'Cargando...',
    serviceName: serviceName || 'Cargando...'
  });

  // Cargar precio del servicio desde la API cuando se abre el modal
  useEffect(() => {
    const loadServicePrice = async () => {
      if (isOpen && appointment?.serviceTypeId) {
        try {
          setLoadingServicePrice(true);
          const response = await servicesService.getAll();
          
          if (response.success) {
            // Buscar el servicio específico por ID
            const service = response.data.find((s: any) => s.id === appointment.serviceTypeId);
            
            if (service) {
              const servicePrice = parseFloat(service.precio) || 0;
              setServicePriceBase(servicePrice.toString());
              setFormData(prev => ({ ...prev, precio: servicePrice.toString() }));
            } else {
              // Si no se encuentra el servicio, usar un precio por defecto
              console.warn(`Servicio con ID ${appointment.serviceTypeId} no encontrado`);
              setServicePriceBase('0');
              setFormData(prev => ({ ...prev, precio: '0' }));
            }
          }
        } catch (error) {
          console.error('Error cargando precio del servicio:', error);
          // En caso de error, usar precio por defecto
          setServicePriceBase('0');
          setFormData(prev => ({ ...prev, precio: '0' }));
        } finally {
          setLoadingServicePrice(false);
        }
      }
    };

    loadServicePrice();
  }, [isOpen, appointment?.serviceTypeId]);

  // Cargar productos del inventario
  useEffect(() => {
    const loadProducts = async () => {
      if (isOpen) {
        try {
          setLoadingProducts(true);
          const response = await productsService.getAll();
          
          if (response.success && response.data) {
            setProductsFromInventory(response.data);
          } else {
            setProductsFromInventory([]);
            console.warn('No se pudieron cargar los productos del inventario');
          }
        } catch (error) {
          console.error('Error cargando productos:', error);
          setProductsFromInventory([]);
        } finally {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();
  }, [isOpen]);

  // Cargar nombres descriptivos cuando se abre el modal
  useEffect(() => {
    const loadDisplayNames = async () => {
      if (isOpen && appointment) {
        try {
          const names = await getDisplayNames({
            clientId: appointment.clientId,
            vehicleId: appointment.vehicleId,
            serviceId: appointment.serviceTypeId
          });
          setDisplayNames(names);
        } catch (error) {
          console.error('Error cargando nombres descriptivos:', error);
          setDisplayNames({
            clientName: clientName || `Cliente #${appointment.clientId}`,
            vehicleName: `Vehículo #${appointment.vehicleId}`,
            serviceName: serviceName || `Servicio #${appointment.serviceTypeId}`
          });
        }
      }
    };

    loadDisplayNames();
  }, [isOpen, appointment, clientName, serviceName]);

  // Funciones para manejar productos
  const handleAddProduct = (product: Product & { inventoryQuantity: number }) => {
    const existingProduct = selectedProducts.find(p => p.productId === product.id);
    
    if (existingProduct) {
      // Si ya existe, aumentar cantidad
      const newQuantity = Math.min(existingProduct.quantity + 1, product.inventoryQuantity || product.stock);
      handleQuantityChange(product.id, newQuantity);
    } else {
      // Agregar nuevo producto
      const newProduct = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      };
      
      const updatedProducts = [...selectedProducts, newProduct];
      setSelectedProducts(updatedProducts);
      updateTotalPriceWithProducts(updatedProducts);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(p => p.productId !== productId);
    setSelectedProducts(updatedProducts);
    updateTotalPriceWithProducts(updatedProducts);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    
    const updatedProducts = selectedProducts.map(p => {
      if (p.productId === productId) {
        return {
          ...p,
          quantity,
          total: p.unitPrice * quantity
        };
      }
      return p;
    });
    
    setSelectedProducts(updatedProducts);
    updateTotalPriceWithProducts(updatedProducts);
  };

  const updateTotalPriceWithProducts = (products: any[]) => {
    const servicePriceNum = parseFloat(servicePriceBase) || 0;
    const productsTotalPrice = products.reduce((sum, product) => sum + product.total, 0);
    const totalPrice = servicePriceNum + productsTotalPrice;
    
    setFormData(prev => ({ ...prev, precio: totalPrice.toString() }));
  };

  const handleServicePriceChange = (value: string) => {
    setServicePriceBase(value);
    updateTotalPriceWithProducts(selectedProducts);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!servicePriceBase || parseFloat(servicePriceBase) <= 0) {
      newErrors.servicePriceBase = 'El precio del servicio debe ser mayor a 0';
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio total debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !appointment) {
      return;
    }

    const quotationData = {
      appointmentId: appointment.id,
      clienteId: appointment.clientId,
      vehiculoId: appointment.vehicleId,
      servicioId: appointment.serviceTypeId,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      precioServicioBase: parseFloat(servicePriceBase),
      notas: formData.notas,
      estado: 'sent',
      fechaCreacion: new Date().toISOString().split('T')[0],
      productos: selectedProducts,
      totalProductos: selectedProducts.reduce((sum, p) => sum + p.total, 0),
    };

    onSubmit(quotationData);
    onClose();
    
    // Limpiar formulario
    setFormData({
      descripcion: '',
      precio: '',
      notas: '',
    });
    setServicePriceBase('');
    setErrors({});
    setSelectedProducts([]);
    setShowProductsSection(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si se cambia manualmente el precio total, recalcular el precio base del servicio
    if (field === 'precio') {
      const totalPrice = parseFloat(value) || 0;
      const productsTotalPrice = selectedProducts.reduce((sum, p) => sum + p.total, 0);
      const newServicePrice = Math.max(0, totalPrice - productsTotalPrice);
      setServicePriceBase(newServicePrice.toString());
    }
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Cotización"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la cita */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Información de la Cita</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Cita:</strong> #{appointment.id.slice(-8)}</p>
            <p><strong>Cliente:</strong> {displayNames.clientName}</p>
            <p><strong>Servicio:</strong> {displayNames.serviceName}</p>
            <p><strong>Vehículo:</strong> {displayNames.vehicleName}</p>
            <p><strong>Fecha:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Sección de productos del inventario */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Productos del punto de venta</h3>
            <button
              type="button"
              onClick={() => setShowProductsSection(!showProductsSection)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showProductsSection ? 'Ocultar productos' : 'Agregar productos'}
            </button>
          </div>

          {showProductsSection && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {loadingProducts ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Cargando productos del inventario...</p>
                </div>
              ) : productsFromInventory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">No hay productos disponibles en el inventario.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Los productos se cargarán automáticamente desde el sistema cuando estén disponibles.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Productos disponibles:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {productsFromInventory.map((product) => {
                      const isSelected = selectedProducts.some(p => p.productId === product.id);
                      const selectedProduct = selectedProducts.find(p => p.productId === product.id);
                      const availableStock = product.stock || 0;
                      
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{product.name}</h5>
                            <p className="text-sm text-gray-600">
                              ${product.price.toFixed(2)} • Stock: {availableStock}
                            </p>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isSelected ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(product.id, (selectedProduct?.quantity || 1) - 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 font-medium"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium">
                                  {selectedProduct?.quantity || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(product.id, (selectedProduct?.quantity || 0) + 1)}
                                  disabled={selectedProduct && selectedProduct.quantity >= availableStock}
                                  className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full text-white font-medium"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddProduct({ ...product, inventoryQuantity: availableStock })}
                                disabled={availableStock <= 0}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded-lg font-medium"
                              >
                                Agregar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de productos seleccionados */}
          {selectedProducts.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-900 mb-3">Productos agregados:</h4>
              <div className="space-y-2">
                {selectedProducts.map((product) => (
                  <div key={product.productId} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-600">
                        ${product.unitPrice.toFixed(2)} x {product.quantity} = ${product.total.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.productId)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium ml-3"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <div className="border-t pt-2 mt-3">
                  <p className="font-medium text-blue-900">
                    Total productos: ${selectedProducts.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <TextArea
          label="Descripción del Trabajo"
          value={formData.descripcion}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('descripcion', e.target.value)}
          error={errors.descripcion}
          placeholder="Describa detalladamente el trabajo a realizar..."
          rows={4}
          required
        />

        {/* Precio del servicio base */}
        <Input
          label={`Precio del Servicio Base${loadingServicePrice ? ' (Cargando...)' : ''}`}
          type="number"
          step="0.01"
          min="0"
          value={servicePriceBase}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleServicePriceChange(e.target.value)}
          error={errors.servicePriceBase}
          placeholder={loadingServicePrice ? "Obteniendo precio desde el sistema..." : "Precio obtenido automáticamente del servicio"}
          required
          disabled={loadingServicePrice}
        />

        {servicePriceBase && !loadingServicePrice && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>✓ Precio cargado automáticamente</strong>
            </p>
          </div>
        )}

        {/* Campo de precio total */}
        <Input
          label="Precio Total de la Cotización"
          type="number"
          step="0.01"
          min="0"
          value={formData.precio}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            handleInputChange('precio', e.target.value);
            setServicePriceBase(e.target.value);
          }}
          error={errors.precio}
          placeholder="0.00"
          required
        />

        <TextArea
          label="Notas Adicionales"
          value={formData.notas}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notas', e.target.value)}
          placeholder="Notas internas, condiciones especiales, etc..."
          rows={3}
        />

        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Esta cotización se enviará automáticamente al cliente y se marcará la cita como "Completada".
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            Crear Cotización
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateQuotationModal;