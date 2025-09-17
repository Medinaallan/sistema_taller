import React, { useState } from 'react';
import { Button, Input } from '../../componentes/comunes/UI';
import { crearCliente, ClienteNuevo } from '../../servicios/clientesApiService';

interface ClientRegisterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientRegisterForm({ onSuccess, onCancel }: ClientRegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const clienteData: ClienteNuevo = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim()
      };

      const nuevoCliente = await crearCliente(clienteData);
      
      console.log('✅ Cliente registrado exitosamente:', nuevoCliente);
      
      // Mostrar mensaje de éxito y redirigir
      alert(`¡Cliente registrado exitosamente!\n\nNombre: ${nuevoCliente.name}\nEmail: ${nuevoCliente.email}\nID: ${nuevoCliente.id}`);
      
      onSuccess();
      
    } catch (error: any) {
      console.error('❌ Error registrando cliente:', error);
      
      // Manejar errores específicos del servidor
      const errorMessage = error.message || 'Error desconocido';
      
      if (errorMessage.includes('email')) {
        setErrors({ email: 'Este email ya está registrado' });
      } else if (errorMessage.includes('servidor')) {
        setErrors({ general: 'Error de conexión con el servidor' });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Registrar Cliente
        </h2>
        <p className="text-sm text-gray-600 text-center mt-2">
          Complete el formulario para registrar un nuevo cliente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error general */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Nombre completo */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ejemplo: Juan Pérez"
            error={errors.name}
            disabled={loading}
            className="w-full"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="ejemplo@correo.com"
            error={errors.email}
            disabled={loading}
            className="w-full"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="555-0123"
            error={errors.phone}
            disabled={loading}
            className="w-full"
          />
        </div>

        {/* Dirección */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <Input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Calle 123, Ciudad"
            error={errors.address}
            disabled={loading}
            className="w-full"
          />
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas Adicionales
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Información adicional sobre el cliente..."
            disabled={loading}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Botones */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Registrando...
              </div>
            ) : (
              'Registrar Cliente'
            )}
          </Button>
        </div>
      </form>

      {/* Información */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-600">
          <strong>Nota:</strong> Los campos marcados con * son obligatorios. 
          El cliente será registrado directamente en el sistema.
        </p>
      </div>
    </div>
  );
}