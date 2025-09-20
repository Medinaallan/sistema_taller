import React, { useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { ClientRegisterForm } from '../../componentes/autenticacion/ClientRegisterForm';
// import { obtenerClientesActualizados } from '../../utilidades/BaseDatosJS'; // Ya no se usa
import { mockUsers } from '../../utilidades/globalMockDatabaseFinal'; // ✅ CORREGIDO: usar el archivo con datos reales

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
      console.log('🔍 Intentando login con:', formData.email, formData.password);
      
      // ========================================
      // NUEVO MÉTODO: Usar endpoint de login del backend
      // ========================================
      
      try {
        console.log('� Probando login de cliente via API...');
        const response = await fetch('http://localhost:8080/api/clients/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        const data = await response.json();
        console.log('📊 Respuesta del login:', data);
        
        if (data.success && data.data) {
          // Cliente autenticado exitosamente
          const user = {
            id: data.data.id,
            email: data.data.email,
            password: formData.password, // Mantener password para compatibilidad
            role: 'client' as const,
            name: data.data.name,
            phone: data.data.phone,
            createdAt: new Date(data.data.created_at || new Date()),
            updatedAt: new Date(data.data.updated_at || new Date()),
          };
          
          console.log('✅ Cliente autenticado via API:', user);
          dispatch({ type: 'LOGIN', payload: user });
          return;
        } else {
          console.log('❌ Login de cliente fallido:', data.message);
        }
      } catch (clientError) {
        console.log('⚠️ Error en login de cliente, probando usuarios del sistema:', (clientError as Error).message);
      }

      // Intentar autenticación con usuarios del sistema (admin, mecánico, recepcionista)
      console.log('🔍 Probando login de usuarios del sistema...');
      console.log('👥 Usuarios disponibles:', mockUsers);
      console.log('🔑 Buscando:', { email: formData.email, password: formData.password });
      
      const systemUser = mockUsers.find(u => u.email === formData.email && u.password === formData.password);
      
      if (systemUser) {
        console.log('✅ Usuario del sistema autenticado:', systemUser);
        dispatch({ type: 'LOGIN', payload: systemUser });
        return;
      }

      // No se encontró usuario
      console.log('❌ No se encontró usuario válido');
      setErrors({ general: 'Email o contraseña incorrectos' });
      
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
      // Crear usuario administrador directamente en el contexto
      const newUser = {
        id: `admin-${Date.now()}`, // Generar ID temporal
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
