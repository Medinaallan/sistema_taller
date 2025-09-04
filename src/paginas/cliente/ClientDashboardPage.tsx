import { useState } from 'react';
import {
  TruckIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  PlusIcon,
  EyeIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  licensePlate: string;
  mileage: number;
  photo?: string;
}

interface WorkOrder {
  id: string;
  vehicleId: string;
  vehicleName: string;
  status: string;
  statusText: string;
  service: string;
  createdDate: string;
  estimatedDelivery: string;
  progress: number;
  description: string;
  photos: string[];
}

interface Quotation {
  id: string;
  workOrderId: string;
  vehicle: string;
  status: string;
  total: number;
  services: { description: string; price: number; quantity: number }[];
  createdDate: string;
}

interface ServiceRecord {
  id: string;
  date: string;
  vehicle: string;
  service: string;
  cost: number;
  status: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  vehicle: string;
  service: string;
  status: string;
}

export function ClientDashboardPage() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'appointments' | 'orders' | 'quotations' | 'history' | 'payments'>('overview');

  // Funciones para modales (implementación futura)
  const handleAddVehicle = () => {
    alert('Funcionalidad de agregar vehículo - En desarrollo');
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    alert(`Ver detalles de ${vehicle.brand} ${vehicle.model} - En desarrollo`);
  };

  // Datos simulados del cliente
  const clientVehicles: Vehicle[] = [
    {
      id: '1',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Blanco',
      vin: '1HGBH41JXMN109186',
      licensePlate: 'HTN-0123',
      mileage: 45000,
      photo: undefined
    },
    {
      id: '2',
      brand: 'Honda',
      model: 'Civic',
      year: 2019,
      color: 'Negro',
      vin: '2HGFC2F59HH123456',
      licensePlate: 'HTN-4567',
      mileage: 38000,
      photo: undefined
    }
  ];

  const workOrders: WorkOrder[] = [
    {
      id: 'OT-001',
      vehicleId: '1',
      vehicleName: 'Toyota Corolla 2020',
      status: 'in-progress',
      statusText: 'En Proceso',
      service: 'Mantenimiento General',
      createdDate: '2025-08-25',
      estimatedDelivery: '2025-08-30',
      progress: 60,
      description: 'Cambio de aceite, filtros y revisión general',
      photos: []
    },
    {
      id: 'OT-002',
      vehicleId: '2',
      vehicleName: 'Honda Civic 2019',
      status: 'pending-parts',
      statusText: 'Esperando Repuestos',
      service: 'Reparación de frenos',
      createdDate: '2025-08-28',
      estimatedDelivery: '2025-09-02',
      progress: 30,
      description: 'Cambio de pastillas y discos de freno delanteros',
      photos: []
    }
  ];

  const quotations: Quotation[] = [
    {
      id: 'COT-001',
      workOrderId: 'OT-003',
      vehicle: 'Toyota Corolla 2020',
      status: 'pending',
      total: 15000,
      services: [
        { description: 'Cambio de transmisión', price: 8000, quantity: 1 },
        { description: 'Mano de obra especializada', price: 5000, quantity: 1 },
        { description: 'Filtro de transmisión', price: 2000, quantity: 1 }
      ],
      createdDate: '2025-08-29'
    }
  ];

  const serviceHistory: ServiceRecord[] = [
    {
      id: 'SH-001',
      date: '2025-07-15',
      vehicle: 'Toyota Corolla 2020',
      service: 'Mantenimiento Preventivo',
      cost: 8500,
      status: 'completed'
    },
    {
      id: 'SH-002',
      date: '2025-06-10',
      vehicle: 'Honda Civic 2019',
      service: 'Cambio de Aceite',
      cost: 3500,
      status: 'completed'
    }
  ];

  const appointments: Appointment[] = [
    {
      id: 'APP-001',
      date: '2025-09-05',
      time: '09:00',
      vehicle: 'Toyota Corolla 2020',
      service: 'Diagnóstico General',
      status: 'confirmed'
    },
    {
      id: 'APP-002',
      date: '2025-09-10',
      time: '14:30',
      vehicle: 'Honda Civic 2019',
      service: 'Mantenimiento Preventivo',
      status: 'pending'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending-parts': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Vehículos Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">{clientVehicles.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Servicios Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {workOrders.filter(o => ['pending', 'in-progress', 'pending-parts'].includes(o.status)).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Próximas Citas</dt>
                  <dd className="text-lg font-medium text-gray-900">{appointments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cotizaciones</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {quotations.filter(q => q.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {workOrders.slice(0, 3).map((order) => (
              <li key={order.id} className="px-4 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.statusText}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{order.service}</p>
                    <p className="text-sm text-gray-500">{order.vehicleName}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.createdDate}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderVehiclesTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Mis Vehículos</h1>
          <p className="mt-2 text-sm text-gray-700">Gestiona todos tus vehículos registrados</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAddVehicle}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Vehículo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clientVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-500">Año {vehicle.year}</p>
                </div>
                <button
                  onClick={() => handleViewVehicle(vehicle)}
                  className="text-blue-600 hover:text-blue-500"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Placa:</span>
                  <span className="text-gray-900">{vehicle.licensePlate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Color:</span>
                  <span className="text-gray-900">{vehicle.color}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kilometraje:</span>
                  <span className="text-gray-900">{vehicle.mileage.toLocaleString()} km</span>
                </div>
              </div>

              {!vehicle.photo && (
                <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-xs text-gray-500">Agregar foto del vehículo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Mis Citas</h1>
          <p className="mt-2 text-sm text-gray-700">Agenda y gestiona tus citas de servicio</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Cita
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.service}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.vehicle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.date}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.time}
                      </p>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderWorkOrdersTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Órdenes de Trabajo</h1>
          <p className="mt-2 text-sm text-gray-700">Seguimiento en tiempo real de tus servicios</p>
        </div>
      </div>

      <div className="space-y-6">
        {workOrders.map((order) => (
          <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {order.service}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {order.vehicleName} • Orden #{order.id}
                  </p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.statusText}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Descripción</p>
                  <p className="mt-1 text-sm text-gray-900">{order.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de entrega estimada</p>
                  <p className="mt-1 text-sm text-gray-900">{order.estimatedDelivery}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Progreso</span>
                  <span className="text-gray-500">{order.progress}%</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuotationsTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Cotizaciones</h1>
          <p className="mt-2 text-sm text-gray-700">Revisa y aprueba las cotizaciones de tus servicios</p>
        </div>
      </div>

      <div className="space-y-6">
        {quotations.map((quotation) => (
          <div key={quotation.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Cotización #{quotation.id}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {quotation.vehicle} • {quotation.createdDate}
                  </p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quotation.status)}`}>
                  {quotation.status === 'pending' ? 'Pendiente de Aprobación' : 'Aprobada'}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Detalle de servicios</h4>
                <div className="space-y-3">
                  {quotation.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm text-gray-900">{service.description}</p>
                        <p className="text-xs text-gray-500">Cantidad: {service.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(service.price * service.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-medium text-gray-900">Total</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(quotation.total)}</p>
                  </div>
                </div>

                {quotation.status === 'pending' && (
                  <div className="mt-6 flex space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Aprobar
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Historial de Servicios</h1>
          <p className="mt-2 text-sm text-gray-700">Todos tus servicios completados</p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {serviceHistory.map((record) => (
            <li key={record.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {record.service}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.vehicle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(record.cost)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {record.date}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Pagos y Facturas</h1>
          <p className="mt-2 text-sm text-gray-700">Gestiona tus pagos y descarga facturas</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Métodos de Pago</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configura tus métodos de pago preferidos
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <CreditCardIcon className="h-4 w-4 mr-2" />
            Agregar Método de Pago
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Facturas Recientes</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {serviceHistory.map((record) => (
              <li key={record.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Factura #{record.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.service} - {record.date}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(record.cost)}
                      </p>
                      <button className="text-blue-600 hover:text-blue-500 text-sm">
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'vehicles': return renderVehiclesTab();
      case 'appointments': return renderAppointmentsTab();
      case 'orders': return renderWorkOrdersTab();
      case 'quotations': return renderQuotationsTab();
      case 'history': return renderHistoryTab();
      case 'payments': return renderPaymentsTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Improved Responsive Design */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold">Mi Panel de Control</h1>
              <p className="text-blue-100 text-sm sm:text-base">Bienvenido, {state.user?.name}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setActiveTab('appointments')}
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CalendarDaysIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nueva</span> Cita
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-white text-sm font-medium rounded-md text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <TruckIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ver</span> Vehículos
              </button>
            </div>
          </div>
          
          {/* Responsive Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center">
                <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-blue-200">Vehículos</p>
                  <p className="text-lg sm:text-xl font-semibold text-white">{clientVehicles.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center">
                <WrenchScrewdriverIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-blue-200">Órdenes Activas</p>
                  <p className="text-lg sm:text-xl font-semibold text-white">
                    {workOrders.filter(o => ['pending', 'in-progress', 'pending-parts'].includes(o.status)).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-blue-200">Próximas Citas</p>
                  <p className="text-lg sm:text-xl font-semibold text-white">{appointments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-blue-200">Cotizaciones</p>
                  <p className="text-lg sm:text-xl font-semibold text-white">{quotations.filter(q => q.status === 'pending').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          {/* Mobile Tab Selector */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {[
                { id: 'overview', name: 'Resumen' },
                { id: 'vehicles', name: 'Mis Vehículos' },
                { id: 'appointments', name: 'Citas' },
                { id: 'orders', name: 'Órdenes de Trabajo' },
                { id: 'quotations', name: 'Cotizaciones' },
                { id: 'history', name: 'Historial' },
                { id: 'payments', name: 'Pagos' },
              ].map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Desktop Tabs */}
          <nav className="hidden sm:flex -mb-px space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Resumen', icon: InformationCircleIcon },
              { id: 'vehicles', name: 'Mis Vehículos', icon: TruckIcon },
              { id: 'orders', name: 'Órdenes de Trabajo', icon: WrenchScrewdriverIcon },
              { id: 'quotations', name: 'Cotizaciones', icon: DocumentTextIcon },
              { id: 'history', name: 'Historial', icon: CheckCircleIcon },
              { id: 'payments', name: 'Pagos', icon: CreditCardIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium lg:text-base`}
              >
                <tab.icon className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                <span className="hidden lg:inline">{tab.name}</span>
                <span className="lg:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}
