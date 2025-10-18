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

  const handleApprove = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await appointmentsService.update(appointment.id, {
        clienteId: (appointment as any).clienteId || appointment.clientId,
        vehiculoId: (appointment as any).vehiculoId || appointment.vehicleId,
        fecha: (appointment as any).fecha || appointment.date,
        hora: (appointment as any).hora || appointment.time,
        servicio: (appointment as any).servicio || appointment.serviceTypeId,
        estado: 'confirmed',
        notas: (appointment as any).notas || appointment.notes || ''
      });

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
    
    const confirmed = confirm('¿Está seguro que desea rechazar esta cita?');
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const result = await appointmentsService.update(appointment.id, {
        clienteId: (appointment as any).clienteId || appointment.clientId,
        vehiculoId: (appointment as any).vehiculoId || appointment.vehicleId,
        fecha: (appointment as any).fecha || appointment.date,
        hora: (appointment as any).hora || appointment.time,
        servicio: (appointment as any).servicio || appointment.serviceTypeId,
        estado: 'cancelled',
        notas: (appointment as any).notas || appointment.notes || ''
      });

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
        const appointmentResult = await appointmentsService.update(appointment.id, {
          clienteId: (appointment as any).clienteId || appointment.clientId,
          vehiculoId: (appointment as any).vehiculoId || appointment.vehicleId,
          fecha: (appointment as any).fecha || appointment.date,
          hora: (appointment as any).hora || appointment.time,
          servicio: (appointment as any).servicio || appointment.serviceTypeId,
          estado: 'completed',
          notas: (appointment as any).notas || appointment.notes || ''
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
          <div className="flex gap-2">
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