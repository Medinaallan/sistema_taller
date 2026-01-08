import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, TextArea } from '../comunes/UI';
import workOrdersService, { WorkOrderData, TaskPriority } from '../../servicios/workOrdersService';
import { servicesService } from '../../servicios/apiService';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderData;
  onSuccess: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  workOrder,
  onSuccess 
}) => {
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo_servicio_id: '',
    descripcion: '',
    horas_estimadas: '',
    prioridad: 3 as TaskPriority
  });

  useEffect(() => {
    if (isOpen) {
      loadServicios();
      // Resetear formulario al abrir
      setFormData({
        tipo_servicio_id: '',
        descripcion: '',
        horas_estimadas: '',
        prioridad: 3
      });
    }
  }, [isOpen]);

  const loadServicios = async () => {
    try {
      setLoadingServicios(true);
      const response = await servicesService.getAll();
      if (response.success) {
        const mappedServices = response.data.map((service: any) => ({
          value: service.id.toString(),
          label: service.nombre
        }));
        setServicios(mappedServices);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
      alert('Error al cargar servicios disponibles');
    } finally {
      setLoadingServicios(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.tipo_servicio_id) {
      alert('Por favor selecciona un tipo de servicio');
      return;
    }

    if (!workOrder.id) {
      alert('No se puede agregar tarea: ID de orden inválido');
      return;
    }

    try {
      setLoading(true);
      
      const tareaData = {
        tipo_servicio_id: parseInt(formData.tipo_servicio_id),
        descripcion: formData.descripcion || undefined,
        horas_estimadas: formData.horas_estimadas ? parseFloat(formData.horas_estimadas) : undefined,
        prioridad: formData.prioridad
      };

      console.log('📤 Enviando datos de tarea:', tareaData);
      
      await workOrdersService.agregarTarea(workOrder.id, tareaData);
      
      alert('Tarea agregada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error agregando tarea:', error);
      alert('Error al agregar tarea: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Nueva Tarea a la Orden de Trabajo"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la OT */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Información de la Orden</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Orden:</span> #{workOrder.id?.slice(-8)}
            </div>
            <div>
              <span className="font-medium">Cliente:</span> {workOrder.clienteId}
            </div>
            <div>
              <span className="font-medium">Vehículo:</span> {workOrder.vehiculoId}
            </div>
            <div>
              <span className="font-medium">Estado:</span>{' '}
              <span className="font-semibold text-blue-600">{workOrder.estado}</span>
            </div>
          </div>
        </div>

        {/* Tipo de Servicio */}
        <Select
          label="Tipo de Servicio *"
          value={formData.tipo_servicio_id}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipo_servicio_id', e.target.value)}
          options={[
            { value: '', label: loadingServicios ? 'Cargando servicios...' : 'Selecciona un servicio' },
            ...servicios
          ]}
          required
          disabled={loadingServicios}
        />

        {/* Descripción */}
        <TextArea
          label="Descripción de la Tarea"
          value={formData.descripcion}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('descripcion', e.target.value)}
          placeholder="Describe los detalles específicos de esta tarea..."
          rows={3}
        />

        {/* Horas Estimadas */}
        <Input
          label="Horas Estimadas"
          type="number"
          step="0.25"
          min="0"
          value={formData.horas_estimadas}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('horas_estimadas', e.target.value)}
          placeholder="Ej: 2.5"
        />

        {/* Prioridad */}
        <Select
          label="Prioridad de la Tarea *"
          value={formData.prioridad.toString()}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('prioridad', parseInt(e.target.value) as TaskPriority)}
          options={workOrdersService.getPriorityOptions().map(opt => ({
            value: opt.value.toString(),
            label: opt.label
          }))}
          required
        />

        {/* Información sobre prioridades */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 mb-2">ℹ️ Sobre las Prioridades:</h5>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li><strong>Baja (1):</strong> Tareas estéticas o ruidos leves sin urgencia</li>
            <li><strong>Media-Baja (2):</strong> Mantenimientos preventivos programados</li>
            <li><strong>Normal (3):</strong> La mayoría de las tareas operativas (predeterminado)</li>
            <li><strong>Alta (4):</strong> Afecta la seguridad del vehículo o el cliente está esperando</li>
            <li><strong>Crítica (5):</strong> Garantías, retrabajos, emergencias o vehículos que bloquean operaciones clave</li>
          </ul>
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
            disabled={loading || loadingServicios}
          >
            {loading ? 'Agregando...' : 'Agregar Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;
