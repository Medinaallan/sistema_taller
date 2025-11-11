# Actualización de Campos de Vehículos

## Descripción
Se han actualizado los formularios y vistas de vehículos para incluir todos los campos disponibles en los stored procedures: VIN, numero_motor y foto_url.

## Archivos Modificados

### 1. `src/tipos/index.ts`
- **Cambio**: Agregados campos opcionales `numeroMotor?: string` y `fotoUrl?: string` al interface `Vehicle`
- **Propósito**: Sincronizar el tipo con los campos del SP

### 2. `src/paginas/administracion/VehiclesPage.tsx`
- **Cambios principales**:
  - Agregados campos VIN, Número de Motor y URL de Foto al formulario
  - Actualizado el mapeo de datos del SP para incluir `numero_motor` y `foto_url`
  - Modificada la vista de detalles para mostrar todos los campos
  - Actualizada la inicialización del formulario para cargar datos existentes

- **Nuevos campos en el formulario**:
  ```tsx
  // VIN (opcional)
  <Input label="VIN (opcional)" name="vin" ... />
  
  // Número de Motor (opcional)  
  <Input label="Número de Motor (opcional)" name="numeroMotor" ... />
  
  // URL de Foto (opcional)
  <Input label="URL de Foto (opcional)" name="fotoUrl" ... />
  ```

- **Vista de detalles actualizada** con:
  - Mostrar VIN con fuente monospace
  - Mostrar número de motor con fuente monospace
  - Mostrar imagen si hay foto_url disponible

### 3. `src/paginas/cliente/ClientVehiclesPage.tsx`
- **Cambios principales**:
  - Actualizado interface local `Vehicle` para incluir `numeroMotor` y `fotoUrl`
  - Expandido interface `VehicleForm` con nuevos campos
  - Agregados campos al formulario modal de creación
  - Actualizado mapeo de datos del SP

- **Nuevos campos en el formulario**:
  ```tsx
  // Número de Motor (opcional)
  <input ... placeholder="ABC123456789" />
  
  // URL de Foto (opcional)
  <input type="url" ... placeholder="https://ejemplo.com/foto-vehiculo.jpg" />
  ```

### 4. `src/servicios/apiService.ts`
- **Estado**: Ya estaba actualizado correctamente
- **Campos soportados**: `numero_motor`, `foto_url`, `vin`, etc.

## Mapeo de Campos

### Frontend ↔ Stored Procedure
| Frontend | SP | Descripción |
|----------|-----|-------------|
| `vin` | `vin` | Número de identificación del vehículo |
| `numeroMotor` | `numero_motor` | Número del motor |
| `fotoUrl` | `foto_url` | URL de la foto del vehículo |
| `mileage` | `kilometraje` | Kilometraje actual |
| `brand` | `marca` | Marca del vehículo |
| `model` | `modelo` | Modelo del vehículo |
| `year` | `anio` | Año del vehículo |
| `licensePlate` | `placa` | Placa del vehículo |

## Validaciones

### Campos Obligatorios (según SP)
- `cliente_id` - ID del cliente
- `marca` - Marca del vehículo
- `modelo` - Modelo del vehículo
- `anio` - Año del vehículo
- `placa` - Placa del vehículo

### Campos Opcionales (con = NULL en SP)
- `color` - Color del vehículo
- `vin` - VIN del vehículo
- `numero_motor` - Número del motor
- `kilometraje` - Kilometraje actual
- `foto_url` - URL de la foto

## Características Implementadas

### 1. Formulario de Administración (`VehiclesPage.tsx`)
- ✅ Todos los campos del SP incluidos
- ✅ Validación solo de campos obligatorios
- ✅ Carga de datos existentes para edición
- ✅ Vista de detalles con todos los campos
- ✅ Manejo de imágenes en detalles

### 2. Formulario de Cliente (`ClientVehiclesPage.tsx`)
- ✅ Todos los campos del SP incluidos
- ✅ Interface local actualizada
- ✅ Formulario responsive con nuevos campos
- ✅ Mapeo correcto desde/hacia API

### 3. Integración con API
- ✅ Servicio API ya compatible con todos los campos
- ✅ Mapeo correcto de nombres de campos
- ✅ Manejo de valores nulos/opcionales

## Funcionalidad

### Creación de Vehículos
- Los usuarios pueden ahora proporcionar VIN, número de motor y URL de foto
- Todos los campos adicionales son opcionales
- Validación respeta los requisitos del SP

### Edición de Vehículos
- Formulario carga todos los campos existentes
- Campos adicionales se muestran si tienen valor
- Actualización preserva todos los datos

### Vista de Detalles
- Muestra VIN y número de motor con formato monospace
- Renderiza imagen si hay foto_url disponible
- Layout mejorado para todos los campos

## Próximos Pasos Sugeridos

1. **Validación Mejorada**: Implementar validación específica para formato VIN (17 caracteres)
2. **Upload de Imágenes**: Considerar implementar upload directo en lugar de URLs
3. **Historial de Cambios**: Logging de cambios en campos importantes como VIN
4. **Búsqueda Expandida**: Incluir VIN en búsquedas del sistema

## Notas Técnicas

- Los campos `numeroMotor` y `fotoUrl` usan camelCase en frontend por consistencia
- El mapeo a `numero_motor` y `foto_url` se realiza en la capa de API
- Todos los nuevos campos son opcionales y manejan valores nulos correctamente
- La vista de detalles maneja casos donde los campos opcionales están vacíos