# 🔐 Flujo de Recuperación de Contraseña

## Implementación Completa

Se ha implementado el flujo completo de recuperación de contraseña utilizando los 3 Stored Procedures especificados.

---

## 📋 Stored Procedures Utilizados

### 1. SP_INICIAR_RECUPERACION_PASSWORD
**Parámetros de entrada:**
- `@correo VARCHAR(100)` - Correo electrónico del usuario

**Valores de retorno:**
- `msg` - Mensaje descriptivo del resultado
- `allow` - Indicador de éxito (0 = error, 1 = éxito)
- `token` - Token único de recuperación (CHAR(36) - formato UUID)

**Función:** Genera un token único con validez de 1 hora e invalida tokens anteriores del mismo usuario.

---

### 2. SP_VALIDAR_TOKEN_RECUPERACION
**Parámetros de entrada:**
- `@token CHAR(36)` - Token de recuperación a validar

**Valores de retorno:**
- `msg` - Mensaje descriptivo del resultado
- `allow` - Indicador de validez (0 = inválido/expirado, 1 = válido)

**Función:** Verifica que el token existe, no ha sido usado y no ha expirado.

---

### 3. SP_COMPLETAR_RECUPERACION_PASSWORD
**Parámetros de entrada:**
- `@token CHAR(36)` - Token de recuperación
- `@password NVARCHAR(100)` - Nueva contraseña (se hashea en el SP)

**Valores de retorno:**
- `msg` - Mensaje descriptivo del resultado
- `allow` - Indicador de éxito (0 = error, 1 = éxito)

**Función:** Valida el token nuevamente, actualiza la contraseña y marca el token como usado.

---

## 🏗️ Arquitectura Implementada

### Backend (Node.js/Express)

#### 📁 Archivos Creados/Modificados:

1. **`backend/services/emailService.js`** ✨ NUEVO
   - Servicio para envío de correos electrónicos
   - En desarrollo: muestra el correo en consola
   - En producción: configurar con SendGrid, AWS SES o SMTP

2. **`backend/server-minimal.js`** 🔄 ACTUALIZADO
   - Agregados 3 endpoints nuevos:
     - `POST /api/auth/forgot-password`
     - `POST /api/auth/validate-reset-token`
     - `POST /api/auth/reset-password`

#### 🔌 Endpoints del Backend:

##### POST /api/auth/forgot-password
**Request Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response (éxito):**
```json
{
  "success": true,
  "message": "Se ha enviado un enlace de recuperación a su correo",
  "token": "123e4567-e89b-12d3-a456-426614174000",
  "resetUrl": "http://localhost:5173/reset-password?token=..."
}
```

##### POST /api/auth/validate-reset-token
**Request Body:**
```json
{
  "token": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (válido):**
```json
{
  "success": true,
  "message": "Token válido",
  "valid": true
}
```

##### POST /api/auth/reset-password
**Request Body:**
```json
{
  "token": "123e4567-e89b-12d3-a456-426614174000",
  "newPassword": "nuevaContraseña123"
}
```

**Response (éxito):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

---

### Frontend (React/TypeScript)

#### 📁 Archivos Modificados:

1. **`src/componentes/autenticacion/ForgotPasswordForm.tsx`** 🔄 ACTUALIZADO
   - Formulario para solicitar recuperación de contraseña
   - Validación de email
   - Llamada a SP_INICIAR_RECUPERACION_PASSWORD
   - Pantalla de confirmación de envío

2. **`src/componentes/autenticacion/ResetPasswordForm.tsx`** 🔄 ACTUALIZADO
   - Validación automática del token al cargar (SP_VALIDAR_TOKEN_RECUPERACION)
   - Formulario para establecer nueva contraseña
   - Validación de coincidencia de contraseñas
   - Llamada a SP_COMPLETAR_RECUPERACION_PASSWORD
   - Pantallas de éxito y error

3. **`src/paginas/autenticacion/LoginPage.tsx`** 🔄 ACTUALIZADO
   - Enlace "¿Olvidaste tu contraseña?" visible en el login
   - Detección automática de token en URL (`?token=...`)
   - Gestión de estados entre login/forgotPassword/resetPassword

---

## 🔄 Flujo Completo de Usuario

### Paso 1: Solicitar Recuperación
1. Usuario hace clic en **"¿Olvidaste tu contraseña?"** en el login
2. Ingresa su correo electrónico
3. Sistema llama a `SP_INICIAR_RECUPERACION_PASSWORD`
4. Se genera un token único con validez de 1 hora
5. En desarrollo: token se muestra en consola y se pasa automáticamente
6. En producción: se envía email con enlace tipo:
   ```
   https://taller.com/reset-password?token=123e4567-e89b-12d3-a456-426614174000
   ```

### Paso 2: Validar Token
1. Usuario hace clic en el enlace del correo (o automático en desarrollo)
2. Sistema detecta el token en la URL
3. Llama a `SP_VALIDAR_TOKEN_RECUPERACION`
4. Si el token es válido: muestra formulario de nueva contraseña
5. Si el token es inválido/expirado: muestra mensaje de error

### Paso 3: Establecer Nueva Contraseña
1. Usuario ingresa y confirma su nueva contraseña
2. Sistema valida que coincidan y tengan mínimo 6 caracteres
3. Llama a `SP_COMPLETAR_RECUPERACION_PASSWORD`
4. El SP actualiza la contraseña (hasheada) y marca el token como usado
5. Usuario es redirigido al login para iniciar sesión

---

## 🧪 Instrucciones de Prueba

### Desarrollo Local

1. **Iniciar el backend:**
   ```bash
   cd backend
   node server-minimal.js
   ```

2. **Iniciar el frontend:**
   ```bash
   npm run dev
   ```

3. **Flujo de prueba:**

   **A. Solicitar Recuperación:**
   - Abrir `http://localhost:5173`
   - Hacer clic en "¿Olvidaste tu contraseña?"
   - Ingresar un correo registrado (ej: `admin@taller.com`)
   - Verificar en consola del backend el token generado
   - Automáticamente se pasa al formulario de reset

   **B. Establecer Nueva Contraseña:**
   - Ingresar nueva contraseña (mínimo 6 caracteres)
   - Confirmar contraseña
   - Hacer clic en "Restablecer Contraseña"
   - Verificar mensaje de éxito
   - Redirigir al login

   **C. Verificar Actualización:**
   - Intentar login con la nueva contraseña
   - Verificar que el acceso sea exitoso

