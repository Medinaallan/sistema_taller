const { getConnection, sql } = require('../config/database');

async function setupDatabase() {
  try {
    console.log('🔧 Configurando base de datos...');
    const pool = await getConnection();
    
    // Crear tabla Users
    console.log('📋 Creando tabla Users...');
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
    console.log('👤 Creando usuario administrador por defecto...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@taller.com')
      BEGIN
        INSERT INTO Users (Email, Password, FullName, UserType, IsActive)
        VALUES ('admin@taller.com', 'admin123', 'Administrador', 'admin', 1)
        PRINT 'Usuario administrador creado'
      END
    `);

    // Crear stored procedure SP_LOGIN
    console.log('🔐 Creando SP_LOGIN...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_LOGIN')
        DROP PROCEDURE SP_LOGIN
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_LOGIN
        @Email NVARCHAR(255),
        @Password NVARCHAR(255)
      AS
      BEGIN
        SET NOCOUNT ON;
        
        DECLARE @UserId INT, @FullName NVARCHAR(255), @UserType NVARCHAR(50);
        
        SELECT 
          @UserId = UserId,
          @FullName = FullName,
          @UserType = UserType
        FROM Users 
        WHERE Email = @Email 
          AND Password = @Password 
          AND IsActive = 1;
        
        IF @UserId IS NOT NULL
        BEGIN
          SELECT 
            1 AS Success,
            'Login exitoso' AS Message,
            @UserId AS UserId,
            @Email AS Email,
            @FullName AS FullName,
            @UserType AS UserType;
        END
        ELSE
        BEGIN
          SELECT 
            0 AS Success,
            'Credenciales inválidas' AS Message,
            NULL AS UserId,
            NULL AS Email,
            NULL AS FullName,
            NULL AS UserType;
        END
      END
    `);

    // Crear stored procedure SP_REGISTRAR_USUARIO_CLIENTE
    console.log('📝 Creando SP_REGISTRAR_USUARIO_CLIENTE...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_REGISTRAR_USUARIO_CLIENTE')
        DROP PROCEDURE SP_REGISTRAR_USUARIO_CLIENTE
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_REGISTRAR_USUARIO_CLIENTE
        @Email NVARCHAR(255),
        @Password NVARCHAR(255),
        @FullName NVARCHAR(255),
        @Phone NVARCHAR(20),
        @Address NVARCHAR(500) = '',
        @CompanyName NVARCHAR(255) = ''
      AS
      BEGIN
        SET NOCOUNT ON;
        
        -- Verificar si el email ya existe
        IF EXISTS (SELECT * FROM Users WHERE Email = @Email)
        BEGIN
          SELECT 
            0 AS Success,
            'El email ya está registrado' AS Message,
            NULL AS UserId,
            NULL AS SecurityCode;
          RETURN;
        END
        
        -- Generar código de seguridad
        DECLARE @SecurityCode NVARCHAR(10) = RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS NVARCHAR), 6);
        DECLARE @SecurityCodeExpiry DATETIME = DATEADD(MINUTE, 15, GETDATE());
        
        -- Insertar nuevo usuario
        DECLARE @UserId INT;
        INSERT INTO Users (Email, Password, FullName, UserType, Phone, Address, CompanyName, IsActive, SecurityCode, SecurityCodeExpiry)
        VALUES (@Email, @Password, @FullName, 'client', @Phone, @Address, @CompanyName, 0, @SecurityCode, @SecurityCodeExpiry);
        
        SET @UserId = SCOPE_IDENTITY();
        
        SELECT 
          1 AS Success,
          'Cliente registrado exitosamente. Verifique su código de seguridad.' AS Message,
          @UserId AS UserId,
          @SecurityCode AS SecurityCode;
      END
    `);

    // Crear stored procedure SP_VERIFICAR_CODIGO_SEGURIDAD
    console.log('🔒 Creando SP_VERIFICAR_CODIGO_SEGURIDAD...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_VERIFICAR_CODIGO_SEGURIDAD')
        DROP PROCEDURE SP_VERIFICAR_CODIGO_SEGURIDAD
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE SP_VERIFICAR_CODIGO_SEGURIDAD
        @Email NVARCHAR(255),
        @SecurityCode NVARCHAR(10)
      AS
      BEGIN
        SET NOCOUNT ON;
        
        DECLARE @UserId INT, @CodeExpiry DATETIME;
        
        SELECT @UserId = UserId, @CodeExpiry = SecurityCodeExpiry
        FROM Users 
        WHERE Email = @Email 
          AND SecurityCode = @SecurityCode
          AND IsActive = 0;
        
        IF @UserId IS NULL
        BEGIN
          SELECT 0 AS Success, 'Código de seguridad inválido' AS Message;
          RETURN;
        END
        
        IF @CodeExpiry < GETDATE()
        BEGIN
          SELECT 0 AS Success, 'El código de seguridad ha expirado' AS Message;
          RETURN;
        END
        
        -- Activar usuario y limpiar código
        UPDATE Users 
        SET IsActive = 1, SecurityCode = NULL, SecurityCodeExpiry = NULL
        WHERE UserId = @UserId;
        
        SELECT 1 AS Success, 'Código verificado exitosamente. Cuenta activada.' AS Message;
      END
    `);

    // Crear otros stored procedures útiles
    console.log('📊 Creando procedures adicionales...');
    
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

    console.log('✅ Base de datos configurada exitosamente');
    
    // Verificar las tablas creadas
    const result = await pool.request().query('SELECT name FROM sys.tables');
    console.log('📋 Tablas en la base de datos:', result.recordset.map(r => r.name));
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Configuración completada');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Error en la configuración:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
