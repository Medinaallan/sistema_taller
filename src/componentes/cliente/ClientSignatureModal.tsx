import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button } from '../comunes/UI';
import signatureRequestsService, { SignatureRequest } from '../../servicios/signatureRequestsService';

interface ClientSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureRequest: SignatureRequest;
  clientName: string;
  vehicleName: string;
  onSigned: () => void;
}

export const ClientSignatureModal: React.FC<ClientSignatureModalProps> = ({
  isOpen,
  onClose,
  signatureRequest,
  clientName,
  vehicleName,
  onSigned
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos del contrato
  const contractData = {
    cliente_nombre: clientName,
    orden_trabajo_numero: signatureRequest.otId?.slice(-8) || 'N/A',
    taller_nombre: 'Mantun Taller',
    vehiculo_marca: 'Vehículo',
    vehiculo_modelo: vehicleName,
    vehiculo_anio: '2020',
    vehiculo_placa: 'N/A',
    vehiculo_vin: 'N/A',
    mecanico_nombre: 'Personal técnico autorizado',
    servicio_descripcion: signatureRequest.descripcion || 'Servicio general',
    fecha_actual: new Date().toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!hasSignature) {
      alert('Por favor, firma el documento antes de continuar');
      return;
    }

    setIsSubmitting(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const signatureDataUrl = canvas.toDataURL('image/png');

      await signatureRequestsService.signRequest(signatureRequest.otId, signatureDataUrl);

      alert('Autorización firmada exitosamente. El vehículo puede pasar a Control de Calidad.');
      
      onSigned();
      onClose();
    } catch (error) {
      console.error('Error firmando autorización:', error);
      alert('Error al firmar la autorización');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('¿Estás seguro de que deseas rechazar esta autorización?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signatureRequestsService.rejectRequest(signatureRequest.otId);
      alert('Autorización rechazada.');
      onSigned(); // Refresh
      onClose();
    } catch (error) {
      console.error('Error rechazando autorización:', error);
      alert('Error al rechazar la autorización');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Control de Calidad - Autorización Digital"
      size="xl"
    >
      <div className="space-y-6">
        {/* Alerta informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>⚠️ Importante:</strong> Este documento autoriza al taller a realizar pruebas 
            de manejo y validación del vehículo. Por favor, lea cuidadosamente antes de firmar.
          </p>
        </div>

        {/* Contrato */}
        <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto border border-gray-200">
          <h3 className="text-lg font-bold text-center mb-4">
            AUTORIZACIÓN DIGITAL PARA PRUEBA DE VEHÍCULO Y CONTROL DE CALIDAD
          </h3>

          <div className="space-y-4 text-sm text-gray-700">
            <p>
              Yo, <strong>{contractData.cliente_nombre}</strong>, vinculado a la Orden de Trabajo 
              N.º <strong>{contractData.orden_trabajo_numero}</strong>, autorizo de forma expresa 
              y voluntaria al taller <strong>{contractData.taller_nombre}</strong> a realizar 
              pruebas de manejo, diagnóstico y control de calidad sobre el vehículo registrado 
              en la orden de trabajo, con el fin de verificar el correcto funcionamiento del mismo.
            </p>

            <div className="bg-white p-3 rounded border border-gray-300">
              <p><strong>Vehículo:</strong> {contractData.vehiculo_modelo}</p>
              <p><strong>Placa:</strong> {contractData.vehiculo_placa}</p>
              <p><strong>VIN/Chasis:</strong> {contractData.vehiculo_vin}</p>
            </div>

            <h4 className="font-bold text-base mt-4">ALCANCE DE LA AUTORIZACIÓN</h4>
            <p>
              El cliente autoriza que el vehículo sea conducido por el mecánico autorizado{' '}
              <strong>{contractData.mecanico_nombre}</strong> o por personal técnico designado 
              por el taller, exclusivamente para fines técnicos relacionados con el diagnóstico, 
              validación y control de calidad del servicio <strong>{contractData.servicio_descripcion}</strong>.
            </p>
            <p>
              Las pruebas podrán realizarse antes, durante o después de la ejecución del servicio 
              asociado a la orden de trabajo, dentro de rutas y distancias razonables necesarias 
              para su correcta verificación.
            </p>

            <h4 className="font-bold text-base mt-4">RESPONSABILIDAD Y CONDICIONES</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>
                El taller se compromete a que el vehículo será utilizado de manera responsable, 
                profesional y conforme a las normas de tránsito vigentes.
              </li>
              <li>
                El cliente reconoce que el taller no será responsable por fallas preexistentes, 
                desgaste normal del vehículo o daños no relacionados directamente con el servicio 
                autorizado, salvo en casos de negligencia debidamente comprobada.
              </li>
            </ul>

            <h4 className="font-bold text-base mt-4">CONDICIONES GENERALES</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>El nivel de combustible podrá variar como resultado de las pruebas realizadas.</li>
              <li>El taller no se hace responsable por objetos personales dejados dentro del vehículo.</li>
              <li>El estado general del vehículo es el registrado en la orden de trabajo al momento de su ingreso.</li>
            </ul>

            <h4 className="font-bold text-base mt-4">ACEPTACIÓN DIGITAL</h4>
            <p>
              La aceptación de la presente autorización se realiza de forma electrónica y queda 
              registrada en el sistema como parte integral de la orden de trabajo y del historial 
              del vehículo.
            </p>

            <p className="text-xs text-gray-500 mt-4">
              Fecha de autorización: {contractData.fecha_actual}
            </p>
          </div>
        </div>

        {/* Área de firma */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Firma del Cliente
            </label>
            <button
              type="button"
              onClick={clearSignature}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Limpiar firma
            </button>
          </div>
          
          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              className="w-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          
          <p className="text-xs text-gray-500">
            Dibuja tu firma en el recuadro usando el cursor del mouse
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            Rechazar
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSign}
              disabled={!hasSignature || isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : 'Firmar y Autorizar'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
