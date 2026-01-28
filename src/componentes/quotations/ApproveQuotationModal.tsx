import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Card } from '../comunes/UI';
import quotationsService, { type QuotationData } from '../../servicios/quotationsService';
import { appointmentsService } from '../../servicios/apiService';
import { showError, showSuccess } from '../../utilidades/sweetAlertHelpers';

interface ApproveQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: QuotationData | null;
  onSuccess: (result: { ot_id: number; numero_ot: string }) => void;
}

export default function ApproveQuotationModal({
  isOpen,
  onClose,
  quotation,
  onSuccess
}: ApproveQuotationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asesor_id: '',
    mecanico_encargado_id: '',
    odometro_ingreso: '',
    fecha_estimada: '',
    hora_estimada: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: number; nombre: string; rol: string }>>([]);
  
  // Detectar si la cotización ya está aprobada (solo necesitamos generar OT)
  const isAlreadyApproved = quotation?.estado_cotizacion === 'Aprobada';

  // Cargar lista de usuarios (asesores y mecánicos) y establecer asesor actual
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Obtener usuario actual desde localStorage
        const usuarioActual = localStorage.getItem('usuario_id');
        
        // TODO: Llamar a endpoint para obtener usuarios
        // Por ahora, usando datos simulados + usuario actual
        const usuariosList = [
          { id: 1, nombre: 'Asesor 1', rol: 'asesor' },
          { id: 2, nombre: 'Asesor 2', rol: 'asesor' },
          { id: 3, nombre: 'Mecánico 1', rol: 'mecanico' },
          { id: 4, nombre: 'Mecánico 2', rol: 'mecanico' },
        ];
        
        // Si hay usuario actual, agregarlo a la lista o usarlo
        if (usuarioActual) {
          setFormData(prev => ({ ...prev, asesor_id: usuarioActual }));
        }
        
        setUsers(usuariosList);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
      }
    };
    loadUsers();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.asesor_id) {
      setError('No se pudo obtener el ID del asesor. Por favor, recarga la página');
      return false;
    }
    if (!formData.fecha_estimada) {
      setError('La fecha estimada es requerida');
      return false;
    }
    if (!formData.hora_estimada) {
      setError('Las horas estimadas de trabajo son requeridas');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!quotation) {
      setError('Cotización no encontrada');
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando aprobación de cotización:', quotation.cotizacion_id);
      
      // Convertir hora_estimada al formato HH:mm:ss
      const horaEstimada = formData.hora_estimada.includes(':') 
        ? formData.hora_estimada 
        : `${formData.hora_estimada}:00:00`;

      const usuario_id = localStorage.getItem('usuario_id');
      
      const result = await quotationsService.approveAndGenerateWorkOrder(
        quotation.cotizacion_id.toString(),
        {
          asesor_id: parseInt(formData.asesor_id),
          mecanico_encargado_id: formData.mecanico_encargado_id ? parseInt(formData.mecanico_encargado_id) : null,
          odometro_ingreso: formData.odometro_ingreso ? parseFloat(formData.odometro_ingreso) : null,
          fecha_estimada: formData.fecha_estimada,
          hora_estimada: horaEstimada,
          generado_por: usuario_id ? parseInt(usuario_id) : null,
        }
      );

      console.log('Resultado de aprobación:', result);

      // Cambiar estado de la cita a "aprobada" después de aprobar la cotización
      if (quotation.cita_id) {
        try {
          const cita_id = quotation.cita_id;
          console.log(`Información para cambiar estado:`, {
            cita_id,
            nuevo_estado: 'aprobada',
            comentario: 'Cotización aprobada',
            registrado_por: usuario_id ? parseInt(usuario_id) : 0
          });
          
          const statusResponse = await appointmentsService.changeStatus(cita_id, {
            nuevo_estado: 'aprobada',
            comentario: 'Cotización aprobada',
            registrado_por: usuario_id ? parseInt(usuario_id) : 0
          });
          
          console.log('Respuesta del cambio de estado:', statusResponse);
          console.log('Estado de cita actualizado a "aprobada"');
        } catch (error) {
          console.error('Error al cambiar estado de cita:', error);
          console.error('Detalles del error:', {
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : 'No stack available'
          });
          // No detener el flujo si falla el cambio de estado
        }
      } else {
        console.warn('No hay cita_id en la cotización:', quotation);
      }
      
      showSuccess(`${result.msg}`);
      
      onSuccess({
        ot_id: result.ot_id || 0,
        numero_ot: result.numero_ot || ''
      });
      
      onClose();
    } catch (err) {
      console.error('Error durante aprobación:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al aprobar cotización: ${errorMsg}`);
      showError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAlreadyApproved ? "Generar Orden de Trabajo" : "Aprobar Cotización y Generar Orden de Trabajo"}
      size="lg"
    >
      {quotation && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta si la cotización ya está aprobada */}
          {isAlreadyApproved && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Información:</strong> Esta cotización ya fue aprobada previamente. Este formulario generará la orden de trabajo asociada.
              </p>
            </div>
          )}
          
          {/* Información de la cotización */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-blue-900">Cotización</dt>
                  <dd className="text-sm text-blue-800">{quotation.numero_cotizacion}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-blue-900">Cliente</dt>
                  <dd className="text-sm text-blue-800">{quotation.nombre_cliente}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-blue-900">Vehículo</dt>
                  <dd className="text-sm text-blue-800">{quotation.placa_vehiculo}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-blue-900">Total</dt>
                  <dd className="text-sm text-blue-800 font-semibold">L{quotation.total?.toFixed(2)}</dd>
                </div>
              </div>
            </div>
          </Card>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Información requerida para la OT */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Información de la Orden de Trabajo</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>✓ Asesor responsable:</strong> Asignado automáticamente desde tu sesión (ID: {formData.asesor_id || 'Cargando...'})
              </p>
            </div>

            <Select
              label="Mecánico Encargado (Opcional)"
              value={formData.mecanico_encargado_id}
              onChange={(e) => handleInputChange('mecanico_encargado_id', e.target.value)}
              options={[
                { value: '', label: 'Seleccionar mecánico (opcional)...' },
                ...users.filter(u => u.rol === 'mecanico').map(m => ({ value: m.id.toString(), label: m.nombre }))
              ]}
            />

            <Input
              label="Odómetro de Ingreso (km)"
              type="number"
              step="0.1"
              min="0"
              value={formData.odometro_ingreso}
              onChange={(e) => handleInputChange('odometro_ingreso', e.target.value)}
              placeholder="Ej: 45230.5"
            />

            <Input
              label="Fecha Estimada de Completado *"
              type="date"
              value={formData.fecha_estimada}
              onChange={(e) => handleInputChange('fecha_estimada', e.target.value)}
              required
            />

            <Input
              label="Horas Estimadas de Trabajo *"
              type="number"
              step="0.5"
              min="0.5"
              value={formData.hora_estimada}
              onChange={(e) => handleInputChange('hora_estimada', e.target.value)}
              placeholder="Ej: 2 (para 02:00:00) o 2.5 (para 02:30:00)"
              required
            />
          </div>

          {/* Información importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> {isAlreadyApproved 
                ? 'Se generará una orden de trabajo con las especificaciones proporcionadas. Los servicios cotizados se convertirán en tareas de la orden de trabajo.'
                : 'Al aprobar esta cotización, se generará automáticamente una orden de trabajo con las especificaciones proporcionadas. Los servicios cotizados se convertirán en tareas de la orden de trabajo.'}
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
              variant="primary"
              disabled={loading}
            >
              {loading 
                ? (isAlreadyApproved ? 'Generando OT...' : 'Aprobando y generando OT...') 
                : (isAlreadyApproved ? 'Generar OT' : ' Aprobar y Generar OT')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
