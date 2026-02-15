/**
 * 🧪 SCRIPT DE PRUEBA DE ZONA HORARIA
 * Verifica que la configuración de timezone esté correcta
 */

// Configurar timezone
process.env.TZ = 'America/Tegucigalpa';

const { getCurrentDateTime, formatDateForDisplay, formatDateForSQL } = require('./utils/dateHelpers');

console.log('\n===============================================');
console.log('🕐 PRUEBA DE CONFIGURACIÓN DE ZONA HORARIA');
console.log('===============================================\n');

const now = getCurrentDateTime();

console.log('📍 Zona horaria configurada:', process.env.TZ);
console.log('\n⏰ HORA ACTUAL:');
console.log('   - new Date():', now);
console.log('   - ISO String:', now.toISOString());
console.log('   - Local String (es-HN):', now.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }));
console.log('   - Formato Display:', formatDateForDisplay(now));
console.log('   - Formato SQL:', formatDateForSQL(now));

console.log('\n🌍 COMPARACIÓN DE ZONAS HORARIAS:');
console.log('   - UTC:', now.toLocaleString('en-US', { timeZone: 'UTC' }));
console.log('   - Honduras (GMT-6):', now.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }));
console.log('   - Diferencia esperada: 6 horas');

console.log('\n✅ Si la hora de Honduras coincide con tu hora local, la configuración es correcta.');
console.log('===============================================\n');
