import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../comunes/UI';
import type { WorkOrderData } from '../../servicios/workOrdersService';
import { getClientDisplayName, getVehicleDisplayName } from '../../utilidades/dataMappers';

interface AdditionalQuotationFormProps {
  workOrder: WorkOrderData | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const AdditionalQuotationForm: React.FC<AdditionalQuotationFormProps> = ({
  workOrder,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    serviciosEncontrados: '',
    descripcionProblema: '',
    serviciosRecomendados: '',
    costoEstimado: '',
    urgencia: 'media' as 'baja' | 'media' | 'alta',
    notas: ''
  });

  const [displayNames, setDisplayNames] = useState({
    clientName: '',
    vehicleName: ''
  });

  useEffect(() => {
    const loadDisplayNames = async () => {
      if (workOrder) {
        const [clientName, vehicleName] = await Promise.all([
          getClientDisplayName(workOrder.clienteId),
          getVehicleDisplayName(workOrder.vehiculoId)
        ]);
        setDisplayNames({ clientName, vehicleName });
      }
    };
    loadDisplayNames();
  }, [workOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviciosEncontrados.trim() || 
        !formData.descripcionProblema.trim() || 
        !formData.serviciosRecomendados.trim() || 
        !formData.costoEstimado.trim()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (isNaN(parseFloat(formData.costoEstimado)) || parseFloat(formData.costoEstimado) <= 0) {
      alert('El costo estimado debe ser un número válido mayor a 0');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">Orden de Trabajo</h4>
        <p className="text-sm text-blue-800">
          <strong>ID:</strong> {workOrder?.id}<br />
          <strong>Cliente:</strong> {displayNames.clientName}<br />
          <strong>Vehículo:</strong> {displayNames.vehicleName}<br />
          <strong>Descripción:</strong> {workOrder?.descripcion}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Servicios Encontrados Durante la Revisión *
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={formData.serviciosEncontrados}
          onChange={(e) => handleChange('serviciosEncontrados', e.target.value)}
          placeholder="Describa qué servicios o problemas adicionales encontró..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción del Problema *
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={formData.descripcionProblema}
          onChange={(e) => handleChange('descripcionProblema', e.target.value)}
          placeholder="Explique el problema detectado en detalle..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Servicios Recomendados *
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={formData.serviciosRecomendados}
          onChange={(e) => handleChange('serviciosRecomendados', e.target.value)}
          placeholder="Describa los servicios que recomienda para solucionar el problema..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Costo Estimado (L.) *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.costoEstimado}
            onChange={(e) => handleChange('costoEstimado', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nivel de Urgencia *
          </label>
          <Select
            value={formData.urgencia}
            onChange={(e) => handleChange('urgencia', e.target.value)}
            options={[
              { value: 'baja', label: '🟢 Baja - Puede esperar' },
              { value: 'media', label: '🟡 Media - Recomendado pronto' },
              { value: 'alta', label: '🔴 Alta - Urgente' }
            ]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas Adicionales
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          value={formData.notas}
          onChange={(e) => handleChange('notas', e.target.value)}
          placeholder="Información adicional o aclaraciones..."
        />
      </div>

      <div className="border-t pt-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Importante:</strong> Esta subcotización se enviará automáticamente al cliente 
            a través del chat y aparecerá en su panel para aprobación.
          </p>
        </div>

        <div className="flex space-x-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Enviar Subcotización al Cliente
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AdditionalQuotationForm;