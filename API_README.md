# API Documentation for Sistema Taller

Este repositorio contiene la documentación de la API del Sistema de Gestión de Taller Automotriz.

## Archivos de Importación para Postman

### 1. Postman Collection (postman_collection.json)
Este archivo contiene una colección completa de Postman con todos los endpoints de la API organizados por categorías.

**Para importar en Postman:**
1. Abre Postman
2. Haz clic en "Import" (Importar)
3. Selecciona "Upload Files" (Subir archivos)
4. Selecciona el archivo `postman_collection.json`
5. Haz clic en "Import"

### 2. OpenAPI/Swagger Specification (openapi.yaml)
Este archivo contiene la especificación OpenAPI 3.0 de la API, compatible con Swagger y otras herramientas.

**Para importar en Postman:**
1. Abre Postman
2. Haz clic en "Import" (Importar)
3. Selecciona "Upload Files" (Subir archivos)
4. Selecciona el archivo `openapi.yaml`
5. Haz clic en "Import"

**Para usar con Swagger UI:**
1. Ve a https://editor.swagger.io/
2. Pega el contenido del archivo `openapi.yaml`
3. Podrás ver la documentación interactiva

## Endpoints Disponibles

### Authentication
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/verify-security-code` - Verificar código de seguridad
- `POST /api/auth/register-client` - Registrar nuevo cliente

### Clients
- `GET /api/clients/registered` - Obtener todos los clientes
- `GET /api/clients/{clientId}` - Obtener cliente por ID
- `PUT /api/clients/{clientId}` - Actualizar cliente

### Vehicles
- `GET /api/vehicles` - Obtener todos los vehículos
- `POST /api/vehicles` - Crear nuevo vehículo
- `PUT /api/vehicles/{id}` - Actualizar vehículo
- `DELETE /api/vehicles/{id}` - Eliminar vehículo

### Services
- `GET /api/services` - Obtener todos los servicios
- `POST /api/services` - Crear nuevo servicio
- `PUT /api/services/{id}` - Actualizar servicio
- `DELETE /api/services/{id}` - Eliminar servicio

### Appointments
- `GET /api/appointments` - Obtener todas las citas
- `GET /api/appointments/{id}` - Obtener cita por ID
- `POST /api/appointments` - Crear nueva cita
- `PUT /api/appointments/{id}` - Actualizar cita
- `DELETE /api/appointments/{id}` - Eliminar cita

### Health Check
- `GET /api/health` - Verificar estado de la API

## Variables de Entorno

La colección de Postman incluye una variable `{{baseUrl}}` que por defecto apunta a `http://localhost:5000`. 

Para cambiar el servidor:
1. En Postman, ve a la pestaña "Variables" de la colección
2. Modifica el valor de `baseUrl` según tu entorno:
   - Desarrollo: `http://localhost:5000`
   - Producción: `https://tu-servidor-produccion.com`

## Notas Importantes

- Todos los endpoints (excepto health check) requieren Content-Type: application/json
- Los campos marcados como requeridos deben incluirse en las peticiones
- Los IDs se generan automáticamente por el sistema
- Las respuestas siguen un formato estándar con `success`, `message` y `data`

## Soporte

Para preguntas sobre la API, contacta al equipo de desarrollo.