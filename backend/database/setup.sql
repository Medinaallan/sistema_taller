-- Crear tabla de usuarios para sistema de taller
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) UNIQUE NOT NULL,
        Password NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(255) NOT NULL,
        UserType NVARCHAR(50) NOT NULL,
        Phone NVARCHAR(20),
        Address NVARCHAR(500),
        CompanyName NVARCHAR(255),
        IsActive BIT DEFAULT 1,
        SecurityCode NVARCHAR(10),
        SecurityCodeExpiry DATETIME,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT CK_UserType CHECK (UserType IN ('admin', 'client'))
    );
    
    PRINT 'Tabla Users creada exitosamente';
END
ELSE
BEGIN
    PRINT 'La tabla Users ya existe';
END

-- Insertar usuario administrador por defecto
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@taller.com')
BEGIN
    INSERT INTO Users (Email, Password, FullName, UserType, IsActive)
    VALUES ('admin@taller.com', 'admin123', 'Administrador', 'admin', 1);
    
    PRINT 'Usuario administrador creado';
END
ELSE
BEGIN
    PRINT 'Usuario administrador ya existe';
END
