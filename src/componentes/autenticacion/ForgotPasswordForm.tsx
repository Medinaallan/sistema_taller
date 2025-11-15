import React, { useState } from 'react';
import { Button, Input } from '../comunes/UI';

interface ForgotPasswordFormProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

export function ForgotPasswordForm({ onSuccess, onCancel }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
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
        onSuccess(data.token); // Para desarrollo, el token se pasa directamente
      } else {
        console.log('❌ Error en solicitud:', data.message);
        setError(data.message || 'Error al solicitar recuperación');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

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
        />

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
          >
            Volver al Login
          </Button>
          
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            Enviar Enlace
          </Button>
        </div>
      </form>

      <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-md">
        <strong>Nota de Desarrollo:</strong> En un entorno de producción, se enviaría un email con el enlace de recuperación.
        En este entorno de desarrollo, el token se mostrará directamente.
      </div>
    </div>
  );
}