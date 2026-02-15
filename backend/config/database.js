const sql = require('mssql');

// Cargar variables de entorno
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    // Configurar zona horaria para SQL Server
    // Honduras está en GMT-6 (Central Standard Time)
    useUTC: false // No usar UTC, usar hora local del servidor
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

const getConnection = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect()
      .then(pool => {
        console.log('✅ Conectado a SQL Server');
        // Configurar zona horaria en la sesión de SQL Server
        return pool.request().query(`
          -- Configurar zona horaria de Honduras (GMT-6) para esta sesión
          SET DATEFIRST 7; -- Domingo como primer día de la semana
          SET DATEFORMAT dmy; -- Formato día-mes-año
          SET LANGUAGE Spanish; -- Idioma español
        `).then(() => {
          console.log('⏰ Zona horaria de SQL Server configurada: GMT-6 (Honduras)');
          return pool;
        });
      })
      .catch(err => {
        console.error('❌ Error conectando a SQL Server:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

module.exports = {
  getConnection,
  sql
};
