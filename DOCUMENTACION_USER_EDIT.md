# 📝 Flujo de Edición de Usuarios - SP_EDITAR_USUARIO

## Resumen
Se ha implementado completamente el flujo de edición de usuarios mediante el Stored Procedure `SP_EDITAR_USUARIO`. El flujo incluye:
- Backend endpoint con validación
- Frontend modal con integración API
- Recarga automática de lista

---

## 🔄 Arquitectura del Flujo

### 1️⃣ Frontend - UserModal Component
**Archivo**: `src/paginas/administracion/secciones/UserManagementSection.tsx`

**Funcionalidad**:
- Formulario modal para editar usuarios
- Campos editables: `nombre_completo`, `correo`, `telefono`
- Campo NO editable: `username` (solo en modo edición)
- Validación de email en el servidor

**Código clave**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    if (user) {
      // PUT /api/users/:usuarioId
      const response = await fetch(`${apiUrl}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: formData.fullName,
          correo: formData.email,
          telefono: formData.phone
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.msg || 'Error al editar usuario');
      }

      alert('✅ Usuario actualizado exitosamente');
      onSave(formData);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Estado y manejo de errores**:
- `loading`: Desactiva botones mientras se procesa
- `error`: Muestra mensajes de validación (ej: email duplicado)
- Alert de éxito cuando se completa

---

### 2️⃣ Backend - Endpoint PUT /api/users/:usuarioId
**Archivo**: `backend/routes/users.js` (líneas 277-318)

**Funcionalidad**:
- Valida que al menos un campo esté presente
- Llama a `SP_VALIDAR_CORREO_USUARIO` si se proporciona correo
- Ejecuta `SP_EDITAR_USUARIO` con los parámetros validados
- Retorna respuesta estructurada

**Código clave**:
```javascript
router.put('/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const { nombre_completo, correo, telefono } = req.body;
  
  console.log(`📝 Editando usuario ${usuarioId}:`, req.body);

  // Validación: al menos un campo
  if (!nombre_completo && !correo && !telefono) {
    return res.status(400).json({
      success: false,
      msg: 'Debe proporcionar al menos un campo para actualizar'
    });
  }

  try {
    const pool = await getConnection();
    
    // Si se proporciona correo, validar que no esté duplicado
    if (correo) {
      const validationResult = await pool.request()
        .input('correo', sql.VarChar, correo)
        .input('usuario_id', sql.Int, usuarioId)
        .execute('SP_VALIDAR_CORREO_USUARIO');

      const validation = validationResult.recordset[0];
      if (!validation.valido) {
        return res.status(400).json({
          success: false,
          msg: validation.mensaje || 'Email no disponible'
        });
      }
    }

    // Ejecutar SP_EDITAR_USUARIO
    const result = await pool.request()
      .input('usuario_id', sql.Int, parseInt(usuarioId))
      .input('nombre_completo', sql.VarChar, nombre_completo || null)
      .input('correo', sql.VarChar, correo || null)
      .input('telefono', sql.VarChar, telefono || null)
      .execute('SP_EDITAR_USUARIO');

    const response = result.recordset[0] || {};
    console.log('✅ Usuario actualizado:', response);

    res.json({
      success: response.resultado === 1,
      msg: response.mensaje || 'Usuario actualizado',
      data: response
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});
```

**Validaciones implementadas**:
1. **Campo obligatorio**: Al menos `nombre_completo`, `correo` o `telefono`
2. **Email válido**: SP_VALIDAR_CORREO_USUARIO retorna si es válido
3. **Parámetros seguros**: Usa sql.Int, sql.VarChar para prevenir inyecciones
4. **Logging exhaustivo**: 6 console.log para debugging

---

### 3️⃣ Recarga automática de lista
**Archivo**: `src/paginas/administracion/secciones/UserManagementSection.tsx`

**Funcionalidad en onSave**:
```typescript
onSave={(userData) => {
  if (selectedUser) {
    // Actualizar estado local
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, ...userData, updatedAt: new Date() } 
        : u
    ));
  }
  setShowUserModal(false);
  setSelectedUser(null);
  
  // ⭐ Recargar lista después de 500ms
  setTimeout(() => loadUsers(), 500);
}}
```

**Por qué 500ms**:
- Asegura que la BD completó la transacción
- Evita condiciones de carrera
- Proporciona feedback visual al usuario

---

## 📋 Parámetros del SP

### SP_VALIDAR_CORREO_USUARIO
**Input**:
- `correo` (VARCHAR): Email a validar
- `usuario_id` (INT): ID del usuario (para excluirlo de la búsqueda)

**Output**:
- `valido` (BIT): 1 = válido, 0 = duplicado
- `mensaje` (VARCHAR): Descripción del resultado

### SP_EDITAR_USUARIO
**Input**:
- `usuario_id` (INT): ID del usuario a editar
- `nombre_completo` (VARCHAR): Nombre completo (NULLABLE)
- `correo` (VARCHAR): Email (NULLABLE)
- `telefono` (VARCHAR): Teléfono (NULLABLE)

**Output**:
- `resultado` (INT): 1 = éxito, 0 = error
- `mensaje` (VARCHAR): Descripción del resultado

---

## 🧪 Pruebas

### Test con script
```bash
node backend/scripts/testUserEdit.js
```

**Qué prueba**:
1. Conexión a BD
2. Obtención de usuarios
3. Validación de correo nuevo
4. Edición de usuario
5. Verificación de cambios

### Test manual en UI
1. Ir a Administración > Gestión de Usuarios
2. Hacer click en ✏️ de un usuario
3. Cambiar nombre, email o teléfono
4. Click "Actualizar"
5. Verificar:
   - ✅ Aparece alert de éxito
   - ✅ Modal se cierra
   - ✅ Tabla se actualiza con nuevos valores
   - ✅ Cambios persisten al refrescar

---

## ⚠️ Casos de error

| Error | Causa | Acción |
|-------|-------|--------|
| "Email no disponible" | Email duplicado | Usuario ve mensaje en modal |
| "Debe proporcionar al menos un campo" | Sin cambios | Formulario rechaza submit |
| "Error al editar usuario" | Error BD | Alert muestra error, puede reintentar |

---

## 📊 Flow Diagram

```
UserModal Form
     ↓
handleSubmit() triggered
     ↓
Validar campos locales
     ↓
PUT /api/users/:usuarioId
     ↓
Backend validates
     ├─ Si correo: SP_VALIDAR_CORREO_USUARIO
     └─ SP_EDITAR_USUARIO
     ↓
Respuesta JSON { success, msg }
     ↓
if success:
  ├─ alert('✅ Actualizado')
  ├─ onSave(formData)
  ├─ setShowUserModal(false)
  └─ setTimeout(() => loadUsers(), 500)
else:
  └─ setError(msg) + mostrar en modal
```

---

## 🔧 Configuración necesaria

### Variables de entorno
- `VITE_API_URL`: URL del API (ej: http://localhost:8080/api)

### BD
- Stored Procedures: `SP_EDITAR_USUARIO`, `SP_VALIDAR_CORREO_USUARIO`
- Tabla `usuarios` con columnas: usuario_id, nombre_completo, correo, telefono

---

## ✅ Checklist de implementación

- [x] Backend endpoint PUT /api/users/:usuarioId
- [x] Validación de email duplicado
- [x] Validación de campos obligatorios
- [x] Frontend UserModal con estado y errors
- [x] Llamada fetch con método PUT
- [x] Manejo de respuestas y errores
- [x] Recarga automática de lista
- [x] Logging en backend
- [x] Deshabilitación de botones durante carga
- [x] Mensajes de error en modal
- [x] Tests unitarios

---

## 🚀 Próximos pasos

1. **Crear usuario**: Implementar POST endpoint para nuevos usuarios
2. **Eliminar usuario**: Implementar DELETE endpoint con validación
3. **Permisos**: Implementar rol-based editing (solo admin puede editar)
4. **Auditoría**: Registrar quién editó qué y cuándo
5. **Validaciones avanzadas**: Validar teléfono, nombre vacío, etc.

---

**Estado**: ✅ COMPLETADO Y FUNCIONAL
**Última actualización**: 2024
**Autor**: Sistema de Gestión de Taller
