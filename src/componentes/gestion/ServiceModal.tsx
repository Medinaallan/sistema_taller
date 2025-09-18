import { Modal } from '../comunes/UI';
import ServiceForm from './ServiceForm';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; descripcion: string; precio: string; duracion: string; categoria: string }) => void;
  loading?: boolean;
}

export function ServiceModal({ isOpen, onClose, onSubmit, loading = false }: ServiceModalProps) {
  const handleSubmit = (data: { nombre: string; descripcion: string; precio: string; duracion: string; categoria: string }) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Nuevo Servicio"
      size="lg"
    >
      <ServiceForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  );
}

export default ServiceModal;