### Prueba Manual con URL

Para probar el flujo como si el usuario hiciera clic en un enlace de email:

```
http://localhost:5173/?token=AQUI_EL_TOKEN_GENERADO
```

El sistema automáticamente:
1. Detectará el token en la URL
2. Validará el token con el SP
3. Mostrará el formulario si es válido
4. Mostrará error si es inválido/expirado

---

## 🔒 Seguridad Implementada

✅ **Token único por usuario** - Se invalidan tokens anteriores al generar uno nuevo

✅ **Expiración de 1 hora** - Los tokens antiguos no pueden ser usados

✅ **Token de un solo uso** - Una vez usado, el token se marca como utilizado

✅ **Validación en cada paso** - Se valida el token antes de permitir cambio de contraseña

✅ **Hash de contraseñas** - Las contraseñas se hashean en el SP antes de guardar

✅ **Limpieza de URL** - El token se elimina de la URL después de detectarlo

✅ **Validación de contraseña** - Mínimo 6 caracteres, debe coincidir confirmación

---

## 📧 Configuración de Email (Producción)

Para habilitar el envío real de correos en producción, editar `backend/services/emailService.js`:

### Opción 1: Nodemailer con SMTP

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
```

### Opción 2: SendGrid

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### Variables de Entorno Necesarias:

Agregar en `.env`:

```env
NODE_ENV=production
FRONTEND_URL=https://taller.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=noreply@taller.com
SMTP_PASSWORD=tu_password_aqui
```

---

## 🐛 Troubleshooting

### El enlace no funciona
- ✅ Verificar que el backend esté corriendo en puerto 8080
- ✅ Verificar que el frontend esté corriendo en puerto 5173
- ✅ Verificar conexión VPN si usa base de datos remota
- ✅ Revisar logs del backend para ver errores del SP

### Token inválido o expirado
- ✅ Verificar que no hayan pasado más de 1 hora desde la generación
- ✅ Verificar que el token no haya sido usado anteriormente
- ✅ Solicitar un nuevo token

### No llega el correo (producción)
- ✅ Verificar configuración SMTP en variables de entorno
- ✅ Revisar logs del servicio de email
- ✅ Verificar que el correo no esté en spam
- ✅ Verificar que el dominio tenga registros SPF/DKIM configurados

---

## 📝 Logs de Desarrollo

El sistema genera logs detallados en desarrollo:

**Backend:**
```
🔐 Iniciando recuperación de contraseña para: user@example.com
✅ Token generado: 123e4567-e89b-12d3-a456-426614174000
📧 EMAIL DE RECUPERACIÓN DE CONTRASEÑA (MODO DESARROLLO)
Para: user@example.com
```

**Frontend:**
```
📧 Enviando solicitud de recuperación para: user@example.com
🔗 Token detectado en URL: 123e4567-e89b-12d3-a456-426614174000
🔍 Validando token: 123e4567-e89b-12d3-a456-426614174000
🔄 Restableciendo contraseña con token: 123e4567-e89b-12d3-a456-426614174000
✅ Contraseña restablecida exitosamente
```

---

## ✅ Checklist de Implementación

- [x] Servicio de email creado
- [x] 3 endpoints del backend implementados
- [x] Componente ForgotPasswordForm actualizado
- [x] Componente ResetPasswordForm actualizado
- [x] LoginPage con detección de token en URL
- [x] Enlace "¿Olvidaste tu contraseña?" visible en login
- [x] Validación de token automática
- [x] Pantallas de éxito y error
- [x] Logs de desarrollo detallados
- [x] Manejo de errores completo
- [x] Sin errores de compilación

---

## 🎉 Resultado Final

El sistema ahora cuenta con un flujo completo y seguro de recuperación de contraseña que:

- ✨ Usa exclusivamente Stored Procedures de SQL Server
- 🔒 Implementa las mejores prácticas de seguridad
- 📧 Está preparado para envío de emails en producción
- 🎨 Tiene una interfaz de usuario pulida y profesional
- 🐛 Maneja errores de forma apropiada
- 📊 Genera logs detallados para debugging

**¡Listo para usar!** 🚀
