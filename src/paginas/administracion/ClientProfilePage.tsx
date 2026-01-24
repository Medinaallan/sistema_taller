import { useState, useMemo, useEffect } from 'react';
import { 
  Card, Button, Select, Badge, Modal, Tabs, Tab
} from '../../componentes/comunes/UI';
import { 
  UserIcon, 
  TruckIcon, 
  WrenchScrewdriverIcon, 
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import useInterconnectedData from '../../contexto/useInterconnectedData';
import { formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import { useClientesFromAPI } from '../../hooks/useClientesFromAPI';
import { useApp } from '../../contexto/useApp';
import { showSuccess } from '../../utilidades/sweetAlertHelpers';

export function ClientProfilePage() {
  const data = useInterconnectedData();
  const { state, dispatch } = useApp();
  
  // 🔥 Cargar clientes desde la API
  const { 
    clientes, 
    clientesLegacy, 
    loading: loadingClientes, 
    error: errorClientes,
    count
  } = useClientesFromAPI();
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'create-appointment' | 'create-quotation' | 'new-work-order'>('create-appointment');
  
  // 🔥 Estados para datos relacionados del cliente
  const [vehiclesData, setVehiclesData] = useState<any[]>([]);
  const [workOrdersData, setWorkOrdersData] = useState<any[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [quotationsData, setQuotationsData] = useState<any[]>([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);

  // 🔥 Actualizar el estado global con los clientes cargados
  useEffect(() => {
    if (clientesLegacy && clientesLegacy.length > 0) {
      console.log('✅ ClientProfilePage: Actualizando estado con', clientesLegacy.length, 'clientes');
      dispatch({ type: 'SET_CLIENTS', payload: clientesLegacy });
    }
  }, [clientesLegacy, dispatch]);

  // 🔥 Cargar datos relacionados cuando se selecciona un cliente
  useEffect(() => {
    const loadClientRelatedData = async () => {
      if (!selectedClientId) {
        setVehiclesData([]);
        setWorkOrdersData([]);
        setAppointmentsData([]);
        setQuotationsData([]);
        return;
      }

      setLoadingRelatedData(true);
      console.log('🔄 Cargando datos relacionados para cliente:', selectedClientId);

      try {
        // Cargar vehículos
        const vehiclesResponse = await fetch(`http://localhost:8080/api/vehicles/client/${selectedClientId}`);
        const vehiclesResult = await vehiclesResponse.json();
        if (vehiclesResult.success && vehiclesResult.data) {
          console.log('✅ Vehículos cargados:', vehiclesResult.data.length);
          setVehiclesData(vehiclesResult.data);
          
          // Actualizar estado global
          const mappedVehicles = vehiclesResult.data.map((v: any) => ({
            id: v.vehiculo_id?.toString(),
            clientId: selectedClientId,
            brand: v.marca,
            model: v.modelo,
            year: v.anio,
            plate: v.placa,
            color: v.color,
            vin: v.vin || '',
            mileage: v.kilometraje || 0
          }));
          dispatch({ type: 'SET_VEHICLES', payload: mappedVehicles });
        }

        // Cargar órdenes de trabajo
        const ordersResponse = await fetch(`http://localhost:8080/api/work-orders/client/${selectedClientId}`);
        const ordersResult = await ordersResponse.json();
        if (ordersResult.success && ordersResult.data) {
          console.log('✅ Órdenes de trabajo cargadas:', ordersResult.data.length);
          setWorkOrdersData(ordersResult.data);
          
          // Actualizar estado global
          const mappedOrders = ordersResult.data.map((wo: any) => ({
            id: wo.ot_id?.toString(),
            clientId: selectedClientId,
            vehicleId: wo.vehiculo_id?.toString(),
            status: wo.estado || 'pendiente',
            createdAt: wo.fecha_creacion || new Date(),
            description: wo.descripcion || ''
          }));
          dispatch({ type: 'SET_WORK_ORDERS', payload: mappedOrders });
        }

        // Cargar citas
        const appointmentsResponse = await fetch(`http://localhost:8080/api/appointments`);
        const appointmentsResult = await appointmentsResponse.json();
        if (appointmentsResult.success && appointmentsResult.data) {
          const clientAppointments = appointmentsResult.data.filter((a: any) => 
            a.cliente_id?.toString() === selectedClientId
          );
          console.log('✅ Citas cargadas:', clientAppointments.length);
          setAppointmentsData(clientAppointments);
          
          // Actualizar estado global
          const mappedAppointments = clientAppointments.map((app: any) => ({
            id: app.cita_id?.toString(),
            clientId: selectedClientId,
            vehicleId: app.vehiculo_id?.toString(),
            date: app.fecha,
            status: app.estado || 'scheduled'
          }));
          dispatch({ type: 'SET_APPOINTMENTS', payload: mappedAppointments });
        }

        // Cargar cotizaciones
        const quotationsResponse = await fetch(`http://localhost:8080/api/quotations/client/${selectedClientId}`);
        const quotationsResult = await quotationsResponse.json();
        if (quotationsResult.success && quotationsResult.data) {
          console.log('✅ Cotizaciones cargadas:', quotationsResult.data.length);
          setQuotationsData(quotationsResult.data);
          
          // Actualizar estado global
          const mappedQuotations = quotationsResult.data.map((q: any) => ({
            id: q.cotizacion_id?.toString(),
            clientId: selectedClientId,
            vehicleId: q.vehiculo_id?.toString(),
            total: q.total || 0,
            status: q.estado || 'pending',
            createdAt: q.fecha_creacion || new Date()
          }));
          dispatch({ type: 'SET_QUOTATIONS', payload: mappedQuotations });
        }

      } catch (error) {
        console.error('❌ Error cargando datos relacionados:', error);
      } finally {
        setLoadingRelatedData(false);
      }
    };

    loadClientRelatedData();
  }, [selectedClientId, dispatch]);

  const selectedClient = selectedClientId ? data.getClientById(selectedClientId) : null;
  
  // Obtener todos los datos relacionados del cliente
  const clientData = useMemo(() => {
    if (!selectedClientId) return null;

    const vehicles = data.getVehiclesByClient(selectedClientId);
    const workOrders = data.getWorkOrdersByClient(selectedClientId);
    const invoices = data.getInvoicesByClient(selectedClientId);
    const appointments = data.getAppointmentsByClient(selectedClientId);
    const quotations = data.getQuotationsByClient(selectedClientId);
    const financialStatus = data.getClientFinancialStatus(selectedClientId);

    // Análisis avanzado
    const recentActivity = [
      ...workOrders.map(wo => ({ ...wo, type: 'work-order', date: wo.createdAt })),
      ...appointments.map(app => ({ ...app, type: 'appointment', date: app.date })),
      ...invoices.map(inv => ({ ...inv, type: 'invoice', date: inv.date })),
      ...quotations.map(q => ({ ...q, type: 'quotation', date: q.createdAt }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    const monthlySpending = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, inv) => {
        const month = inv.date.toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + inv.total;
        return acc;
      }, {} as Record<string, number>);

    const vehicleStats = vehicles.map(vehicle => {
      const vehicleWorkOrders = data.getWorkOrdersByVehicle(vehicle.id);
      const vehicleAppointments = data.getAppointmentsByVehicle(vehicle.id);
      const vehicleInvoices = invoices.filter(inv => 
        workOrders.some(wo => wo.vehicleId === vehicle.id && wo.id === inv.workOrderId)
      );
      
      return {
        ...vehicle,
        workOrdersCount: vehicleWorkOrders.length,
        appointmentsCount: vehicleAppointments.length,
        totalSpent: vehicleInvoices.reduce((sum, inv) => sum + inv.total, 0),
        lastService: vehicleWorkOrders
          .filter(wo => wo.status === 'completed')
          .sort((a, b) => new Date(b.actualCompletionDate || b.createdAt).getTime() - new Date(a.actualCompletionDate || a.createdAt).getTime())[0]
      };
    });

    return {
      vehicles,
      workOrders,
      invoices,
      appointments,
      quotations,
      financialStatus,
      recentActivity,
      monthlySpending,
      vehicleStats
    };
  }, [selectedClientId, data, state.vehicles, state.workOrders, state.appointments, state.quotations, state.invoices]);

  const handleCompleteWorkOrder = (workOrderId: string) => {
    data.completeWorkOrderWithInvoice(workOrderId);
    showSuccess('Orden de trabajo completada y factura generada automáticamente!');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-appointment':
        setActionType('create-appointment');
        setIsActionModalOpen(true);
        break;
      case 'create-quotation':
        setActionType('create-quotation');
        setIsActionModalOpen(true);
        break;
      case 'new-work-order':
        setActionType('new-work-order');
        setIsActionModalOpen(true);
        break;
      case 'call-client':
        if (selectedClient?.phone) {
          window.open(`tel:${selectedClient.phone}`);
        }
        break;
      case 'email-client':
        if (selectedClient?.email) {
          window.open(`mailto:${selectedClient.email}`);
        }
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil Completo del Cliente</h1>
          <p className="text-gray-600">Vista 360° de toda la información y actividad del cliente</p>
        </div>
        {selectedClient && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleQuickAction('call-client')}
              className="flex items-center space-x-2"
            >
              <PhoneIcon className="h-4 w-4" />
              <span>Llamar</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction('email-client')}
              className="flex items-center space-x-2"
            >
              <EnvelopeIcon className="h-4 w-4" />
              <span>Email</span>
            </Button>
            <Button
              onClick={() => handleQuickAction('create-appointment')}
              className="flex items-center space-x-2"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Nueva Cita</span>
            </Button>
          </div>
        )}
      </div>

      {/* Selector de Cliente */}
      <Card>
        <h3 className="text-lg font-medium mb-4">Seleccionar Cliente</h3>
        
        {loadingClientes ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        ) : errorClientes ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error al cargar clientes: {errorClientes}</p>
          </div>
        ) : data.clients.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">No hay clientes registrados en el sistema.</p>
          </div>
        ) : (
          <Select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            options={[
              { value: '', label: 'Selecciona un cliente para ver su perfil completo...' },
              ...data.clients.map(client => ({
                value: client.id,
                label: `${client.name} - ${client.email} - ${client.phone}`
              }))
            ]}
          />
        )}
        
        {!loadingClientes && !errorClientes && data.clients.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {count} cliente{count !== 1 ? 's' : ''} disponible{count !== 1 ? 's' : ''}
          </p>
        )}
      </Card>

      {/* Indicador de carga de datos relacionados */}
      {selectedClientId && loadingRelatedData && (
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando información del cliente...</p>
            <p className="text-sm text-gray-500 mt-1">Obteniendo vehículos, órdenes, citas y cotizaciones...</p>
          </div>
        </Card>
      )}

      {selectedClient && clientData && !loadingRelatedData && (
        <>
          {/* Header del Cliente */}
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedClient.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{selectedClient.phone}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{selectedClient.email}</span>
                    </span>
                    {selectedClient.address && (
                      <span className="flex items-center space-x-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{selectedClient.address}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliente desde: {formatDate(selectedClient.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Estado del Cliente */}
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {clientData.financialStatus.pendingDebt > 0 ? (
                    <Badge variant="warning">Deuda Pendiente</Badge>
                  ) : (
                    <Badge variant="success">Al Día</Badge>
                  )}
                  <Badge variant="primary">
                    {clientData.vehicles.length} Vehículo{clientData.vehicles.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Métricas Principales */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <div className="text-center">
                <TruckIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{clientData.vehicles.length}</div>
                <div className="text-xs text-blue-500">Vehículos</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <WrenchScrewdriverIcon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{clientData.workOrders.length}</div>
                <div className="text-xs text-purple-500">Órdenes</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <DocumentTextIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{clientData.invoices.length}</div>
                <div className="text-xs text-green-500">Facturas</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <CalendarDaysIcon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{clientData.appointments.length}</div>
                <div className="text-xs text-orange-500">Citas</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-xl font-bold text-yellow-600">
                  {formatCurrency(clientData.financialStatus.totalSpent)}
                </div>
                <div className="text-xs text-yellow-500">Total Gastado</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <ChartBarIcon className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className={`text-xl font-bold ${clientData.financialStatus.pendingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(clientData.financialStatus.pendingDebt)}
                </div>
                <div className={`text-xs ${clientData.financialStatus.pendingDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {clientData.financialStatus.pendingDebt > 0 ? 'Deuda' : 'Sin Deuda'}
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs para organizar la información */}
          <Card>
            <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
              <Tab id="overview" label="Resumen General" />
              <Tab id="vehicles" label="Vehículos" />
              <Tab id="work-orders" label="Órdenes de Trabajo" />
              <Tab id="financial" label="Información Financiera" />
              <Tab id="appointments" label="Citas y Servicios" />
              <Tab id="activity" label="Actividad Reciente" />
            </Tabs>

            <div className="mt-6">
              {/* Tab: Resumen General */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información Personal */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Información Personal</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                        <dd className="text-sm text-gray-900">{selectedClient.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                        <dd className="text-sm text-gray-900">{selectedClient.phone}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{selectedClient.email}</dd>
                      </div>
                      {selectedClient.address && (
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                          <dd className="text-sm text-gray-900">{selectedClient.address}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Cliente desde</dt>
                        <dd className="text-sm text-gray-900">{formatDate(selectedClient.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Resumen de Actividad */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Resumen de Actividad</h3>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TruckIcon className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Vehículos Registrados</span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">{clientData.vehicles.length}</span>
                        </div>
                        {clientData.vehicleStats.length > 0 && (
                          <div className="mt-2 text-xs text-blue-700">
                            Último servicio: {clientData.vehicleStats[0].lastService ? 
                              formatDate(clientData.vehicleStats[0].lastService.actualCompletionDate || clientData.vehicleStats[0].lastService.createdAt) : 
                              'Nunca'
                            }
                          </div>
                        )}
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <WrenchScrewdriverIcon className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">Órdenes de Trabajo</span>
                          </div>
                          <span className="text-lg font-bold text-purple-600">{clientData.workOrders.length}</span>
                        </div>
                        <div className="mt-2 flex space-x-4 text-xs">
                          <span className="text-green-700">
                            Completadas: {clientData.workOrders.filter(wo => wo.status === 'completed').length}
                          </span>
                          <span className="text-orange-700">
                            Activas: {clientData.workOrders.filter(wo => wo.status !== 'completed').length}
                          </span>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Situación Financiera</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(clientData.financialStatus.totalSpent)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-green-700">
                          {clientData.financialStatus.pendingDebt > 0 ? (
                            <span className="text-red-700">
                              Deuda: {formatCurrency(clientData.financialStatus.pendingDebt)}
                            </span>
                          ) : (
                            <span>Sin deudas pendientes</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Vehículos */}
              {activeTab === 'vehicles' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Vehículos del Cliente</h3>
                    <Button 
                      onClick={() => handleQuickAction('new-work-order')}
                      className="flex items-center space-x-2"
                    >
                      <WrenchScrewdriverIcon className="h-4 w-4" />
                      <span>Nueva Orden</span>
                    </Button>
                  </div>
                  
                  {clientData.vehicleStats.map(vehicle => (
                    <div key={vehicle.id} className="border rounded-lg p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Información del Vehículo */}
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 mb-2">
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                          </h4>
                          <dl className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Placa:</dt>
                              <dd className="font-medium">{vehicle.licensePlate}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Color:</dt>
                              <dd className="font-medium">{vehicle.color}</dd>
                            </div>
                            {vehicle.mileage && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Kilometraje:</dt>
                                <dd className="font-medium">{vehicle.mileage.toLocaleString()} km</dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        {/* Estadísticas del Vehículo */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Estadísticas</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 p-3 rounded text-center">
                              <div className="text-lg font-bold text-blue-600">{vehicle.workOrdersCount}</div>
                              <div className="text-xs text-blue-500">Órdenes</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded text-center">
                              <div className="text-lg font-bold text-green-600">{vehicle.appointmentsCount}</div>
                              <div className="text-xs text-green-500">Citas</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded text-center col-span-2">
                              <div className="text-lg font-bold text-purple-600">
                                {formatCurrency(vehicle.totalSpent)}
                              </div>
                              <div className="text-xs text-purple-500">Total Gastado</div>
                            </div>
                          </div>
                        </div>

                        {/* Último Servicio */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Último Servicio</h5>
                          {vehicle.lastService ? (
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm font-medium">{vehicle.lastService.description}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(vehicle.lastService.actualCompletionDate || vehicle.lastService.createdAt)}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                {formatCurrency(vehicle.lastService.totalCost)}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 p-3 rounded text-center">
                              <ClockIcon className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                              <p className="text-xs text-yellow-700">Sin servicios registrados</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Órdenes de Trabajo */}
              {activeTab === 'work-orders' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Historial de Órdenes de Trabajo</h3>
                    <div className="flex space-x-2">
                      <Badge variant="warning">
                        En Progreso: {clientData.workOrders.filter(wo => wo.status === 'in-progress').length}
                      </Badge>
                      <Badge variant="default">
                        Pendientes: {clientData.workOrders.filter(wo => wo.status === 'pending').length}
                      </Badge>
                    </div>
                  </div>
                  
                  {clientData.workOrders.map(order => {
                    const vehicle = data.getVehicleById(order.vehicleId);
                    return (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">#{order.id.slice(-6)}</h4>
                              <Badge 
                                variant={
                                  order.status === 'completed' ? 'success' : 
                                  order.status === 'in-progress' ? 'warning' : 
                                  'default'
                                }
                                size="sm"
                              >
                                {order.status === 'pending' ? 'Pendiente' :
                                 order.status === 'in-progress' ? 'En Progreso' :
                                 'Completada'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-900 mb-1">{order.description}</p>
                            <p className="text-sm text-gray-600">
                              Vehículo: {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A'}
                            </p>
                            
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Mano de Obra:</span>
                                <span className="ml-1 font-medium">{formatCurrency(order.laborCost)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Repuestos:</span>
                                <span className="ml-1 font-medium">{formatCurrency(order.partsCost)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Total:</span>
                                <span className="ml-1 font-bold text-green-600">{formatCurrency(order.totalCost)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Fecha:</span>
                                <span className="ml-1">{order.startDate ? formatDate(order.startDate) : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            {order.status === 'in-progress' && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteWorkOrder(order.id)}
                                className="flex items-center space-x-1"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                <span>Completar</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {clientData.workOrders.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Este cliente no tiene órdenes de trabajo registradas.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Información Financiera */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <div className="text-center p-4">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(clientData.financialStatus.totalSpent)}
                        </div>
                        <div className="text-sm text-green-500">Total Gastado</div>
                      </div>
                    </Card>
                    
                    <Card>
                      <div className="text-center p-4">
                        <ExclamationTriangleIcon className={`h-8 w-8 mx-auto mb-2 ${
                          clientData.financialStatus.pendingDebt > 0 ? 'text-red-600' : 'text-green-600'
                        }`} />
                        <div className={`text-2xl font-bold ${
                          clientData.financialStatus.pendingDebt > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(clientData.financialStatus.pendingDebt)}
                        </div>
                        <div className={`text-sm ${
                          clientData.financialStatus.pendingDebt > 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {clientData.financialStatus.pendingDebt > 0 ? 'Deuda Pendiente' : 'Sin Deudas'}
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <div className="text-center p-4">
                        <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{clientData.financialStatus.invoicesCount}</div>
                        <div className="text-sm text-blue-500">Total Facturas</div>
                      </div>
                    </Card>
                  </div>

                  {/* Facturas */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Historial de Facturas</h3>
                    <div className="space-y-3">
                      {clientData.invoices.map(invoice => {
                        const payments = data.getPaymentsByInvoice(invoice.id);
                        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                        return (
                          <div key={invoice.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">Factura #{invoice.invoiceNumber}</h4>
                                  <Badge
                                    variant={
                                      invoice.status === 'paid' ? 'success' :
                                      invoice.status === 'pending' ? 'warning' : 'danger'
                                    }
                                    size="sm"
                                  >
                                    {invoice.status === 'paid' ? 'Pagada' :
                                     invoice.status === 'pending' ? 'Pendiente' : 'Vencida'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Fecha: {formatDate(invoice.date)}
                                </p>
                                {payments.length > 0 && (
                                  <p className="text-sm text-green-600">
                                    Pagado: {formatCurrency(totalPaid)} de {formatCurrency(invoice.total)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                                {invoice.status === 'pending' && (
                                  <p className="text-sm text-red-600">
                                    Pendiente: {formatCurrency(invoice.total - totalPaid)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Citas y Servicios */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Citas y Servicios</h3>
                    <Button 
                      onClick={() => handleQuickAction('create-appointment')}
                      className="flex items-center space-x-2"
                    >
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>Agendar Cita</span>
                    </Button>
                  </div>

                  {/* Citas */}
                  <div>
                    <h4 className="font-medium mb-3">Citas Programadas</h4>
                    {clientData.appointments.map(appointment => {
                      const vehicle = data.getVehicleById(appointment.vehicleId);
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4 mb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {formatDate(appointment.date)} - {appointment.time}
                                </span>
                                <Badge
                                  variant={
                                    appointment.status === 'confirmed' ? 'success' :
                                    appointment.status === 'pending' ? 'warning' :
                                    appointment.status === 'completed' ? 'primary' : 'danger'
                                  }
                                  size="sm"
                                >
                                  {appointment.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Vehículo: {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}
                              </p>
                              {appointment.notes && (
                                <p className="text-sm text-gray-500 mt-1">{appointment.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cotizaciones */}
                  <div>
                    <h4 className="font-medium mb-3">Cotizaciones</h4>
                    {clientData.quotations.map(quotation => {
                      const vehicle = data.getVehicleById(quotation.vehicleId);
                      return (
                        <div key={quotation.id} className="border rounded-lg p-4 mb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                                <span className="font-medium">Cotización #{quotation.id.slice(-6)}</span>
                                <Badge
                                  variant={
                                    quotation.status === 'approved' ? 'success' :
                                    quotation.status === 'pending' ? 'warning' :
                                    quotation.status === 'sent' ? 'primary' : 'danger'
                                  }
                                  size="sm"
                                >
                                  {quotation.status === 'sent' ? 'Enviada a Cliente' : quotation.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Vehículo: {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(quotation.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(quotation.total)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Actividad Reciente */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Actividad Reciente</h3>
                  <div className="space-y-3">
                    {clientData.recentActivity.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              {activity.type === 'work-order' && <WrenchScrewdriverIcon className="h-4 w-4 text-purple-600" />}
                              {activity.type === 'appointment' && <CalendarDaysIcon className="h-4 w-4 text-blue-600" />}
                              {activity.type === 'invoice' && <DocumentTextIcon className="h-4 w-4 text-green-600" />}
                              {activity.type === 'quotation' && <DocumentTextIcon className="h-4 w-4 text-orange-600" />}
                              <span className="font-medium text-sm">
                                {activity.type === 'work-order' ? 'Orden de Trabajo' :
                                 activity.type === 'appointment' ? 'Cita' :
                                 activity.type === 'invoice' ? 'Factura' :
                                 'Cotización'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.type === 'work-order' ? (activity as any).description :
                               activity.type === 'appointment' ? `Cita programada - ${(activity as any).time}` :
                               activity.type === 'invoice' ? `Factura #${(activity as any).invoiceNumber}` :
                               `Cotización #${activity.id.slice(-6)}`}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{formatDate(activity.date)}</p>
                            {(activity as any).total && (
                              <p className="font-medium text-green-600">
                                {formatCurrency((activity as any).total || (activity as any).totalCost)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <h3 className="text-lg font-medium mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => handleQuickAction('create-appointment')}
                className="flex items-center justify-center space-x-2 py-3"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                <span>Agendar Cita</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickAction('create-quotation')}
                className="flex items-center justify-center space-x-2 py-3"
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span>Nueva Cotización</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickAction('new-work-order')}
                className="flex items-center justify-center space-x-2 py-3"
              >
                <WrenchScrewdriverIcon className="h-5 w-5" />
                <span>Nueva Orden</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickAction('call-client')}
                className="flex items-center justify-center space-x-2 py-3"
              >
                <PhoneIcon className="h-5 w-5" />
                <span>Llamar Cliente</span>
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Modal para Acciones Rápidas */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={
          actionType === 'create-appointment' ? 'Agendar Nueva Cita' :
          actionType === 'create-quotation' ? 'Crear Nueva Cotización' :
          'Crear Nueva Orden de Trabajo'
        }
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Función en desarrollo. Esta acción se integrará con el backend.
          </p>
          <p className="text-sm text-gray-500">
            Cliente seleccionado: <strong>{selectedClient?.name}</strong>
          </p>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsActionModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ClientProfilePage;
