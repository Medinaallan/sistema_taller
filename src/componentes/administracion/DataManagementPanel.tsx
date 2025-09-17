import { useState } from 'react';
import { Button } from '../comunes/UI';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  ChartBarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface DataStats {
  clients: { count: number; exists: boolean; lastModified: string | null; };
  vehicles: { count: number; exists: boolean; lastModified: string | null; };
  appointments: { count: number; exists: boolean; lastModified: string | null; };
  services: { count: number; exists: boolean; lastModified: string | null; };
}

interface ResetResult {
  success: boolean;
  message: string;
  details: {
    clients: { count: number; module: string; };
    vehicles: { count: number; module: string; };
    appointments: { count: number; module: string; };
    services: { count: number; module: string; };
  };
  timestamp: string;
}

export function DataManagementPanel() {
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Cargar estadísticas de datos
  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/data-stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        console.error('Error cargando estadísticas:', result);
      }
    } catch (error) {
      console.error('Error conectando con API:', error);
    } finally {
      setLoading(false);
    }
  };

  // Restablecer todos los datos
  const resetAllData = async () => {
    setResetting(true);
    setResetResult(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/admin/reset-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      setResetResult(result);
      
      if (result.success) {
        // Recargar estadísticas después del restablecimiento
        await loadStats();
      }
      
    } catch (error) {
      console.error('Error restableciendo datos:', error);
      setResetResult({
        success: false,
        message: 'Error de conexión con el servidor',
        details: {} as any,
        timestamp: new Date().toISOString()
      });
    } finally {
      setResetting(false);
      setShowConfirm(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Gestión de Datos CSV</h3>
          <p className="text-sm text-gray-600 mt-1">
            Administre los archivos CSV del sistema y restablezca datos de ejemplo
          </p>
        </div>
        <Button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <ChartBarIcon className="w-4 h-4" />
          {loading ? 'Cargando...' : 'Actualizar Estadísticas'}
        </Button>
      </div>

      {/* Estadísticas actuales */}
      {stats && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Estado Actual de los Datos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats).map(([module, data]) => (
              <div key={module} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 capitalize">{module}</h5>
                  <span className={`w-2 h-2 rounded-full ${data.exists ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <p className="text-2xl font-bold text-blue-600">{data.count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Última modificación:<br />
                  {formatDate(data.lastModified)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel de restablecimiento */}
      <div className="border-t border-gray-200 pt-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                ⚠️ Advertencia: Restablecimiento de Datos
              </h4>
              <p className="text-sm text-yellow-700">
                Esta acción eliminará todos los datos actuales y los reemplazará con datos de ejemplo.
                Se creará un backup automático antes del restablecimiento.
              </p>
            </div>
          </div>
        </div>

        {!showConfirm ? (
          <Button
            onClick={() => setShowConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Vaciar TODOS los Datos
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-800">
              ¿Está seguro de que desea VACIAR todos los datos? Esto borrará ABSOLUTAMENTE TODO.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={resetAllData}
                disabled={resetting}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <ArrowPathIcon className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
                {resetting ? 'Vaciando...' : 'SÍ, VACIAR TODO'}
              </Button>
              <Button
                onClick={() => setShowConfirm(false)}
                disabled={resetting}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Resultado del restablecimiento */}
      {resetResult && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className={`rounded-lg p-4 ${
            resetResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              <div className={`w-6 h-6 mr-3 mt-0.5 ${
                resetResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {resetResult.success ? '✅' : '❌'}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium mb-2 ${
                  resetResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {resetResult.success ? 'Restablecimiento Exitoso' : 'Error en Restablecimiento'}
                </h4>
                <p className={`text-sm mb-3 ${
                  resetResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {resetResult.message}
                </p>
                
                {resetResult.success && resetResult.details && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-800">Datos restablecidos:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                      {Object.entries(resetResult.details).map(([module, data]) => (
                        <div key={module} className="flex justify-between">
                          <span className="capitalize">{module}:</span>
                          <span className="font-medium">{data.count} registros</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-3">
                  {formatDate(resetResult.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}