import React, { useState } from 'react';
import { Button, Input } from '../../componentes/comunes/UI';
import { agregarCliente } from '../../utilidades/BaseDatosJS';
import { generateId } from '../../utilidades/globalMockDatabase';
import type { Client } from '../../tipos';

interface ClientRegisterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type RegisterStep = 'email' | 'info' | 'code' | 'password';

// API URLs
const API_BASE = 'http://localhost:8080/api';

// Funciones para llamadas directas a la API
const validarCorreoUsuario = async (correo: string) => {
  const response = await fetch(`${API_BASE}/users/validate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo })
  });
  if (!response.ok) throw new Error('Error de conexión');
  return await response.json();
};

const registrarUsuarioCliente = async (email: string, password: string, fullName: string, phone: string) => {
  const response = await fetch(`${API_BASE}/auth/register-client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName, phone })
  });
  if (!response.ok) throw new Error('Error de conexión');
  return await response.json();
};

const verificarCodigoSeguridad = async (email: string, securityCode: string) => {
  const response = await fetch(`${API_BASE}/auth/verify-security-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, securityCode })
  });
  if (!response.ok) throw new Error('Error de conexión');
  return await response.json();
};

export function ClientRegisterForm({ onSuccess, onCancel }: ClientRegisterFormProps) {
  const [currentStep, setCurrentStep] = useState<RegisterStep>('email');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [securityCode, setSecurityCode] = useState<string>(''); // Para guardar el código generado
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    code: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'El email es requerido' });
      return false;
    }
    
    setLoading(true);
    try {
      const result = await validarCorreoUsuario(formData.email);
      
      if (!result.success) {
        setErrors({ email: result.message || 'Email no válido' });
        return false;
      }
      
      return true;
    } catch {
      setErrors({ email: 'Error al validar el correo' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateUserInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCode = () => {
    if (!formData.code.trim()) {
      setErrors({ code: 'El código es requerido' });
      return false;
    }
    if (formData.code.length !== 6) {
      setErrors({ code: 'El código debe tener 6 dígitos' });
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    setErrors({});

    switch (currentStep) {
      case 'email':
        const emailValid = await validateEmail();
        if (emailValid) setCurrentStep('info');
        break;
        
      case 'info':
        if (validateUserInfo()) {
          setLoading(true);
          try {
            const result = await registrarUsuarioCliente(
              formData.email,
              'temp_password', // La contraseña se define después
              formData.name,
              formData.phone
            );
            
            if (result.success) {
              setCurrentStep('code');
              setSecurityCode(result.data?.securityCode || '');
              // Mostrar código en consola para pruebas
              console.log('Código enviado:', result.data?.securityCode);
            } else {
              setErrors({ general: result.message || 'Error al registrar usuario' });
            }
          } catch {
            setErrors({ general: 'Error al registrar usuario' });
          } finally {
            setLoading(false);
          }
        }
        break;
        
      case 'code':
        if (validateCode()) {
          setLoading(true);
          try {
            console.log('🔐 Verificando código:', {
              email: formData.email,
              code: formData.code,
              codeLength: formData.code.length,
              codeType: typeof formData.code
            });
            
            const result = await verificarCodigoSeguridad(
              formData.email,
              formData.code
            );
            
            console.log('📥 Respuesta del backend:', result);
            console.log('📊 result.success:', result.success, 'tipo:', typeof result.success);
            console.log('📊 result.allow:', result.allow, 'tipo:', typeof result.allow);
            console.log('📊 result.message:', result.message);
            
            if (result.success) {
              console.log('✅ Código válido, avanzando a password');
              setCurrentStep('password');
            } else {
              console.log('❌ Código inválido:', result.message);
              setErrors({ code: result.message || 'Código inválido' });
            }
          } catch (error) {
            console.error('❌ Error verificando código:', error);
            setErrors({ code: 'Error al verificar código' });
          } finally {
            setLoading(false);
          }
        }
        break;
        
      case 'password':
        if (validatePassword()) {
          setLoading(true);
          try {
            console.log('🔄 Actualizando contraseña en la base de datos...');
            console.log('Email:', formData.email);
            console.log('Nueva contraseña:', formData.password);
            
            // Actualizar la contraseña en la base de datos
            const updateResponse = await fetch(`${API_BASE}/auth/update-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: formData.email, 
                newPassword: formData.password 
              })
            });
            
            const updateData = await updateResponse.json();
            console.log('📊 Respuesta de actualización de contraseña:', updateData);
            
            if (updateData.success) {
              console.log('✅ Contraseña actualizada exitosamente');
              
              // Probar login inmediatamente para verificar
              console.log('🔐 Probando login con nueva contraseña...');
              const loginTestResponse = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  correo: formData.email,
                  password: formData.password
                })
              });
              
              const loginTestData = await loginTestResponse.json();
              console.log('📊 Resultado del login test:', loginTestData);
              
              if (loginTestData.allow === 1) {
                console.log('✅ Login test exitoso - la contraseña se guardó correctamente');
              } else {
                console.warn('⚠️ Login test falló - puede haber un problema con la actualización');
              }
              
              // Agregar al CSV local para compatibilidad
              try {
                const nuevoCliente: Client = {
                  id: generateId(),
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  address: '',
                  password: formData.password,
                  vehicles: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                console.log('💾 Guardando cliente en CSV:', nuevoCliente.name);
                await agregarCliente(nuevoCliente);
                console.log('✅ Cliente agregado al CSV exitosamente');
              } catch (csvError) {
                console.warn('⚠️ Error guardando en CSV:', csvError);
              }
              
              onSuccess();
            } else {
              console.error('❌ Error actualizando contraseña:', updateData.message);
              setErrors({ password: updateData.message || 'Error al actualizar contraseña' });
            }
          } catch (error) {
            console.error('❌ Error actualizando contraseña:', error);
            setErrors({ password: 'Error al completar el registro' });
          } finally {
            setLoading(false);
          }
        }
        break;
    }
  };  const getStepTitle = () => {
    switch (currentStep) {
      case 'email': return 'Verificar Email';
      case 'info': return 'Información Personal';
      case 'code': return 'Verificar Código';
      case 'password': return 'Crear Contraseña';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email': return 'Ingrese su correo electrónico';
      case 'info': return 'Complete sus datos personales';
      case 'code': return 'Ingrese el código enviado a su correo';
      case 'password': return 'Cree una contraseña segura';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
        <p className="text-sm text-gray-600">{getStepDescription()}</p>
        
        {/* Indicador de progreso */}
        <div className="flex items-center space-x-2 mt-4">
          {['email', 'info', 'code', 'password'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === step 
                  ? 'bg-blue-600 text-white' 
                  : ['email', 'info', 'code', 'password'].indexOf(currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-8 h-1 ${
                  ['email', 'info', 'code', 'password'].indexOf(currentStep) > index
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {currentStep === 'email' && (
          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            placeholder="su.correo@ejemplo.com"
            required
          />
        )}

        {currentStep === 'info' && (
          <>
            <Input
              id="name"
              name="name"
              type="text"
              label="Nombre Completo"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder="Su nombre completo"
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
              placeholder="+1234567890"
              required
            />
          </>
        )}

        {currentStep === 'code' && (
          <>
            <Input
              id="code"
              name="code"
              type="text"
              label="Código de Seguridad"
              value={formData.code}
              onChange={handleInputChange}
              error={errors.code}
              placeholder="123456"
              maxLength={6}
              required
            />
            {securityCode && (
              <div className="text-sm bg-green-50 border border-green-200 p-4 rounded-md">
                <div className="flex items-center">
                  <div className="text-green-800">
                    <strong>Código de seguridad (SIMULACIÓN):</strong>
                    <div className="text-lg font-mono bg-green-100 px-2 py-1 rounded mt-1">
                      {securityCode}
                    </div>
                    <p className="mt-2 text-xs text-green-600">
                      En producción, este código se enviaría por email.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">
              <strong>Para pruebas:</strong> Revise la consola del navegador (F12) para ver el código de seguridad generado.
            </div>
          </>
        )}

        {currentStep === 'password' && (
          <>
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
            
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirmar Contraseña"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder="••••••••"
              required
            />
          </>
        )}

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">
              {errors.general}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={onCancel}
          variant="secondary"
          className="flex-1"
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleNextStep}
          loading={loading}
          className="flex-1"
        >
          {currentStep === 'password' ? 'Registrar' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
}
