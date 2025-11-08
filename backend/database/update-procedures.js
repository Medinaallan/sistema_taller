const { getConnection, sql } = require('../config/database');

async function updateStoredProcedures() {
  try {
    console.log('🔄 Actualizando stored procedures...');
    const pool = await getConnection();
    
    // SP_LOGIN - Corregir parámetros según especificaciones
    console.log('📝 Actualizando SP_LOGIN...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_LOGIN')
        DROP PROCEDURE SP_LOGIN
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_LOGIN
        @correo VARCHAR(100),
        @password NVARCHAR(100)
      AS
      BEGIN
        SET NOCOUNT ON;
        
        DECLARE @usuario_id INT, @nombre_completo NVARCHAR(255), @telefono NVARCHAR(20), @rol NVARCHAR(50);
        
        SELECT 
          @usuario_id = UserId,
          @nombre_completo = FullName,
          @telefono = Phone,
          @rol = UserType
        FROM Users 
        WHERE Email = @correo 
          AND Password = @password 
          AND IsActive = 1;
        
        IF @usuario_id IS NOT NULL
        BEGIN
          SELECT 
            @usuario_id AS usuario_id,
            @nombre_completo AS nombre_completo,
            @correo AS correo,
            @telefono AS telefono,
            @rol AS rol;
        END
        ELSE
        BEGIN
          SELECT 'Usuario o contraseña incorrectos' AS msg;
        END
      END
    `);
    console.log('✅ SP_LOGIN actualizado');

    // SP_REGISTRAR_USUARIO_CLIENTE - Según especificaciones
    console.log('📝 Actualizando SP_REGISTRAR_USUARIO_CLIENTE...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_REGISTRAR_USUARIO_CLIENTE')
        DROP PROCEDURE SP_REGISTRAR_USUARIO_CLIENTE
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_REGISTRAR_USUARIO_CLIENTE
        @nombre_completo VARCHAR(100),
        @correo VARCHAR(100),
        @telefono VARCHAR(30)
      AS
      BEGIN
        SET NOCOUNT ON;
        
        -- Verificar si el email ya existe
        IF EXISTS (SELECT * FROM Users WHERE Email = @correo)
        BEGIN
          SELECT 
            'El email ya está registrado' AS msg,
            0 AS allow;
          RETURN;
        END
        
        -- Generar código de seguridad
        DECLARE @codigo_seguridad VARCHAR(6) = RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR), 6);
        DECLARE @SecurityCodeExpiry DATETIME = DATEADD(MINUTE, 15, GETDATE());
        
        -- Insertar nuevo usuario (sin password aún)
        INSERT INTO Users (Email, Password, FullName, UserType, Phone, IsActive, SecurityCode, SecurityCodeExpiry)
        VALUES (@correo, 'TEMP_PASSWORD', @nombre_completo, 'client', @telefono, 0, @codigo_seguridad, @SecurityCodeExpiry);
        
        SELECT 
          '200 OK' AS response,
          'Usuario registrado con éxito' AS msg,
          @codigo_seguridad AS codigo_seguridad;
      END
    `);
    console.log('✅ SP_REGISTRAR_USUARIO_CLIENTE actualizado');

    // SP_VERIFICAR_CODIGO_SEGURIDAD - Según especificaciones
    console.log('📝 Actualizando SP_VERIFICAR_CODIGO_SEGURIDAD...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_VERIFICAR_CODIGO_SEGURIDAD')
        DROP PROCEDURE SP_VERIFICAR_CODIGO_SEGURIDAD
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_VERIFICAR_CODIGO_SEGURIDAD
        @correo VARCHAR(100),
        @codigo_seguridad VARCHAR(6)
      AS
      BEGIN
        SET NOCOUNT ON;
        
        DECLARE @UserId INT, @CodeExpiry DATETIME;
        
        SELECT @UserId = UserId, @CodeExpiry = SecurityCodeExpiry
        FROM Users 
        WHERE Email = @correo 
          AND SecurityCode = @codigo_seguridad;
        
        IF @UserId IS NULL
        BEGIN
          SELECT 'Código de seguridad inválido' AS msg, 0 AS allow;
          RETURN;
        END
        
        IF @CodeExpiry < GETDATE()
        BEGIN
          SELECT 'El código de seguridad ha expirado' AS msg, 0 AS allow;
          RETURN;
        END
        
        -- Limpiar código (pero mantener usuario inactivo hasta que registre password)
        UPDATE Users 
        SET SecurityCode = NULL, SecurityCodeExpiry = NULL
        WHERE UserId = @UserId;
        
        SELECT 'Código verificado exitosamente' AS msg, 1 AS allow;
      END
    `);
    console.log('✅ SP_VERIFICAR_CODIGO_SEGURIDAD actualizado');

    // SP_VALIDAR_CORREO_USUARIO - Con parámetro opcional
    console.log('📝 Actualizando SP_VALIDAR_CORREO_USUARIO...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_VALIDAR_CORREO_USUARIO')
        DROP PROCEDURE SP_VALIDAR_CORREO_USUARIO
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_VALIDAR_CORREO_USUARIO
        @correo VARCHAR(100),
        @usuario_id INT = NULL
      AS
      BEGIN
        SET NOCOUNT ON;
        
        -- Si se proporciona usuario_id, excluir ese usuario de la validación (para actualización)
        IF @usuario_id IS NOT NULL
        BEGIN
          IF EXISTS (SELECT * FROM Users WHERE Email = @correo AND UserId != @usuario_id)
          BEGIN
            SELECT 'El correo ya está registrado por otro usuario' AS msg, 0 AS allow;
          END
          ELSE
          BEGIN
            SELECT 'Correo disponible' AS msg, 1 AS allow;
          END
        END
        ELSE
        BEGIN
          -- Validación normal para registro nuevo
          IF EXISTS (SELECT * FROM Users WHERE Email = @correo)
          BEGIN
            SELECT 'El correo ya está registrado' AS msg, 0 AS allow;
          END
          ELSE
          BEGIN
            SELECT 'Correo disponible' AS msg, 1 AS allow;
          END
        END
      END
    `);
    console.log('✅ SP_VALIDAR_CORREO_USUARIO actualizado');

    // SP_REGISTRAR_PASSWORD - NUEVO
    console.log('📝 Creando SP_REGISTRAR_PASSWORD...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_REGISTRAR_PASSWORD')
        DROP PROCEDURE SP_REGISTRAR_PASSWORD
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_REGISTRAR_PASSWORD
        @correo VARCHAR(100),
        @password NVARCHAR(100)
      AS
      BEGIN
        SET NOCOUNT ON;
        
        DECLARE @UserId INT;
        
        -- Verificar que el usuario existe y no tiene password aún (o tiene password temporal)
        SELECT @UserId = UserId
        FROM Users 
        WHERE Email = @correo 
          AND (Password = 'TEMP_PASSWORD' OR SecurityCode IS NULL);
        
        IF @UserId IS NULL
        BEGIN
          SELECT 'Usuario no encontrado o ya tiene contraseña registrada' AS msg, 0 AS allow;
          RETURN;
        END
        
        -- Actualizar contraseña y activar usuario
        UPDATE Users 
        SET 
          Password = @password,
          IsActive = 1,
          UpdatedAt = GETDATE()
        WHERE UserId = @UserId;
        
        SELECT 'Contraseña registrada exitosamente' AS msg, 1 AS allow;
      END
    `);
    console.log('✅ SP_REGISTRAR_PASSWORD creado');

    // SP_REGISTRAR_USUARIO_PANEL_ADMIN - Según especificaciones
    console.log('📝 Actualizando SP_REGISTRAR_USUARIO_PANEL_ADMIN...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_REGISTRAR_USUARIO_PANEL_ADMIN')
        DROP PROCEDURE SP_REGISTRAR_USUARIO_PANEL_ADMIN
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_REGISTRAR_USUARIO_PANEL_ADMIN
        @nombre_completo VARCHAR(100),
        @correo VARCHAR(100),
        @telefono VARCHAR(30),
        @rol VARCHAR(50),
        @registradoPor INT = NULL
      AS
      BEGIN
        SET NOCOUNT ON;
        
        -- Verificar si el email ya existe
        IF EXISTS (SELECT * FROM Users WHERE Email = @correo)
        BEGIN
          SELECT 'El email ya está registrado' AS msg, 0 AS allow;
          RETURN;
        END
        
        -- Generar contraseña temporal
        DECLARE @TempPassword NVARCHAR(50) = CONCAT(@rol, '123');
        
        -- Insertar nuevo usuario admin
        INSERT INTO Users (Email, Password, FullName, UserType, Phone, IsActive)
        VALUES (@correo, @TempPassword, @nombre_completo, 'admin', @telefono, 1);
        
        SELECT 
          '200 OK' AS response,
          'Usuario registrado con éxito' AS msg,
          SCOPE_IDENTITY() AS usuario_id;
      END
    `);
    console.log('✅ SP_REGISTRAR_USUARIO_PANEL_ADMIN actualizado');

    // SP_OBTENER_ROLES - Según especificaciones
    console.log('📝 Actualizando SP_OBTENER_ROLES...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_OBTENER_ROLES')
        DROP PROCEDURE SP_OBTENER_ROLES
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_OBTENER_ROLES
      AS
      BEGIN
        SET NOCOUNT ON;
        
        SELECT 
          1 AS rol_id, 
          'Administrador' AS nombre, 
          'Acceso completo al sistema' AS descripcion
        UNION ALL
        SELECT 
          2 AS rol_id, 
          'Mecánico' AS nombre, 
          'Gestión de órdenes de trabajo y servicios' AS descripcion
        UNION ALL
        SELECT 
          3 AS rol_id, 
          'Recepcionista' AS nombre, 
          'Gestión de clientes y citas' AS descripcion;
      END
    `);
    console.log('✅ SP_OBTENER_ROLES actualizado');

    // SP_OBTENER_USUARIOS - NUEVO
    console.log('📝 Creando SP_OBTENER_USUARIOS...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_OBTENER_USUARIOS')
        DROP PROCEDURE SP_OBTENER_USUARIOS
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_OBTENER_USUARIOS
        @usuario_id INT
      AS
      BEGIN
        SET NOCOUNT ON;
        
        SELECT 
          UserId AS usuario_id,
          FullName AS nombre_completo,
          Email AS correo,
          Phone AS telefono,
          UserType AS rol
        FROM Users 
        WHERE UserId = @usuario_id AND IsActive = 1;
      END
    `);
    console.log('✅ SP_OBTENER_USUARIOS creado');

    console.log('🎉 TODOS LOS STORED PROCEDURES ACTUALIZADOS EXITOSAMENTE');
    console.log('📋 Stored procedures actualizados:');
    console.log('   1. SP_LOGIN');
    console.log('   2. SP_REGISTRAR_USUARIO_CLIENTE');
    console.log('   3. SP_VERIFICAR_CODIGO_SEGURIDAD');
    console.log('   4. SP_VALIDAR_CORREO_USUARIO');
    console.log('   5. SP_REGISTRAR_PASSWORD');
    console.log('   6. SP_REGISTRAR_USUARIO_PANEL_ADMIN');
    console.log('   7. SP_OBTENER_ROLES');
    console.log('   8. SP_OBTENER_USUARIOS');
    
  } catch (error) {
    console.error('❌ Error actualizando stored procedures:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateStoredProcedures()
    .then(() => {
      console.log('✅ Actualización completada');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error en la actualización:', err);
      process.exit(1);
    });
}

module.exports = { updateStoredProcedures };