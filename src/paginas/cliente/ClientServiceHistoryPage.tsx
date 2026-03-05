import { useState, useEffect } from 'react';
import { appConfig } from '../../config/config';
import {
  CheckCircleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  StarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';
import { serviceHistoryService } from '../../servicios/serviceHistoryService';

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
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [clientVehicles, setClientVehicles] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);

  // Cargar historial de servicios y vehículos del cliente
  useEffect(() => {
    const loadServiceHistory = async () => {
      if (!state?.user?.id) return;

      setLoading(true);

      try {
        // Traer historial y estadísticas (si aplica)
        const [historyResponse] = await Promise.all([
          serviceHistoryService.getClientServiceHistory(state.user.id),
        ]);

        if (historyResponse && historyResponse.success) {
          setServiceHistory(historyResponse.data || []);
        } else {
          setServiceHistory([]);
        }

        // Cargar vehículos del cliente (misma lógica del dashboard)
        try {
          const resp = await fetch(`${appConfig.apiBaseUrl}/vehicles?cliente_id=${state.user.id}&obtener_activos=1`);
          if (resp.ok) {
            const result = await resp.json();
            if (result.success && result.data) {
              const userVehicles = result.data.map((vehicle: any) => ({
                id: vehicle.vehiculo_id?.toString() || vehicle.id?.toString(),
                name: `${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.placa ? '- ' + vehicle.placa : ''}`.trim(),
              }));
              setClientVehicles(userVehicles);
            } else {
              setClientVehicles([]);
            }
          } else {
            setClientVehicles([]);
          }
        } catch (err) {
          setClientVehicles([]);
        }

      } catch (error) {
        setServiceHistory([]);
        setClientVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    loadServiceHistory();
  }, [state?.user?.id]);

  const term = searchTerm.trim().toLowerCase();
  const filteredServices = serviceHistory
    .filter(service => {
      const matchesVehicle = filterVehicle === 'all' || String(service.vehicleId || '') === filterVehicle;
      const matchesYear = filterYear === 'all' || String(service.date || '').startsWith(filterYear);

      const serviceType = (service.serviceType || '').toString().toLowerCase();
      const description = (service.description || '').toString().toLowerCase();
      const vehicleName = (service.vehicleName || '').toString().toLowerCase();

      const matchesTerm = term === '' || serviceType.includes(term) || description.includes(term) || vehicleName.includes(term);

      return matchesVehicle && matchesYear && matchesTerm;
    })
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

  const totalSpent = serviceHistory.reduce((sum, service) => {
    const cost = (service as any).cost ?? (service as any).servicePrice ?? (service as any).price ?? 0;
    return sum + (Number(cost) || 0);
  }, 0);
  const ratingValues = serviceHistory.filter(s => s.rating != null).map(s => s.rating || 0);
  const averageRating = ratingValues.length ? ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length : 0;

  const renderServiceCard = (service: ServiceRecord) => {
    const status = (service as any).status ?? service.status ?? 'completed';
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

    const serviceId = (service as any).id ?? (service as any)._id ?? (service as any).history_id ?? service.id;
    const serviceName = (service as any).serviceType ?? (service as any).serviceName ?? (service as any).service ?? '';
    const vehicleName = (service as any).vehicleName ?? (service as any).vehicle ?? '';
    const vehiclePlate = (service as any).vehiclePlate ?? (service as any).placa ?? '';
    const serviceDescription = (service as any).description ?? (service as any).serviceDescription ?? (service as any).notes ?? '';
    const dateText = (service as any).date ?? (service as any).createdAt ?? '';
    const costValue = Number((service as any).cost ?? (service as any).servicePrice ?? (service as any).price ?? 0) || 0;

    return (
      <div key={serviceId} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-xl mr-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{serviceName}</h3>
                <p className="text-sm text-gray-600">#{serviceId}</p>
                <p className="text-sm text-gray-500">{vehicleName}{vehiclePlate ? ` • ${vehiclePlate}` : ''}</p>
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
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(costValue)}</p>
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
          <p className="text-sm text-gray-700 mb-4 line-clamp-2">{serviceDescription}</p>

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header responsivo */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
                  <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Historial de Servicios</h1>
                  <p className="text-green-100 text-sm sm:text-base lg:text-lg">Todos tus servicios completados</p>
                </div>
              </div>
              
              {/* Stats responsivas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">{serviceHistory.length}</div>
                  <div className="text-green-100 text-xs sm:text-sm">Servicios Totales</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                  <div className="text-green-100 text-xs sm:text-sm">Total Invertido</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
                  <div className="text-green-100 text-xs sm:text-sm">Calificación Promedio</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda responsivos */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 absolute left-3 top-2.5 sm:top-3" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
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
