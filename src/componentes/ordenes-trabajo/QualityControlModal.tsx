import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button } from '../comunes/UI';
import { WorkOrderData } from '../../servicios/workOrdersService';
import { showError, showSuccess, showWarning } from '../../utilidades/sweetAlertHelpers';

interface QualityControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderData;
  clientName: string;
  vehicleName: string;
  onComplete: () => void;
}

export const QualityControlModal: React.FC<QualityControlModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  clientName,
  vehicleName,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos del contrato
  const contractData = {
    cliente_nombre: clientName,
    orden_trabajo_numero: workOrder.id?.slice(-8) || 'N/A',
    taller_nombre: 'Mantun Taller',
    vehiculo_marca: 'Vehículo', // Extraer de vehicleName si es posible
    vehiculo_modelo: vehicleName,
    vehiculo_anio: '2020', // Esto debería venir de la BD
    vehiculo_placa: 'N/A', // Esto debería venir de la BD
    vehiculo_vin: 'N/A', // Esto debería venir de la BD
    mecanico_nombre: workOrder.recomendaciones?.includes('Mecánico') 
      ? workOrder.recomendaciones.split(':')[1]?.trim() 
      : 'Personal técnico autorizado',
    servicio_descripcion: workOrder.descripcion || 'Servicio general',
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
        // Configurar canvas
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

  const handleSubmit = async () => {
    if (!hasSignature) {
      showWarning('Por favor, firma el documento antes de continuar');
      return;
    }

    setIsSubmitting(true);

    try {
      // Obtener la firma como imagen base64
      const canvas = canvasRef.current;
      if (!canvas) return;

      const signatureDataUrl = canvas.toDataURL('image/png');

      // Aquí guardarías la firma y el consentimiento en el backend
      // Por ahora, lo guardamos en localStorage como ejemplo
      const consentimiento = {
        orden_trabajo_id: workOrder.id,
        cliente_nombre: contractData.cliente_nombre,
        vehiculo: contractData.vehiculo_modelo,
        firma: signatureDataUrl,
        fecha_autorizacion: new Date().toISOString(),
        contrato: contractData
      };

      // Guardar en localStorage (temporal)
      const consentimientos = JSON.parse(localStorage.getItem('consentimientos-calidad') || '[]');
      consentimientos.push(consentimiento);
      localStorage.setItem('consentimientos-calidad', JSON.stringify(consentimientos));

      showSuccess('Autorización firmada exitosamente. El vehículo puede pasar a Control de Calidad.');
      
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error guardando autorización:', error);
      showError('Error al guardar la autorización');
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
            <strong> Importante:</strong> Este documento autoriza al taller a realizar pruebas 
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
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasSignature || isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : 'Firmar y Autorizar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
