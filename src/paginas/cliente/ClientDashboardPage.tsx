import React, { useState, useEffect } from 'react';
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
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';
import { serviceHistoryService } from '../../servicios/serviceHistoryService';
import { vehiclesService } from '../../servicios/apiService';
import workOrdersService from '../../servicios/workOrdersService';
import additionalQuotationsService, { type AdditionalQuotation } from '../../servicios/additionalQuotationsService';
import type { ServiceHistoryRecord, ClientServiceStats } from '../../tipos';
import SignatureRequestAlerts from '../../componentes/cliente/SignatureRequestAlerts';
import { ClientSignatureModal } from '../../componentes/cliente/ClientSignatureModal';
import signatureRequestsService, { SignatureRequest } from '../../servicios/signatureRequestsService';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'appointments' | 'orders' | 'history' | 'payments'>('overview');
  
  // Estado para el historial de servicios
  const [serviceHistoryRecords, setServiceHistoryRecords] = useState<ServiceHistoryRecord[]>([]);
  const [clientStats, setClientStats] = useState<ClientServiceStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Estado para los vehículos del cliente
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [additionalQuotations, setAdditionalQuotations] = useState<AdditionalQuotation[]>([]);
  
  // Estado para órdenes de trabajo del cliente
  const [clientWorkOrders, setClientWorkOrders] = useState<any[]>([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);

  // Estados para solicitudes de firma
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedSignatureRequest, setSelectedSignatureRequest] = useState<SignatureRequest | null>(null);

  // Guard para evitar errores si no hay usuario
  if (!state?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Cargar historial de servicios del cliente
  useEffect(() => {
    const loadServiceHistory = async () => {
      if (!state.user?.id) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const [historyResponse, statsResponse] = await Promise.all([
          serviceHistoryService.getClientServiceHistory(state.user.id),
          serviceHistoryService.getClientStats(state.user.id)
        ]);
        
        if (historyResponse.success) {
          setServiceHistoryRecords(historyResponse.data);
        } else {
          setHistoryError(historyResponse.message || 'Error cargando historial');
        }
        
        if (statsResponse.success) {
          setClientStats(statsResponse.data);
        }
      } catch (error) {
        console.error('Error cargando historial de servicios:', error);
        setHistoryError('Error de conexión');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadServiceHistory();
  }, [state.user?.id]);

  // Cargar vehículos del cliente desde la API
  useEffect(() => {
    const loadClientVehicles = async () => {
      if (!state?.user?.id) return;
      
      setVehiclesLoading(true);
      try {
        console.log('📥 Cargando vehículos para cliente:', state.user.id);
        
        // Llamar al endpoint con el parámetro cliente_id para usar SP_OBTENER_VEHICULOS
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/vehicles?cliente_id=${state.user.id}&obtener_activos=1`);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Respuesta de vehículos:', result);
        
        if (result.success && result.data) {
          const userVehicles = result.data.map((vehicle: any) => ({
            id: vehicle.vehiculo_id?.toString() || vehicle.id?.toString(),
            brand: vehicle.marca || '',
            model: vehicle.modelo || '',
            year: parseInt(vehicle.anio || vehicle.año) || 0,
            color: vehicle.color || '',
            licensePlate: vehicle.placa || '',
            vin: vehicle.vin || '',
            mileage: parseInt(vehicle.kilometraje || vehicle.mileage) || 0
          }));
          console.log('✅ Vehículos mapeados:', userVehicles);
          setClientVehicles(userVehicles);
        } else {
          console.error('❌ Error en respuesta:', result.message);
          setClientVehicles([]);
        }
      } catch (error) {
        console.error('❌ Error cargando vehículos:', error);
        setClientVehicles([]);
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadClientVehicles();
  }, [state?.user?.id]);

  // Cargar subcotizaciones del cliente
  useEffect(() => {
    const loadAdditionalQuotations = async () => {
      if (state?.user?.id) {
        const clientQuotations = await additionalQuotationsService.getByClientId(state.user.id);
        setAdditionalQuotations(clientQuotations);
      }
    };

    loadAdditionalQuotations();
  }, [state?.user?.id]);
  
  // Cargar órdenes de trabajo del cliente
  useEffect(() => {
    const loadClientWorkOrders = async () => {
      if (!state?.user?.id) {
        console.log('⚠️ No hay usuario autenticado, omitiendo carga de órdenes de trabajo');
        return;
      }
      
      try {
        setWorkOrdersLoading(true);
        console.log('📥 Cargando órdenes de trabajo para cliente:', state.user.id);
        
        const orders = await workOrdersService.getWorkOrdersByClient(state.user.id.toString());
        console.log('✅ Órdenes de trabajo cargadas:', orders);
        
        setClientWorkOrders(orders || []);
      } catch (error) {
        console.error('❌ Error cargando órdenes de trabajo:', error);
        // No romper la UI si falla la carga de órdenes
        setClientWorkOrders([]);
      } finally {
        setWorkOrdersLoading(false);
      }
    };

    loadClientWorkOrders();
  }, [state?.user?.id]);

  const quotations: Quotation[] = [
    
  ];

  const serviceHistory: ServiceRecord[] = [
    
    
  ];

  const appointments: Appointment[] = [
    
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

  // Manejar respuesta a subcotizaciones
  const handleQuotationResponse = async (quotationId: string, response: 'aprobada' | 'rechazada') => {
    try {
      const approved = response === 'aprobada';
      await additionalQuotationsService.respondToQuotation(quotationId, approved, state?.user?.id || 'cliente');
      
      // Recargar las subcotizaciones para actualizar la UI
      if (state?.user?.id) {
        const updatedQuotations = await additionalQuotationsService.getByClientId(state.user.id);
        setAdditionalQuotations(updatedQuotations);
      }

      // Mostrar mensaje de confirmación
      alert(response === 'aprobada' ? 
        'Subcotización aprobada exitosamente. Los servicios se añadirán a tu orden de trabajo.' :
        'Subcotización rechazada.'
      );
    } catch (error) {
      console.error('Error respondiendo a subcotización:', error);
      alert('Error al procesar la respuesta. Por favor intenta de nuevo.');
    }
  };

  // Manejar click en alerta de autorización
  const handleSignatureRequestClick = (request: SignatureRequest) => {
    setSelectedSignatureRequest(request);
    setShowSignatureModal(true);
  };

  // Manejar firma de autorización
  const handleSignatureSigned = async () => {
    // Recargar órdenes de trabajo para actualizar el estado
    if (state?.user?.id) {
      try {
        console.log('🔄 Recargando órdenes de trabajo después de firma...');
        const orders = await workOrdersService.getWorkOrdersByClient(state.user.id.toString());
        setClientWorkOrders(orders);
        console.log('✅ Órdenes de trabajo actualizadas:', orders);
      } catch (error) {
        console.error('❌ Error recargando órdenes de trabajo:', error);
      }
    }
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
                    {clientWorkOrders.filter(o => o.estado !== 'Completada' && o.estado !== 'Cerrada' && o.estado !== 'Cancelada').length}
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
                    {quotations.filter(q => q.status === 'pending' || q.status === 'sent').length}
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
            {clientWorkOrders.slice(0, 3).map((order) => {
              const statusColors = workOrdersService.getStatusColor(order.estado);
              return (
                <li key={order.id} className="px-4 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                        {workOrdersService.formatStatus(order.estado)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{order.descripcion || 'Servicio general'}</p>
                      <p className="text-sm text-gray-500">{order.nombreVehiculo || `Vehículo #${order.vehiculoId}`}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      OT #{order.id?.slice(-8)}
                    </div>
                  </div>
                </li>
              );
            })}
            {clientWorkOrders.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-500">
                No tienes órdenes de trabajo recientes
              </li>
            )}
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
          <p className="mt-2 text-sm text-gray-700">Información de tus vehículos registrados</p>
        </div>
      </div>

      {vehiclesLoading ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Cargando tus vehículos...
          </h3>
          <p className="text-gray-500 mb-8">
            Por favor espera mientras cargamos tu información
          </p>
        </div>
      ) : clientVehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <TruckIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes vehículos registrados
          </h3>
          <p className="text-gray-500 mb-8">
            Contacta al taller para registrar tus vehículos
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Año
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kilometraje
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VIN
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <TruckIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.brand} {vehicle.model}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">{vehicle.licensePlate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.color}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.mileage.toLocaleString()} km</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{vehicle.vin || 'N/A'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );  const renderAppointmentsTab = () => (
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

      {workOrdersLoading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando órdenes de trabajo...</span>
          </div>
        </div>
      ) : clientWorkOrders.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center text-gray-500">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">No tienes órdenes de trabajo activas</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {clientWorkOrders.map((order) => {
            const statusColors = workOrdersService.getStatusColor(order.estado);
            
            return (
              <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {order.descripcion || 'Servicio general'}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {order.nombreVehiculo || `Vehículo #${order.vehiculoId}`} • OT #{order.id?.slice(-8)}
                      </p>
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                      {workOrdersService.formatStatus(order.estado)}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Problema reportado</p>
                      <p className="mt-1 text-sm text-gray-900">{order.problema || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Diagnóstico</p>
                      <p className="mt-1 text-sm text-gray-900">{order.diagnostico || 'Pendiente'}</p>
                    </div>
                    {order.fechaEstimadaCompletado && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fecha estimada de entrega</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(order.fechaEstimadaCompletado).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Costo estimado</p>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">L {order.costoEstimado?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  
                  {order.notas && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Notas</p>
                      <p className="mt-1 text-sm text-gray-900">{order.notas}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
                  {quotation.status === 'pending' ? 'Pendiente de Aprobación' : 
                   quotation.status === 'sent' ? 'Enviada a Cliente' :
                   quotation.status === 'approved' ? 'Aprobada' : 'Rechazada'}
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

                {(quotation.status === 'pending' || quotation.status === 'sent') && (
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

  const renderSubcotizacionesTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Subcotizaciones</h1>
          <p className="mt-2 text-sm text-gray-700">Servicios adicionales recomendados durante las reparaciones</p>
        </div>
      </div>

      <div className="space-y-6">
        {additionalQuotations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay subcotizaciones</h3>
            <p className="text-gray-500">Cuando encontremos servicios adicionales durante las reparaciones, aparecerán aquí</p>
          </div>
        ) : (
          additionalQuotations.map((quotation) => (
            <div key={quotation.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Subcotización #{quotation.id.slice(0, 8)}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Orden de Trabajo #{quotation.workOrderId} • {new Date(quotation.fechaCreacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    quotation.estado === 'pendiente-aprobacion' ? 'bg-yellow-100 text-yellow-800' :
                    quotation.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quotation.estado === 'pendiente-aprobacion' ? 'Pendiente de Respuesta' : 
                     quotation.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:px-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Servicios Adicionales Encontrados</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Servicios adicionales detectados
                        </h4>
                        <p className="mt-2 text-sm text-yellow-700">
                          {quotation.descripcionProblema}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="font-medium text-gray-900 mb-2">Servicios Encontrados:</h5>
                      <p className="text-sm text-gray-700 mb-3">{quotation.serviciosEncontrados}</p>
                      
                      <h5 className="font-medium text-gray-900 mb-2">Servicios Recomendados:</h5>
                      <p className="text-sm text-gray-700 mb-3">{quotation.serviciosRecomendados}</p>
                      
                      {quotation.notas && (
                        <>
                          <h5 className="font-medium text-gray-900 mb-2">Notas Adicionales:</h5>
                          <p className="text-sm text-gray-700">{quotation.notas}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-medium text-gray-900">Costo Estimado</p>
                        <p className={`text-sm ${
                          quotation.urgencia === 'alta' ? 'text-red-600' :
                          quotation.urgencia === 'media' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          Urgencia: {quotation.urgencia}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ${quotation.costoEstimado.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {quotation.estado === 'pendiente-aprobacion' && (
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => handleQuotationResponse(quotation.id, 'aprobada')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Aprobar Servicios
                      </button>
                      <button
                        onClick={() => handleQuotationResponse(quotation.id, 'rechazada')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Rechazar
                      </button>
                    </div>
                  )}

                  {quotation.estado === 'aprobada' && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Servicios Aprobados
                          </p>
                          <p className="mt-1 text-sm text-green-700">
                            Los servicios han sido aprobados y se añadirán a tu orden de trabajo.
                            {quotation.fechaRespuesta && ` (${new Date(quotation.fechaRespuesta).toLocaleDateString('es-ES')})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {quotation.estado === 'rechazada' && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            Servicios Rechazados
                          </p>
                          <p className="mt-1 text-sm text-red-700">
                            Los servicios adicionales han sido rechazados.
                            {quotation.fechaRespuesta && ` (${new Date(quotation.fechaRespuesta).toLocaleDateString('es-ES')})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Historial de Servicios</h1>
          <p className="mt-2 text-sm text-gray-700">Todos tus servicios completados desde Excel</p>
        </div>
      </div>

      {/* Estadísticas del cliente */}
      {clientStats && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white mb-6">
          <h3 className="text-lg font-semibold mb-4">Resumen de Servicios</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{clientStats.totalServices}</div>
              <div className="text-green-100 text-sm">Servicios Totales</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{formatCurrency(clientStats.totalSpent)}</div>
              <div className="text-green-100 text-sm">Total Invertido</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{clientStats.vehiclesServiced}</div>
              <div className="text-green-100 text-sm">Vehículos Atendidos</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{formatCurrency(clientStats.averageServiceCost)}</div>
              <div className="text-green-100 text-sm">Costo Promedio</div>
            </div>
          </div>
          
          {clientStats.favoriteServiceType && (
            <div className="mt-4 bg-white/10 rounded-lg p-3">
              <p className="text-sm text-green-100">Servicio más frecuente:</p>
              <p className="font-semibold">{clientStats.favoriteServiceType}</p>
            </div>
          )}
        </div>
      )}

      {/* Lista de servicios */}
      {historyLoading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Cargando historial de servicios...</span>
          </div>
        </div>
      ) : historyError ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-center text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            <span>{historyError}</span>
          </div>
        </div>
      ) : serviceHistoryRecords.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {serviceHistoryRecords.map((record) => {
              const statusIcon = record.status === 'completed' ? CheckCircleIcon : ClockIcon;
              const statusColor = record.status === 'completed' ? 'text-green-400' : 'text-yellow-400';
              
              return (
                <li key={record.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {React.createElement(statusIcon, { className: `h-6 w-6 ${statusColor}` })}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {record.serviceName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {record.vehicleName} • {record.vehiclePlate}
                          </p>
                          {record.serviceDescription && (
                            <p className="text-xs text-gray-400 mt-1">
                              {record.serviceDescription}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(record.servicePrice)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.date || record.createdAt).toLocaleDateString('es-ES')}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status === 'completed' ? 'Completado' :
                             record.status === 'pending' ? 'Pendiente' :
                             record.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {record.notes && (
                      <div className="mt-3 ml-10">
                        <p className="text-sm text-gray-600">
                          <strong>Notas:</strong> {record.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin historial de servicios</h3>
          <p className="text-gray-500">
            No se encontraron servicios completados para tu cuenta.
          </p>
        </div>
      )}
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
      case 'history': return renderHistoryTab();
      case 'payments': return renderPaymentsTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Alertas de solicitud de firma pendiente */}
        {state.user?.id && (
          <SignatureRequestAlerts
            clienteId={state.user.id}
            onSignatureRequestClick={handleSignatureRequestClick}
          />
        )}

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
                    {clientWorkOrders.filter(o => o.estado !== 'Completada' && o.estado !== 'Cerrada' && o.estado !== 'Cancelada').length}
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

      {/* Modal de firma de autorización */}
      {selectedSignatureRequest && (
        <ClientSignatureModal
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
            setSelectedSignatureRequest(null);
          }}
          signatureRequest={selectedSignatureRequest}
          clientName={state.user?.name || 'Cliente'}
          vehicleName="Vehículo" // This should come from the work order data
          onSigned={handleSignatureSigned}
        />
      )}
    </div>
  );
}
