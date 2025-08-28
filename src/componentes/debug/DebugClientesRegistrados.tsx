import { useState, useEffect } from 'react';
import { obtenerClientes, obtenerEstadisticasClientes } from '../../utilidades/BaseDatosJS';

export function DebugClientesRegistrados() {
  const [clientes, setClientes] = useState(obtenerClientes());
  const [stats, setStats] = useState(obtenerEstadisticasClientes());
  const [isVisible, setIsVisible] = useState(false);

  // Actualizar clientes cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      const clientesActuales = obtenerClientes();
      const statsActuales = obtenerEstadisticasClientes();
      setClientes(clientesActuales);
      setStats(statsActuales);
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50"
      >
        Ver Clientes ({stats.total})
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Clientes Registrados
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-3 p-2 bg-blue-50 rounded">
        <p className="text-sm font-medium text-blue-800">
          Total: {stats.total} clientes
        </p>
        <p className="text-xs text-blue-600">
          Guardados en localStorage: 'tallerApp_clientesRegistrados'
        </p>
        {stats.fechaUltimoRegistro && (
          <p className="text-xs text-blue-600">
            Último: {new Date(stats.fechaUltimoRegistro).toLocaleString()}
          </p>
        )}
      </div>
      
      {clientes.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            No hay clientes registrados aún.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Registra un cliente para verlo aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.map((cliente, index) => (
            <div key={cliente.id} className="bg-gray-50 p-3 rounded border">
              <div className="text-sm">
                <p className="font-semibold text-gray-800">
                  {index + 1}. {cliente.name}
                </p>
                <p className="text-gray-600">{cliente.email}</p>
                <p className="text-gray-500 text-xs">
                  Tel: {cliente.phone}
                </p>
                <p className="text-gray-400 text-xs">
                  ID: {cliente.id}
                </p>
                <p className="text-gray-400 text-xs">
                  Registrado: {cliente.createdAt.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
