// Simulación de stored procedures según especificaciones exactas
// Esto permite que el backend funcione mientras configuramos la base de datos real

let mockUsers = [
  {
    userId: 1,
    email: 'admin@taller.com',
    password: 'admin123',
    fullName: 'Administrador',
    userType: 'admin',
    phone: null,
    address: null,
    companyName: null,
    isActive: true,
    securityCode: null,
    securityCodeExpiry: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    userId: 2,
    email: 'operador@taller.com',
    password: 'operador123',
    fullName: 'Operador Taller',
    userType: 'admin',
    phone: null,
    address: null,
    companyName: null,
    isActive: true,
    securityCode: null,
    securityCodeExpiry: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

let mockClients = [];
let nextUserId = 3;

// Función para generar código de seguridad
function generateSecurityCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SP_VALIDAR_CORREO_USUARIO - Validar si el correo está disponible
async function SP_VALIDAR_CORREO_USUARIO(correo) {
  try {
    // Verificar si el email ya existe
    const existingUser = [...mockUsers, ...mockClients].find(u => u.email === correo);
    
    if (existingUser) {
      return {
        msg: 'El correo ya está registrado',
        allow: 0
      };
    }

    // Validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return {
        msg: 'Formato de correo inválido',
        allow: 0
      };
    }

    return {
      msg: 'Correo válido',
      allow: 1
    };
  } catch (error) {
    return {
      msg: 'Error al validar correo',
      allow: 0
    };
  }
}

