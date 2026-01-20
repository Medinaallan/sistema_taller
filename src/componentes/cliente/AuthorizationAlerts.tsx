import { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { workOrderAuthorizationsService, WorkOrderAuthorization } from '../../servicios/workOrderAuthorizationsService';

interface AuthorizationAlertsProps {
  clienteId: string;
  onAuthorizationClick: (authorization: WorkOrderAuthorization) => void;
}

export default function AuthorizationAlerts({ clienteId, onAuthorizationClick }: AuthorizationAlertsProps) {
  const [pendingAuthorizations, setPendingAuthorizations] = useState<WorkOrderAuthorization[]>([]);
  const [dismissedAuths, setDismissedAuths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingAuthorizations();
    // Recargar cada 30 segundos
    const interval = setInterval(loadPendingAuthorizations, 30000);
    return () => clearInterval(interval);
  }, [clienteId]);

  const loadPendingAuthorizations = async () => {
    try {
      const auths = await workOrderAuthorizationsService.getClientPendingAuthorizations(clienteId);
      setPendingAuthorizations(auths);
    } catch (error) {
      console.error('Error cargando autorizaciones pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (otId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAuths(prev => new Set(prev).add(otId));
  };

  const visibleAuthorizations = pendingAuthorizations.filter(
    auth => !dismissedAuths.has(auth.otId)
  );

  if (loading || visibleAuthorizations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleAuthorizations.map((auth) => (
        <div
          key={auth.otId}
          onClick={() => onAuthorizationClick(auth)}
          className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className="relative">
                  <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <BellIcon className="h-5 w-5 mr-2 text-orange-600" />
                    ¡Autorización Requerida!
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Urgente
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Orden de Trabajo #{auth.otNumero || auth.otId}</span>
                  {auth.vehiculoInfo && <span className="text-gray-600"> • {auth.vehiculoInfo}</span>}
                </p>
                
                <div className="bg-white rounded-md p-3 mb-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Motivo: <span className="text-orange-600">{auth.motivo}</span>
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {auth.detalles}
                  </p>
                  {auth.costoEstimado && (
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      Costo Estimado: <span className="text-orange-600">${auth.costoEstimado.toFixed(2)}</span>
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    Enviado: {new Date(auth.fechaEnvio).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  
                  <button
                    onClick={() => onAuthorizationClick(auth)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Responder Ahora
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={(e) => handleDismiss(auth.otId, e)}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
              title="Ocultar temporalmente"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
