import { useState, useEffect } from 'react';
import { Modal, Input, Select, TextArea, Button } from '../comunes/UI';
import type { Appointment } from '../../tipos';
import { obtenerClientes, type Cliente } from '../../servicios/clientesApiService';
import { servicesService } from '../../servicios/apiService';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointment: Omit<Appointment, 'id'>) => void;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    clientId: '',
    vehicleId: '',
    serviceTypeId: '',
    notes: '',
    status: 'pending' as const,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);

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
      newErrors.vehicleId = 'El vehículo es requerido';
    }

    if (!formData.serviceTypeId) {
      newErrors.serviceTypeId = 'El tipo de servicio es requerido';
    }

    // Validar que la fecha no sea en el pasado
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      date: new Date(formData.date),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Cita"
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

          <Input
            label="Vehículo ID"
            type="text"
            value={formData.vehicleId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('vehicleId', e.target.value)}
            placeholder="ej: VEH-001"
            error={errors.vehicleId}
            required
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
            Crear Cita
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewAppointmentModal;