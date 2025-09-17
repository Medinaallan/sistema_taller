import { useState, useEffect } from 'react';
import { useApp } from '../../contexto/useApp';
import { DocumentArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export function CSVDataManager() {
  const [loading, setLoading] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { state, reloadCSVData } = useApp();

  // Usar datos del contexto en lugar de memoria local
  useEffect(() => {
    const updateClientCount = () => {
      setClientCount(state.clients.length);
      setLastUpdate(new Date().toLocaleTimeString());
    };

    updateClientCount();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(updateClientCount, 5000);
    
    return () => clearInterval(interval);
  }, [state.clients]);

  const handleReloadCSV = async () => {
    setLoading(true);
    try {
      console.log('🔄 Recargando datos CSV desde el administrador...');
      
      // Usar la función de recarga del contexto
      if (reloadCSVData) {
        reloadCSVData();
        
        // Esperar un poco para que se actualicen los datos
        setTimeout(() => {
          setClientCount(state.clients.length);
          setLastUpdate(new Date().toLocaleTimeString());
          
          // Mostrar notificación de éxito
          alert(`✅ Datos CSV recargados exitosamente!\n${state.clients.length} clientes cargados`);
        }, 1000);
      } else {
        throw new Error('Función de recarga no disponible');
      }
      
    } catch (error) {
      console.error('❌ Error recargando CSV:', error);
      alert('❌ Error al recargar datos del CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <DocumentArrowDownIcon className="w-8 h-8 text-blue-600 mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Datos CSV</h2>
          <p className="text-gray-600">Administrar y sincronizar datos del archivo CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Estado Actual</h3>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">Clientes cargados:</span> {clientCount}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Última actualización:</span> {lastUpdate}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Archivo:</span> backend/data/clients/clients.csv
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acciones Disponibles</h3>
          <div className="space-y-3">
            <button
              onClick={handleReloadCSV}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Recargando...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Recargar desde CSV
                </>
              )}
            </button>
            <p className="text-sm text-gray-600">
              Use este botón después de editar manualmente el archivo CSV
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Importante</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Los cambios manuales en el CSV requieren recargar para verse reflejados en el sistema</li>
                <li>Los nuevos clientes agregados desde la aplicación se guardan automáticamente</li>
                <li>Mantenga el formato del CSV: campo1;campo2;campo3...</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
