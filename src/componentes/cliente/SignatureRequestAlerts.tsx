import React, { useEffect, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import signatureRequestsService, { SignatureRequest } from '../../servicios/signatureRequestsService';

interface SignatureRequestAlertsProps {
  clienteId: string;
  onSignatureRequestClick: (request: SignatureRequest) => void;
}

const SignatureRequestAlerts: React.FC<SignatureRequestAlertsProps> = ({
  clienteId,
  onSignatureRequestClick
}) => {
  const [pendingRequests, setPendingRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingRequests();
  }, [clienteId]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const requests = await signatureRequestsService.getClientPendingRequests(clienteId);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error cargando solicitudes de firma:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {pendingRequests.map((request) => (
        <div
          key={request.otId}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm animate-pulse"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                ⚠️ Autorización Pendiente - Orden #{request.otId.slice(-8)}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  El taller requiere tu autorización para realizar pruebas de manejo y 
                  control de calidad en tu vehículo.
                </p>
                <p className="mt-1 font-semibold">
                  {request.descripcion || request.vehiculoInfo}
                </p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => onSignatureRequestClick(request)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Ver y Firmar Autorización
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SignatureRequestAlerts;
