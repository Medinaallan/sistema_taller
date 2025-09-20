require('dotenv').config();

console.log('Verificando variables de entorno:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***CONFIGURADO***' : 'NO CONFIGURADO');
console.log('NODE_ENV:', process.env.NODE_ENV);