# API Requirements - Backend Integration

## 📋 Resumen Ejecutivo para Backend Team

Este documento especifica los endpoints y modelos de datos necesarios para integrar el frontend desarrollado con el backend del sistema.

## 🔐 Autenticación

### JWT Token Structure
```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "string",
    "email": "string", 
    "role": "admin" | "client",
    "name": "string"
  },
  "expires": "2024-12-31T23:59:59Z"
}
```

### Authentication Endpoints

#### POST /api/auth/login
```json
// Request
{
  "email": "admin@taller.com",
  "password": "admin123"
}

// Response (200)
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "1",
    "email": "admin@taller.com",
    "role": "admin",
    "name": "Administrador"
  }
}

// Response (401)
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

#### POST /api/auth/logout
```json
// Headers: Authorization: Bearer {token}
// Response (200)
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

#### POST /api/auth/refresh
```json
// Headers: Authorization: Bearer {token}
// Response (200)
{
  "success": true,
  "token": "new_jwt_token_here"
}
```

## 👥 Gestión de Clientes

### GET /api/clients
```json
// Headers: Authorization: Bearer {token}
// Query params: ?page=1&limit=10&search=juan
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Juan Pérez",
      "email": "juan.perez@email.com",
      "phone": "+1234567890",
      "address": "Calle Principal 123",
      "createdAt": "2024-01-15T10:30:00Z",
      "vehicles": ["vehicle_id_1", "vehicle_id_2"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### POST /api/clients
```json
// Request
{
  "name": "Juan Pérez",
  "email": "juan.perez@email.com", 
  "phone": "+1234567890",
  "address": "Calle Principal 123",
  "password": "cliente123"
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Juan Pérez",
    "email": "juan.perez@email.com",
    "phone": "+1234567890",
    "address": "Calle Principal 123",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/clients/:id
```json
// Request
{
  "name": "Juan Pérez Actualizado",
  "phone": "+1234567891",
  "address": "Nueva Dirección 456"
}

// Response (200)
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Juan Pérez Actualizado",
    "email": "juan.perez@email.com",
    "phone": "+1234567891",
    "address": "Nueva Dirección 456",
    "updatedAt": "2024-01-15T11:30:00Z"
  }
}
```

### DELETE /api/clients/:id
```json
// Response (200)
{
  "success": true,
  "message": "Cliente eliminado exitosamente"
}
```

## 🚗 Gestión de Vehículos

### GET /api/vehicles
```json
// Query params: ?client_id=1&page=1&limit=10
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "1",
      "clientId": "1",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "licensePlate": "ABC-123",
      "color": "Blanco",
      "serviceType": "maintenance",
      "mileage": 45000,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/vehicles
```json
// Request
{
  "clientId": "1",
  "make": "Toyota",
  "model": "Corolla", 
  "year": 2020,
  "licensePlate": "ABC-123",
  "color": "Blanco",
  "serviceType": "maintenance",
  "mileage": 45000
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "1",
    "clientId": "1",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "licensePlate": "ABC-123",
    "color": "Blanco",
    "serviceType": "maintenance",
    "mileage": 45000,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## 🔧 Órdenes de Trabajo

### GET /api/work-orders
```json
// Query params: ?status=active&client_id=1&vehicle_id=1
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "1",
      "clientId": "1",
      "vehicleId": "1", 
      "serviceType": "Mantenimiento preventivo",
      "description": "Cambio de aceite y filtros",
      "status": "in_progress", // pending, in_progress, completed, cancelled
      "cost": 120.50,
      "assignedMechanic": "Juan Mecánico",
      "startDate": "2024-01-15T08:00:00Z",
      "endDate": null,
      "notes": ["Filtro de aire muy sucio", "Se recomienda cambio de bujías"],
      "createdAt": "2024-01-15T07:30:00Z"
    }
  ]
}
```

### POST /api/work-orders
```json
// Request
{
  "clientId": "1",
  "vehicleId": "1",
  "serviceType": "Mantenimiento preventivo", 
  "description": "Cambio de aceite y filtros",
  "cost": 120.50,
  "assignedMechanic": "Juan Mecánico"
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "1",
    "clientId": "1",
    "vehicleId": "1",
    "serviceType": "Mantenimiento preventivo",
    "description": "Cambio de aceite y filtros", 
    "status": "pending",
    "cost": 120.50,
    "assignedMechanic": "Juan Mecánico",
    "createdAt": "2024-01-15T07:30:00Z"
  }
}
```

### PUT /api/work-orders/:id
```json
// Request
{
  "status": "completed",
  "endDate": "2024-01-15T12:00:00Z",
  "notes": ["Trabajo completado satisfactoriamente"]
}
```

## 📅 Recordatorios

### GET /api/reminders
```json
// Query params: ?client_id=1&vehicle_id=1&type=mileage
// Response (200)  
{
  "success": true,
  "data": [
    {
      "id": "1",
      "clientId": "1", 
      "vehicleId": "1",
      "type": "mileage", // mileage, date
      "triggerValue": 50000, // kilometers or date
      "message": "Es hora del mantenimiento de los 50,000 km",
      "serviceType": "Mantenimiento mayor",
      "isActive": true,
      "lastTriggered": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/reminders
```json
// Request
{
  "clientId": "1",
  "vehicleId": "1", 
  "type": "mileage",
  "triggerValue": 50000,
  "message": "Es hora del mantenimiento de los 50,000 km",
  "serviceType": "Mantenimiento mayor"
}
```

## 📊 Dashboard y Estadísticas

### GET /api/dashboard/stats
```json
// Response (200)
{
  "success": true,
  "data": {
    "totalClients": 150,
    "totalVehicles": 200,
    "activeWorkOrders": 25,
    "completedThisMonth": 45,
    "monthlyRevenue": 15750.00,
    "pendingReminders": 12,
    "averageCompletionTime": 2.5, // days
    "customerSatisfaction": 4.8 // out of 5
  }
}
```

### GET /api/dashboard/recent-activities
```json
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "1",
      "type": "work_order_created",
      "message": "Nueva orden de trabajo para Toyota Corolla ABC-123",
      "timestamp": "2024-01-15T14:30:00Z",
      "clientName": "Juan Pérez"
    },
    {
      "id": "2", 
      "type": "work_order_completed",
      "message": "Completado mantenimiento para Honda Civic XYZ-789",
      "timestamp": "2024-01-15T13:45:00Z",
      "clientName": "María García"
    }
  ]
}
```

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP
- `200`: Éxito
- `201`: Creado exitosamente  
- `400`: Bad Request (datos inválidos)
- `401`: No autorizado
- `403`: Prohibido (sin permisos)
- `404`: No encontrado
- `422`: Datos no procesables (validación)
- `500`: Error interno del servidor

### Estructura de Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {
    "field1": ["Error específico del campo"],
    "field2": ["Otro error"]
  }
}
```

## 🔒 Seguridad y Validaciones

### Headers Requeridos
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
```

### Validaciones por Endpoint
- **Email**: Formato válido y único
- **Phone**: Formato internacional válido
- **License Plate**: Formato local válido y único
- **Year**: Entre 1900 y año actual + 1
- **Mileage**: Número positivo
- **Cost**: Número positivo con máximo 2 decimales

### Rate Limiting
- **Login**: 5 intentos por IP cada 15 minutos
- **API General**: 100 requests por minuto por usuario
- **Operaciones de escritura**: 30 requests por minuto

## 🗄️ Base de Datos

Ver archivo [modelos-datos.md](./modelos-datos.md) para esquemas detallados de base de datos.

---

**Notas para el Backend Team**:
1. Todos los endpoints deben manejar paginación para listas grandes
2. Implementar soft deletes para auditoria
3. Logs detallados para debugging
4. Validaciones exhaustivas en servidor
5. Encriptación de contraseñas con bcrypt
6. JWT con expiración configurables
