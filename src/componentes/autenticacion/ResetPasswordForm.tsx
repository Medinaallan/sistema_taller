import React, { useState, useEffect } from 'react';
import { Button, Input } from '../comunes/UI';

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ResetPasswordForm({ token, onSuccess, onCancel }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(true);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    setValidating(true);
    try {
      console.log('🔍 Validando token:', token);
      
      const response = await fetch('http://localhost:8080/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      console.log('📝 Respuesta de validación:', data);
      
      setTokenValid(data.success);
      
      if (!data.success) {
        setErrors({ general: data.message || 'Token inválido o expirado' });
      }
    } catch (error) {
      console.error('❌ Error validando token:', error);
      setTokenValid(false);
      setErrors({ general: 'Error de conexión con el servidor' });
    } finally {
      setValidating(false);
    }
  };

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

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Debe confirmar la nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      console.log('🔄 Restableciendo contraseña con token:', token);
      
      const response = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token: token,
          newPassword: formData.newPassword 
        })
      });

      const data = await response.json();
      console.log('📝 Respuesta del servidor:', data);
      
      if (data.success) {
        console.log('✅ Contraseña restablecida exitosamente');
        setSuccessMessage(true);
        
        // Esperar 4 segundos antes de redirigir
        setTimeout(() => {
          onSuccess();
        }, 4000);
      } else {
        console.log('❌ Error:', data.message);
        setErrors({ general: data.message || 'Error al restablecer la contraseña' });
      }
    } catch (error) {
      console.error('❌ Error restableciendo contraseña:', error);
      setErrors({ general: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de validación
  if (validating) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Validando Token...</h2>
          <p className="text-sm text-gray-600 mt-2">
            Verificando la validez del enlace de recuperación.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200 text-center">
          <strong>Verificando...</strong>
        </div>
      </div>
    );
  }

  // Pantalla de token inválido
  if (tokenValid === false) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Enlace Inválido</h2>
          <p className="text-sm text-gray-600 mt-2">
            El enlace de recuperación es inválido o ha expirado.
          </p>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">
              {errors.general}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">Posibles razones:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>El token ha expirado (validez: 1 hora)</li>
            <li>El token ya fue utilizado</li>
            <li>El enlace no es válido</li>
          </ul>
        </div>

        <Button
          onClick={onCancel}
          className="w-full"
        >
          Volver al Login
        </Button>
      </div>
    );
  }

  // Pantalla de éxito
  if (successMessage) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Contraseña Actualizada!</h2>
          <p className="text-sm text-gray-600 mt-2">
            Su contraseña ha sido restablecida exitosamente.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800 text-center">
          <p>Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  // Formulario de restablecimiento
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Restablecer Contraseña</h2>
        <p className="text-sm text-gray-600 mt-2">
          Ingrese su nueva contraseña. Debe tener al menos 6 caracteres.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          label="Nueva Contraseña"
          value={formData.newPassword}
          onChange={handleInputChange}
          error={errors.newPassword}
          placeholder="Mínimo 6 caracteres"
          required
          disabled={loading}
          autoComplete="new-password"
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirmar Nueva Contraseña"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          placeholder="Repita la contraseña"
          required
          disabled={loading}
          autoComplete="new-password"
        />

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">
              {errors.general}
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
          </Button>
        </div>
      </form>

      <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-md border border-green-200">
        <strong>✓ Token válido</strong> - Puede proceder a restablecer su contraseña.
      </div>
    </div>
  );
}