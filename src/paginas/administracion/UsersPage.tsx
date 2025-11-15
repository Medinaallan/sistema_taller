import { useState, useEffect } from 'react';
import { Usuario } from '../../tipos/usuario';
import usuariosService from '../../servicios/usuariosService';

export function UsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    console.log('👥 Cargando usuarios desde base de datos...');
    setLoading(true);
    setError('');
    
    try {
      const resultado = await usuariosService.obtenerUsuarios();
      
      if (resultado.success && resultado.data) {
        const usuariosArray = Array.isArray(resultado.data) ? resultado.data : [resultado.data];
        setUsuarios(usuariosArray);
        console.log(`✅ ${usuariosArray.length} usuarios cargados`);
      } else {
        setError(resultado.message || 'Error al cargar usuarios');
        console.log('❌ Error:', resultado.message);
      }
    } catch (error) {
      setError('Error de conexión');
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-semibold text-gray-700">Cargando usuarios...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-semibold">Error: {error}</span>
          </div>
          <button 
            onClick={cargarUsuarios}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
              <p className="text-sm text-gray-600 mt-1">
                Usuarios registrados obtenidos desde SP_OBTENER_USUARIOS
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {usuarios.length} usuarios
              </span>
              <button 
                onClick={cargarUsuarios}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Recargar
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {usuarios.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay usuarios</h3>
              <p className="text-gray-600 mb-4">
                No se encontraron usuarios en la base de datos usando SP_OBTENER_USUARIOS
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-yellow-800 text-sm">
                  <strong>Nota técnica:</strong> El stored procedure SP_OBTENER_USUARIOS 
                  está siendo utilizado para obtener los usuarios desde la base de datos.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.usuario_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {usuario.usuario_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {usuario.nombre_completo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.correo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          usuario.rol === 'Cliente' 
                            ? 'bg-blue-100 text-blue-800'
                            : usuario.rol === 'Admin'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Información técnica
            </summary>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>• Endpoint: GET /api/users/list</p>
              <p>• Stored Procedure: SP_OBTENER_USUARIOS</p>
              <p>• Base de datos: workshopControlDB</p>
              <p>• Total usuarios encontrados: {usuarios.length}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}