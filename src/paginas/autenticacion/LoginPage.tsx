import React, { useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import { ClientRegisterForm } from '../../componentes/autenticacion/ClientRegisterForm';
import { ForgotPasswordForm } from '../../componentes/autenticacion/ForgotPasswordForm';
import { ResetPasswordForm } from '../../componentes/autenticacion/ResetPasswordForm';
import { InitialSetupPage } from './InitialSetupPage';
import '../../estilos/login-animations.css';
// import { obtenerClientesActualizados } from '../../utilidades/BaseDatosJS'; // Ya no se usa
// import { mockUsers } from '../../utilidades/globalMockDatabaseFinal'; // Ya no necesario - ahora usa SP_LOGIN real

type ViewMode = 'login' | 'setup' | 'clientRegister' | 'initialSetup' | 'forgotPassword' | 'resetPassword';

// Función para mapear roles del SP al formato del frontend
const mapRoleFromSP = (roleSP: string): 'admin' | 'client' | 'mechanic' | 'receptionist' => {
  const roleMap: Record<string, 'admin' | 'client' | 'mechanic' | 'receptionist'> = {
    'Administrador': 'admin',
    'Mecánico': 'mechanic', 
    'Recepcionista': 'receptionist',
    'Cliente': 'client',
    // Fallbacks en inglés
    'admin': 'admin',
    'mechanic': 'mechanic',
    'receptionist': 'receptionist', 
    'client': 'client'
  };
  
  return roleMap[roleSP] || 'client';
};

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
  const [resetToken, setResetToken] = useState<string>('');

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
      console.log('🔍 Autenticando con SP_LOGIN:', formData.email, formData.password);
      
      // ========================================
      // USAR EXCLUSIVAMENTE SP_LOGIN REAL (REQUIERE VPN)
      // ========================================
      
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      console.log('📊 Respuesta del SP_LOGIN:', data);
      
      // Verificar si la respuesta tiene formato nuevo (directo del SP) o formato anterior (con allow)
      const isDirectSPResponse = data.usuario_id && data.correo && data.nombre_completo;
      const isOldFormatResponse = data.allow === 1 && data.usuario;
      
      if (isDirectSPResponse || isOldFormatResponse) {
        // Normalizar datos del usuario según el formato de respuesta
        const userData = isDirectSPResponse ? data : data.usuario;
        
        const user = {
          id: userData.usuario_id.toString(),
          email: userData.correo,
          password: formData.password,
          role: mapRoleFromSP(userData.rol),
          name: userData.nombre_completo,
          phone: userData.telefono || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Guardar usuario_id explícitamente en localStorage
        localStorage.setItem('usuario_id', user.id);
        console.log('✅ Usuario autenticado via SP_LOGIN:', user);
        dispatch({ type: 'LOGIN', payload: user });
        return;
      } else {
        console.log('❌ Credenciales inválidas:', data.msg || 'Usuario o contraseña incorrectos');
        setErrors({ general: data.msg || 'Usuario o contraseña incorrectos' });
        return;
      }
      
    } catch (error) {
      console.error('❌ Error conectando con SP_LOGIN:', error);
      
      // Determinar tipo de error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrors({ 
          general: 'Error de conexión: No se puede conectar con el servidor backend (puerto 8080)' 
        });
      } else if (error instanceof Error && error.message.includes('NetworkError')) {
        setErrors({ 
          general: 'Error de red: Verifique su conexión VPN e intente nuevamente' 
        });
      } else {
        setErrors({ 
          general: 'Error de conexión con la base de datos. Verifique su VPN.' 
        });
      }
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

  const handleForgotPasswordSuccess = (token: string) => {
    setResetToken(token);
    setViewMode('resetPassword');
  };

  const handleResetPasswordSuccess = () => {
    setViewMode('login');
    setResetToken('');
    setErrors({});
    // Mostrar mensaje de éxito (opcional)
  };

  const handleBackToLogin = () => {
    setViewMode('login');
    setResetToken('');
    setFormData({ email: '', password: '', name: '', phone: '' });
    setErrors({});
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'setup': return 'Configuración Inicial';
      case 'clientRegister': return 'Registro de Cliente';
      case 'initialSetup': return 'Configuración del Sistema';
      case 'forgotPassword': return 'Recuperar Contraseña';
      case 'resetPassword': return 'Restablecer Contraseña';
      default: return 'Iniciar Sesión';
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'setup': return 'Crear el primer usuario administrador del sistema';
      case 'clientRegister': return 'Crear una cuenta de cliente';
      case 'initialSetup': return 'Registrar usuarios usando stored procedures reales';
      case 'forgotPassword': return 'Solicitar enlace de recuperación por email';
      case 'resetPassword': return 'Establecer nueva contraseña';
      default: return 'Sistema de Gestión para Talleres Mecánicos';
    }
  };

  if (viewMode === 'forgotPassword') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Animation Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="backdrop-blur-sm bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg mb-4">
                  <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Sistema Taller
                </h1>
              </div>
              
              <ForgotPasswordForm
                onSuccess={handleForgotPasswordSuccess}
                onCancel={handleBackToLogin}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'resetPassword') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Animation Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="backdrop-blur-sm bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg mb-4">
                  <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Sistema Taller
                </h1>
              </div>
              
              <ResetPasswordForm
                token={resetToken}
                onSuccess={handleResetPasswordSuccess}
                onCancel={handleBackToLogin}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'clientRegister') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Animation Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="backdrop-blur-sm bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg mb-4">
                  <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Sistema Taller
                </h1>
              </div>
              
              <ClientRegisterForm
                onSuccess={handleClientRegisterSuccess}
                onCancel={() => setViewMode('login')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'initialSetup') {
    return (
      <InitialSetupPage
        onComplete={() => setViewMode('login')}
        onCancel={() => setViewMode('login')}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Animation Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout - Dos columnas */}
        <div className="hidden lg:flex w-full max-w-6xl">
          {/* Columna izquierda - Información */}
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="max-w-lg">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl shadow-lg mb-6">
                  <WrenchScrewdriverIcon className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                  Sistema Taller
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6"></div>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Gestión completa y moderna para talleres mecánicos. 
                  Controla inventario, citas, clientes y órdenes de trabajo 
                  desde una plataforma integral.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-300">Gestión de clientes y vehículos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Control de inventario</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-gray-300">Programación de citas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-300">Órdenes de trabajo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Formulario */}
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="w-full max-w-md">
              <div className="backdrop-blur-sm bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
                {/* Title Section */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {getTitle()}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    {getDescription()}
                  </p>
                </div>

                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  viewMode === 'setup' ? handleSetupAdmin() : handleLogin();
                }}>
                  <div className="space-y-5">
                    {viewMode === 'setup' && (
                      <>
                        <div className="group">
                          <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                            Nombre Completo
                          </label>
                          <div className="relative">
                            <input
                              id="name"
                              name="name"
                              type="text"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Tu nombre completo"
                              required
                              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                            />
                            {errors.name && (
                              <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="group">
                          <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                            Teléfono
                          </label>
                          <div className="relative">
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Tu número de teléfono"
                              required
                              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                            />
                            {errors.phone && (
                              <p className="mt-2 text-sm text-red-400">{errors.phone}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="usuario@taller.com"
                          required
                          className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                        {errors.email && (
                          <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          required
                          className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                        {errors.password && (
                          <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors.general && (
                    <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-sm text-red-300">
                        {errors.general}
                      </div>
                    </div>
                  )}

                  {viewMode === 'login' && (
                    <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-xs space-y-1">
                        <div className="font-mono text-sm">admin@taller.com</div>
                        <div className="font-mono text-sm">admin123</div>
                      </div>
                    </div>
                  )}

                  {/* Login Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <WrenchScrewdriverIcon className="h-5 w-5 text-purple-300 group-hover:text-purple-200" />
                        )}
                      </span>
                      <span className="ml-3">
                        {loading 
                          ? 'Iniciando sesión...' 
                          : (viewMode === 'setup' ? 'Crear Administrador' : 'Iniciar Sesión')
                        }
                      </span>
                    </button>
                  </div>

                  {viewMode === 'login' && (
                    <div className="text-center space-y-4 pt-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-transparent text-gray-400">o</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          className="w-full text-sm text-gray-300 hover:text-white transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-white/5"
                          onClick={() => setViewMode('clientRegister')}
                        >
                          ¿Eres cliente? <span className="text-purple-400 font-medium">Registra tu cuenta aquí</span>
                        </button>

                        <button
                          type="button"
                          className="w-full text-sm text-gray-300 hover:text-white transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-white/5"
                          onClick={() => setViewMode('initialSetup')}
                        >
                          <span className="text-green-400 font-medium">⚙️ Configuración Inicial del Sistema</span>
                        </button>
                        
                        {state.users.length > 0 && (
                          <button
                            type="button"
                            className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-white/5"
                            onClick={() => setViewMode('forgotPassword')}
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Una columna */}
        <div className="lg:hidden max-w-md w-full">
          <div className="backdrop-blur-sm bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.02] transition-all duration-300">
            {/* Logo Section Mobile */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg mb-4">
                <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                Sistema Taller
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto"></div>
            </div>

            {/* Title Section Mobile */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {getTitle()}
              </h2>
              <p className="text-gray-300 text-sm">
                {getDescription()}
              </p>
            </div>

            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              viewMode === 'setup' ? handleSetupAdmin() : handleLogin();
            }}>
              <div className="space-y-5">
                {viewMode === 'setup' && (
                  <>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Tu nombre completo"
                          required
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                        {errors.name && (
                          <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                        Teléfono
                      </label>
                      <div className="relative">
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Tu número de teléfono"
                          required
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                        {errors.phone && (
                          <p className="mt-2 text-sm text-red-400">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="usuario@taller.com"
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-white transition-colors">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                    )}
                  </div>
                </div>
              </div>

              {errors.general && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-sm text-red-300">
                    {errors.general}
                  </div>
                </div>
              )}

              {viewMode === 'login' && (
                <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs text-amber-300 space-y-1">
                    <div className="font-mono">admin@taller.com</div>
                    <div className="font-mono">admin123</div>
                  </div>
                </div>
              )}

              {/* Login Button Mobile */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <WrenchScrewdriverIcon className="h-5 w-5 text-purple-300 group-hover:text-purple-200" />
                    )}
                  </span>
                  <span className="ml-3">
                    {loading 
                      ? 'Iniciando sesión...' 
                      : (viewMode === 'setup' ? 'Crear Administrador' : 'Iniciar Sesión')
                    }
                  </span>
                </button>
              </div>

              {viewMode === 'login' && (
                <div className="text-center space-y-4 pt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-transparent text-gray-400">o</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      className="w-full text-sm text-gray-300 hover:text-white transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-white/5"
                      onClick={() => setViewMode('clientRegister')}
                    >
                      ¿Eres cliente? <span className="text-purple-400 font-medium">Registra tu cuenta aquí</span>
                    </button>

                    <button
                      type="button"
                      className="w-full text-sm text-gray-300 hover:text-white transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-white/5"
                      onClick={() => setViewMode('initialSetup')}
                    >
                      <span className="text-green-400 font-medium">⚙️ Configuración Inicial del Sistema</span>
                    </button>
                    
                    {state.users.length > 0 && (
                      <button
                        type="button"
                        className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-white/5"
                        onClick={() => setViewMode('forgotPassword')}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer Mobile */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              Sistema de Gestión para Talleres Mecánicos
            </p>
            <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-500">
              <span>v2.0</span>
              <span>•</span>
              <span>2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
