import { useState, useEffect } from 'react';
import { Modal, Button, TextArea } from '../comunes/UI';
import quotationsService from '../../servicios/quotationsService';
import { servicesService } from '../../servicios/apiService';
import { getDisplayNames } from '../../utilidades/dataMappers';
import type { Appointment } from '../../tipos';

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

const CreateQuotationModal = ({ isOpen, onClose, appointment, onSuccess }: CreateQuotationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [servicePrecio, setServicePrecio] = useState<number>(0);
  const [serviceName, setServiceName] = useState<string>('');
  const [loadingService, setLoadingService] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: '',
    notas: ''
  });
  const [displayNames, setDisplayNames] = useState({
    clientName: 'Cargando...',
    vehicleName: 'Cargando...',
    serviceName: 'Cargando...'
  });

  // Cargar precio del servicio cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment?.serviceTypeId) {
      loadServicePrice(appointment.serviceTypeId);
    }
  }, [isOpen, appointment?.serviceTypeId]);

  // Cargar nombres descriptivos cuando se abre el modal
  useEffect(() => {
    const loadDisplayNames = async () => {
      if (isOpen && appointment) {
        try {
          const names = await getDisplayNames({
            clientId: appointment.clientId,
            vehicleId: appointment.vehicleId,
            serviceId: appointment.serviceTypeId
          });
          setDisplayNames(names);
        } catch (error) {
          console.error('Error cargando nombres descriptivos:', error);
          setDisplayNames({
            clientName: `Cliente #${appointment.clientId}`,
            vehicleName: `Vehículo #${appointment.vehicleId}`,
            serviceName: `Servicio #${appointment.serviceTypeId}`
          });
        }
      }
    };

    loadDisplayNames();
  }, [isOpen, appointment]);

  const loadServicePrice = async (serviceId: string) => {
    try {
      setLoadingService(true);
      const response = await servicesService.getAll();
      if (response.success && response.data) {
        const service = response.data.find((s: any) => s.id === serviceId);
        if (service) {
          setServicePrecio(parseFloat(service.precio) || 0);
          setServiceName(service.nombre || service.name || 'Servicio');
        } else {
          setServicePrecio(500); // Precio por defecto
          setServiceName('Servicio no encontrado');
        }
      }
    } catch (error) {
      console.error('Error cargando precio del servicio:', error);
      setServicePrecio(500); // Precio por defecto en caso de error
      setServiceName('Error cargando servicio');
    } finally {
      setLoadingService(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment) return;
    
    try {
      setLoading(true);
      
      const cotizacionData = {
        appointmentId: appointment.id,
        clienteId: appointment.clientId,
        vehiculoId: appointment.vehicleId,
        servicioId: appointment.serviceTypeId,
        descripcion: formData.descripcion,
        precio: servicePrecio,
        notas: formData.notas,
        estado: 'sent' as const
      };
      
      await quotationsService.createQuotation(cotizacionData);
      
      setFormData({
        descripcion: '',
        notas: ''
      });
      
      alert('Cotización creada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error creando cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Crear Cotización - Cita #${String(appointment.id).substring(0, 8)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Información de la cita:</h4>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Cliente:</span>
              <div className="font-medium">{displayNames.clientName}</div>
            </div>
            <div>
              <span className="text-gray-500">Vehículo:</span>
              <div className="font-medium">{displayNames.vehicleName}</div>
            </div>
            <div>
              <span className="text-gray-500">Servicio:</span>
              <div className="font-medium">{displayNames.serviceName}</div>
            </div>
            <div>
              <span className="text-gray-500">Fecha:</span>
              <div>{appointment.date.toLocaleDateString('es-ES')} - {appointment.time}</div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del trabajo *
          </label>
          <TextArea
            value={formData.descripcion}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('descripcion', e.target.value)}
            placeholder="Describe detalladamente el trabajo..."
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio del Servicio (Lempiras)
          </label>
          <div className="bg-gray-50 p-3 rounded-lg border">
            {loadingService ? (
              <div className="text-gray-500">Cargando precio...</div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-green-600">
                  L {servicePrecio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {serviceName}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas adicionales
          </label>
          <TextArea
            value={formData.notas}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('notas', e.target.value)}
            placeholder="Información adicional..."
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
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
            loading={loading}
            disabled={loading || !formData.descripcion || servicePrecio <= 0}
          >
            {loading ? 'Creando...' : 'Crear Cotización'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateQuotationModal;
