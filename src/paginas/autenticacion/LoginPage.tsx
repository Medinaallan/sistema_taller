import React, { useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { ClientRegisterForm } from '../../componentes/autenticacion/ClientRegisterForm';
import { 
  SP_LOGIN,
  SP_REGISTRAR_USUARIO_PANEL_ADMIN
} from '../../utilidades/storedProceduresBackend';
import { generateId } from '../../utilidades/globalMockDatabase';

type ViewMode = 'login' | 'setup' | 'clientRegister';

export function LoginPage() {
  const { state, dispatch } = useApp();
  
  // Determinar modo inicial basado en usuarios existentes
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return state.users.length === 0 ? 'setup' : 'login';
  });
  
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

    if (viewMode === 'setup') {
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

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await SP_LOGIN(formData.email, formData.password);
      
      if (result.allow === 1 && result.usuario) {
        // Crear objeto User para el contexto usando la estructura exacta de tu SP
        const user = {
          id: result.usuario.usuario_id.toString(),
          email: result.usuario.correo,
          password: formData.password, // Mantener para compatibilidad
          role: result.usuario.rol === 'admin' ? 'admin' as const : 'client' as const,
          name: result.usuario.nombre_completo,
          phone: result.usuario.telefono || '', // Del SP
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        dispatch({ type: 'LOGIN', payload: user });
      } else {
        setErrors({ general: result.msg || 'Error en el inicio de sesión' });
      }
    } catch (error) {
      console.error('Error en login:', error);
      setErrors({ general: 'Error al iniciar sesión. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAdmin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await SP_REGISTRAR_USUARIO_PANEL_ADMIN(
        formData.name,
        formData.email,
        '', // telefono - no disponible en el form, usar cadena vacía
        'admin' // rol
      );
      
      if (result.allow === 1 || result.response === '200 OK') {
        // Crear usuario administrador directamente en el contexto
        const newUser = {
          id: generateId(), // Generar ID temporal
          email: formData.email,
          password: formData.password,
          role: 'admin' as const,
          name: formData.name,
          phone: formData.phone,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        dispatch({ type: 'ADD_USER', payload: newUser });
        dispatch({ type: 'LOGIN', payload: newUser });
        setViewMode('login');
        setFormData({ email: '', password: '', name: '', phone: '' });
        setErrors({});
      } else {
        setErrors({ general: result.msg || 'Error al crear administrador' });
      }
    } catch (error) {
      console.error('Error creando administrador:', error);
      setErrors({ general: 'Error al configurar administrador. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClientRegisterSuccess = () => {
    setViewMode('login');
    setFormData({ email: '', password: '', name: '', phone: '' });
    setErrors({});
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'setup': return 'Configuración Inicial';
      case 'clientRegister': return 'Registro de Cliente';
      default: return 'Iniciar Sesión';
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'setup': return 'Crear el primer usuario administrador del sistema';
      case 'clientRegister': return 'Crear una cuenta de cliente';
      default: return 'Sistema de Gestión para Talleres Mecánicos';
    }
  };

  if (viewMode === 'clientRegister') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <WrenchScrewdriverIcon className="h-12 w-12 text-blue-600" />
                <span className="ml-2 text-3xl font-bold text-gray-900">PruebaProject</span>
              </div>
            </div>
            
            <ClientRegisterForm
              onSuccess={handleClientRegisterSuccess}
              onCancel={() => setViewMode('login')}
            />
          </div>
        </div>
      </div>
    );
  }

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
            {getTitle()}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getDescription()}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => {
          e.preventDefault();
          viewMode === 'setup' ? handleSetupAdmin() : handleLogin();
        }}>
          <div className="space-y-4">
            {viewMode === 'setup' && (
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
              placeholder="usuario@taller.com"
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

          {viewMode === 'login' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-xs text-blue-700 space-y-1">
                <div className="text-xs text-blue-600 mt-2 italic">
                  * Usuarios de prueba:
                  <div>Admin: admin@taller.com / admin123</div>
                  <div>Recep: recep@taller.com / recep123</div>
                  <div>Mec: mecanico@taller.com / mec123</div>
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
              {viewMode === 'setup' ? 'Crear Administrador' : 'Iniciar Sesión'}
            </Button>
          </div>

          {viewMode === 'login' && (
            <div className="text-center space-y-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500"
                onClick={() => setViewMode('clientRegister')}
              >
                ¿Eres cliente? Registra tu cuenta aquí
              </button>
              
              {state.users.length > 0 && (
                <div>
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-400"
                    onClick={() => {/* Implementar recuperación de contraseña */}}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
