import { useState } from 'react';
import {
  CheckCircleIcon,
  CalendarDaysIcon,
  TruckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  StarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';

interface ServiceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  description: string;
  date: string;
  cost: number;
  technician: string;
  status: 'completed' | 'warranty' | 'pending-payment';
  rating?: number;
  review?: string;
  warranty?: {
    months: number;
    expiryDate: string;
  };
  invoice?: {
    number: string;
    downloadUrl: string;
  };
  photos?: string[];
  nextServiceRecommendation?: {
    service: string;
    recommendedDate: string;
    mileage: number;
  };
}

export function ClientServiceHistoryPage() {
  const { state } = useApp();
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'rating'>('date');

  // Datos de ejemplo
  const serviceHistory: ServiceRecord[] = [
    {
      id: 'SH-2025-001',
      vehicleId: '1',
      vehicleName: 'Toyota Corolla 2020 (HTN-0123)',
      serviceType: 'Mantenimiento Preventivo',
      description: 'Cambio de aceite, filtros de aire y combustible, revisión general',
      date: '2025-07-15',
      cost: 8500,
      technician: 'Carlos Mendoza',
      status: 'completed',
      rating: 5,
      review: 'Excelente servicio, muy profesional y rápido. El auto quedó como nuevo.',
      warranty: {
        months: 3,
        expiryDate: '2025-10-15'
      },
      invoice: {
        number: 'FAC-2025-001',
        downloadUrl: '#'
      },
      nextServiceRecommendation: {
        service: 'Cambio de aceite',
        recommendedDate: '2025-12-15',
        mileage: 50000
      }
    },
    {
      id: 'SH-2025-002',
      vehicleId: '2',
      vehicleName: 'Honda Civic 2019 (HTN-4567)',
      serviceType: 'Cambio de Aceite',
      description: 'Cambio de aceite sintético y filtro de aceite',
      date: '2025-06-10',
      cost: 3500,
      technician: 'Miguel Rodriguez',
      status: 'completed',
      rating: 4,
      warranty: {
        months: 2,
        expiryDate: '2025-08-10'
      },
      invoice: {
        number: 'FAC-2025-002',
        downloadUrl: '#'
      }
    },
    {
      id: 'SH-2025-003',
      vehicleId: '1',
      vehicleName: 'Toyota Corolla 2020 (HTN-0123)',
      serviceType: 'Reparación de Frenos',
      description: 'Cambio de pastillas de freno delanteras y revisión del sistema',
      date: '2025-05-20',
      cost: 12000,
      technician: 'Luis Hernandez',
      status: 'warranty',
      rating: 5,
      warranty: {
        months: 6,
        expiryDate: '2025-11-20'
      },
      invoice: {
        number: 'FAC-2025-003',
        downloadUrl: '#'
      }
    },
    {
      id: 'SH-2025-004',
      vehicleId: '3',
      vehicleName: 'Nissan Sentra 2021 (HTN-8910)',
      serviceType: 'Diagnóstico General',
      description: 'Diagnóstico completo del vehículo, revisión de códigos de error',
      date: '2025-04-18',
      cost: 1500,
      technician: 'Carlos Mendoza',
      status: 'completed',
      rating: 4,
      invoice: {
        number: 'FAC-2025-004',
        downloadUrl: '#'
      }
    }
  ];

  const clientVehicles = [
    { id: '1', name: 'Toyota Corolla 2020' },
    { id: '2', name: 'Honda Civic 2019' },
    { id: '3', name: 'Nissan Sentra 2021' }
  ];

  const filteredServices = serviceHistory
    .filter(service => 
      (filterVehicle === 'all' || service.vehicleId === filterVehicle) &&
      (filterYear === 'all' || service.date.startsWith(filterYear)) &&
      (service.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
       service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       service.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return b.cost - a.cost;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Completado', icon: CheckCircleIcon };
      case 'warranty':
        return { color: 'bg-blue-100 text-blue-800', text: 'En Garantía', icon: DocumentTextIcon };
      case 'pending-payment':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Pago Pendiente', icon: ClockIcon };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status, icon: CheckCircleIcon };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalSpent = serviceHistory.reduce((sum, service) => sum + service.cost, 0);
  const averageRating = serviceHistory.filter(s => s.rating).reduce((sum, service) => sum + (service.rating || 0), 0) / serviceHistory.filter(s => s.rating).length;

  const renderServiceCard = (service: ServiceRecord) => {
    const statusConfig = getStatusConfig(service.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div key={service.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-xl mr-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{service.serviceType}</h3>
                <p className="text-sm text-gray-600">#{service.id}</p>
                <p className="text-sm text-gray-500">{service.vehicleName}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.text}
              </span>
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha</p>
              <p className="text-sm font-semibold text-gray-900">{service.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Costo</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(service.cost)}</p>
            </div>
          </div>

          {/* Rating */}
          {service.rating && (
            <div className="flex items-center mb-4">
              <span className="text-sm text-gray-600 mr-2">Calificación:</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-4 w-4 ${
                      star <= service.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">({service.rating}/5)</span>
              </div>
            </div>
          )}

          {/* Garantía */}
          {service.warranty && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Garantía Activa</p>
                  <p className="text-sm text-blue-700">Válida hasta {service.warranty.expiryDate}</p>
                </div>
                <div className="text-sm font-semibold text-blue-800">
                  {service.warranty.months} meses
                </div>
              </div>
            </div>
          )}

          {/* Técnico */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Técnico</p>
              <p className="text-sm font-semibold text-gray-900">{service.technician}</p>
            </div>
            {service.invoice && (
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Descargar Factura
              </button>
            )}
          </div>

          {/* Descripción */}
          <p className="text-sm text-gray-700 mb-4 line-clamp-2">{service.description}</p>

          {/* Acciones */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedService(service)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Ver Detalles
            </button>
            {service.nextServiceRecommendation && (
              <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                Próximo Servicio
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderServiceDetail = () => {
    if (!selectedService) return null;

    const statusConfig = getStatusConfig(selectedService.status);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedService.serviceType}</h3>
                  <p className="text-green-100 text-sm">#{selectedService.id} • {selectedService.vehicleName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Detalles del Servicio</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fecha:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedService.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Técnico:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedService.technician}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${statusConfig.color}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Costos</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Costo total:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedService.cost)}</span>
                  </div>
                  {selectedService.invoice && (
                    <div className="mt-4">
                      <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Descargar Factura #{selectedService.invoice.number}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción detallada */}
            <div className="mb-8">
              <h5 className="font-semibold text-gray-900 mb-3">Descripción del Trabajo</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{selectedService.description}</p>
              </div>
            </div>

            {/* Rating y reseña */}
            {selectedService.rating && (
              <div className="mb-8">
                <h5 className="font-semibold text-gray-900 mb-3">Tu Calificación</h5>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center mr-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-5 w-5 ${
                            star <= selectedService.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{selectedService.rating}/5</span>
                  </div>
                  {selectedService.review && (
                    <p className="text-gray-700 italic">"{selectedService.review}"</p>
                  )}
                </div>
              </div>
            )}

            {/* Garantía */}
            {selectedService.warranty && (
              <div className="mb-8">
                <h5 className="font-semibold text-gray-900 mb-3">Información de Garantía</h5>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">Garantía de {selectedService.warranty.months} meses</p>
                      <p className="text-blue-700">Válida hasta {selectedService.warranty.expiryDate}</p>
                    </div>
                    <div className="text-blue-600">
                      <DocumentTextIcon className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recomendación próximo servicio */}
            {selectedService.nextServiceRecommendation && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Próximo Servicio Recomendado</h5>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-orange-900">{selectedService.nextServiceRecommendation.service}</p>
                      <p className="text-orange-700">Fecha recomendada: {selectedService.nextServiceRecommendation.recommendedDate}</p>
                      <p className="text-orange-700">A los {selectedService.nextServiceRecommendation.mileage.toLocaleString()} km</p>
                    </div>
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                      Agendar Cita
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Historial de Servicios</h1>
                  <p className="text-green-100 text-lg">Todos tus servicios completados</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{serviceHistory.length}</div>
                  <div className="text-green-100 text-sm">Servicios Totales</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                  <div className="text-green-100 text-sm">Total Invertido</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
                  <div className="text-green-100 text-sm">Calificación Promedio</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los vehículos</option>
              {clientVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los años</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="date">Ordenar por fecha</option>
              <option value="cost">Ordenar por costo</option>
              <option value="rating">Ordenar por calificación</option>
            </select>
          </div>
        </div>

        {/* Lista de servicios */}
        {filteredServices.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {filteredServices.map(renderServiceCard)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircleIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron servicios
            </h3>
            <p className="text-gray-500 mb-8">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        )}

        {/* Modal de detalle */}
        {selectedService && renderServiceDetail()}
      </div>
    </div>
  );
}
