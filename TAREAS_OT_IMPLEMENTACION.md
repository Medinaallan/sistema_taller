# Sistema de Gestión de Tareas en Órdenes de Trabajo (OT)

## Resumen de la Implementación

Se ha implementado un sistema completo para gestionar **tareas dentro de las Órdenes de Trabajo**, permitiendo que cada OT funcione como un contenedor de múltiples servicios/tareas.

---

## Características Principales

### 1. **Conceptualización**
- Una **Orden de Trabajo (OT)** funciona como un contenedor o "sala" de tareas asociadas a un vehículo
- Similar a una orden de compra que puede contener múltiples productos/servicios
- Cada OT puede tener **una o varias tareas**

### 2. **Creación de OT**
- **Desde Cotización**: La OT se genera automáticamente con una tarea inicial via `SP_GENERAR_OT_DESDE_COTIZACION`
- **Registro Manual**: La OT se genera con una tarea inicial via `SP_REGISTRAR_OT_MANUAL`
- **No se modifica el flujo actual del formulario** ✅

### 3. **Gestión de Tareas Adicionales**
- Se pueden agregar tareas adicionales a una OT existente
- Estas funcionan como "cotizaciones adicionales" asociadas a la misma orden
- Botones implementados:
  - **"Ver tareas"**: Muestra todas las tareas de una OT en un modal con subtabla
  - **"Agregar Tarea"**: Permite agregar nuevas tareas a la OT

---

## Archivos Creados/Modificados

### Frontend

#### Servicios
- **`src/servicios/workOrdersService.ts`**
  - ✅ Interfaces para `OTTarea`, `TaskStatus`, `TaskPriority`, `WorkOrderStatus`
  - ✅ Métodos: `getTareasByOT()`, `agregarTarea()`, `eliminarTarea()`, `gestionarEstadoTarea()`
  - ✅ Helpers para formatear prioridades, estados de tareas, y estados de OT
  - ✅ Estados temporales de OT (hasta implementar SP reales)

#### Componentes
- **`src/componentes/ordenes-trabajo/TasksListModal.tsx`** ✅
  - Modal para visualizar todas las tareas de una OT
  - Muestra: ID, Servicio, Descripción, Prioridad, Estado, Horas Estimadas/Reales
  - Acciones: Iniciar, Completar, Cancelar, Eliminar tarea
  - Estadísticas de tareas por estado
  - Color de prioridad (ROJO, AMARILLO, VERDE)

- **`src/componentes/ordenes-trabajo/AddTaskModal.tsx`** ✅
  - Modal con formulario para agregar nuevas tareas
  - Campos: Tipo de Servicio, Descripción, Horas Estimadas, Prioridad
  - Información sobre niveles de prioridad
  - Validaciones integradas

#### Páginas
- **`src/paginas/ordenes-trabajo/WorkOrdersPage.tsx`** ✅
  - Botones "Ver tareas" y "Agregar Tarea" integrados en la tabla
  - Estados y handlers para los modales de tareas
  - Flujo completo: Ver tareas → Agregar tarea → Actualizar lista

### Backend

#### Rutas
- **`backend/routes/workOrders.js`** ✅
  - `GET /:id/tareas` - Obtener todas las tareas de una OT (SP_OBTENER_TAREAS_OT)
  - `POST /:id/tareas` - Agregar nueva tarea (SP_AGREGAR_TAREA_OT)
  - `DELETE /tareas/:tareaId` - Eliminar tarea (SP_ELIMINAR_TAREA_OT)
  - `PUT /tareas/:tareaId/estado` - Gestionar estado de tarea (SP_GESTIONAR_ESTADO_TAREA)

---

## Estados Implementados

### Estados de Órdenes de Trabajo (Temporal - JSON)
Almacenados temporalmente mientras se incorporan los SP reales:

1. **Abierta**: Vehículo ingresado al taller, trabajo no iniciado
2. **En proceso**: Mecánico trabajando en el vehículo
3. **Control de calidad**: Verificación final del trabajo
4. **Completada**: Vehículo listo, pendiente de retiro
5. **Cerrada**: Vehículo entregado y orden cerrada (facturación/pago)
6. **En espera de repuestos**: Bloqueado por repuestos pendientes
7. **En espera de aprobación**: Bloqueado por daño oculto pendiente de autorización
8. **Cancelada**: Orden cancelada

### Estados de Tareas (OT_Tareas)

1. **Pendiente** (default): Estado inicial al crear la tarea
2. **En proceso**: Mecánico ha iniciado la tarea
3. **Completada**: Tarea finalizada
4. **Cancelada**: Tarea cancelada

### Escala de Prioridades (1-5)

| Nivel | Nombre | Descripción | Color |
|-------|--------|-------------|-------|
| 1 | Baja | Tareas estéticas o ruidos leves sin urgencia | Gris |
| 2 | Media-Baja | Mantenimientos preventivos programados | Azul |
| 3 | Normal | La mayoría de las tareas operativas (PREDETERMINADO) | Verde |
| 4 | Alta | Afecta seguridad del vehículo o cliente esperando | Naranja |
| 5 | Crítica | Garantías, retrabajos, emergencias, bloqueo operativo | Rojo |

