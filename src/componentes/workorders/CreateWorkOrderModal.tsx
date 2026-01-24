import { useState, useEffect } from 'react';
import { Modal, Input, Select, TextArea, Button } from '../comunes/UI';
import { showError, showSuccess } from '../../utilidades/sweetAlertHelpers';
import workOrdersService, { type WorkOrderData } from '../../servicios/workOrdersService';
import { vehiclesService, appointmentsService } from '../../servicios/apiService';
import { useClientesFromAPI } from '../../hooks/useClientesFromAPI';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workOrder: WorkOrderData) => void;
}

interface FormData {
  cliente_id: string;
  vehiculo_id: string;
  cita_id: string;
  asesor_id: string;
  mecanico_encargado_id: string;
  odometro_ingreso: string;
  fecha_estimada: string;
  hora_estimada: string;
  notas_recepcion: string;
}

const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { clientes } = useClientesFromAPI();
  const [formData, setFormData] = useState<FormData>({
    cliente_id: '',
    vehiculo_id: '',
    cita_id: '',
    asesor_id: '',
    mecanico_encargado_id: '',
    odometro_ingreso: '',
    fecha_estimada: '',
    hora_estimada: '',
    notas_recepcion: ''
  });

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar usuario actual (asesor) desde localStorage
  useEffect(() => {
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      setFormData(prev => ({ ...prev, asesor_id: usuarioId }));
    }
  }, []);

  // Cargar mecánicos disponibles
  useEffect(() => {
    const loadMechanics = async () => {
      try {
        // Cargar usuarios del API
        const res = await fetch('/api/users');
        const response = await res.json();

        if (response.success && response.data) {
          // Filtrar usuarios con rol "mecanico" o similar
          const mechanicsFiltered = response.data.filter((user: any) => 
            user.rol?.toLowerCase().includes('mecanico') || 
            user.rol?.toLowerCase().includes('mechanic')
          );
          
          const mapped = mechanicsFiltered.map((m: any) => ({
            id: m.usuario_id || m.id,
            nombre: m.nombre_completo || m.name,
            correo: m.correo || m.email
          }));
          
          setMechanics(mapped);
          console.log('✅ Mecánicos cargados:', mapped);
        } else {
          console.warn('⚠️ No se encontraron mecánicos');
        }
      } catch (error) {
        console.error('❌ Error cargando mecánicos:', error);
      }
    };

    loadMechanics();
  }, []);

  // Cargar vehículos cuando se selecciona un cliente
  useEffect(() => {
    const loadVehicles = async () => {
      if (formData.cliente_id) {
        try {
          const response = await vehiclesService.getAll();
          if (response.success) {
            const clientVehicles = response.data.filter(
              (v: any) => String(v.cliente_id || v.clientId).trim() === formData.cliente_id.trim()
            );
            const mapped = clientVehicles.map((v: any) => ({
              id: v.vehiculo_id?.toString() || v.id,
              brand: v.marca,
              model: v.modelo,
              licensePlate: v.placa,
              year: v.anio
            }));
            setVehicles(mapped);
            setFormData(prev => ({ ...prev, vehiculo_id: '' }));
          }
        } catch (error) {
          console.error('Error cargando vehículos:', error);
        }
      } else {
        setVehicles([]);
      }
    };
    loadVehicles();
  }, [formData.cliente_id]);

  // Cargar citas cuando se selecciona un vehículo
  useEffect(() => {
    const loadAppointments = async () => {
      if (formData.vehiculo_id) {
        try {
          const response = await appointmentsService.getAll();
          if (response.success) {
            const vehicleAppointments = response.data.filter(
              (a: any) => String(a.vehiculo_id).trim() === formData.vehiculo_id.trim()
            );
            const mapped = vehicleAppointments.map((a: any) => ({
              id: a.cita_id,
              fecha: a.fecha_inicio,
              estado: a.estado
            }));
            setAppointments(mapped);
          }
        } catch (error) {
          console.error('Error cargando citas:', error);
        }
      } else {
        setAppointments([]);
      }
    };
    loadAppointments();
  }, [formData.vehiculo_id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Cliente es requerido';
    }
    if (!formData.vehiculo_id) {
      newErrors.vehiculo_id = 'Vehículo es requerido';
    }
    if (!formData.fecha_estimada) {
      newErrors.fecha_estimada = 'Fecha estimada es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const usuarioId = localStorage.getItem('usuario_id');
      
      const payload = {
        cliente_id: parseInt(formData.cliente_id),
        vehiculo_id: parseInt(formData.vehiculo_id),
        cita_id: formData.cita_id ? parseInt(formData.cita_id) : null,
        asesor_id: formData.asesor_id ? parseInt(formData.asesor_id) : null,
        mecanico_encargado_id: formData.mecanico_encargado_id ? parseInt(formData.mecanico_encargado_id) : null,
        odometro_ingreso: formData.odometro_ingreso ? parseFloat(formData.odometro_ingreso) : null,
        fecha_estimada: formData.fecha_estimada || null,
        hora_estimada: formData.hora_estimada || null,
        notas_recepcion: formData.notas_recepcion || null,
        registrado_por: usuarioId ? parseInt(usuarioId) : null
      };

      console.log('Enviando payload:', payload);

      // Usar el servicio para registrar la orden
      const result = await workOrdersService.registerWorkOrderManually(payload);

      console.log('Orden creada exitosamente:', result);

      // Crear objeto WorkOrderData para pasar al callback
      const newWorkOrder: WorkOrderData = {
        id: result.ot_id?.toString(),
        quotationId: undefined,
        appointmentId: formData.cita_id ? formData.cita_id : undefined,
        clienteId: formData.cliente_id,
        vehiculoId: formData.vehiculo_id,
        servicioId: '',
        descripcion: '',
        problema: formData.notas_recepcion || '',
        diagnostico: '',
        tipoServicio: 'corrective',
        fechaEstimadaCompletado: formData.fecha_estimada ? new Date(formData.fecha_estimada).toISOString() : undefined,
        fechaInicioReal: new Date().toISOString(),
        costoManoObra: 0,
        costoPartes: 0,
        costoTotal: 0,
        costoEstimado: 0,
        notas: formData.notas_recepcion || '',
        recomendaciones: '',
        estadoPago: 'pending',
        estado: 'pending',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };

      onSuccess(newWorkOrder);
      
      // Resetear formulario
      setFormData({
        cliente_id: '',
        vehiculo_id: '',
        cita_id: '',
        asesor_id: '',
        mecanico_encargado_id: '',
        odometro_ingreso: '',
        fecha_estimada: '',
        hora_estimada: '',
        notas_recepcion: ''
      });

      showSuccess(`Orden de trabajo creada exitosamente\n\nNúmero: ${result.numero_ot}\nID: ${result.ot_id}`);
      onClose();
    } catch (error) {
      console.error('Error creando orden:', error);
      showError('Error al crear la orden de trabajo: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clientes.map(c => ({
    value: (c.usuario_id).toString(),
    label: c.nombre_completo || c.correo
  }));

  const vehicleOptions = vehicles.map(v => ({
    value: v.id.toString(),
    label: `${v.brand} ${v.model} (${v.licensePlate}) - ${v.year}`
  }));

  const appointmentOptions = appointments.map(a => ({
    value: a.id.toString(),
    label: `${new Date(a.fecha).toLocaleDateString('es-ES')} - ${a.estado}`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Orden de Trabajo"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Información de Cliente y Vehículo */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Cliente *"
              value={formData.cliente_id}
              onChange={(e) => handleInputChange('cliente_id', e.target.value)}
              options={[{ value: '', label: 'Seleccionar cliente...' }, ...clientOptions]}
              error={errors.cliente_id}
              required
            />

            <Select
              label="Vehículo *"
              value={formData.vehiculo_id}
              onChange={(e) => handleInputChange('vehiculo_id', e.target.value)}
              options={[{ value: '', label: 'Seleccionar vehículo...' }, ...vehicleOptions]}
              error={errors.vehiculo_id}
              required
              disabled={!formData.cliente_id}
            />
          </div>
        </div>

        {/* Sección: Cita Asociada (opcional) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cita Asociada (Opcional)</h3>
          <Select
            label="Cita"
            value={formData.cita_id}
            onChange={(e) => handleInputChange('cita_id', e.target.value)}
            options={[{ value: '', label: 'Sin cita asociada' }, ...appointmentOptions]}
            disabled={!formData.vehiculo_id}
          />
        </div>

        {/* Sección: Asignación de Personal */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asignación de Personal</h3>
          <div className="space-y-4">
            {/* Asesor - automático desde usuario actual */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Asesor Asignado</p>
                  <p className="text-sm text-gray-600 mt-1">ID: {formData.asesor_id || 'No disponible'}</p>
                </div>
                <div className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mecánico - select de usuarios con rol mecánico */}
            <Select
              label="Mecánico a Cargo (Opcional)"
              value={formData.mecanico_encargado_id}
              onChange={(e) => handleInputChange('mecanico_encargado_id', e.target.value)}
              options={[
                { value: '', label: 'Sin asignar' },
                ...mechanics.map(m => ({
                  value: m.id.toString(),
                  label: `${m.nombre} (${m.correo})`
                }))
              ]}
            />
          </div>
        </div>

        {/* Sección: Información Técnica */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Odómetro de Ingreso (km)"
              type="number"
              step="0.1"
              value={formData.odometro_ingreso}
              onChange={(e) => handleInputChange('odometro_ingreso', e.target.value)}
              placeholder="0.0"
            />

            <Input
              label="Fecha Estimada de Completado *"
              type="date"
              value={formData.fecha_estimada}
              onChange={(e) => handleInputChange('fecha_estimada', e.target.value)}
              error={errors.fecha_estimada}
              required
            />
          </div>

          <div className="mt-4">
            <Input
              label="Hora Estimada (HH:mm:ss)"
              type="time"
              value={formData.hora_estimada}
              onChange={(e) => handleInputChange('hora_estimada', e.target.value)}
              placeholder="Horas de trabajo estimadas"
            />
          </div>
        </div>

        {/* Sección: Notas */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas de Recepción (Opcional)</h3>
          <TextArea
            label="Notas"
            value={formData.notas_recepcion}
            onChange={(e) => handleInputChange('notas_recepcion', e.target.value)}
            placeholder="Observaciones al recibir el vehículo..."
            rows={3}
          />
        </div>

        {/* Información de ayuda */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            * Los campos marcados con asterisco son obligatorios.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Orden de Trabajo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkOrderModal;
