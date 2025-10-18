import { useState } from 'react';
import { Modal, Input, TextArea, Button } from '../comunes/UI';
import type { Appointment } from '../../tipos';

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quotationData: any) => void;
  appointment: Appointment | null;
  clientName: string;
  serviceName: string;
}

const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  clientName,
  serviceName,
}) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    precio: '',
    notas: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !appointment) {
      return;
    }

    const quotationData = {
      appointmentId: appointment.id,
      clienteId: appointment.clientId,
      vehiculoId: appointment.vehicleId,
      servicioId: appointment.serviceTypeId,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      notas: formData.notas,
      estado: 'draft',
      fechaCreacion: new Date().toISOString().split('T')[0],
    };

    onSubmit(quotationData);
    onClose();
    
    // Limpiar formulario
    setFormData({
      descripcion: '',
      precio: '',
      notas: '',
    });
    setErrors({});
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
      title="Crear Cotización"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la cita */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Información de la Cita</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Cita:</strong> {appointment.id}</p>
            <p><strong>Cliente:</strong> {clientName}</p>
            <p><strong>Servicio:</strong> {serviceName}</p>
            <p><strong>Vehículo:</strong> {appointment.vehicleId}</p>
            <p><strong>Fecha:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
          </div>
        </div>

        <TextArea
          label="Descripción del Trabajo"
          value={formData.descripcion}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('descripcion', e.target.value)}
          error={errors.descripcion}
          placeholder="Describa detalladamente el trabajo a realizar..."
          rows={4}
          required
        />

        <Input
          label="Precio Estimado"
          type="number"
          step="0.01"
          min="0"
          value={formData.precio}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('precio', e.target.value)}
          error={errors.precio}
          placeholder="0.00"
          required
        />

        <TextArea
          label="Notas Adicionales"
          value={formData.notas}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notas', e.target.value)}
          placeholder="Notas internas, condiciones especiales, etc..."
          rows={3}
        />

        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Esta cotización se creará en estado "Borrador" y se marcará la cita como "Completada" automáticamente.
          </p>
        </div>

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
            Crear Cotización
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateQuotationModal;