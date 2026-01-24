import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { Modal, Button, Select, TextArea, Input } from '../comunes/UI';
import { WorkOrderData } from '../../servicios/workOrdersService';
import { workOrderAuthorizationsService } from '../../servicios/workOrderAuthorizationsService';
import { showError, showSuccess, showWarning } from '../../utilidades/sweetAlertHelpers';

interface SendAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderData | null;
  clientName: string;
  vehicleName: string;
  onSent: () => void;
}

export default function SendAuthorizationModal({
  isOpen,
  onClose,
  workOrder,
  clientName,
  vehicleName,
  onSent
}: SendAuthorizationModalProps) {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    motivo: '',
    detalles: '',
    costoEstimado: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workOrder) return;
    
    if (!formData.motivo.trim() || !formData.detalles.trim()) {
      showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setSending(true);
      
      await workOrderAuthorizationsService.createAuthorization({
        otId: workOrder.id || '',
        otNumero: `OT-${workOrder.id}`,
        clienteId: workOrder.clienteId,
        clienteNombre: clientName,
        vehiculoInfo: vehicleName,
        motivo: formData.motivo,
        detalles: formData.detalles,
        costoEstimado: formData.costoEstimado ? parseFloat(formData.costoEstimado) : undefined,
        enviadoPor: 1, // TODO: obtener del usuario actual
        enviadoPorNombre: 'Admin' // TODO: obtener del usuario actual
      });

      showSuccess('Autorización enviada al cliente exitosamente');
      
      // Resetear formulario
      setFormData({
        motivo: '',
        detalles: '',
        costoEstimado: ''
      });
      
      onSent();
      onClose();
    } catch (error) {
      console.error('Error enviando autorización:', error);
      showError('Error al enviar la autorización: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSending(false);
    }
  };

  if (!workOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Autorización al Cliente"
      size="xl"
    >
      <div className="space-y-6">
        {/* Advertencia */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mr-2" />
            <p className="text-sm text-orange-700">
              Solicitar aprobación del cliente para proceder con la orden de trabajo
            </p>
          </div>
        </div>

        {/* Información de la OT */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Información de la Orden</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">OT #:</span>
                      <span className="ml-2 font-medium text-gray-900">{workOrder.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cliente:</span>
                      <span className="ml-2 font-medium text-gray-900">{clientName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Vehículo:</span>
                      <span className="ml-2 font-medium text-gray-900">{vehicleName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Estado Actual:</span>
                      <span className="ml-2 font-medium text-orange-600">{workOrder.estado}</span>
                    </div>
                  </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Select
                    label="Motivo de la Autorización *"
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    required
                    options={[
                      { value: '', label: 'Seleccionar motivo...' },
                      { value: 'Repuestos adicionales', label: 'Repuestos adicionales necesarios' },
                      { value: 'Trabajo extra', label: 'Trabajo adicional detectado' },
                      { value: 'Costo adicional', label: 'Costo adicional por complejidad' },
                      { value: 'Cambio de alcance', label: 'Cambio en el alcance del trabajo' },
                      { value: 'Problema detectado', label: 'Nuevo problema detectado' },
                      { value: 'Otro', label: 'Otro motivo' }
                    ]}
                  />

                  <TextArea
                    label="Detalles de la Solicitud *"
                    value={formData.detalles}
                    onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                    rows={4}
                    placeholder="Describa en detalle qué necesita autorización y por qué..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Sea específico sobre qué trabajos adicionales o repuestos se necesitan
                  </p>

                  <Input
                    label="Costo Estimado Adicional (opcional)"
                    type="number"
                    value={formData.costoEstimado}
                    onChange={(e) => setFormData({ ...formData, costoEstimado: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />

                  {/* Advertencia */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium">Importante:</p>
                        <p>El cliente recibirá una notificación y podrá aprobar o rechazar esta solicitud desde su panel.</p>
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      type="button"
                      onClick={onClose}
                      disabled={sending}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={sending}
                      variant="warning"
                    >
                      {sending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          Enviar Autorización
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Modal>
  );
}
