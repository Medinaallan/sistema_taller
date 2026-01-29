import { Modal } from '../comunes/UI';
import ServiceForm from './ServiceForm';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; descripcion: string; precio: string; duracion: string; categoria: string }) => void;
  loading?: boolean;
  initialValues?: Partial<{ nombre: string; descripcion: string; precio: string; duracion: string; categoria: string }>;
  title?: string;
}

export function ServiceModal({ isOpen, onClose, onSubmit, loading = false, initialValues, title }: ServiceModalProps) {
  const handleSubmit = (data: { nombre: string; descripcion: string; precio: string; duracion: string; categoria: string }) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Agregar Nuevo Servicio'}
      size="lg"
    >
      <ServiceForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
        initialValues={initialValues}
      />
    </Modal>
  );
}

export default ServiceModal;