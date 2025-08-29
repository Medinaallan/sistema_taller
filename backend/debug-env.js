require('dotenv').config();

console.log('Environment variables loaded:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***hidden***' : 'NOT SET');

const { setupDatabase } = require('./database/setup');

setupDatabase()
  .then(() => {
    console.log('🎉 Configuración completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error en la configuración:', err);
    process.exit(1);
  });
