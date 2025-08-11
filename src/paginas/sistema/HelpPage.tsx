import { Card } from '../../componentes/comunes/UI';
import { 
  WrenchScrewdriverIcon, 
  UserGroupIcon,
  TruckIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';

export function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guía de Usuario</h1>
        <p className="text-gray-600">Manual de uso del Sistema de Gestión de Taller Mecánico</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Servicios</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-800">Crear Orden de Trabajo</h3>
                <p className="text-sm text-blue-700 mt-1">
                  • Seleccione el cliente y vehículo<br />
                  • Agregue servicios requeridos<br />
                  • Asigne fecha y mecánico responsable<br />
                  • Confirme los costos estimados
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-800">Estados de Órdenes</h3>
                <p className="text-sm text-green-700 mt-1">
                  • <strong>Pendiente:</strong> Orden recién creada<br />
                  • <strong>En Proceso:</strong> Trabajo en ejecución<br />
                  • <strong>Completada:</strong> Servicio terminado<br />
                  • <strong>Entregada:</strong> Vehículo entregado al cliente
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Clientes</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <h3 className="font-medium text-amber-800">Registro de Clientes</h3>
                <p className="text-sm text-amber-700 mt-1">
                  • Complete información personal y de contacto<br />
                  • Verifique datos antes de guardar<br />
                  • El sistema asigna automáticamente un ID único<br />
                  • Los clientes pueden acceder con su email
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h3 className="font-medium text-purple-800">Historial de Servicios</h3>
                <p className="text-sm text-purple-700 mt-1">
                  • Consulte servicios anteriores por cliente<br />
                  • Revise patrones de mantenimiento<br />
                  • Acceda a detalles de cada orden<br />
                  • Genere reportes personalizados
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TruckIcon className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Control de Vehículos</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-800">Información Vehicular</h3>
                <p className="text-sm text-red-700 mt-1">
                  • Registre marca, modelo y año<br />
                  • Anote número de placa y VIN<br />
                  • Configure recordatorios de mantenimiento<br />
                  • Adjunte fotos y documentos relevantes
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
                <h3 className="font-medium text-indigo-800">Mantenimiento Preventivo</h3>
                <p className="text-sm text-indigo-700 mt-1">
                  • Programe servicios según kilometraje<br />
                  • Configure alertas automáticas<br />
                  • Mantenga registro de cambios de aceite<br />
                  • Controle vencimiento de documentos
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reportes y Análisis</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-md p-4">
                <h3 className="font-medium text-teal-800">Reportes Disponibles</h3>
                <p className="text-sm text-teal-700 mt-1">
                  • Ingresos por período de tiempo<br />
                  • Servicios más solicitados<br />
                  • Rendimiento por mecánico<br />
                  • Análisis de satisfacción del cliente
                </p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-md p-4">
                <h3 className="font-medium text-rose-800">Exportación de Datos</h3>
                <p className="text-sm text-rose-700 mt-1">
                  • Exporte reportes en formato PDF<br />
                  • Genere archivos Excel para análisis<br />
                  • Configure reportes automáticos<br />
                  • Envíe reportes por correo electrónico
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <QuestionMarkCircleIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preguntas Frecuentes</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">¿Cómo programar una cita?</h3>
                <p className="text-sm text-gray-600">
                  Vaya a "Órdenes de Trabajo", seleccione "Nueva Orden", escoja cliente y vehículo, 
                  defina servicios y asigne fecha disponible.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">¿Cómo modificar el estado de una orden?</h3>
                <p className="text-sm text-gray-600">
                  Haga clic en la orden desde el dashboard, seleccione "Cambiar Estado" 
                  y elija entre Pendiente, En Proceso, Completada o Entregada.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">¿Cómo generar una factura?</h3>
                <p className="text-sm text-gray-600">
                  Desde una orden completada, haga click en "Generar Factura" 
                  El sistema calculará automáticamente totales e impuestos.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">¿Cómo configurar recordatorios?</h3>
                <p className="text-sm text-gray-600">
                  En la sección de vehículos, configure alertas por kilometraje o fecha 
                  para mantenimientos preventivos y vencimientos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
