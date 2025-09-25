# Guía de Uso - Nueva Funcionalidad de Importación Excel

## Funcionalidades Implementadas

### 1. 🔄 Barra de Progreso con Timeout
- **Ubicación**: `src/componentes/ui/ProgressBar.tsx`
- **Características**:
  - Animación fluida de 0 a 100%
  - Mensajes contextuales durante el proceso
  - Duración configurable (por defecto 3 segundos)
  - Indicadores visuales y contadores de tiempo

### 2. 👁️ Modal de Vista Previa de Datos
- **Ubicación**: `src/componentes/gestion/DataPreviewModal.tsx`
- **Características**:
  - Tabla interactiva con datos de clientes y vehículos
  - Navegación por pestañas (Clientes/Vehículos)
  - Validación y mostrar errores/advertencias
  - Estadísticas de importación
  - Confirmación antes del procesamiento final

### 3. 🔧 Servicios Backend Mejorados
- **Vista previa**: `POST /api/excel-import/preview`
- **Confirmación**: `POST /api/excel-import/confirm`
- **Validaciones extendidas**: Campos obligatorios, unicidad, formatos

## Flujo Completo de Uso

### Paso 1: Descarga de Plantilla
```
Usuario hace clic en "Descargar Plantilla" → Se descarga archivo Excel
```

### Paso 2: Selección de Archivo
```
Usuario selecciona/arrastra archivo → Se inicia el proceso de carga
```

### Paso 3: Barra de Progreso
```
Se muestra barra animada con mensajes:
- "Leyendo archivo Excel..."
- "Validando formato..."
- "Procesando datos de clientes..."
- "Procesando datos de vehículos..."
- "Preparando vista previa..."
```

### Paso 4: Vista Previa de Datos
```
Modal se abre mostrando:
- Resumen de estadísticas (X clientes, Y vehículos)
- Errores de validación (si los hay)
- Advertencias
- Tablas con datos a procesar
- Botones: Cancelar / Confirmar Importación
```

### Paso 5: Confirmación y Procesamiento
```
Si usuario confirma:
- Se procesan los datos definitivamente
- Se guardan en archivos CSV
- Se muestra resultado final con estadísticas
```

## Archivos Modificados/Creados

### Nuevos Componentes
1. `src/componentes/ui/ProgressBar.tsx` - Barra de progreso animada
2. `src/componentes/gestion/DataPreviewModal.tsx` - Modal de vista previa

### Archivos Modificados
1. `src/componentes/gestion/ExcelImportModal.tsx` - Integración completa del flujo
2. `backend/services/excelImportService.js` - Método `previewExcelFile()` y `validateDataForPreview()`
3. `backend/routes/excelImport.js` - Endpoints `/preview` y `/confirm`

### Scripts de Utilidad
1. `backend/scripts/testExcelImportFlow.js` - Script de pruebas de endpoints

## Características Técnicas

### Validaciones Implementadas
- **Clientes**: name, email, phone, password (obligatorios)
- **Vehículos**: clienteEmail, marca, modelo, año, placa, color (obligatorios)
- **Unicidad**: emails y placas únicas
- **Formato**: email válido, año numérico válido
- **Relaciones**: vehículos deben tener cliente existente

### Manejo de Errores
- Archivos temporales se limpian automáticamente
- Validaciones detalladas con ubicación de errores por fila
- Mensajes de error contextuales para el usuario

### UX/UI Mejorada
- Drag & drop para archivos
- Indicadores visuales de estado
- Animaciones fluidas
- Navegación intuitiva entre pasos
- Confirmación explícita antes de procesar datos

## Uso

1. Abrir el modal de importación desde la interfaz
2. Descargar y completar la plantilla Excel
3. Subir el archivo (drag & drop o selección)
4. Esperar la barra de progreso
5. Revisar los datos en la vista previa
6. Confirmar o cancelar la importación
7. Ver resultado final con estadísticas

## Notas de Desarrollo

- Compatible con formatos .xlsx y .xls
- Límite de archivo: 10MB
- Archivos temporales se mantienen solo durante la sesión
- Validación tanto en frontend como backend
- Manejo robusto de errores y estados de carga