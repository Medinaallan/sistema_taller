import { appConfig } from '../../config/config';
import React, { useState } from 'react';
import { Button, Input } from '../comunes/UI';
import { useApp } from '../../contexto/useApp';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const { state } = useApp();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Debe verificar la nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!state.user?.id) {
      setErrors({ general: 'Usuario no identificado' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario_id: parseInt(state.user.id),
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setErrors({});
        if (onSuccess) onSuccess();
      } else {
        setErrors({ general: data.message || 'Error al cambiar contraseña' });
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setErrors({ general: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>
        <p className="text-sm text-gray-600 mt-1">
          Por seguridad, necesitamos verificar tu contraseña actual antes de cambiarla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          label="Contraseña Actual"
          value={formData.currentPassword}
          onChange={handleInputChange}
          error={errors.currentPassword}
          placeholder="Ingrese su contraseña actual"
          required
        />

        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          label="Nueva Contraseña"
          value={formData.newPassword}
          onChange={handleInputChange}
          error={errors.newPassword}
          placeholder="Ingrese la nueva contraseña"
          required
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Verificar Nueva Contraseña"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          placeholder="Confirme la nueva contraseña"
          required
        />

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">
              {errors.general}
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            Cambiar Contraseña
          </Button>
        </div>
      </form>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-xs text-blue-700">
          <strong>Consejos de seguridad:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Use al menos 6 caracteres</li>
            <li>Combine letras, números y símbolos</li>
            <li>Evite palabras comunes o información personal</li>
            <li>No comparta su contraseña con nadie</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
