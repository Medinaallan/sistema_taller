import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../comunes/UI';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { paymentMethodsService, type PaymentMethod } from '../../paginas/administracion/secciones/PaymentMethodsSection';
import { showError } from '../../utilidades/sweetAlertHelpers';
import { formatCurrency } from '../../utilidades/globalMockDatabase';
import { useApp } from '../../contexto/useApp';

interface Payment {
  id: string;
  metodoPagoId: string;
  metodoPagoNombre: string;
  tipoBase: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  monto: number;
  referencia: string;
  requiereReferencia: boolean;
}

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  facturaId: number;
  facturaNumero: string;
  totalFactura: number;
  saldoPendienteInicial: number;
  onSuccess: () => void;
}

export const RegisterPaymentModal = ({
  isOpen,
  onClose,
  facturaId,
  facturaNumero,
  totalFactura,
  saldoPendienteInicial,
  onSuccess
}: RegisterPaymentModalProps) => {
  const { state } = useApp();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener usuario ID desde el contexto o localStorage
  const getUserId = (): number => {
    if (state.user?.id) {
      return parseInt(state.user.id);
    }
    // Fallback a localStorage si no está en el contexto
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return parseInt(user.id) || 1;
      }
    } catch (error) {
      console.error('Error obteniendo usuario ID:', error);
    }
    return 1; // Fallback por defecto
  };

  // Form state para el pago actual
  const [currentPayment, setCurrentPayment] = useState({
    metodoPagoId: '',
    monto: saldoPendienteInicial,
    referencia: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      // Inicializar con el saldo pendiente real
      setCurrentPayment({
        metodoPagoId: '',
        monto: saldoPendienteInicial,
        referencia: ''
      });
      setPayments([]);
    }
  }, [isOpen, saldoPendienteInicial]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentMethodsService.getAll();
      const activeMethods = methods.filter(m => m.activo);
      setPaymentMethods(activeMethods);
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
      showError('Error al cargar métodos de pago');
    }
  };

  const totalPagado = payments.reduce((sum, p) => sum + p.monto, 0);
  const saldoPendiente = saldoPendienteInicial - totalPagado;
  const totalPagadoAnteriormente = totalFactura - saldoPendienteInicial;

  const handleAddPayment = () => {
    if (!currentPayment.metodoPagoId) {
      showError('Selecciona un método de pago');
      return;
    }

    if (currentPayment.monto <= 0) {
      showError('El monto debe ser mayor a 0');
      return;
    }

    if (currentPayment.monto > saldoPendiente) {
      showError(`El monto no puede ser mayor al saldo pendiente (${formatCurrency(saldoPendiente)})`);
      return;
    }

    const selectedMethod = paymentMethods.find(m => m.id === currentPayment.metodoPagoId);
    if (!selectedMethod) return;

    if (selectedMethod.requiereReferencia && !currentPayment.referencia.trim()) {
      showError('Este método de pago requiere un número de referencia');
      return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      metodoPagoId: selectedMethod.id,
      metodoPagoNombre: selectedMethod.nombre,
      tipoBase: selectedMethod.tipo,
      monto: currentPayment.monto,
      referencia: currentPayment.referencia,
      requiereReferencia: selectedMethod.requiereReferencia
    };

    setPayments([...payments, newPayment]);

    // Limpiar formulario y ajustar monto al saldo pendiente
    setCurrentPayment({
      metodoPagoId: '',
      monto: saldoPendiente - currentPayment.monto,
      referencia: ''
    });
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleConfirmPayments = async () => {
    if (payments.length === 0) {
      showError('Debes agregar al menos un pago');
      return;
    }

    if (saldoPendiente > 0) {
      showError(`Aún falta pagar ${formatCurrency(saldoPendiente)}`);
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      
      // Registrar cada pago usando el SP_REGISTRAR_PAGO
      for (const payment of payments) {
        const response = await fetch(`${API_BASE_URL}/invoices/register-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            factura_id: facturaId,
            monto: payment.monto,
            metodo_pago: payment.tipoBase, // Usar el tipo base (Efectivo, Tarjeta, Transferencia)
            referencia: payment.referencia || null,
            registrado_por: getUserId() // Usuario actual del localStorage/contexto
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Error al registrar pago');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error registrando pagos:', error);
      showError('Error al registrar los pagos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === currentPayment.metodoPagoId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Pago - ${facturaNumero}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Información de la factura */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-sm text-gray-600 font-medium">Total Factura</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(totalFactura)}</div>
            </div>
            <div>
              <div className="text-sm text-blue-600 font-medium">Pagado Antes</div>
              <div className="text-xl font-bold text-blue-900">{formatCurrency(totalPagadoAnteriormente)}</div>
            </div>
            <div>
              <div className="text-sm text-green-600 font-medium">Pagando Ahora</div>
              <div className="text-xl font-bold text-green-900">{formatCurrency(totalPagado)}</div>
            </div>
            <div>
              <div className="text-sm text-orange-600 font-medium">Saldo Pendiente</div>
              <div className="text-xl font-bold text-orange-900">{formatCurrency(saldoPendiente)}</div>
            </div>
          </div>
        </div>

        {/* Formulario de agregar pago */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            {payments.length === 0 ? 'Agregar Pago' : 'Agregar Otro Pago'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Método de Pago"
              value={currentPayment.metodoPagoId}
              onChange={(e) => setCurrentPayment({ ...currentPayment, metodoPagoId: e.target.value })}
              options={[
                { value: '', label: 'Selecciona un método' },
                ...paymentMethods.map(m => ({
                  value: m.id,
                  label: `${m.nombre} (${m.tipo})`
                }))
              ]}
            />

            <Input
              label="Monto"
              type="number"
              step="0.01"
              min="0"
              max={saldoPendiente}
              value={currentPayment.monto}
              onChange={(e) => setCurrentPayment({ ...currentPayment, monto: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          {selectedMethod?.requiereReferencia && (
            <div className="mt-4">
              <Input
                label="Número de Referencia / Autorización"
                value={currentPayment.referencia}
                onChange={(e) => setCurrentPayment({ ...currentPayment, referencia: e.target.value })}
                placeholder="Ingresa el número de referencia"
                required
              />
            </div>
          )}

          <Button
            type="button"
            onClick={handleAddPayment}
            className="mt-4 w-full flex items-center justify-center gap-2"
            variant="secondary"
            disabled={saldoPendiente <= 0}
          >
            <PlusIcon className="h-4 w-4" />
            {payments.length === 0 ? 'Agregar Pago' : 'Agregar Otro Pago'}
          </Button>
        </div>

        {/* Lista de pagos agregados */}
        {payments.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Pagos Registrados</h3>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{payment.metodoPagoNombre}</div>
                    <div className="text-sm text-gray-500">
                      {payment.tipoBase}
                      {payment.referencia && ` - Ref: ${payment.referencia}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(payment.monto)}
                    </div>
                    <button
                      onClick={() => handleRemovePayment(payment.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar pago"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPayments}
            disabled={loading || payments.length === 0 || saldoPendiente > 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Procesando...' : `Confirmar Cobro (${formatCurrency(totalPagado)})`}
          </Button>
        </div>

        {saldoPendiente > 0 && payments.length > 0 && (
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-sm text-orange-800">
               Debes completar el pago total para confirmar. 
              Faltan {formatCurrency(saldoPendiente)}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
