import { useState, useEffect } from 'react';

export function TestConnectionPage() {
  const [backendStatus, setBackendStatus] = useState<string>('Verificando...');
  const [apiClients, setApiClients] = useState<any>(null);
  const [chatStatus, setChatStatus] = useState<string>('Verificando...');

  useEffect(() => {
    testBackendConnection();
    testApiClients();
    testChatConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/health');
      const data = await response.json();
      if (data.status === 'OK') {
        setBackendStatus('✅ Backend conectado correctamente');
      } else {
        setBackendStatus('❌ Backend respondió pero con problemas');
      }
    } catch (error) {
      setBackendStatus('❌ Error conectando al backend: ' + error);
    }
  };

  const testApiClients = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/clients');
      const data = await response.json();
      console.log('Datos de clientes:', data);
      setApiClients(data);
    } catch (error) {
      setApiClients({ error: 'Error cargando clientes: ' + error });
    }
  };

  const testChatConnection = () => {
    try {
      // Intentar conectar Socket.IO
      const socket = new WebSocket('ws://localhost:8080');
      
      socket.onopen = () => {
        setChatStatus('✅ WebSocket conectado');
        socket.close();
      };

      socket.onerror = () => {
        setChatStatus('❌ Error conectando WebSocket');
      };

      socket.onclose = () => {
        // Si se cerró después de conectar, está bien
      };

    } catch (error) {
      setChatStatus('❌ Error inicializando WebSocket: ' + error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🧪 Test de Conexiones</h1>
      
      {/* Backend Health */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🏥 Estado del Backend</h2>
        <p className="text-lg">{backendStatus}</p>
      </div>

      {/* API Clients */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">👥 API de Clientes</h2>
        {apiClients ? (
          <div>
            <p className="mb-4">
              {apiClients.error ? (
                <span className="text-red-600">❌ {apiClients.error}</span>
              ) : (
                <span className="text-green-600">
                  ✅ {apiClients.status === 'success' ? apiClients.total : apiClients.clients?.length || 0} clientes cargados
                </span>
              )}
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Ver datos completos</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(apiClients, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <p>⏳ Cargando...</p>
        )}
      </div>

      {/* Chat Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">💬 Estado del Chat</h2>
        <p className="text-lg">{chatStatus}</p>
      </div>

      {/* Navigation */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔗 Enlaces Rápidos</h3>
        <div className="grid grid-cols-2 gap-4">
          <a 
            href="/debug" 
            className="block p-4 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
          >
            🐛 Página Debug
          </a>
          <a 
            href="/administracion" 
            className="block p-4 bg-green-600 text-white rounded text-center hover:bg-green-700"
          >
            ⚙️ Administración
          </a>
          <a 
            href="/cliente/chat" 
            className="block p-4 bg-purple-600 text-white rounded text-center hover:bg-purple-700"
          >
            💬 Chat Cliente
          </a>
          <a 
            href="http://localhost:8080/api/clients" 
            target="_blank"
            className="block p-4 bg-gray-600 text-white rounded text-center hover:bg-gray-700"
          >
            🔌 API Directa
          </a>
        </div>
      </div>
    </div>
  );
}

export default TestConnectionPage;