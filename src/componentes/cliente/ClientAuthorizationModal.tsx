import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Modal, Button, TextArea } from '../comunes/UI';
import { WorkOrderAuthorization, workOrderAuthorizationsService } from '../../servicios/workOrderAuthorizationsService';
import { workOrdersService } from '../../servicios/workOrdersService';
import { showError, showSuccess } from '../../utilidades/sweetAlertHelpers';

interface ClientAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorization: WorkOrderAuthorization | null;
  onResponse: () => void;
}

export default function ClientAuthorizationModal({
  isOpen,
  onClose,
  authorization,
  onResponse
}: ClientAuthorizationModalProps) {
  const [responding, setResponding] = useState(false);
  const [comments, setComments] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approved' | 'rejected' | null>(null);

  const handleResponse = async (action: 'approved' | 'rejected') => {
    if (!authorization) return;

    try {
      setResponding(true);

      // Responder a la autorización
      await workOrderAuthorizationsService.respondToAuthorization(
        authorization.otId,
        action,
        comments.trim() || undefined
      );

      // Si fue aprobada, cambiar el estado de la OT a "Control de calidad" (valida que tareas estén completadas)
      if (action === 'approved') {
        const result = await workOrdersService.changeStatus(authorization.otId, 'Control de calidad');
        
        if (!result.success) {
          showError(result.message || 'No se puede cambiar a Control de Calidad. Verifique que todas las tareas estén completadas.');
          return;
        }
      } else {
        // Si fue rechazada, volver a "En espera de aprobación"
        const result = await workOrdersService.changeStatus(authorization.otId, 'En espera de aprobación');
        
        if (!result.success) {
          showError(result.message || 'Error al cambiar estado');
          return;
        }
      }

      showSuccess(action === 'approved' 
        ? 'Autorización aprobada. El trabajo continuará.' 
        : 'Autorización rechazada. El taller será notificado.'
      );

      setComments('');
      onResponse();
      onClose();
    } catch (error) {
      console.error('Error respondiendo autorización:', error);
      showError('Error al enviar respuesta: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setResponding(false);
      setShowConfirmation(false);
      setPendingAction(null);
    }
  };

  const handleActionClick = (action: 'approved' | 'rejected') => {
    setPendingAction(action);
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    if (pendingAction) {
      handleResponse(pendingAction);
    }
  };

  if (!authorization) return null;

  // Si está en confirmación, mostrar modal de confirmación
  if (showConfirmation) {
    return (
      <Modal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingAction(null);
        }}
        title={pendingAction === 'approved' ? '¿Aprobar Autorización?' : '¿Rechazar Autorización?'}
        size="md"
      >
        <div className="space-y-4">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            pendingAction === 'approved' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {pendingAction === 'approved' ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <XCircleIcon className="h-6 w-6 text-red-600" />
            )}
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            {pendingAction === 'approved' 
              ? 'Confirma que autorizas al taller para realizar el trabajo adicional descrito.'
              : 'Confirma que rechazas la autorización. El taller será notificado.'}
          </p>
          
          {authorization.costoEstimado && pendingAction === 'approved' && (
            <p className="text-lg font-bold text-gray-900 text-center">
              Costo adicional: ${authorization.costoEstimado.toFixed(2)}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => {
                setShowConfirmation(false);
                setPendingAction(null);
              }}
              disabled={responding}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAction}
              disabled={responding}
              variant={pendingAction === 'approved' ? 'success' : 'danger'}
              className="flex-1"
            >
              {responding ? 'Procesando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Modal principal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Autorización Requerida"
      size="xl"
    >
      <div className="space-y-6">
        {/* Advertencia */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mr-2" />
            <p className="text-sm text-orange-700">
              El taller necesita tu aprobación para continuar con el trabajo
            </p>
          </div>
        </div>

                  {/* Información de la orden */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-6 border border-orange-200">
                    <div className="flex items-center mb-4">
                      <DocumentTextIcon className="h-6 w-6 text-orange-600 mr-2" />
                      <h4 className="text-lg font-bold text-gray-900">Detalles de la Solicitud</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-sm text-gray-600">Orden de Trabajo</span>
                        <p className="font-semibold text-gray-900">{authorization.otNumero || `#${authorization.otId}`}</p>
                      </div>
                      {authorization.vehiculoInfo && (
                        <div className="bg-white rounded-lg p-3">
                          <span className="text-sm text-gray-600">Vehículo</span>
                          <p className="font-semibold text-gray-900">{authorization.vehiculoInfo}</p>
                        </div>
                      )}
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-sm text-gray-600">Motivo</span>
                        <p className="font-semibold text-orange-600">{authorization.motivo}</p>
                      </div>
                      {authorization.costoEstimado && (
                        <div className="bg-white rounded-lg p-3">
                          <span className="text-sm text-gray-600">Costo Adicional Estimado</span>
                          <p className="font-bold text-2xl text-orange-600">
                            ${authorization.costoEstimado.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Descripción del Trabajo Adicional:</h5>
                      <p className="text-gray-700 whitespace-pre-wrap">{authorization.detalles}</p>
                    </div>

                    {authorization.enviadoPorNombre && (
                      <div className="mt-4 text-sm text-gray-600">
                        <p>Solicitado por: <span className="font-medium">{authorization.enviadoPorNombre}</span></p>
                        <p>Fecha: {new Date(authorization.fechaEnvio).toLocaleString('es-ES', {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })}</p>
                      </div>
                    )}
                  </div>

                  {/* Campo de comentarios */}
                  <TextArea
                    label="Comentarios (opcional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    placeholder="Agrega cualquier comentario o pregunta..."
                  />

                  {/* Información importante */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 text-sm text-blue-700">
                        <p className="font-medium">Importante:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Si <strong>apruebas</strong>, el taller procederá con el trabajo adicional</li>
                          <li>Si <strong>rechazas</strong>, el taller se pondrá en contacto contigo</li>
                          <li>Puedes contactar al taller si tienes preguntas antes de decidir</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button
                      onClick={() => handleActionClick('rejected')}
                      disabled={responding}
                      variant="danger"
                      className="flex-1"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2 inline" />
                      Rechazar
                    </Button>
                    
                    <Button
                      onClick={() => handleActionClick('approved')}
                      disabled={responding}
                      variant="success"
                      className="flex-1"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                      Aprobar
                    </Button>
                  </div>
                </div>
              </Modal>
  );
}
