import { useState, useEffect } from 'react';
import { Modal, Input, Select, TextArea, Button } from '../comunes/UI';
import type { Appointment } from '../../tipos';
import { obtenerClientes, type Cliente } from '../../servicios/clientesApiService';
import { servicesService, vehiclesService, appointmentsService } from '../../servicios/apiService';

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
    date: '',
    time: '',
    clientId: '',
    vehicleId: '',
    serviceTypeId: '',
    notes: '',
    status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [vehiculosCliente, setVehiculosCliente] = useState<any[]>([]);

  // Cargar datos del appointment cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      setFormData({
        date: appointment.date instanceof Date ? appointment.date.toISOString().split('T')[0] : appointment.date,
        time: appointment.time,
        clientId: appointment.clientId,
        vehicleId: appointment.vehicleId,
        serviceTypeId: appointment.serviceTypeId,
        notes: appointment.notes || '',
        status: appointment.status,
      });
      setErrors({});
    }
  }, [isOpen, appointment]);

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: '',
        time: '',
        clientId: '',
        vehicleId: '',
        serviceTypeId: '',
        notes: '',
        status: 'pending',
      });
      setErrors({});
      setVehiculosCliente([]);
    }
  }, [isOpen]);

  // Cargar clientes cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      const cargarClientes = async () => {
        setLoadingClientes(true);
        try {
          const clientesData = await obtenerClientes();
          setClientes(clientesData);
        } catch (error) {
          console.error('Error cargando clientes:', error);
          setClientes([]);
        } finally {
          setLoadingClientes(false);
        }
      };

      cargarClientes();
    }
  }, [isOpen]);

  // Cargar servicios cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      const cargarServicios = async () => {
        setLoadingServicios(true);
        try {
          const response = await servicesService.getAll();
          if (response.success) {
            const mappedServices = response.data.map((csvService: any) => ({
              id: csvService.id,
              name: csvService.nombre,
              description: csvService.descripcion || '',
              basePrice: parseFloat(csvService.precio) || 0,
              estimatedTime: csvService.duracion || '',
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

  // Cargar vehículos cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      const cargarVehiculos = async () => {
        setLoadingVehiculos(true);
        try {
          const response = await vehiclesService.getAll();
          if (response.success) {
            setVehiculos(response.data);
          }
        } catch (error) {
          console.error('Error cargando vehículos:', error);
          setVehiculos([]);
        } finally {
          setLoadingVehiculos(false);
        }
      };

      cargarVehiculos();
    }
  }, [isOpen]);

  // Filtrar vehículos cuando cambie el cliente seleccionado
  useEffect(() => {
    if (formData.clientId && vehiculos.length > 0) {
      const vehiculosFiltrados = vehiculos.filter(vehiculo => vehiculo.clienteId === formData.clientId);
      setVehiculosCliente(vehiculosFiltrados);
      
      // Si el vehículo actual no pertenece al nuevo cliente, limpiar selección
      if (formData.vehicleId && !vehiculosFiltrados.some(v => v.id === formData.vehicleId)) {
        setFormData(prev => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setVehiculosCliente([]);
    }
  }, [formData.clientId, vehiculos]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (!formData.time) {
      newErrors.time = 'La hora es requerida';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'El cliente es requerido';
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Debe seleccionar un vehículo';
    }

    if (!formData.serviceTypeId) {
      newErrors.serviceTypeId = 'El tipo de servicio es requerido';
    }

    // Validar que la fecha no sea en el pasado (excepto si es hoy)
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'La fecha no puede ser en el pasado';
      }
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
      // Preparar datos para el backend
      const appointmentData = {
        clienteId: formData.clientId,
        vehiculoId: formData.vehicleId,
        fecha: formData.date,
        hora: formData.time,
        servicio: formData.serviceTypeId,
        estado: formData.status,
        notas: formData.notes
      };

      // Actualizar en el backend
      const response = await appointmentsService.update(appointment.id, appointmentData);
      
      if (response.success) {
        onSubmit(); // Notificar al componente padre para que recargue la lista
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
    
    // Limpiar error del campo cuando el usuario empiece a escribir
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha"
            type="date"
            value={formData.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('date', e.target.value)}
            error={errors.date}
            required
          />

          <Input
            label="Hora"
            type="time"
            value={formData.time}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('time', e.target.value)}
            error={errors.time}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Cliente"
            value={formData.clientId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('clientId', e.target.value)}
            error={errors.clientId}
            required
            options={[
              { value: "", label: loadingClientes ? "Cargando clientes..." : "Seleccionar cliente..." },
              ...clientes.map(cliente => ({
                value: cliente.id,
                label: `${cliente.name} - ${cliente.email}`
              }))
            ]}
          />

          <Select
            label="Vehículo"
            value={formData.vehicleId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('vehicleId', e.target.value)}
            error={errors.vehicleId}
            required
            disabled={!formData.clientId || loadingVehiculos}
            options={[
              { 
                value: "", 
                label: !formData.clientId 
                  ? "Primero seleccione un cliente" 
                  : loadingVehiculos 
                    ? "Cargando vehículos..." 
                    : vehiculosCliente.length === 0 
                      ? "Este cliente no tiene vehículos registrados"
                      : "Seleccionar vehículo..."
              },
              ...vehiculosCliente.map(vehiculo => ({
                value: vehiculo.id,
                label: `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa} (${vehiculo.año})`
              }))
            ]}
          />
        </div>

        <Select
          label="Tipo de Servicio"
          value={formData.serviceTypeId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('serviceTypeId', e.target.value)}
          error={errors.serviceTypeId}
          required
          options={[
            { value: "", label: loadingServicios ? "Cargando servicios..." : "Seleccionar servicio..." },
            ...servicios.map(servicio => ({
              value: servicio.id,
              label: `${servicio.name} - $${servicio.basePrice}`
            }))
          ]}
        />

        <Select
          label="Estado"
          value={formData.status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('status', e.target.value as 'pending' | 'confirmed' | 'cancelled' | 'completed')}
          options={[
            { value: "pending", label: "Pendiente" },
            { value: "confirmed", label: "Confirmada" },
            { value: "cancelled", label: "Cancelada" },
            { value: "completed", label: "Completada" }
          ]}
        />

        <TextArea
          label="Notas adicionales"
          value={formData.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
          placeholder="Información adicional sobre la cita..."
          rows={3}
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