// SP_REGISTRAR_USUARIO_CLIENTE - Registro de cliente (paso 1)
async function SP_REGISTRAR_USUARIO_CLIENTE(nombre_completo, correo, telefono) {
  try {
    // Verificar si el email ya existe
    const existingUser = [...mockUsers, ...mockClients].find(u => u.email === correo);
    
    if (existingUser) {
      return {
        msg: 'El email ya está registrado',
        allow: 0
      };
    }

    // Generar código de seguridad
    const codigo_seguridad = generateSecurityCode();
    const securityCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Crear cliente temporal (sin password aún)
    const newClient = {
      userId: nextUserId++,
      email: correo,
      password: null, // Se establecerá después
      fullName: nombre_completo,
      userType: 'client',
      phone: telefono,
      address: null,
      companyName: null,
      isActive: false, // Se activa después de verificar código
      securityCode: codigo_seguridad,
      securityCodeExpiry,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockClients.push(newClient);

    return {
      response: '200 OK',
      msg: 'Usuario registrado con éxito',
      codigo_seguridad: codigo_seguridad
    };
  } catch (error) {
    return {
      msg: 'Error al registrar usuario cliente',
      allow: 0
    };
  }
}

// SP_VERIFICAR_CODIGO_SEGURIDAD - Verificar código (paso 2)
async function SP_VERIFICAR_CODIGO_SEGURIDAD(correo, codigo_seguridad) {
  try {
    const client = mockClients.find(c => c.email === correo && c.securityCode === codigo_seguridad);

    if (!client) {
      return {
        msg: 'Código de seguridad inválido',
        allow: 0
      };
    }

    if (client.securityCodeExpiry && client.securityCodeExpiry < new Date()) {
      return {
        msg: 'El código de seguridad ha expirado',
        allow: 0
      };
    }

    // Marcar como código verificado (pero aún no activo)
    client.securityCode = null; // Limpiar código
    client.securityCodeExpiry = null;
    client.updatedAt = new Date();

    return {
      msg: 'Código verificado exitosamente',
      allow: 1
    };
  } catch (error) {
    return {
      msg: 'Error al verificar código de seguridad',
      allow: 0
    };
  }
}

// SP_REGISTRAR_PASSWORD - Registrar contraseña final (paso 3)
async function SP_REGISTRAR_PASSWORD(correo, password) {
  try {
    const client = mockClients.find(c => c.email === correo && !c.isActive && !c.securityCode);

    if (!client) {
      return {
        msg: 'Usuario no encontrado o código no verificado',
        allow: 0
      };
    }

    // Establecer contraseña y activar cuenta
    client.password = password;
    client.isActive = true;
    client.updatedAt = new Date();

    return {
      msg: 'Contraseña registrada con éxito',
      allow: 1
    };
  } catch (error) {
    return {
      msg: 'Error al registrar contraseña',
      allow: 0
    };
  }
}

// SP_LOGIN - Login de usuario
async function SP_LOGIN(correo, password) {
  try {
    // Buscar en usuarios administradores
    const user = mockUsers.find(u => u.email === correo && u.password === password && u.isActive);
    
    if (user) {
      return {
        allow: 1,
        usuario: {
          usuario_id: user.userId,
          nombre_completo: user.fullName,
          correo: user.email,
          telefono: user.phone || '',
          rol: user.userType
        }
      };
    }

    // Buscar en clientes
    const client = mockClients.find(c => c.email === correo && c.password === password && c.isActive);
    
    if (client) {
      return {
        allow: 1,
        usuario: {
          usuario_id: client.userId,
          nombre_completo: client.fullName,
          correo: client.email,
          telefono: client.phone || '',
          rol: client.userType
        }
      };
    }

    return {
      allow: 0,
      msg: 'Usuario o contraseña incorrectos'
    };
  } catch (error) {
    return {
      allow: 0,
      msg: 'Usuario o contraseña incorrectos'
    };
  }
}

//Registro desde panel admin
async function SP_REGISTRAR_USUARIO_PANEL_ADMIN(nombre_completo, correo, telefono, rol, registradoPor = null) {
  try {
    // Verificar si el email ya existe
    const existingUser = [...mockUsers, ...mockClients].find(u => u.email === correo);
    
    if (existingUser) {
      return {
        msg: 'El email ya está registrado',
        allow: 0
      };
    }

    // Crear nuevo usuario admin
    const newAdmin = {
      userId: nextUserId++,
      email: correo,
      password: 'temp123', // Password temporal
      fullName: nombre_completo,
      userType: rol === 'admin' ? 'admin' : 'client',
      phone: telefono,
      address: null,
      companyName: null,
      isActive: true,
      securityCode: null,
      securityCodeExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockUsers.push(newAdmin);

    return {
      response: '200 OK',
      msg: 'Usuario registrado con éxito'
    };
  } catch (error) {
    return {
      msg: 'Error al registrar usuario administrador',
      allow: 0
    };
  }
}

// SP_OBTENER_CLIENTES_REGISTRADOS - Obtener lista de clientes
async function SP_OBTENER_CLIENTES_REGISTRADOS() {
  try {
    return mockClients.filter(c => c.isActive).map(client => ({
      userId: client.userId,
      email: client.email,
      fullName: client.fullName,
      phone: client.phone,
      address: client.address,
      companyName: client.companyName,
      isActive: client.isActive,
      createdAt: client.createdAt
    }));
  } catch (error) {
    console.error('Error en SP_OBTENER_CLIENTES_REGISTRADOS:', error);
    return [];
  }
}

// Función para obtener estadísticas (útil para debugging)
function getStats() {
  return {
    totalUsers: mockUsers.length,
    totalClients: mockClients.length,
    activeClients: mockClients.filter(c => c.isActive).length,
    pendingClients: mockClients.filter(c => !c.isActive).length
  };
}

module.exports = {
  SP_VALIDAR_CORREO_USUARIO,
  SP_REGISTRAR_USUARIO_CLIENTE,
  SP_VERIFICAR_CODIGO_SEGURIDAD,
  SP_REGISTRAR_PASSWORD,
  SP_LOGIN,
  SP_REGISTRAR_USUARIO_PANEL_ADMIN,
  SP_OBTENER_CLIENTES_REGISTRADOS,
  getStats
};
