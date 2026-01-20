import { Modal, Button } from '../comunes/UI';
import { CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface AuthorizationDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessInAdmin: () => void;
  onSendToClient: () => void;
  workOrderNumber?: string;
}

export default function AuthorizationDecisionModal({
  isOpen,
  onClose,
  onProcessInAdmin,
  onSendToClient,
  workOrderNumber
}: AuthorizationDecisionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Cómo deseas proceder con la autorización?"
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <p className="text-sm text-blue-700">
            La Orden de Trabajo <strong>#{workOrderNumber}</strong> ha completado todas las tareas y está lista para autorización.
            Elige cómo deseas proceder:
          </p>
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opción 1: Procesar en panel admin */}
          <button
            onClick={() => {
              onProcessInAdmin();
              onClose();
            }}
            className="group relative bg-white p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Procesar en Panel Administrador
              </h3>
              <p className="text-sm text-gray-600">
                Continuar con el proceso de control de calidad interno sin necesidad de aprobación del cliente
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Proceso Interno
                </span>
              </div>
            </div>
          </button>

          {/* Opción 2: Enviar al cliente */}
          <button
            onClick={() => {
              onSendToClient();
              onClose();
            }}
            className="group relative bg-white p-6 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <PaperAirplaneIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Enviar Autorización al Cliente
              </h3>
              <p className="text-sm text-gray-600">
                Solicitar aprobación del cliente antes de proceder con el trabajo adicional o finalización
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Requiere Aprobación Cliente
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Información adicional */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Recomendaciones:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Procesar en panel:</strong> Usar cuando el trabajo está dentro del presupuesto original</li>
            <li>• <strong>Enviar al cliente:</strong> Usar cuando hay trabajos adicionales, costos extras o cambios significativos</li>
          </ul>
        </div>

        {/* Botón cancelar */}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
