import { useState } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { loadCSVData, csvToClients, csvToWorkOrders } from '../../utilidades/csvDatabase';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export function CSVDataManager() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleReloadCSV = async () => {
    setLoading(true);
    try {
      // Cargar datos actualizados del CSV
      const csvData = await loadCSVData();
      const clients = csvToClients(csvData);
      const vehicles = clients.flatMap(client => client.vehicles);
      const workOrders = csvToWorkOrders(csvData);

      // Actualizar el estado con los nuevos datos
      dispatch({ 
        type: 'LOAD_CSV_DATA', 
        payload: { clients, vehicles, workOrders } 
      });

      setLastUpdate(new Date());
      
      // Mostrar mensaje de éxito
      alert(`CSV recargado exitosamente!\n- ${clients.length} clientes\n- ${vehicles.length} vehículos\n- ${workOrders.length} órdenes de trabajo`);
      
    } catch (error) {
      console.error('Error recargando CSV:', error);
      alert('Error al recargar el archivo CSV. Verifica que el archivo esté disponible.');
    } finally {
      setLoading(false);
    }
  };

  // Identificar clientes que vienen del CSV (tienen estructura específica del CSV)
  const csvClientIds = state.clients
    .filter(client => client.id.startsWith('client-') && client.email.includes('@taller.com'))
    .map(client => client.id);

  const csvClients = state.clients.filter(client => csvClientIds.includes(client.id));
  const regularClients = state.clients.filter(client => !csvClientIds.includes(client.id));

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-6 w-6" />
              Gestor de Datos CSV
            </h2>
            <p className="text-sm text-gray-600">
              Administra los datos cargados desde Client_Database.csv
            </p>
          </div>
          <Button
            onClick={handleReloadCSV}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Recargando...' : 'Recargar CSV'}
          </Button>
        </div>

        {lastUpdate && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              Última actualización: {lastUpdate.toLocaleString()}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{csvClients.length}</div>
            <div className="text-sm text-blue-700">Clientes del CSV</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{regularClients.length}</div>
            <div className="text-sm text-green-700">Clientes Regulares</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{state.clients.length}</div>
            <div className="text-sm text-purple-700">Total de Clientes</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Clientes del CSV</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {csvClients.length > 0 ? (
                <div className="space-y-2">
                  {csvClients.map(client => (
                    <div key={client.id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div>
                        <span className="font-medium">{client.name}</span>
                        <span className="text-gray-500 ml-2">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {state.vehicles.filter(v => v.clientId === client.id).length} vehículos
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          CSV
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No hay clientes del CSV cargados</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Instrucciones</h3>
            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
              <ul className="list-disc list-inside space-y-1">
                <li>Para actualizar los datos, modifica el archivo <code>public/Client_Database.csv</code></li>
                <li>Mantén el formato: Nombre;Teléfono;Email;Dirección;Contraseña;NumVehiculos;NombreVehiculo;Modelo;OrdenesCompletadas;OrdenesEnProceso;VehiculoId;Kilometraje</li>
                <li>Haz clic en "Recargar CSV" para aplicar los cambios</li>
                <li>Los clientes del CSV aparecerán automáticamente en el módulo de administración</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
