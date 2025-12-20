const { getConnection, sql } = require('../config/database');

async function setupDatabase() {
  try {
    console.log(' Configurando base de datos...');
    const pool = await getConnection();
    
    // Crear tabla Users
    console.log(' Creando tabla Users...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      BEGIN
        CREATE TABLE Users (
          UserId INT IDENTITY(1,1) PRIMARY KEY,
          Email NVARCHAR(255) UNIQUE NOT NULL,
          Password NVARCHAR(255) NOT NULL,
          FullName NVARCHAR(255) NOT NULL,
          UserType NVARCHAR(50) NOT NULL CHECK (UserType IN ('admin', 'client')),
          Phone NVARCHAR(20),
          Address NVARCHAR(500),
          CompanyName NVARCHAR(255),
          IsActive BIT DEFAULT 1,
          SecurityCode NVARCHAR(10),
          SecurityCodeExpiry DATETIME,
          CreatedAt DATETIME DEFAULT GETDATE(),
          UpdatedAt DATETIME DEFAULT GETDATE()
        )
        PRINT 'Tabla Users creada'
      END
    `);
    
    // Insertar usuario administrador por defecto
    console.log(' Creando usuario administrador por defecto...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@taller.com')
      BEGIN
        INSERT INTO Users (Email, Password, FullName, UserType, IsActive)
        VALUES ('admin@taller.com', 'admin123', 'Administrador', 'admin', 1)
        PRINT 'Usuario administrador creado'
      END
    `);

    // Crear stored procedure SP_LOGIN
    console.log(' Creando SP_LOGIN...');
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

    // Crear stored procedure SP_REGISTRAR_USUARIO_CLIENTE
    console.log(' Creando SP_REGISTRAR_USUARIO_CLIENTE...');
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

    // Crear stored procedure SP_VERIFICAR_CODIGO_SEGURIDAD
    console.log(' Creando SP_VERIFICAR_CODIGO_SEGURIDAD...');
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

    // Crear otros stored procedures útiles
    console.log(' Creando procedures adicionales...');
    
    // SP_OBTENER_CLIENTES_REGISTRADOS
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_OBTENER_CLIENTES_REGISTRADOS')
        DROP PROCEDURE SP_OBTENER_CLIENTES_REGISTRADOS
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_OBTENER_CLIENTES_REGISTRADOS
      AS
      BEGIN
        SET NOCOUNT ON;
        
        SELECT 
          UserId,
          Email,
          FullName,
          Phone,
          Address,
          CompanyName,
          IsActive,
          CreatedAt
        FROM Users 
        WHERE UserType = 'client'
        ORDER BY CreatedAt DESC;
      END
    `);

    // SP_VALIDAR_CORREO_USUARIO
    console.log(' Creando SP_VALIDAR_CORREO_USUARIO...');
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

    // SP_OBTENER_CLIENTE_POR_ID
    console.log(' Creando SP_OBTENER_CLIENTE_POR_ID...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_OBTENER_CLIENTE_POR_ID')
        DROP PROCEDURE SP_OBTENER_CLIENTE_POR_ID
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_OBTENER_CLIENTE_POR_ID
        @ClientId INT
      AS
      BEGIN
        SET NOCOUNT ON;
        
        SELECT 
          UserId,
          Email,
          FullName,
          Phone,
          Address,
          CompanyName,
          IsActive,
          CreatedAt
        FROM Users 
        WHERE UserId = @ClientId AND UserType = 'client';
      END
    `);

    // SP_ACTUALIZAR_CLIENTE
    console.log(' Creando SP_ACTUALIZAR_CLIENTE...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_ACTUALIZAR_CLIENTE')
        DROP PROCEDURE SP_ACTUALIZAR_CLIENTE
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_ACTUALIZAR_CLIENTE
        @ClientId INT,
        @FullName NVARCHAR(255),
        @Phone NVARCHAR(20),
        @Address NVARCHAR(500),
        @CompanyName NVARCHAR(255)
      AS
      BEGIN
        SET NOCOUNT ON;
        
        UPDATE Users 
        SET 
          FullName = @FullName,
          Phone = @Phone,
          Address = @Address,
          CompanyName = @CompanyName,
          UpdatedAt = GETDATE()
        WHERE UserId = @ClientId AND UserType = 'client';
        
        IF @@ROWCOUNT > 0
        BEGIN
          SELECT 1 AS Success, 'Cliente actualizado exitosamente' AS Message;
        END
        ELSE
        BEGIN
          SELECT 0 AS Success, 'Cliente no encontrado' AS Message;
        END
      END
    `);

    // SP_REGISTRAR_USUARIO_PANEL_ADMIN
    console.log(' Creando SP_REGISTRAR_USUARIO_PANEL_ADMIN...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_REGISTRAR_USUARIO_PANEL_ADMIN')
        DROP PROCEDURE SP_REGISTRAR_USUARIO_PANEL_ADMIN
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_REGISTRAR_USUARIO_PANEL_ADMIN
        @nombre_completo NVARCHAR(255),
        @correo NVARCHAR(255),
        @telefono NVARCHAR(20),
        @rol NVARCHAR(50),
        @registradoPor INT
      AS
      BEGIN
        SET NOCOUNT ON;
        
        -- Verificar si el email ya existe
        IF EXISTS (SELECT * FROM Users WHERE Email = @correo)
        BEGIN
          SELECT 0 AS Success, 'El email ya está registrado' AS Message;
          RETURN;
        END
        
        -- Generar contraseña temporal
        DECLARE @TempPassword NVARCHAR(50) = CONCAT(@rol, '123');
        
        -- Insertar nuevo usuario admin
        INSERT INTO Users (Email, Password, FullName, UserType, Phone, IsActive)
        VALUES (@correo, @TempPassword, @nombre_completo, 'admin', @telefono, 1);
        
        SELECT 1 AS Success, 'Usuario creado exitosamente' AS Message, SCOPE_IDENTITY() AS UserId;
      END
    `);

    // SP_OBTENER_ROLES (según especificaciones exactas)
    console.log(' Creando SP_OBTENER_ROLES...');
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

    // SP_REGISTRAR_PASSWORD (FALTABA COMPLETAMENTE)
    console.log(' Creando SP_REGISTRAR_PASSWORD...');
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

    // SP_OBTENER_USUARIOS (FALTABA COMPLETAMENTE)
    console.log(' Creando SP_OBTENER_USUARIOS...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_OBTENER_USUARIOS')
        DROP PROCEDURE SP_OBTENER_USUARIOS
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_OBTENER_USUARIOS
        @obtener_todos BIT = 0,
        @usuario_id INT = NULL
      AS
      BEGIN
        SET NOCOUNT ON;
        
        IF @obtener_todos = 1
        BEGIN
          -- Obtener todos los usuarios activos
          SELECT 
            UserId AS usuario_id,
            FullName AS nombre_completo,
            Email AS correo,
            Phone AS telefono,
            UserType AS rol
          FROM Users 
          WHERE IsActive = 1;
        END
        ELSE
        BEGIN
          -- Obtener usuario específico
          SELECT 
            UserId AS usuario_id,
            FullName AS nombre_completo,
            Email AS correo,
            Phone AS telefono,
            UserType AS rol
          FROM Users 
          WHERE UserId = @usuario_id AND IsActive = 1;
        END
      END
    `);

    console.log(' Base de datos configurada exitosamente');
    
    // Verificar las tablas creadas
    const result = await pool.request().query('SELECT name FROM sys.tables');
    console.log(' Tablas en la base de datos:', result.recordset.map(r => r.name));
    
  } catch (error) {
    console.error(' Error configurando la base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log(' Configuración completada');
      process.exit(0);
    })
    .catch(err => {
      console.error(' Error en la configuración:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
