import React, { useState, useEffect } from 'react';
import { Input, Button, Select } from '../comunes/UI';

interface ServiceFormData {
  nombre: string;
  descripcion: string;
  precio: string;
  duracion: string;
  categoria: string;
}

interface ServiceFormProps {
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  initialValues?: Partial<ServiceFormData>;
}

const categorias = [
  { value: '', label: 'Seleccionar categoría...' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'instalacion', label: 'Instalación' },
  { value: 'revision', label: 'Revisión' },
  { value: 'otros', label: 'Otros' },
];

export function ServiceForm({ onSubmit, onCancel, loading = false, initialValues }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    nombre: initialValues?.nombre || '',
    descripcion: initialValues?.descripcion || '',
    precio: initialValues?.precio || '',
    duracion: initialValues?.duracion || '',
    categoria: initialValues?.categoria || '',
  });

  // Actualizar cuando cambien las initialValues (p. ej. al editar)
  useEffect(() => {
    if (!initialValues) return;
    setFormData(prev => ({
      nombre: initialValues.nombre ?? prev.nombre,
      descripcion: initialValues.descripcion ?? prev.descripcion,
      precio: initialValues.precio ?? prev.precio,
      duracion: initialValues.duracion ?? prev.duracion,
      categoria: initialValues.categoria ?? prev.categoria,
    }));
  }, [initialValues]);

  const [errors, setErrors] = useState<Partial<ServiceFormData>>({});

  const handleInputChange = (field: keyof ServiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ServiceFormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es requerido';
    } else {
      const precio = parseFloat(formData.precio);
      if (isNaN(precio) || precio <= 0) {
        newErrors.precio = 'El precio debe ser un número mayor a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Nombre del Servicio */}
        <Input
          id="nombre"
          label="Nombre del Servicio *"
          type="text"
          value={formData.nombre}
          onChange={(e) => handleInputChange('nombre', e.target.value)}
          error={errors.nombre}
          placeholder="Ej: Cambio de aceite"
          disabled={loading}
        />

        {/* Descripción */}
        <div>
          <label className="label" htmlFor="descripcion">
            Descripción
          </label>
          <textarea
            id="descripcion"
            className="input-field"
            rows={3}
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            placeholder="Descripción detallada del servicio..."
            disabled={loading}
          />
          {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
        </div>

        {/* Precio */}
        <Input
          id="precio"
          label="Precio (L.) *"
          type="number"
          step="0.01"
          min="0"
          value={formData.precio}
          onChange={(e) => handleInputChange('precio', e.target.value)}
          error={errors.precio}
          placeholder="0.00"
          disabled={loading}
        />

        {/* Duración Estimada */}
        <Input
          id="duracion"
          label="Duración Estimada"
          type="text"
          value={formData.duracion}
          onChange={(e) => handleInputChange('duracion', e.target.value)}
          error={errors.duracion}
          placeholder="Ej: 2 horas"
          disabled={loading}
        />

        {/* Categoría */}
        <Select
          id="categoria"
          label="Categoría"
          value={formData.categoria}
          onChange={(e) => handleInputChange('categoria', e.target.value)}
          error={errors.categoria}
          options={categorias}
          disabled={loading}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Servicio'}
        </Button>
      </div>
    </form>
  );
}

export default ServiceForm;