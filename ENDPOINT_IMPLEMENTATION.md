# Implementación: Endpoint POST /from-quotation (WorkOrders)

## Descripción
Se ha implementado el endpoint `POST /workorders/from-quotation` que genera una orden de trabajo desde una cotización aprobada, utilizando el stored procedure `SP_GENERAR_OT_DESDE_COTIZACION`.

## Ubicación
- **Archivo**: `backend/routes/workOrders.js`
- **Líneas**: 108-177
- **Route**: `POST /api/workorders/from-quotation`

## Parámetros de Entrada

```javascript
{
  cotizacion_id: INT (REQUERIDO),
  asesor_id: INT (REQUERIDO),
  mecanico_encargado_id: INT (OPCIONAL),
  odometro_ingreso: DECIMAL(10,1) (OPCIONAL),
  fecha_estimada: DATE (OPCIONAL),
  hora_estimada: TIME (OPCIONAL) // Formato: HH:mm:ss (horas de trabajo estimadas)
  generado_por: INT (OPCIONAL) // usuario_id
}
```

## Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "msg": "Orden de trabajo generada",
  "allow": true,
  "ot_id": 123,
  "numero_ot": "OT-2024-001",
  "data": {
    "msg": "...",
    "allow": true,
    "ot_id": 123,
    "numero_ot": "OT-2024-001"
  }
}
```

## Respuestas de Error

### 400 Bad Request - Parámetros faltantes
```json
{
  "success": false,
  "message": "Parámetros requeridos faltantes: cotizacion_id, asesor_id"
}
```

### 500 Internal Server Error - Error en el SP
```json
{
  "success": false,
  "message": "Error al crear orden desde cotización",
  "error": "Mensaje de error",
  "details": "Detalles adicionales del error"
}
```

## Características

✅ **Validación de parámetros requeridos** (cotizacion_id, asesor_id)
✅ **Manejo seguro de tipos de datos**
  - `parseInt()` para parámetros INT
  - `parseFloat()` para DECIMAL
✅ **Logging detallado** para debugging
✅ **Manejo robusto de errores** con mensajes descriptivos
✅ **Integración directa con SP_GENERAR_OT_DESDE_COTIZACION**

## Flujo de Uso

1. **Frontend**: Obtiene cotización aprobada
2. **Llamada al endpoint**: 
   ```javascript
   POST /api/workorders/from-quotation
   {
     "cotizacion_id": 5,
     "asesor_id": 2,
     "mecanico_encargado_id": 3,
     "odometro_ingreso": 45000.5,
     "fecha_estimada": "2024-12-15",
     "hora_estimada": "08:00:00",
     "generado_por": 2
   }
   ```
3. **Backend**: Ejecuta SP_GENERAR_OT_DESDE_COTIZACION
4. **Respuesta**: Retorna ot_id y numero_ot
5. **Frontend**: Redirige o muestra confirmación

## Integración en el Frontend

El servicio `quotationsService.ts` ya tiene la función `generateWorkOrderFromQuotation()` que consume este endpoint:

```typescript
async generateWorkOrderFromQuotation(quotationId: string, otData: {
  asesor_id: number;
  mecanico_encargado_id?: number | null;
  odometro_ingreso?: number | null;
  fecha_estimada?: string | null;
  hora_estimada?: string | null;
  generado_por?: number | null;
})
```

## Notas Importantes

- El SP `SP_GENERAR_OT_DESDE_COTIZACION` debe existir en la base de datos
- Los parámetros `fecha_estimada` y `hora_estimada` deben estar en formato ISO
- El parámetro `hora_estimada` es para las horas de trabajo estimadas (HH:mm:ss)
- La cotización debe estar aprobada antes de generar la OT
- El endpoint no valida el estado de la cotización (esa validación debe estar en el SP)

## Testing

Para probar el endpoint:

```bash
curl -X POST http://localhost:3000/api/workorders/from-quotation \
  -H "Content-Type: application/json" \
  -d '{
    "cotizacion_id": 5,
    "asesor_id": 2,
    "mecanico_encargado_id": 3,
    "odometro_ingreso": 45000.5,
    "fecha_estimada": "2024-12-15",
    "hora_estimada": "08:00:00",
    "generado_por": 2
  }'
```
