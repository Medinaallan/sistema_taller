import React, { useState, useEffect } from 'react';
import { WrenchScrewdriverIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';

// Tipos para el formulario
interface FormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  confirmPassword: string;
}

interface Role {
  rol_id: number;
  nombre: string;
  descripcion: string;
}

interface InitialSetupPageProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function InitialSetupPage({ onComplete, onCancel }: InitialSetupPageProps) {
  const { dispatch } = useApp();
  
  const [currentStep, setCurrentStep] = useState<'register' | 'password'>('register');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Cargar roles al montar el componente
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      console.log('📋 Cargando roles desde SP_OBTENER_ROLES...');
      
      const response = await fetch('http://localhost:8080/api/users/roles');
      const data = await response.json();
      
      if (data.success && data.data) {
        setRoles(data.data);
        console.log('✅ Roles cargados:', data.data);
        
        // Auto-seleccionar rol de Administrador si existe
        const adminRole = data.data.find((role: Role) => 
          role.nombre.toLowerCase().includes('admin')
        );
        if (adminRole) {
          setFormData(prev => ({ ...prev, role: adminRole.nombre }));
        }
      } else {
        console.error(' Error obteniendo roles:', data.message);
        // Fallback roles si no se pueden cargar desde la DB
        setRoles([
          { rol_id: 1, nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
          { rol_id: 2, nombre: 'Mecánico', descripcion: 'Gestión de servicios y reparaciones' },
          { rol_id: 3, nombre: 'Recepcionista', descripcion: 'Atención al cliente y citas' }
        ]);
        setFormData(prev => ({ ...prev, role: 'Administrador' }));
      }
    } catch (error) {
      console.error(' Error de conexión cargando roles, usando fallback:', error);
      // Roles de emergencia si no hay conexión
      setRoles([
        { rol_id: 1, nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
        { rol_id: 2, nombre: 'Mecánico', descripcion: 'Gestión de servicios y reparaciones' },
        { rol_id: 3, nombre: 'Recepcionista', descripcion: 'Atención al cliente y citas' }
      ]);
      setFormData(prev => ({ ...prev, role: 'Administrador' }));
    } finally {
      setRolesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Debe seleccionar un rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirme su contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterUser = async () => {
    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      console.log('🚀 Registrando usuario inicial con SP_REGISTRAR_USUARIO_PANEL_ADMIN:', formData);

      // Llamar al SP_REGISTRAR_USUARIO_PANEL_ADMIN real
      const response = await fetch('http://localhost:8080/api/users/panel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre_completo: formData.name,
          correo: formData.email,
          telefono: formData.phone,
          rol: formData.role,
          registradoPor: null // Primer usuario del sistema
        })
      });

      const result = await response.json();
      console.log('📊 Respuesta del SP:', result);

