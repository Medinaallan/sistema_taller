// Página de depuración para verificar datos CSV
import { useState, useEffect } from 'react';

export function DebugPage() {
  const [datos, setDatos] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const probarAPI = async () => {
    setLoading(true);
    try {
      console.log('🔍 Probando API directamente...');
      const response = await fetch('http://localhost:8080/api/clients');
      const data = await response.json();
      
      console.log('📊 Datos recibidos:', data);
      setDatos(data);
    } catch (error) {
      console.error('❌ Error:', error);
      setDatos({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    probarAPI();
  }, []);

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Depuración CSV</h1>
      
      <button 
        onClick={probarAPI}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Cargando...' : 'Recargar desde API'}
      </button>

      {datos && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Datos de la API:</h2>
          
          {datos.success ? (
            <div>
              <p className="mb-4 text-green-600 font-semibold">
                ✅ API funcionando - {datos.clients.length} clientes encontrados
              </p>
              
              <div className="space-y-4">
                {datos.clients.map((cliente: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-bold text-lg">{cliente.nombre}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <p><strong>ID:</strong> {cliente.id}</p>
                      <p><strong>Teléfono:</strong> {cliente.telefono}</p>
                      <p><strong>Email:</strong> {cliente.email}</p>
                      <p><strong>Dirección:</strong> {cliente.direccion}</p>
                      <p><strong>Vehículos:</strong> {cliente.vehiculos}</p>
                      <p><strong>Vehículo:</strong> {cliente.vehiculoNombre} {cliente.vehiculoModelo}</p>
                      <p><strong>Kilometraje:</strong> {cliente.kilometraje}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">❌ Error: {JSON.stringify(datos)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
