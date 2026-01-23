# Módulo de Recordatorios - Sistema Taller

## 📋 Descripción
Sistema completo de recordatorios de mantenimiento para vehículos con almacenamiento JSON.

## 🚀 Características Implementadas

### Backend
- ✅ API RESTful completa con Express
- ✅ Almacenamiento en JSON (`backend/data/reminders.json`)
- ✅ CRUD completo de recordatorios
- ✅ Filtrado por cliente
- ✅ Recordatorios por fecha y kilometraje
- ✅ Sistema de notificaciones
- ✅ Integrado con `server-minimal.js`

### Frontend

#### Panel de Administrador (`/reminders`)
- ✅ Crear recordatorios para clientes
- ✅ Editar recordatorios existentes
- ✅ Eliminar recordatorios
- ✅ Marcar como completado
- ✅ Activar/desactivar recordatorios
- ✅ **Enviar notificaciones a clientes**
- ✅ Dashboard con estadísticas
- ✅ Selección de cliente y vehículo
- ✅ Recordatorios por fecha o kilometraje

#### Panel de Cliente (`/client-reminders`)
- ✅ Ver todos sus recordatorios
- ✅ Estadísticas personales
- ✅ Indicadores de estado (Vencido, Próximo, Programado)
- ✅ Información de vehículos asociados
- ✅ Diseño responsive

## 📁 Archivos Creados/Modificados

### Backend
```
backend/
  ├── data/
  │   ├── reminders.json                    # Almacenamiento de recordatorios
  │   └── reminders-example.json            # Datos de ejemplo
  ├── services/
  │   └── remindersService.js               # Lógica de negocio
  ├── routes/
  │   └── reminders.js                      # Endpoints API
  └── server-minimal.js                     # Actualizado con rutas
```

### Frontend
```
src/
  ├── servicios/
  │   └── remindersService.ts               # Cliente API
  └── paginas/
      ├── administracion/
      │   └── RemindersPage.tsx             # Actualizado con API
      └── cliente/
          └── ClientRemindersPage.tsx       # Actualizado con API
```

## 🔌 API Endpoints

### Recordatorios
- `GET /api/reminders` - Obtener todos los recordatorios
- `GET /api/reminders/client/:clientId` - Obtener recordatorios de un cliente
- `GET /api/reminders/upcoming?days=7` - Recordatorios próximos
- `GET /api/reminders/expired` - Recordatorios vencidos
- `POST /api/reminders` - Crear recordatorio
- `PUT /api/reminders/:id` - Actualizar recordatorio
- `DELETE /api/reminders/:id` - Eliminar recordatorio
- `PATCH /api/reminders/:id/complete` - Marcar como completado
- `PATCH /api/reminders/:id/toggle` - Activar/desactivar
- `POST /api/reminders/:id/notify` - **Enviar notificación al cliente**

## 📊 Estructura de Datos

```typescript
interface Reminder {
  id: string;
  vehicleId: string | null;
  clientId: string;
  type: 'date' | 'mileage';
  title: string;
  description: string;
  triggerValue: number | string;  // Fecha ISO o kilometraje
  currentValue?: number;           // Kilometraje actual
  isActive: boolean;
  isCompleted: boolean;
  services: string[];
  notificationSent?: boolean;
  createdAt: string;
  triggerDate?: string | null;
  createdBy?: string | null;
}
```

## 🎯 Funcionalidad Principal

### Desde el Panel del Admin

1. **Crear Recordatorio**
   - Seleccionar cliente
   - Seleccionar vehículo (opcional)
   - Elegir tipo (fecha o kilometraje)
   - Definir título y descripción
   - Agregar servicios
   - Establecer valor de activación

2. **Enviar Notificación**
   - Botón de notificación (🔔) en cada recordatorio activo
   - Envía notificación al cliente
   - Marca como enviada en el sistema
   - Muestra confirmación al admin

3. **Gestionar Recordatorios**
   - Editar cualquier campo
   - Activar/desactivar
   - Marcar como completado
   - Eliminar

### Desde el Panel del Cliente

1. **Ver Recordatorios**
   - Lista de todos sus recordatorios
   - Estado visual (Vencido, Próximo, Programado, Completado)
   - Información del vehículo
   - Servicios programados
   - Para recordatorios de kilometraje: muestra km actual y km faltantes

## 🚀 Cómo Usar

### 1. Iniciar el Backend
```bash
cd backend
node server-minimal.js
```
El servidor estará en `http://localhost:8080`

### 2. Iniciar el Frontend
```bash
npm run dev
```
La aplicación estará en `http://localhost:5173`

### 3. Crear un Recordatorio (Admin)
1. Ir a `/reminders`
2. Click en "Nuevo Recordatorio"
3. Llenar el formulario
4. Guardar

### 4. Enviar Notificación (Admin)
1. En la lista de recordatorios
2. Click en el botón de campana (🔔)
3. Confirmar envío

### 5. Ver Recordatorios (Cliente)
1. Ir a `/client-reminders`
2. Ver todos los recordatorios asignados

## 🔧 Personalización

### Agregar Servicio de Email/SMS
Edita `backend/routes/reminders.js` en el endpoint `POST /:id/notify`:

```javascript
router.post('/:id/notify', authenticate, async (req, res) => {
  // ... código existente ...
  
  // Agregar aquí tu servicio de email/SMS
  await emailService.send({
    to: reminder.clientEmail,
    subject: `Recordatorio: ${reminder.titulo}`,
    body: reminder.descripcion
  });
  
  // ... resto del código ...
});
```

## 📝 Notas Importantes

- Los recordatorios se almacenan en `backend/data/reminders.json`
- El sistema usa almacenamiento JSON, no SQL Server
- Las notificaciones actualmente solo se marcan como enviadas
- Para recordatorios de kilometraje, necesitas mantener actualizado el kilometraje del vehículo
- El clientId debe corresponder a un cliente existente en el sistema

## ✅ Checklist de Funcionalidades

- [x] Backend con almacenamiento JSON
- [x] API RESTful completa
- [x] Panel de admin funcional
- [x] Panel de cliente funcional
- [x] Crear recordatorios
- [x] Editar recordatorios
- [x] Eliminar recordatorios
- [x] Activar/desactivar
- [x] Marcar como completado
- [x] **Enviar notificaciones desde admin**
- [x] Ver recordatorios por cliente
- [x] Estadísticas en ambos paneles
- [x] Recordatorios por fecha
- [x] Recordatorios por kilometraje
- [x] Diseño responsive

## 🎨 Mejoras Futuras Sugeridas

- [ ] Integración real de email (NodeMailer, SendGrid)
- [ ] Integración de SMS (Twilio)
- [ ] Notificaciones automáticas programadas
- [ ] Historial de notificaciones enviadas
- [ ] Plantillas de recordatorios predefinidas
- [ ] Recordatorios recurrentes
- [ ] Exportar recordatorios a PDF
- [ ] Dashboard con gráficos
- [ ] Filtros avanzados
- [ ] Búsqueda de recordatorios
