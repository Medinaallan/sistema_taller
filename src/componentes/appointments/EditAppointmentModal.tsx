import { useState, useEffect } from 'react';
import { Modal, Input, Select, TextArea, Button } from '../comunes/UI';
import type { Appointment } from '../../tipos';
// import eliminado: clientesApiService
import { servicesService, appointmentsService } from '../../servicios/apiService';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  appointment: Appointment | null;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appointment,
}) => {
  const [formData, setFormData] = useState({
    tipo_servicio_id: '',
    fecha_inicio: '',
    notas_cliente: '',
    editado_por: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [servicios, setServicios] = useState<any[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
    // Eliminados: clientes, loadingClientes, vehiculos, loadingVehiculos, vehiculosCliente

  // Cargar datos del appointment cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      setFormData({
        tipo_servicio_id: appointment.tipo_servicio_id?.toString() || appointment.serviceTypeId?.toString() || '',
        fecha_inicio: appointment.fecha_inicio instanceof Date ? appointment.fecha_inicio.toISOString().split('T')[0] : appointment.fecha_inicio || appointment.date || '',
        notas_cliente: appointment.notas_cliente || appointment.notes || '',
        editado_por: localStorage.getItem('usuario_id') || '',
      });
      setErrors({});
    }
  }, [isOpen, appointment]);

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        tipo_servicio_id: '',
        fecha_inicio: '',
        notas_cliente: '',
        editado_por: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  // Eliminado: useEffect para cargar clientes

  // Cargar servicios cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      const cargarServicios = async () => {
        setLoadingServicios(true);
        try {
          const response = await servicesService.getAll();
          if (response.success) {
            const mappedServices = response.data.map((service: any) => ({
              id: service.id,
              name: service.nombre,
              description: service.descripcion || '',
              basePrice: parseFloat(service.precio) || 0,
              estimatedTime: service.duracion || '',
            }));
            setServicios(mappedServices);
          }
        } catch (error) {
          console.error('Error cargando servicios:', error);
          setServicios([]);
        } finally {
          setLoadingServicios(false);
        }
      };

      cargarServicios();
    }
  }, [isOpen]);

  // Eliminado: useEffect para cargar vehículos

  // Eliminado: useEffect para filtrar vehículos por cliente

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.tipo_servicio_id) {
      newErrors.tipo_servicio_id = 'El tipo de servicio es requerido';
    }
    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    } else {
      const selectedDate = new Date(formData.fecha_inicio);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.fecha_inicio = 'La fecha no puede ser en el pasado';
      }
    }
    if (!formData.editado_por) {
      newErrors.editado_por = 'El usuario editor es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !appointment) {
      return;
    }
    try {
      // Preparar datos para el SP_EDITAR_CITA
      const editData = {
        cita_id: appointment.id,
        tipo_servicio_id: Number(formData.tipo_servicio_id),
        fecha_inicio: formData.fecha_inicio,
        notas_cliente: formData.notas_cliente,
        editado_por: Number(formData.editado_por)
      };
      const response = await appointmentsService.update(Number(appointment.id), editData); // update debe usar SP_EDITAR_CITA
      if (response.success) {
        onSubmit();
        onClose();
      } else {
        setErrors({ submit: 'Error al actualizar la cita. Intente nuevamente.' });
      }
    } catch (error) {
      console.error('Error actualizando cita:', error);
      setErrors({ submit: 'Error al actualizar la cita. Intente nuevamente.' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Cita"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          label="Tipo de Servicio"
          value={formData.tipo_servicio_id}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipo_servicio_id', e.target.value)}
          error={errors.tipo_servicio_id}
          required
          options={[{ value: '', label: loadingServicios ? 'Cargando servicios...' : 'Seleccionar servicio...' },
            ...servicios.map(servicio => ({
              value: servicio.id,
              label: `${servicio.name} - $${servicio.basePrice}`
            }))
          ]}
        />
        <Input
          label="Fecha de inicio"
          type="date"
          value={formData.fecha_inicio}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fecha_inicio', e.target.value)}
          error={errors.fecha_inicio}
          required
        />
        <TextArea
          label="Notas del cliente"
          value={formData.notas_cliente}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notas_cliente', e.target.value)}
          placeholder="Notas sobre la cita..."
          rows={3}
        />
        <Input
          label="Editado por (ID usuario)"
          type="number"
          value={formData.editado_por}
          disabled={true}
          className="bg-gray-50"
          error={errors.editado_por}
          required
        />
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            Actualizar Cita
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAppointmentModal;