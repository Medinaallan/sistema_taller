import { Card } from '../../componentes/comunes/UI';
import { UserIcon, KeyIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayuda del Sistema</h1>
  <p className="text-gray-600">Información útil para usar PruebaProject</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Usuarios de Prueba</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-800 flex items-center">
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Administrador
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  <strong>Email:</strong> admin@tallerpro.hn<br />
                  <strong>Contraseña:</strong> admin123<br />
                  <strong>Nombre:</strong> Carlos Alberto Mendoza
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-800 flex items-center">
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Recepcionista
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Email:</strong> recepcion@tallerpro.hn<br />
                  <strong>Contraseña:</strong> recep123<br />
                  <strong>Nombre:</strong> María Elena Rodríguez
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-800 flex items-center">
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Mecánico
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  <strong>Email:</strong> mecanico@tallerpro.hn<br />
                  <strong>Contraseña:</strong> mech123<br />
                  <strong>Nombre:</strong> José Manuel Hernández
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-800 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 mr-2" />
                  Clientes
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  Los clientes se crean desde el panel de Administración.<br />
                  Una vez creados, pueden iniciar sesión con su email y contraseña.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <InformationCircleIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Moneda</h3>
                <p className="text-sm text-gray-600">
                  Todos los precios se muestran en <strong>Lempiras Hondureñas (L.)</strong>
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Datos de Ejemplo</h3>
                <p className="text-sm text-gray-600">
                  El sistema incluye datos de prueba con clientes, vehículos y órdenes de trabajo de ejemplo para Honduras.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Roles del Sistema</h3>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li><strong>Administrador:</strong> Acceso completo al sistema</li>
                  <li><strong>Recepcionista:</strong> Gestión de clientes y órdenes</li>
                  <li><strong>Mecánico:</strong> Gestión de servicios técnicos</li>
                  <li><strong>Cliente:</strong> Vista de vehículos y citas propias</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Ubicación</h3>
                <p className="text-sm text-gray-600">
                  Sistema configurado para <strong>Honduras</strong> con formato de fecha, moneda y datos locales.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
