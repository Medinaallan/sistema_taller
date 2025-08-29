const sql = require('mssql');

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
    requestTimeout: 30000
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
        return pool;
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
