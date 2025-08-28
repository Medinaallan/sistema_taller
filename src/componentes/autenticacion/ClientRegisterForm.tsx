import React, { useState } from 'react';
import { Button, Input } from '../../componentes/comunes/UI';
import { 
  SP_REGISTRAR_USUARIO_CLIENTE,
  SP_VERIFICAR_CODIGO_SEGURIDAD,
  SP_REGISTRAR_PASSWORD,
  SP_VALIDAR_CORREO_USUARIO
} from '../../utilidades/storedProcedures';

interface ClientRegisterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type RegisterStep = 'email' | 'info' | 'code' | 'password';

export function ClientRegisterForm({ onSuccess, onCancel }: ClientRegisterFormProps) {
  const [currentStep, setCurrentStep] = useState<RegisterStep>('email');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
      const result = await SP_VALIDAR_CORREO_USUARIO(formData.email);
      
      if (result.allow === 0) {
        setErrors({ email: result.msg });
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
            const result = await SP_REGISTRAR_USUARIO_CLIENTE(
              formData.name,
              formData.email,
              formData.phone
            );
            
            if (result.allow === 1) {
              setCurrentStep('code');
              // Mostrar código en consola para pruebas
              console.log('Código enviado:', result.codigo_seguridad);
            } else {
              setErrors({ general: result.msg });
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
            const result = await SP_VERIFICAR_CODIGO_SEGURIDAD(
              formData.email,
              formData.code
            );
            
            if (result.allow === 1) {
              setCurrentStep('password');
            } else {
              setErrors({ code: result.msg });
            }
          } catch {
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
            const result = await SP_REGISTRAR_PASSWORD(
              formData.email,
              formData.password
            );
            
            if (result.allow === 1) {
              onSuccess();
            } else {
              setErrors({ password: result.msg });
            }
          } catch {
            setErrors({ password: 'Error al registrar contraseña' });
          } finally {
            setLoading(false);
          }
        }
        break;
    }
  };

  const getStepTitle = () => {
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
