import { useState, useEffect } from 'react';
import { Modal, Input, Select, TextArea, Button } from '../comunes/UI';
import type { Appointment } from '../../tipos';
import { clientesService } from '../../servicios/clientesService';
import { servicesService, vehiclesService, appointmentsService } from '../../servicios/apiService';

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
  const [clientes, setClientes] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [vehiculosCliente, setVehiculosCliente] = useState<any[]>([]);

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
          const response = await clientesService.obtenerClientes();
          if (response.success && response.data) {
            const clientesArray = Array.isArray(response.data) ? response.data : [response.data];
            setClientes(clientesArray);
          } else {
            setClientes([]);
          }
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
      const vehiculosFiltrados = vehiculos.filter(vehiculo => vehiculo.cliente_id?.toString() === formData.clientId);
      setVehiculosCliente(vehiculosFiltrados);
      
      // Limpiar selección de vehículo si ya no está disponible
      if (formData.vehicleId && !vehiculosFiltrados.some(v => v.vehiculo_id?.toString() === formData.vehicleId)) {
        setFormData(prev => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setVehiculosCliente([]);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.clientId, vehiculos]);

  // Procesar clientes para el Select
  const numericClients = clientes.filter(cliente => cliente.usuario_id && !isNaN(Number(cliente.usuario_id)));
  const clientOptions = [
    { value: "", label: loadingClientes ? "Cargando clientes..." : "Seleccionar cliente..." },
    ...numericClients.map(cliente => ({
      value: cliente.usuario_id.toString(),
      label: `${cliente.nombre_completo} (ID: ${cliente.usuario_id})`
    }))
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
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

      // Guardar en el backend
      const response = await appointmentsService.create(appointmentData);
      
      if (response.success) {
        // Llamar al callback para notificar al componente padre
        onSubmit({
          ...formData,
          date: new Date(formData.date),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        onClose();
      } else {
        // Mostrar error si no se pudo guardar
        setErrors({ submit: 'Error al crear la cita. Intente nuevamente.' });
      }
    } catch (error) {
      console.error('Error creando cita:', error);
      setErrors({ submit: 'Error al crear la cita. Intente nuevamente.' });
    }
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


        <Select
          label="Cliente"
          value={formData.clientId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('clientId', e.target.value)}
          options={clientOptions}
          error={errors.clientId}
          required
          disabled={loadingClientes}
        />
        {loadingClientes && (
          <p className="mt-1 text-sm text-blue-600">
            ⏳ Cargando clientes desde la base de datos...
          </p>
        )}
        {!loadingClientes && numericClients.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">
            ⚠️ No hay clientes cargados. Recargue la página o registre clientes primero.
          </p>
        )}
        {!loadingClientes && numericClients.length > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            ✅ {numericClients.length} clientes disponibles
          </p>
        )}

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
                value: vehiculo.vehiculo_id?.toString(),
                label: `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa} (${vehiculo.anio})`
              }))
            ]}
          />

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

        <Input
          label="Estado"
          type="text"
          value="Pendiente"
          disabled={true}
          className="bg-gray-50"
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
            Crear Cita
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewAppointmentModal;