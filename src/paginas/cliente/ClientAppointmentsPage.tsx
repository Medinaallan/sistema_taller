import { useState } from 'react';
import {
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, Button } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { mockVehicles } from '../../utilidades/mockData';

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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<AppointmentForm>({
    vehicleId: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    problem: '',
    priority: 'medium',
    contactPhone: '',
    additionalNotes: '',
  });

  const clientId = state.user?.id;
  const clientVehicles = mockVehicles.filter(vehicle => vehicle.clientId === clientId);

  const serviceTypes = [
    { id: 'maintenance', name: 'Mantenimiento Preventivo', icon: '' },
    { id: 'repair', name: 'Reparación', icon: '' },
    { id: 'diagnostic', name: 'Diagnóstico', icon: '' },
    { id: 'oil-change', name: 'Cambio de Aceite', icon: '' },
    { id: 'tire-service', name: 'Servicio de Llantas', icon: '' },
    { id: 'brake-service', name: 'Servicio de Frenos', icon: '' },
    { id: 'battery', name: 'Batería', icon: '' },
    { id: 'air-conditioning', name: 'Aire Acondicionado', icon: '' },
    { id: 'transmission', name: 'Transmisión', icon: '' },
    { id: 'other', name: 'Otro', icon: '' },
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const priorityLevels = [
    { value: 'low', label: 'Baja', color: 'text-green-600', description: 'Mantenimiento rutinario' },
    { value: 'medium', label: 'Media', color: 'text-yellow-600', description: 'Servicio normal' },
    { value: 'high', label: 'Alta', color: 'text-orange-600', description: 'Problema importante' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-600', description: 'Emergencia vial' },
  ];

  const handleInputChange = (field: keyof AppointmentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    // Simular envío de la solicitud
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      
      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        setSubmitStatus('idle');
        setShowForm(false);
        setFormData({
          vehicleId: '',
          serviceType: '',
          preferredDate: '',
          preferredTime: '',
          problem: '',
          priority: 'medium',
          contactPhone: '',
          additionalNotes: '',
        });
      }, 3000);
    } catch {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Mínimo mañana
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Máximo 30 días
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Solicitar Cita</h1>
        <p className="text-gray-600">Programa el mantenimiento de tus vehículos</p>
      </div>

      {!showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de Servicios */}
          <Card title="Servicios Disponibles" subtitle="Tipos de mantenimiento que ofrecemos">
            <div className="grid grid-cols-2 gap-3">
              {serviceTypes.map((service) => (
                <div key={service.id} className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{service.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Horarios y Política */}
          <Card title="Información del Servicio" subtitle="Horarios y políticas de citas">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Horarios de Atención</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Lunes - Viernes:</span>
                    <span>8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábados:</span>
                    <span>8:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domingos:</span>
                    <span>Cerrado</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Política de Citas</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Las citas deben programarse con al menos 24 horas de anticipación</li>
                  <li>• Servicios urgentes serán atendidos según disponibilidad</li>
                  <li>• Confirmación por teléfono dentro de 2 horas</li>
                  <li>• Cancelaciones con al menos 4 horas de anticipación</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Servicios de Emergencia</p>
                    <p className="text-sm text-blue-700">
                      Para emergencias viales, contáctanos directamente al +504 2234-5678
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Botón para Solicitar Cita */}
          <div className="lg:col-span-2">
            <Card>
              <div className="text-center py-8">
                <CalendarIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  ¿Listo para programar tu cita?
                </h3>
                <p className="text-gray-600 mb-6">
                  Selecciona el vehículo, tipo de servicio y horario que mejor te convenga
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  disabled={clientVehicles.length === 0}
                  className="px-8 py-3"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Solicitar Cita
                </Button>
                {clientVehicles.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Necesitas tener al menos un vehículo registrado para solicitar una cita
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card title="Nueva Solicitud de Cita" subtitle="Completa la información para programar tu servicio">
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-green-800 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-green-700 mb-4">
                  Tu solicitud de cita ha sido recibida. Te contactaremos dentro de 2 horas para confirmar.
                </p>
                <p className="text-sm text-gray-600">
                  También puedes llamarnos al +504 2234-5678 si tienes preguntas urgentes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de Vehículo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehículo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona un vehículo</option>
                    {clientVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.licensePlate}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Servicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Servicio <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona el tipo de servicio</option>
                    {serviceTypes.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.icon} {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción del Problema */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Problema <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.problem}
                    onChange={(e) => handleInputChange('problem', e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe en detalle el problema o el servicio que necesitas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Fecha y Hora Preferida */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Preferida <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      min={getTodayDate()}
                      max={getMaxDate()}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora Preferida <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecciona la hora</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad del Servicio
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {priorityLevels.map((priority) => (
                      <label key={priority.value} className="cursor-pointer">
                        <input
                          type="radio"
                          value={priority.value}
                          checked={formData.priority === priority.value}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-3 border-2 rounded-lg text-center transition-all ${
                          formData.priority === priority.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className={`text-sm font-medium ${priority.color}`}>
                            {priority.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {priority.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Teléfono de Contacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de Contacto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    required
                    placeholder="+504 9789-6227"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notas Adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    rows={3}
                    placeholder="Información adicional, preferencias de horario, instrucciones especiales..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Botones */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                    disabled={submitStatus === 'submitting'}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitStatus === 'submitting'}
                    className="flex items-center justify-center"
                  >
                    {submitStatus === 'submitting' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Solicitar Cita
                      </>
                    )}
                  </Button>
                </div>

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-red-800 text-sm">
                        Hubo un error al enviar la solicitud. Por favor, inténtalo de nuevo o contáctanos directamente.
                      </p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
