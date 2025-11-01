import { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  TruckIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';

import { servicesService, vehiclesService, appointmentsService } from '../../servicios/apiService';

interface Appointment {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  problem: string;
  contactPhone: string;
  notes?: string;
  createdDate: string;
}

interface AppointmentForm {
  vehicleId: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  problem: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactPhone: string;
  additionalNotes: string;
}

export function ClientAppointmentsPage() {
  const { state } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [clientVehicles, setClientVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [formData, setFormData] = useState<AppointmentForm>({
    vehicleId: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    problem: '',
    priority: 'medium',
    contactPhone: state.user?.phone || '',
    additionalNotes: '',
  });

  // useEffect para cargar servicios desde la API
  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      try {
        const response = await servicesService.getAll();
        if (response.success && response.data) {
          // Mapear los servicios del CSV al formato esperado
          const mappedServices = response.data.map((service: any) => ({
            id: service.id || service.codigo,
            name: service.nombre || service.name,
            description: service.descripcion || service.description || 'Servicio disponible',
            precio: service.precio || 0,
            categoria: service.categoria || 'general'
          }));
          
          // Si no hay servicios en el CSV, usar servicios básicos
          if (mappedServices.length === 0) {
            setServiceTypes([
              { id: 'maintenance', name: 'Mantenimiento Preventivo', description: 'Servicio rutinario programado'},
              { id: 'diagnostic', name: 'Diagnóstico', description: 'Revisión y detección de problemas'},
              { id: 'repair', name: 'Reparación', description: 'Arreglo de componentes específicos'},
              { id: 'other', name: 'Otro', description: 'Otro tipo de servicio'}
            ]);
          } else {
            setServiceTypes(mappedServices);
          }
        } else {
          console.error('Error cargando servicios:', response.message);
          // Mantener algunos servicios básicos como fallback
          setServiceTypes([
            { id: 'maintenance', name: 'Mantenimiento Preventivo', description: 'Servicio rutinario programado'},
            { id: 'diagnostic', name: 'Diagnóstico', description: 'Revisión y detección de problemas'},
            { id: 'repair', name: 'Reparación', description: 'Arreglo de componentes específicos'},
            { id: 'other', name: 'Otro', description: 'Otro tipo de servicio'}
          ]);
        }
      } catch (error) {
        console.error('Error cargando servicios:', error);
        // Servicios básicos como fallback
        setServiceTypes([
          { id: 'maintenance', name: 'Mantenimiento Preventivo', description: 'Servicio rutinario programado'},
          { id: 'diagnostic', name: 'Diagnóstico', description: 'Revisión y detección de problemas'},
          { id: 'repair', name: 'Reparación', description: 'Arreglo de componentes específicos'},
          { id: 'other', name: 'Otro', description: 'Otro tipo de servicio'}
        ]);
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  // useEffect para cargar vehículos del cliente desde la API
  useEffect(() => {
    const loadClientVehicles = async () => {
      if (!state?.user?.id) return;
      
      setLoadingVehicles(true);
      try {
        const response = await vehiclesService.getAll();
        if (response.success && response.data) {
          // Filtrar solo los vehículos del cliente actual
          const userVehicles = response.data
            .filter((vehicle: any) => vehicle.clienteId === state.user?.id)
            .map((vehicle: any) => ({
              id: vehicle.id,
              brand: vehicle.marca,
              model: vehicle.modelo,
              year: parseInt(vehicle.año),
              color: vehicle.color,
              licensePlate: vehicle.placa,
              vin: vehicle.vin || '',
              mileage: parseInt(vehicle.mileage) || 0
            }));
          setClientVehicles(userVehicles);
        } else {
          console.error('Error cargando vehículos:', response.message);
          setClientVehicles([]);
        }
      } catch (error) {
        console.error('Error cargando vehículos:', error);
        setClientVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadClientVehicles();
  }, [state?.user?.id]);

  // useEffect para cargar citas del cliente desde la API
  useEffect(() => {
    const loadClientAppointments = async () => {
      if (!state?.user?.id) return;
      
      setLoadingAppointments(true);
      try {
        const response = await appointmentsService.getAll();
        if (response.success && response.data) {
          // Filtrar solo las citas del cliente actual y mapear a formato frontend
          const userAppointments = response.data
            .filter((appointment: any) => appointment.clienteId === state.user?.id)
            .map((appointment: any) => {
              // Encontrar el vehículo correspondiente
              const vehicle = clientVehicles.find(v => v.id === appointment.vehiculoId);
              const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : appointment.vehiculoId;
              
              // Parsear las notas que vienen como JSON string
              let problemText = 'Sin descripción';
              let notesText = '';
              try {
                const notesData = JSON.parse(appointment.notas?.replace(/^"|"$/g, '') || '{}');
                problemText = notesData.problem || 'Sin descripción';
                notesText = notesData.additionalNotes || '';
              } catch (e) {
                problemText = appointment.notas?.replace(/^"|"$/g, '') || 'Sin descripción';
              }

              // Encontrar el servicio correspondiente
              const service = serviceTypes.find(s => s.id === appointment.servicio);
              const serviceName = service ? service.name : 'Servicio no especificado';

              return {
                id: appointment.id,
                vehicleId: appointment.vehiculoId,
                vehicleName: vehicleName,
                serviceType: serviceName,
                date: appointment.fecha,
                time: appointment.hora,
                status: appointment.estado as any,
                priority: 'medium' as any, // Default priority desde notas si está disponible
                problem: problemText,
                contactPhone: state.user?.phone || '',
                notes: notesText,
                createdDate: appointment.fecha
              };
            });
          setAppointments(userAppointments);
        } else {
          console.error('Error cargando citas:', response.message);
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error cargando citas:', error);
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };

    // Solo cargar citas si ya tenemos los vehículos cargados
    if (clientVehicles.length >= 0) {
      loadClientAppointments();
    }
  }, [state?.user?.id, clientVehicles]);

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const filteredAppointments = appointments.filter(appointment => 
    activeFilter === 'all' || appointment.status === activeFilter
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Pendiente', icon: ClockIcon };
      case 'confirmed':
        return { color: 'bg-green-100 text-green-800 border-green-200', text: 'Confirmada', icon: CheckCircleIcon };
      case 'in-progress':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'En Proceso', icon: WrenchScrewdriverIcon };
      case 'completed':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Completada', icon: CheckCircleIcon };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800 border-red-200', text: 'Cancelada', icon: XMarkIcon };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status, icon: ClockIcon };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'low':
        return { color: 'text-green-600', text: 'Baja' };
      case 'medium':
        return { color: 'text-yellow-600', text: 'Media' };
      case 'high':
        return { color: 'text-orange-600', text: 'Alta' };
      case 'urgent':
        return { color: 'text-red-600', text: 'Urgente' };
      default:
        return { color: 'text-gray-600', text: priority };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state?.user?.id) {
      alert('No se puede agendar la cita: usuario no identificado');
      return;
    }

    if (!formData.vehicleId) {
      alert('Selecciona un vehículo antes de agendar la cita');
      return;
    }

    if (!formData.serviceType) {
      alert('Selecciona un tipo de servicio');
      return;
    }

    if (!formData.preferredDate || !formData.preferredTime) {
      alert('Selecciona fecha y hora preferida');
      return;
    }

    try {
      // Construir notas con información relevante
      const notas = JSON.stringify({
        problem: formData.problem,
        additionalNotes: formData.additionalNotes,
        priority: formData.priority,
        contactPhone: formData.contactPhone,
      });

      const payload = {
        clienteId: state.user.id,
        vehiculoId: formData.vehicleId,
        fecha: formData.preferredDate,
        hora: formData.preferredTime,
        servicio: formData.serviceType,
        estado: 'pending',
        notas,
      };

      const res = await appointmentsService.create(payload as any);
      if (res.success) {
        alert('Cita creada correctamente. El administrador la verá para confirmar.');
        
        // Agregar la nueva cita al estado local inmediatamente
        const vehicle = clientVehicles.find(v => v.id === formData.vehicleId);
        const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : formData.vehicleId;
        const serviceTypeName = serviceTypes.find(s => s.id === formData.serviceType)?.name || formData.serviceType;
        
        const newAppointment: Appointment = {
          id: res.data.id,
          vehicleId: formData.vehicleId,
          vehicleName: vehicleName,
          serviceType: serviceTypeName,
          date: formData.preferredDate,
          time: formData.preferredTime,
          status: 'pending',
          priority: formData.priority,
          problem: formData.problem,
          contactPhone: formData.contactPhone,
          notes: formData.additionalNotes,
          createdDate: formData.preferredDate
        };
        
        setAppointments(prev => [newAppointment, ...prev]);
        
        // cerrar modal y resetear
        setShowForm(false);
        setFormData({
          vehicleId: '',
          serviceType: '',
          preferredDate: '',
          preferredTime: '',
          problem: '',
          priority: 'medium',
          contactPhone: state.user?.phone || '',
          additionalNotes: '',
        });
      } else {
        console.error('Error creando cita:', res.message, res);
        alert('Error al crear la cita: ' + (res.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error creando cita:', error);
      alert('No se pudo conectar con el servidor al crear la cita');
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const statusConfig = getStatusConfig(appointment.status);
    const priorityConfig = getPriorityConfig(appointment.priority);
    const StatusIcon = statusConfig.icon;

    return (
      <div key={appointment.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
                <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{appointment.serviceType}</h3>
                <p className="text-sm text-gray-600 truncate">{appointment.vehicleName}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.text}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha</p>
              <p className="text-sm font-semibold text-gray-900">{appointment.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Hora</p>
              <p className="text-sm font-semibold text-gray-900">{appointment.time}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Problema Reportado</p>
            <p className="text-sm text-gray-700 line-clamp-2">{appointment.problem}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <span className="text-gray-500 mr-2">Prioridad:</span>
              <span className={`font-medium ${priorityConfig.color}`}>{priorityConfig.text}</span>
            </div>
            <div className="flex space-x-2">
              {appointment.status === 'pending' && (
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Confirmar
                </button>
              )}
              <button 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNewAppointmentForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Agendar Nueva Cita</h3>
                <p className="text-blue-100 text-sm">Programa tu próximo servicio</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Selección de vehículo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Selecciona tu vehículo *
            </label>
            {loadingVehicles ? (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 mb-2">Cargando tus vehículos...</p>
                <p className="text-sm text-gray-400">Por favor espera un momento</p>
              </div>
            ) : clientVehicles.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No tienes vehículos registrados</p>
                <p className="text-sm text-gray-400">Primero necesitas registrar un vehículo en tu perfil</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clientVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    onClick={() => setFormData({...formData, vehicleId: vehicle.id})}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.vehicleId === vehicle.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <TruckIcon className={`h-5 w-5 mr-3 ${
                        formData.vehicleId === vehicle.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vehicle.year} • {vehicle.licensePlate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tipo de servicio */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de servicio *
            </label>
            {loadingServices ? (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando servicios disponibles...</p>
              </div>
            ) : serviceTypes.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No hay servicios disponibles</p>
                <p className="text-sm text-gray-400">Contacta al administrador para configurar los servicios</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {serviceTypes.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setFormData({...formData, serviceType: service.id})}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.serviceType === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-3"></span>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fecha y hora preferida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha preferida *
              </label>
              <input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hora preferida *
              </label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona una hora</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Problema y prioridad */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe el problema o servicio necesario *
            </label>
            <textarea
              value={formData.problem}
              onChange={(e) => setFormData({...formData, problem: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe detalladamente el problema o el servicio que necesitas..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Baja - No es urgente</option>
                <option value="medium">Media - Normal</option>
                <option value="high">Alta - Importante</option>
                <option value="urgent">Urgente - Crítico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono de contacto *
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa tu número de teléfono"
                required
              />
            </div>
          </div>

          {/* Notas adicionales */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Información adicional que consideres importante..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header mejorado y responsivo */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
                  <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Mis Citas</h1>
                  <p className="text-indigo-100 text-sm sm:text-base lg:text-lg">Agenda y gestiona tus servicios</p>
                </div>
              </div>
              
              {/* Stats de citas responsivas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">{appointments.length}</div>
                  <div className="text-indigo-100 text-xs sm:text-sm">Total Citas</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">
                    {appointments.filter(a => a.status === 'pending').length}
                  </div>
                  <div className="text-indigo-100 text-xs sm:text-sm">Pendientes</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </div>
                  <div className="text-indigo-100 text-xs sm:text-sm">Confirmadas</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">
                    {appointments.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-indigo-100 text-xs sm:text-sm">Completadas</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-indigo-600 px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center shadow-lg w-full lg:w-auto"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Nueva Cita
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas', count: appointments.length },
              { key: 'pending', label: 'Pendientes', count: appointments.filter(a => a.status === 'pending').length },
              { key: 'confirmed', label: 'Confirmadas', count: appointments.filter(a => a.status === 'confirmed').length },
              { key: 'completed', label: 'Completadas', count: appointments.filter(a => a.status === 'completed').length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  activeFilter === filter.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
                <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de citas */}
        {loadingAppointments ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Cargando tus citas...
            </h3>
            <p className="text-gray-500 mb-8">
              Por favor espera mientras cargamos tu información
            </p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {filteredAppointments.map(renderAppointmentCard)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CalendarDaysIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeFilter === 'all' ? 'No tienes citas programadas' : `No hay citas ${activeFilter}`}
            </h3>
            <p className="text-gray-500 mb-8">
              Comienza agendando tu primera cita de servicio
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Agendar Primera Cita
            </button>
          </div>
        )}

        {/* Modal de nueva cita */}
        {showForm && renderNewAppointmentForm()}
      </div>
    </div>
  );
}