      if (result.success) {
        console.log('✅ Usuario registrado exitosamente, paso 2: establecer contraseña');
        setCurrentStep('password');
        setErrors({}); // Limpiar errores
      } else {
        console.error('❌ Error registrando usuario:', result.message);
        setErrors({ 
          general: result.message || 'Error al registrar usuario. Verifique los datos.' 
        });
      }
    } catch (error) {
      console.error('⚠️ Error de conexión:', error);
      setErrors({ 
        general: 'Error de conexión con el servidor. Verifique su VPN y que el backend esté funcionando.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      console.log('🔒 Estableciendo contraseña con SP_REGISTRAR_PASSWORD:', formData.email);

      // Llamar al SP_REGISTRAR_PASSWORD real
      const response = await fetch('http://localhost:8080/api/auth/register-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();
      console.log('📊 Respuesta del SP_REGISTRAR_PASSWORD:', result);

      if (result.allow === 1) {
        console.log('✅ Contraseña establecida exitosamente');
        
        // Crear usuario para el contexto local con la contraseña real
        const newUser = {
          id: Date.now().toString(),
          email: formData.email,
          password: formData.password,
          role: formData.role.toLowerCase().replace('administrador', 'admin').replace('mecánico', 'mechanic').replace('recepcionista', 'receptionist') as 'admin' | 'mechanic' | 'receptionist',
          name: formData.name,
          phone: formData.phone,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Agregar al contexto y hacer login automático
        dispatch({ type: 'ADD_USER', payload: newUser });
        dispatch({ type: 'LOGIN', payload: newUser });
        
        onComplete();
      } else {
        console.error('❌ Error estableciendo contraseña:', result.msg);
        setErrors({ 
          general: result.msg || 'Error al establecer contraseña. Intente nuevamente.' 
        });
      }
    } catch (error) {
      console.error('⚠️ Error de conexión:', error);
      setErrors({ 
        general: 'Error de conexión con el servidor. Verifique su VPN.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 'register') {
      handleRegisterUser();
    } else {
      handleSetPassword();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-12 w-12 text-green-600" />
              <span className="ml-2 text-3xl font-bold text-gray-900">Sistema Taller</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {currentStep === 'register' ? 'Configuración Inicial' : 'Establecer Contraseña'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {currentStep === 'register' 
              ? 'Registre el primer usuario del sistema usando SP_REGISTRAR_USUARIO_PANEL_ADMIN'
              : 'Establezca una contraseña segura usando SP_REGISTRAR_PASSWORD'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {currentStep === 'register' ? (
              <>
                {/* Paso 1: Información básica del usuario */}
                <Input
                  id="name"
                  name="name"
                  type="text"
                  label="Nombre Completo"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  placeholder="Ej: Juan Pérez"
                  required
                  disabled={loading}
                />

                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Correo Electrónico"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  placeholder="admin@taller.com"
                  required
                  disabled={loading}
                />

                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  label="Teléfono"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={errors.phone}
                  placeholder="(504) 1234-5678"
                  required
                  disabled={loading}
                />

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Rol del Usuario
                  </label>
                  {rolesLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <span className="text-gray-500">Cargando roles...</span>
                    </div>
                  ) : (
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={loading}
                    >
                      <option value="">Seleccione un rol...</option>
                      {roles.map((role) => (
                        <option key={role.rol_id} value={role.nombre}>
                          {role.nombre} - {role.descripcion}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Paso 2: Establecer contraseña */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-700">
                    <strong>Usuario:</strong> {formData.name} ({formData.email})<br />
                    <strong>Rol:</strong> {formData.role}
                  </div>
                </div>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={loading}
                />

                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirmar Contraseña"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={errors.confirmPassword}
                  placeholder="Repita su contraseña"
                  required
                  disabled={loading}
                />
              </>
            )}
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">
                {errors.general}
              </div>
            </div>
          )}

          {/* Información del sistema */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-xs text-green-700 space-y-1">
              <div className="font-medium">ℹ️ {currentStep === 'register' ? 'Paso 1: Registro' : 'Paso 2: Contraseña'}:</div>
              {currentStep === 'register' ? (
                <>
                  <div>• Usa SP_REGISTRAR_USUARIO_PANEL_ADMIN</div>
                  <div>• Requiere conexión VPN para funcionar</div>
                  <div>• Primer usuario registrado = Admin del sistema</div>
                </>
              ) : (
                <>
                  <div>• Usa SP_REGISTRAR_PASSWORD</div>
                  <div>• Establece la contraseña definitiva</div>
                  <div>• Login automático después del registro</div>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={currentStep === 'register' ? onCancel : () => setCurrentStep('register')}
              disabled={loading}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {currentStep === 'register' ? 'Cancelar' : 'Atrás'}
            </Button>
            
            <Button
              type="submit"
              className="flex-1"
              loading={loading}
              size="lg"
            >
              {currentStep === 'register' ? 'Registrar Usuario' : 'Establecer Contraseña'}
            </Button>
          </div>
        </form>

        {/* Debug info */}
        {roles.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">🔧 Debug - Roles disponibles:</div>
              {roles.map(role => (
                <div key={role.rol_id} className="ml-2">
                  • {role.nombre} (ID: {role.rol_id})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}