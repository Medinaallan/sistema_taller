import React, { useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { generateId } from '../../utilidades/globalMockDatabase';

export function LoginPage() {
  const { state, dispatch } = useApp();
  const [isRegistering, setIsRegistering] = useState(state.users.length === 0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (isRegistering) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'El teléfono es requerido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isRegistering) {
        // Crear primer usuario administrador
        const newUser = {
          id: generateId(),
          email: formData.email,
          password: formData.password,
          role: 'admin' as const,
          name: formData.name,
          phone: formData.phone,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Agregar usuario al estado del contexto
        dispatch({ type: 'ADD_USER', payload: newUser });
        dispatch({ type: 'LOGIN', payload: newUser });
        setIsRegistering(false);
      } else {
        // Buscar usuario en el estado del contexto
        const user = state.users.find(
          u => u.email === formData.email && u.password === formData.password
        );

        if (user) {
          dispatch({ type: 'LOGIN', payload: user });
        } else {
          setErrors({ general: 'Credenciales inválidas' });
        }
      }
    } catch {
      setErrors({ general: isRegistering ? 'Error al registrar usuario' : 'Error al iniciar sesión. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-12 w-12 text-blue-600" />
              <span className="ml-2 text-3xl font-bold text-gray-900">PruebaProject</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Configuración Inicial' : 'Iniciar Sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering 
              ? 'Crear el primer usuario administrador del sistema' 
              : 'Sistema de Gestión para Talleres Mecánicos'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegistering && (
              <>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  label="Nombre Completo"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  placeholder="Tu nombre completo"
                  required
                />
                
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  label="Teléfono"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={errors.phone}
                  placeholder="Tu número de teléfono"
                  required
                />
              </>
            )}
            
            <Input
              id="email"
              name="email"
              type="email"
              label="Correo Electrónico"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder= "usuario@talleR.com"
              required
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder="••••••••"
              required
            />
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">
                {errors.general}
              </div>
            </div>
          )}

          {!isRegistering && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Sistema de Gestión de Taller</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Gestión completa de órdenes de trabajo</div>
                <div>• Control de inventario y servicios</div>
                <div>• Reportes y análisis de rendimiento</div>
                <div>• Seguimiento de clientes y vehículos</div>
                <div className="text-xs text-blue-600 mt-2 italic">
                  * Contacte al administrador para obtener acceso al sistema
                  <div>Admin: admin@taller.com / Contraseña: admin123</div>
                  <div>Recep: recep@taller.com / Contraseña: recep123</div>
                  <div>Mec: mecanico@taller.com / Contraseña: mec123</div>
                  <div>Cliente: se genera desde el panel del admin</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              {isRegistering ? 'Crear Administrador' : 'Iniciar Sesión'}
            </Button>
          </div>

          {!isRegistering && state.users.length > 0 && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500"
                onClick={() => {/* Implementar recuperación de contraseña */}}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
