import { useState, useEffect } from 'react';
import { ClientRegisterForm } from '../../componentes/autenticacion/ClientRegisterFormNew';
import { obtenerClientes, Cliente } from '../../servicios/clientesApiService';

export function TestClientRegisterPage() {
  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const clientesData = await obtenerClientes();
      setClientes(clientesData);
      console.log('📋 Clientes cargados:', clientesData);
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    cargarClientes(); // Recargar la lista
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧪 Test: Registro de Clientes</h1>
              <p className="text-gray-600 mt-2">
                Pruebas del nuevo sistema de registro con API CSV
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ➕ Nuevo Cliente
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de registro */}
          <div className="space-y-6">
            {showForm ? (
              <ClientRegisterForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Formulario de Registro
                </h3>
                <p className="text-gray-600 mb-4">
                  Haga clic en "Nuevo Cliente" para abrir el formulario de registro
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Abrir Formulario
                </button>
              </div>
            )}
          </div>

          {/* Lista de clientes */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  👥 Clientes Registrados
                </h3>
                <button
                  onClick={cargarClientes}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? '🔄' : '🔄'} Recargar
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Total: {clientes.length} clientes
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600">Cargando clientes...</span>
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📭</span>
                  </div>
                  <p className="text-gray-500">No hay clientes registrados</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {cliente.name || 'Sin nombre'}
                          </h4>
                          <p className="text-sm text-gray-600">{cliente.email}</p>
                          <p className="text-sm text-gray-600">{cliente.phone}</p>
                          {cliente.address && (
                            <p className="text-xs text-gray-500 mt-1">{cliente.address}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            cliente.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {cliente.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {cliente.id.split('-')[1]?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      {cliente.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600">
                            <strong>Notas:</strong> {cliente.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-2">🔧 Estado del Sistema</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">API:</span>
              <span className="text-blue-700 ml-2">http://localhost:8081/api/clients</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Almacenamiento:</span>
              <span className="text-blue-700 ml-2">CSV Backend</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Estado:</span>
              <span className="text-green-700 ml-2">✅ Funcional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}