import { Modal, Button, Card } from '../comunes/UI';
import type { Appointment } from '../../tipos';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  clientName?: string;
  vehicleName?: string;
  serviceName?: string;
}

const statusColors = {
  pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', label: 'Pendiente' },
  confirmed: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', label: 'Confirmada' },
  approved: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', label: 'Aprobada' },
  completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', label: 'Completada' },
  cancelled: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', label: 'Cancelada' }
};

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  clientName = 'Cargando...',
  vehicleName = 'Cargando...',
  serviceName = 'Cargando...'
}: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  const statusKey = (appointment.status as keyof typeof statusColors) || 'pending';
  const statusInfo = statusColors[statusKey];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalles de Cita #${appointment.id}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Estado */}
        <div className={`p-4 rounded-lg border ${statusInfo.bg} ${statusInfo.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Estado</p>
              <p className={`text-lg font-semibold ${statusInfo.text}`}>
                {statusInfo.label}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full ${statusInfo.bg} ${statusInfo.border} border-2 flex items-center justify-center`}>
              {statusKey === 'pending' && <span className="text-2xl"></span>}
              {statusKey === 'confirmed' && <span className="text-2xl"></span>}
              {statusKey === 'approved' && <span className="text-2xl"></span>}
              {statusKey === 'completed' && <span className="text-2xl"></span>}
              {statusKey === 'cancelled' && <span className="text-2xl"></span>}
            </div>
          </div>
        </div>

        {/* Información General */}
        <Card className="bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-medium text-gray-900">
                {appointment.date.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hora</p>
              <p className="font-medium text-gray-900">{appointment.time}</p>
            </div>
          </div>
        </Card>

        {/* Cliente y Vehículo */}
        <Card className="bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cliente y Vehículo</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-medium text-gray-900">{clientName}</p>
              <p className="text-xs text-gray-500">ID: {appointment.clientId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vehículo</p>
              <p className="font-medium text-gray-900">{vehicleName}</p>
              <p className="text-xs text-gray-500">ID: {appointment.vehicleId}</p>
            </div>
          </div>
        </Card>

        {/* Servicio */}
        <Card className="bg-purple-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicio Solicitado</h3>
          <div>
            <p className="text-sm text-gray-600">Tipo de Servicio</p>
            <p className="font-medium text-gray-900">{serviceName}</p>
            <p className="text-xs text-gray-500">ID: {appointment.serviceTypeId}</p>
          </div>
        </Card>

        {/* Notas */}
        {appointment.notes && (
          <Card className="bg-yellow-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas del Cliente</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{appointment.notes}</p>
          </Card>
        )}

        {/* Fechas de Registro */}
        <Card className="bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Registro</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Creada</p>
              <p className="font-medium text-gray-900">
                {appointment.createdAt.toLocaleDateString('es-ES')}
              </p>
              <p className="text-xs text-gray-500">
                {appointment.createdAt.toLocaleTimeString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Actualizada</p>
              <p className="font-medium text-gray-900">
                {appointment.updatedAt.toLocaleDateString('es-ES')}
              </p>
              <p className="text-xs text-gray-500">
                {appointment.updatedAt.toLocaleTimeString('es-ES')}
              </p>
            </div>
          </div>
        </Card>

        {/* Botón Cerrar */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
