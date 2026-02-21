import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal } from '../../../componentes/comunes/UI';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { showError, showSuccess, showConfirm } from '../../../utilidades/sweetAlertHelpers';

// Interfaz para método de pago
export interface PaymentMethod {
  id: string;
  nombre: string;
  tipo: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  activo: boolean;
  requiereReferencia: boolean;
  descripcion?: string;
  createdAt: Date;
}

// Servicio básico para métodos de pago (localStorage por ahora, puede migrar a BD después)
class PaymentMethodsService {
  private storageKey = 'payment-methods';

  async getAll(): Promise<PaymentMethod[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        // Inicializar con métodos por defecto
        const defaultMethods: PaymentMethod[] = [
          {
            id: '1',
            nombre: 'Efectivo',
            tipo: 'Efectivo',
            activo: true,
            requiereReferencia: false,
            descripcion: 'Pago en efectivo',
            createdAt: new Date()
          },
          {
            id: '2',
            nombre: 'Tarjeta',
            tipo: 'Tarjeta',
            activo: true,
            requiereReferencia: true,
            descripcion: 'Pago con tarjeta de crédito/débito',
            createdAt: new Date()
          },
          {
            id: '3',
            nombre: 'Transferencia Bancaria',
            tipo: 'Transferencia',
            activo: true,
            requiereReferencia: true,
            descripcion: 'Transferencia bancaria',
            createdAt: new Date()
          }
        ];
        await this.saveAll(defaultMethods);
        return defaultMethods;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
      return [];
    }
  }

  async saveAll(methods: PaymentMethod[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(methods));
  }

  async create(method: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<PaymentMethod> {
    const methods = await this.getAll();
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    methods.push(newMethod);
    await this.saveAll(methods);
    return newMethod;
  }

  async update(id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | null> {
    const methods = await this.getAll();
    const index = methods.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    methods[index] = { ...methods[index], ...updates };
    await this.saveAll(methods);
    return methods[index];
  }

  async delete(id: string): Promise<boolean> {
    const methods = await this.getAll();
    const filtered = methods.filter(m => m.id !== id);
    if (filtered.length === methods.length) return false;
    await this.saveAll(filtered);
    return true;
  }

  async getActiveByType(tipo: 'Efectivo' | 'Tarjeta' | 'Transferencia'): Promise<PaymentMethod[]> {
    const methods = await this.getAll();
    return methods.filter(m => m.activo && m.tipo === tipo);
  }
}

const paymentMethodsService = new PaymentMethodsService();
export { paymentMethodsService };

export const PaymentMethodsSection = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Efectivo' as 'Efectivo' | 'Tarjeta' | 'Transferencia',
    activo: true,
    requiereReferencia: false,
    descripcion: ''
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await paymentMethodsService.getAll();
      setMethods(data);
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
      showError('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        nombre: method.nombre,
        tipo: method.tipo,
        activo: method.activo,
        requiereReferencia: method.requiereReferencia,
        descripcion: method.descripcion || ''
      });
    } else {
      setEditingMethod(null);
      setFormData({
        nombre: '',
        tipo: 'Efectivo',
        activo: true,
        requiereReferencia: false,
        descripcion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setFormData({
      nombre: '',
      tipo: 'Efectivo',
      activo: true,
      requiereReferencia: false,
      descripcion: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMethod) {
        await paymentMethodsService.update(editingMethod.id, formData);
        showSuccess('Método de pago actualizado exitosamente');
      } else {
        await paymentMethodsService.create(formData);
        showSuccess('Método de pago creado exitosamente');
      }
      
      await loadMethods();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando método de pago:', error);
      showError('Error al guardar método de pago');
    }
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm('¿Estás seguro de eliminar este método de pago?')) {
      try {
        await paymentMethodsService.delete(id);
        showSuccess('Método de pago eliminado exitosamente');
        await loadMethods();
      } catch (error) {
        console.error('Error eliminando método de pago:', error);
        showError('Error al eliminar método de pago');
      }
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      await paymentMethodsService.update(method.id, { activo: !method.activo });
      await loadMethods();
      showSuccess(`Método de pago ${!method.activo ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      showError('Error al cambiar estado del método');
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Efectivo':
        return 'bg-green-100 text-green-800';
      case 'Tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'Transferencia':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métodos de Pago</h2>
          <p className="text-gray-600">Configura los métodos de pago aceptados en el taller</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Nuevo Método
        </Button>
      </div>

      {/* Información de tipos de pago */}
      <Card>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tipos de Pago Base</h3>
          <p className="text-sm text-blue-800 mb-2">
            Los métodos de pago se vinculan a uno de estos tres tipos base para el registro de pagos:
          </p>
          <div className="flex gap-4 mt-3">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              Efectivo
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              Tarjeta
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
              Transferencia
            </span>
          </div>
        </div>
      </Card>

      {/* Listado de métodos */}
      <Card>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando métodos de pago...</p>
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay métodos de pago configurados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {methods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {method.nombre}
                          </div>
                          {method.requiereReferencia && (
                            <div className="text-xs text-gray-500">
                              Requiere referencia
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipoColor(method.tipo)}`}>
                        {method.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {method.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(method)}
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          method.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {method.activo ? '✓ Activo' : '✗ Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal(method)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de crear/editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del Método"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: POS BAC, Transferencia Ficohsa"
            required
          />

          <Select
            label="Tipo de Pago"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
            options={[
              { value: 'Efectivo', label: '💵 Efectivo' },
              { value: 'Tarjeta', label: '💳 Tarjeta' },
              { value: 'Transferencia', label: '🏦 Transferencia' }
            ]}
            required
          />

          <Input
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción opcional"
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requiereReferencia"
              checked={formData.requiereReferencia}
              onChange={(e) => setFormData({ ...formData, requiereReferencia: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="requiereReferencia" className="text-sm text-gray-700">
              Requiere número de referencia/autorización
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="activo" className="text-sm text-gray-700">
              Método activo (disponible para usar)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingMethod ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
