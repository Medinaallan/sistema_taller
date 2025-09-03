import { useState } from 'react';
import { obtenerClientesActualizados } from '../utilidades/BaseDatosJS';

export function TestLogin() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      console.log('🧪 Probando obtenerClientesActualizados...');
      const clientes = await obtenerClientesActualizados();
      console.log('📊 Clientes obtenidos:', clientes);
      
      const testEmail = 'avargas@taller.com';
      const testPassword = 'asdf1234';
      
      const found = clientes.find(c => 
        c.email === testEmail && c.password === testPassword
      );
      
      setResult({
        totalClientes: clientes.length,
        clienteEncontrado: found,
        todosLosClientes: clientes.map(c => ({
          email: c.email,
          password: c.password,
          name: c.name
        }))
      });
    } catch (error) {
      console.error('❌ Error en test:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Login Debug</h1>
      
      <button 
        onClick={testLogin}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Probando...' : 'Probar Login'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Resultado:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
