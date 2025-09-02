 const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Middleware básico
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5174');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Cargar stored procedures
let storedProcedures;
try {
  storedProcedures = require('./simulation/storedProcedures');
  console.log('Stored procedures cargados correctamente');
} catch (error) {
  console.error('Error cargando stored procedures:', error.message);
  process.exit(1);
}

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check solicitado');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });

});

// Validar email (Paso 1)
app.post('/api/auth/validate-email', async (req, res) => {
  console.log('Validar email:', req.body);
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.json({ msg: 'Correo requerido', allow: 0 });
    }
    const result = await storedProcedures.SP_VALIDAR_CORREO_USUARIO(correo);
    console.log('Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('Error validando email:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Registrar usuario (Paso 2)
app.post('/api/auth/register-user-info', async (req, res) => {
  console.log('👤 Registrar usuario:', req.body);
  try {
    const { nombre_completo, correo, telefono } = req.body;
    if (!nombre_completo || !correo || !telefono) {
      return res.json({ msg: 'Todos los campos son requeridos', allow: 0 });
    }
    const result = await storedProcedures.SP_REGISTRAR_USUARIO_CLIENTE(nombre_completo, correo, telefono);
    console.log('Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Verificar código (Paso 3)
app.post('/api/auth/verify-security-code', async (req, res) => {
  console.log('🔑 Verificar código:', req.body);
  try {
    const { correo, codigo_seguridad } = req.body;
    if (!correo || !codigo_seguridad) {
      return res.json({ msg: 'Correo y código requeridos', allow: 0 });
    }
    const result = await storedProcedures.SP_VERIFICAR_CODIGO_SEGURIDAD(correo, codigo_seguridad);
    console.log('Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('Error verificando código:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Registrar password (Paso 4)
app.post('/api/auth/register-password', async (req, res) => {
  console.log('Registrar password:', req.body);
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.json({ msg: 'Correo y password requeridos', allow: 0 });
    }
    const result = await storedProcedures.SP_REGISTRAR_PASSWORD(correo, password);
    console.log('Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('Error registrando password:', error);
    res.json({ msg: 'Error interno', allow: 0 });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  console.log('Login:', req.body);
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.json({ allow: 0, msg: 'Credenciales requeridas' });
    }
    const result = await storedProcedures.SP_LOGIN(correo, password);
    console.log('Resultado:', result);
    res.json(result);
  } catch (error) {
    console.error('Error en login:', error);
    res.json({ allow: 0, msg: 'Error interno' });
  }
});

// Rutas para manejo de clientes en CSV
const CSV_PATH = path.join(__dirname, '../src/Client_Database.csv');

// Obtener clientes desde CSV
app.get('/api/clients', async (req, res) => {
  try {
    console.log('📋 Obteniendo clientes desde CSV');
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8');
    console.log('📄 Contenido CSV raw:', csvContent.length, 'caracteres');
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log('📝 Líneas totales después del filtro:', lines.length);
    
    // Saltar la primera línea (headers)
    const dataLines = lines.slice(1);
    console.log('📊 Líneas de datos:', dataLines.length);
    
    // Debug: mostrar cada línea
    dataLines.forEach((line, index) => {
      console.log(`Línea ${index + 1}:`, line.substring(0, 50) + '...');
    });
    
    const clients = dataLines.map((line, index) => {
      const columns = line.split(';');
      return {
        id: `client-${index + 1}`,
        nombre: columns[0] || '',
        telefono: columns[1] || '',
        email: columns[2] || '',
        direccion: columns[3] || '',
        password: columns[4] || '',
        vehiculos: parseInt(columns[5]) || 0,
        vehiculoNombre: columns[6] || '',
        vehiculoModelo: columns[7] || '',
        ordenesActivas: parseInt(columns[8]) || 0,
        proximasCitas: parseInt(columns[9]) || 0,
        cotizaciones: parseInt(columns[10]) || 0,
        kilometraje: parseInt(columns[11]) || 0
      };
    });
    
    console.log(`✅ ${clients.length} clientes cargados desde CSV`);
    res.json({ success: true, clients });
  } catch (error) {
    console.error('❌ Error leyendo CSV:', error);
    res.json({ success: false, error: 'Error leyendo base de datos de clientes' });
  }
});

// Agregar nuevo cliente al CSV
app.post('/api/clients', async (req, res) => {
  try {
    console.log('➕ Agregando nuevo cliente al CSV:', req.body);
    const { nombre, telefono, email, direccion, password, vehiculos = 0, vehiculoNombre = '', vehiculoModelo = '', kilometraje = 0 } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !telefono || !email || !direccion || !password) {
      return res.json({ success: false, error: 'Campos requeridos faltantes' });
    }
    
    // Crear línea CSV
    const csvLine = `${nombre};${telefono};${email};${direccion};${password};${vehiculos};${vehiculoNombre};${vehiculoModelo};0;0;0;${kilometraje}`;
    
    // Agregar al archivo CSV
    await fs.appendFile(CSV_PATH, '\n' + csvLine);
    
    console.log('✅ Cliente agregado exitosamente al CSV');
    res.json({ success: true, message: 'Cliente agregado exitosamente' });
  } catch (error) {
    console.error('❌ Error escribiendo en CSV:', error);
    res.json({ success: false, error: 'Error guardando cliente' });
  }
});

// 404
app.use('*', (req, res) => {
  console.log('Ruta no encontrada:', req.originalUrl);
  res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const PORT = 8080;
const server = app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Puerto ${PORT} ya está en uso`);
    process.exit(1);
  } else {
    console.error('Error del servidor:', error);
  }
});
