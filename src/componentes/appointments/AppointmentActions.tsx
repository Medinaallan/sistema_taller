import React, { useState } from 'react';
import type { Appointment } from '../../tipos';
import { appointmentsService, quotationsService } from '../../servicios/apiService';
import CreateQuotationModal from './CreateQuotationModal';

interface AppointmentActionsProps {
  appointment: Appointment;
  clientName: string;
  serviceName: string;
  onUpdate: () => void;
}

const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  appointment,
  clientName,
  serviceName,
  onUpdate,
}) => {
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      // SP_CAMBIAR_ESTADO_CITA: cita_id, nuevo_estado, comentario, registrado_por
      const usuarioId = Number(localStorage.getItem('usuario_id'));
      const payload = {
        nuevo_estado: 'confirmed',
        comentario: '',
        registrado_por: usuarioId
      };
      const result = await appointmentsService.changeStatus(Number(appointment.id), payload);
      if (result.success) {
        console.log('Cita aprobada exitosamente');
        onUpdate();
      } else {
        console.error('Error al aprobar cita:', result.message);
        alert('Error al aprobar la cita');
      }
    } catch (error) {
      console.error('Error al aprobar cita:', error);
      alert('Error al aprobar la cita');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;
    setShowRejectInput(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Debes ingresar el motivo de rechazo.');
      return;
    }
    setIsProcessing(true);
    try {
      const usuarioId = Number(localStorage.getItem('usuario_id'));
      const payload = {
        nuevo_estado: 'cancelled',
        comentario: rejectReason,
        registrado_por: usuarioId
      };
      const result = await appointmentsService.changeStatus(Number(appointment.id), payload);
      if (result.success) {
        console.log('Cita rechazada exitosamente');
        onUpdate();
      } else {
        console.error('Error al rechazar cita:', result.message);
        alert('Error al rechazar la cita');
      }
    } catch (error) {
      console.error('Error al rechazar cita:', error);
      alert('Error al rechazar la cita');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateQuotation = async (quotationData: any) => {
    setIsProcessing(true);
    try {
      // Crear la cotización
      const quotationResult = await quotationsService.create(quotationData);

      if (quotationResult.success) {
        // Marcar la cita como completada
        const usuarioId = Number(localStorage.getItem('usuario_id'));
        const appointmentResult = await appointmentsService.changeStatus(Number(appointment.id), {
          nuevo_estado: 'completed',
          comentario: 'Cotización creada y cita completada',
          registrado_por: usuarioId
        });

        if (appointmentResult.success) {
          console.log('Cotización creada y cita completada exitosamente');
          alert('Cotización creada exitosamente y cita marcada como completada');
          onUpdate();
        } else {
          console.error('Error al actualizar cita:', appointmentResult.message);
          alert('Cotización creada pero error al actualizar la cita');
        }
      } else {
        console.error('Error al crear cotización:', quotationResult.message);
        alert('Error al crear la cotización');
      }
    } catch (error) {
      console.error('Error en el proceso de cotización:', error);
      alert('Error al crear la cotización');
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionButtons = () => {
    const appointmentStatus = (appointment as any).estado || appointment.status;
    switch (appointmentStatus) {
      case 'pending':
        return (
          <div className="flex gap-2 items-center">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:bg-gray-400"
              title="Aprobar cita"
            >
              ✓ Aprobar
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:bg-gray-400"
              title="Rechazar cita"
            >
              ✗ Rechazar
            </button>
            {showRejectInput && (
              <div className="flex flex-col gap-2 ml-2">
                <input
                  type="text"
                  placeholder="Motivo de rechazo"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="px-2 py-1 border rounded text-xs"
                  disabled={isProcessing}
                  style={{ minWidth: '180px' }}
                />
                <button
                  onClick={handleConfirmReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Confirmar rechazo
                </button>
              </div>
            )}
          </div>
        );

      case 'confirmed':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => setIsQuotationModalOpen(true)}
              disabled={isProcessing}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-400"
              title="Convertir a cotización"
            >
              💰 Cotizar
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:bg-gray-400"
              title="Cancelar cita"
            >
              ✗ Cancelar
            </button>
          </div>
        );

      case 'completed':
        return (
          <span className="text-green-600 text-xs font-medium">
            ✓ Completada
          </span>
        );

      case 'cancelled':
        return (
          <span className="text-red-600 text-xs font-medium">
            ✗ Cancelada
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {getActionButtons()}
      
      <CreateQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onSubmit={handleCreateQuotation}
        appointment={appointment}
        clientName={clientName}
        serviceName={serviceName}
      />
    </>
  );
};

export default AppointmentActions;