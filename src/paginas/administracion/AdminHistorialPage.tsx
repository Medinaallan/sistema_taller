import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { serviceHistoryService } from '../../servicios/serviceHistoryService';
import type { ServiceHistoryRecord, ServiceHistoryStats } from '../../tipos';

export function AdminHistorialPage() {
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ServiceHistoryRecord[]>([]);
  const [stats, setStats] = useState<ServiceHistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  
  // Estado del modal de detalles
  const [selectedRecord, setSelectedRecord] = useState<ServiceHistoryRecord | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadServiceHistory();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [serviceHistory, searchTerm, selectedClient, selectedStatus, selectedService, selectedDateRange, selectedPaymentStatus]);

  const loadServiceHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await serviceHistoryService.getAllServiceHistory();
      
      if (response.success) {
        setServiceHistory(response.data);
        setStats(response.stats);
      } else {
        setError(response.message || 'Error cargando historial');
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...serviceHistory];

    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.clientName.toLowerCase().includes(searchLower) ||
        record.serviceName.toLowerCase().includes(searchLower) ||
        record.vehicleName.toLowerCase().includes(searchLower) ||
        record.vehiclePlate.toLowerCase().includes(searchLower) ||
        record.serviceDescription.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por cliente
    if (selectedClient !== 'all') {
      filtered = filtered.filter(record => record.clientId === selectedClient);
    }

    // Filtro por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }

    // Filtro por servicio
    if (selectedService !== 'all') {
      filtered = filtered.filter(record => record.serviceId === selectedService);
    }

    // Filtro por estado de pago
    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(record => record.paymentStatus === selectedPaymentStatus);
    }

    // Filtro por rango de fecha
    if (selectedDateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedDateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date || record.createdAt);
        return recordDate >= startDate;
      });
    }

    setFilteredHistory(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon;
      case 'pending':
        return ClockIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-100';
      case 'pending':
        return 'text-yellow-500 bg-yellow-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  // Obtener listas únicas para filtros
  const uniqueClients = Array.from(new Set(serviceHistory.map(r => r.clientId)))
    .map(id => {
      const record = serviceHistory.find(r => r.clientId === id);
      return { id, name: record?.clientName || '' };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const uniqueServices = Array.from(new Set(serviceHistory.map(r => r.serviceId)))
    .map(id => {
      const record = serviceHistory.find(r => r.serviceId === id);
      return { id, name: record?.serviceName || '' };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const uniqueStatuses = Array.from(new Set(serviceHistory.map(r => r.status)));
  const uniquePaymentStatuses = Array.from(new Set(serviceHistory
    .map(r => r.paymentStatus)
    .filter(Boolean)
  ));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial de servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error cargando datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadServiceHistory}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold mb-2">Historial Global de Servicios</h1>
              <p className="text-blue-100">Gestión completa del historial de servicios de todos los clientes</p>
            
            </div>
            
            {/* Estadísticas generales */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.totalRecords}</div>
                  <div className="text-blue-100 text-sm">Servicios</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.totalClients}</div>
                  <div className="text-blue-100 text-sm">Clientes</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                  <div className="text-blue-100 text-sm">Vehículos</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.totalServices}</div>
                  <div className="text-blue-100 text-sm">Tipos de Servicio</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {/* Búsqueda */}
            <div className="xl:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente, servicio, vehículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cliente */}
            <div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los clientes</option>
                {uniqueClients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'completed' ? 'Completado' : 
                     status === 'pending' ? 'Pendiente' : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado de Pago */}
            <div>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Estado de Pago</option>
                {uniquePaymentStatuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'paid' ? 'Pagado' : 
                     status === 'pending' ? 'Pendiente' : 
                     status === 'partial' ? 'Parcial' : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Servicio */}
            <div>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los servicios</option>
                {uniqueServices.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>

            {/* Rango de fecha */}
            <div>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>
          </div>

          {/* Resumen de filtros */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>Mostrando {filteredHistory.length} de {serviceHistory.length} registros</span>
            {(searchTerm || selectedClient !== 'all' || selectedStatus !== 'all' || 
              selectedService !== 'all' || selectedDateRange !== 'all' || selectedPaymentStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClient('all');
                  setSelectedStatus('all');
                  setSelectedService('all');
                  setSelectedDateRange('all');
                  setSelectedPaymentStatus('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de servicios */}
        {filteredHistory.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((record) => {
                    const StatusIcon = getStatusIcon(record.status);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.clientName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.clientEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.vehicleName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.vehiclePlate}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.serviceName}
                              </div>
                              {record.serviceDescription && (
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {record.serviceDescription}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {formatDate(record.date || record.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusIcon className={`h-5 w-5 mr-2 ${getStatusColor(record.status).split(' ')[0]}`} />
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status === 'completed' ? 'Completado' :
                               record.status === 'pending' ? 'Pendiente' :
                               record.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.paymentStatus ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.paymentStatus === 'paid' ? 'text-green-500 bg-green-100' :
                              record.paymentStatus === 'pending' ? 'text-yellow-500 bg-yellow-100' :
                              record.paymentStatus === 'partial' ? 'text-blue-500 bg-blue-100' :
                              'text-gray-500 bg-gray-100'
                            }`}>
                              {record.paymentStatus === 'paid' ? 'Pagado' :
                               record.paymentStatus === 'pending' ? 'Pendiente' :
                               record.paymentStatus === 'partial' ? 'Parcial' :
                               record.paymentStatus}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(record.servicePrice)}
                              </div>
                              {record.invoiceTotal && record.invoiceTotal !== record.servicePrice && (
                                <div className="text-xs text-blue-600">
                                  Total factura: {formatCurrency(record.invoiceTotal)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron registros
            </h3>
            <p className="text-gray-500">
              {serviceHistory.length === 0
                ? 'No hay servicios registrados en el sistema.'
                : 'Intenta ajustar los filtros para ver más resultados.'}
            </p>
          </div>
        )}

        {/* Modal de detalles */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Detalles del Servicio</h3>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del cliente */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2" />
                      Cliente
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nombre:</strong> {selectedRecord.clientName}</div>
                      <div><strong>Email:</strong> {selectedRecord.clientEmail}</div>
                      <div><strong>Teléfono:</strong> {selectedRecord.clientPhone}</div>
                    </div>
                  </div>

                  {/* Información del vehículo */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <TruckIcon className="h-5 w-5 mr-2" />
                      Vehículo
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Vehículo:</strong> {selectedRecord.vehicleName}</div>
                      <div><strong>Placa:</strong> {selectedRecord.vehiclePlate}</div>
                      <div><strong>Color:</strong> {selectedRecord.vehicleColor}</div>
                    </div>
                  </div>

                  {/* Información del servicio */}
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
                      Servicio
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Nombre:</strong> {selectedRecord.serviceName}</div>
                      <div><strong>Categoría:</strong> {selectedRecord.serviceCategory}</div>
                      <div><strong>Precio:</strong> {formatCurrency(selectedRecord.servicePrice)}</div>
                      <div><strong>Duración:</strong> {selectedRecord.serviceDuration}</div>
                      <div><strong>Fecha:</strong> {formatDate(selectedRecord.date || selectedRecord.createdAt)}</div>
                      <div><strong>Estado:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                          {selectedRecord.status === 'completed' ? 'Completado' :
                           selectedRecord.status === 'pending' ? 'Pendiente' :
                           selectedRecord.status}
                        </span>
                      </div>
                      {selectedRecord.paymentStatus && (
                        <div><strong>Estado de Pago:</strong>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedRecord.paymentStatus === 'paid' ? 'text-green-500 bg-green-100' :
                            selectedRecord.paymentStatus === 'pending' ? 'text-yellow-500 bg-yellow-100' :
                            selectedRecord.paymentStatus === 'partial' ? 'text-blue-500 bg-blue-100' :
                            'text-gray-500 bg-gray-100'
                          }`}>
                            {selectedRecord.paymentStatus === 'paid' ? 'Pagado' :
                             selectedRecord.paymentStatus === 'pending' ? 'Pendiente' :
                             selectedRecord.paymentStatus === 'partial' ? 'Parcial' :
                             selectedRecord.paymentStatus}
                          </span>
                        </div>
                      )}
                      {selectedRecord.invoiceId && (
                        <div><strong>Factura ID:</strong> {selectedRecord.invoiceId}</div>
                      )}
                      {selectedRecord.invoiceTotal && (
                        <div><strong>Total Facturado:</strong> {formatCurrency(selectedRecord.invoiceTotal)}</div>
                      )}
                      {selectedRecord.workOrderId && (
                        <div><strong>Orden de Trabajo:</strong> #{selectedRecord.workOrderId.slice(-8)}</div>
                      )}
                    </div>
                    
                    {selectedRecord.serviceDescription && (
                      <div className="mt-4">
                        <strong>Descripción:</strong>
                        <p className="mt-1 text-gray-700">{selectedRecord.serviceDescription}</p>
                      </div>
                    )}
                    
                    {selectedRecord.notes && (
                      <div className="mt-4">
                        <strong>Notas:</strong>
                        <p className="mt-1 text-gray-700">{selectedRecord.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}