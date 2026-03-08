import React, { useState } from 'react';
import { appConfig } from '../../config/config';
import { Button, Input } from '../comunes/UI';

interface ForgotPasswordFormProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

export function ForgotPasswordForm({ onSuccess, onCancel }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('El email no es válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📧 Enviando solicitud de recuperación para:', email);
      
      const response = await fetch(`${appConfig.apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('📝 Respuesta del servidor:', data);
      
      if (data.success) {
        console.log('✅ Solicitud de recuperación exitosa');
        console.log('🎟️ Token generado:', data.token);
        
        // Marcar como enviado y pasar el token
        setEmailSent(true);
        
        // Después de 2 segundos, pasar al siguiente paso
        setTimeout(() => {
          onSuccess(data.token);
        }, 2000);
      } else {
        console.log('❌ Error en solicitud:', data.message);
        setError(data.message || 'Error al solicitar recuperación de contraseña');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setError('Error de conexión con el servidor. Verifique que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Correo Enviado!</h2>
          <p className="text-sm text-gray-600 mt-2">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Pasos a seguir:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Revise su bandeja de entrada</li>
            <li>Haga clic en el enlace del correo</li>
            <li>Establezca su nueva contraseña</li>
          </ol>
          <p className="mt-2 text-xs">El enlace expirará en 1 hora.</p>
        </div>

        <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-md border border-yellow-200">
          <strong>Nota de Desarrollo:</strong> En este entorno de desarrollo, será redirigido automáticamente 
          al formulario de recuperación.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h2>
        <p className="text-sm text-gray-600 mt-2">
          Ingrese su dirección de correo electrónico y le enviaremos un enlace para restablecer su contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Correo Electrónico"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          error={error}
          placeholder="su.correo@ejemplo.com"
          required
          disabled={loading}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
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
            Volver al Login
          </Button>
          
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </Button>
        </div>
      </form>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-200">
        <strong> Información:</strong> El sistema generará un token único con validez de una hora.
      </div>
    </div>
  );
}