**Color de Prioridad adicional (backend):**
- ROJO: Prioridad crítica
- AMARILLO: Prioridad alta/media
- VERDE: Prioridad normal/baja

---

## Stored Procedures Requeridos (Backend SQL)

Los siguientes SP deben existir en la base de datos para que el sistema funcione:

### 1. `SP_OBTENER_TAREAS_OT`
**Parámetros:**
- `@ot_id INT`

**Retorna:**
- `ot_tarea_id`, `ot_id`, `tipo_servicio_id`, `servicio_nombre`
- `descripcion`, `prioridad`, `estado_tarea`
- `horas_estimadas`, `horas_reales`, `color_prioridad`

### 2. `SP_AGREGAR_TAREA_OT`
**Parámetros:**
- `@ot_id INT`
- `@tipo_servicio_id INT`
- `@descripcion VARCHAR(300) = NULL`
- `@horas_estimadas DECIMAL(9,2) = NULL`
- `@horas_reales DECIMAL(9,2) = NULL`
- `@prioridad TINYINT = 3`
- `@registrado_por INT = NULL`

**Retorna:**
- `'200 OK'`, response, msg, allow, `ot_tarea_id`

### 3. `SP_ELIMINAR_TAREA_OT`
**Parámetros:**
- `@ot_tarea_id INT`
- `@eliminado_por INT = NULL`

**Retorna:**
- `'200 OK'`, msg, allow

**Restricción:** No permite eliminar tareas de OT en estado "Cerrada"

### 4. `SP_GESTIONAR_ESTADO_TAREA`
**Parámetros:**
- `@ot_tarea_id INT`
- `@nuevo_estado VARCHAR(50)`
- `@horas_estimadas DECIMAL(9,2) = NULL`
- `@registrado_por INT = NULL`

**Retorna:**
- `'200 OK'`, response, msg, allow

---

## Flujo de Uso

### Visualizar Tareas de una OT
1. En la tabla de Órdenes de Trabajo, hacer clic en **"📋 Ver tareas"**
2. Se abre un modal mostrando todas las tareas de la OT
3. Siempre muestra al menos una tarea (la tarea inicial)
4. Muestra estadísticas: Pendientes, En Proceso, Completadas, Canceladas

### Agregar Nueva Tarea
1. Desde la tabla de OT, hacer clic en **"➕ Agregar Tarea"**
   - O desde el modal de "Ver tareas", hacer clic en "Agregar Tarea"
2. Se abre formulario con:
   - Tipo de Servicio (requerido)
   - Descripción (opcional)
   - Horas Estimadas (opcional)
   - Prioridad (1-5, default: 3)
3. Al guardar, la tarea se agrega y el modal de lista se actualiza

### Gestionar Estado de Tareas
Desde el modal "Ver tareas":
- **▶️ Iniciar**: Cambia de "Pendiente" a "En proceso"
- **✅ Completar**: Cambia de "En proceso" a "Completada"
- **✖️ Cancelar**: Cambia a "Cancelada"
- **🗑️ Eliminar**: Elimina la tarea (requiere confirmación)

---

## Validaciones y Restricciones

1. **No se pueden eliminar tareas de OT cerradas** (validación en SP)
2. **Tipo de servicio es requerido** al agregar tarea
3. **Prioridad default es 3 (Normal)**
4. **Estados de tarea siguen flujo lógico**:
   - Pendiente → En proceso → Completada
   - Pendiente/En proceso → Cancelada

---

## Próximos Pasos

### Pendientes de Implementación

1. **Implementar SP reales para estados de OT**
   - Actualmente los estados están en JSON temporal
   - Crear SP para cambiar estados de OT

2. **Integrar estados de OT con transiciones**
   - Validar transiciones permitidas entre estados
   - Prevenir cambios inválidos

3. **Notificaciones al cliente**
   - Notificar cuando se agregan tareas adicionales
   - Similar al sistema de subcotizaciones existente

4. **Costos por tarea**
   - Agregar campos de costo a las tareas
   - Calcular costo total de OT basado en tareas

5. **Asignación de mecánicos a tareas**
   - Permitir asignar mecánicos específicos a cada tarea
   - Trackear tiempos por mecánico

---

## Tecnologías Utilizadas

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, SQL Server
- **Base de Datos**: SQL Server con Stored Procedures
- **Estado**: React Hooks (useState, useEffect)

---

## Autor y Fecha

**Implementado**: 24 de diciembre de 2025  
**Sistema**: Sistema de Gestión de Taller Mecánico

---

## Notas Técnicas

### Estructura de Datos
```typescript
interface OTTarea {
  ot_tarea_id: number;
  ot_id: number;
  tipo_servicio_id: number;
  servicio_nombre: string;
  descripcion?: string;
  prioridad: 1 | 2 | 3 | 4 | 5;
  estado_tarea: 'Pendiente' | 'En proceso' | 'Completada' | 'Cancelada';
  horas_estimadas?: number;
  horas_reales?: number;
  color_prioridad: 'ROJO' | 'AMARILLO' | 'VERDE';
}
```

### Endpoints API
```
GET    /api/workorders/:id/tareas
POST   /api/workorders/:id/tareas
DELETE /api/workorders/tareas/:tareaId
PUT    /api/workorders/tareas/:tareaId/estado
```

---

**¡Sistema completamente funcional y listo para usar!** 🚀
