import { Card } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { formatCurrency } from '../../utilidades/mockData';

export function CSVDemoPage() {
  const { state } = useApp();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Datos del CSV - Sistema Taller</h1>
        <p className="text-gray-600">Información cargada desde Client_Database.csv</p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
          <p className="text-3xl font-bold text-blue-600">{state.clients.length}</p>
          <p className="text-sm text-gray-500">Total en el sistema</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">Vehículos</h3>
          <p className="text-3xl font-bold text-green-600">{state.vehicles.length}</p>
          <p className="text-sm text-gray-500">Registrados</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">Órdenes</h3>
          <p className="text-3xl font-bold text-purple-600">{state.workOrders.length}</p>
          <p className="text-sm text-gray-500">Total de servicios</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">Ingresos</h3>
          <p className="text-3xl font-bold text-orange-600">
            {formatCurrency(state.dashboardStats?.totalRevenue || 0)}
          </p>
          <p className="text-sm text-gray-500">Completadas</p>
        </Card>
      </div>

      {/* Clientes del CSV */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Clientes Cargados desde CSV
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Órdenes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{client.phone}</div>
                      <div className="text-xs">{client.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="mb-1">
                          {vehicle.brand} {vehicle.model} ({vehicle.mileage?.toLocaleString()} km)
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {state.workOrders.filter(wo => wo.clientId === client.id).length} órdenes
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Órdenes de Trabajo */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Órdenes de Trabajo Generadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {state.workOrders.filter(wo => wo.status === 'completed').length}
              </div>
              <div className="text-sm text-green-700">Completadas</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {state.workOrders.filter(wo => wo.status === 'in-progress').length}
              </div>
              <div className="text-sm text-blue-700">En Proceso</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {state.workOrders.filter(wo => wo.status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-700">Pendientes</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.workOrders.slice(0, 10).map((order) => {
                  const client = state.clients.find(c => c.id === order.clientId);
                  const vehicle = state.vehicles.find(v => v.id === order.vehicleId);
                  
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle?.brand} {vehicle?.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(order.totalCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Credenciales de Acceso */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Credenciales de Acceso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Clientes (del CSV)</h3>
              <div className="space-y-2 text-sm">
                {state.clients.slice(0, 3).map(client => (
                  <div key={client.id} className="bg-gray-50 p-3 rounded">
                    <div><strong>Email:</strong> {client.email}</div>
                    <div><strong>Contraseña:</strong> {client.password}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Usuarios del Sistema</h3>
              <div className="space-y-2 text-sm">
                {state.users.map(user => (
                  <div key={user.id} className="bg-gray-50 p-3 rounded">
                    <div><strong>Rol:</strong> {user.role}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Contraseña:</strong> {user.password}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
