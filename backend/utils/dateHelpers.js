/**
 * 🕐 UTILIDADES PARA MANEJO DE FECHAS
 * Zona horaria: America/Tegucigalpa (Honduras, GMT-6)
 */

// Zona horaria de Honduras
const TIMEZONE = 'America/Tegucigalpa';

/**
 * Obtiene la fecha/hora actual en la zona horaria de Honduras
 * @returns {Date} Fecha actual
 */
const getCurrentDateTime = () => {
  return new Date();
};

/**
 * Formatea una fecha para mostrarla en formato local de Honduras
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
const formatDateForDisplay = (date) => {
  const d = new Date(date);
  return d.toLocaleString('es-HN', { 
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Formatea una fecha para almacenarla en SQL Server
 * SQL Server espera formato ISO: YYYY-MM-DD HH:mm:ss
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato SQL Server
 */
const formatDateForSQL = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Formatea solo la fecha (sin hora) para SQL Server
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
const formatDateOnlyForSQL = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene el inicio del día actual (00:00:00)
 * @returns {Date} Fecha con hora 00:00:00
 */
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Obtiene el fin del día actual (23:59:59)
 * @returns {Date} Fecha con hora 23:59:59
 */
const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Calcula la diferencia de días entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number} Número de días de diferencia
 */
const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Verifica si una fecha está en el rango especificado
 * @param {Date|string} date - Fecha a verificar
 * @param {Date|string} startDate - Fecha inicial del rango
 * @param {Date|string} endDate - Fecha final del rango
 * @returns {boolean} True si la fecha está en el rango
 */
const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
};

module.exports = {
  TIMEZONE,
  getCurrentDateTime,
  formatDateForDisplay,
  formatDateForSQL,
  formatDateOnlyForSQL,
  getStartOfDay,
  getEndOfDay,
  getDaysDifference,
  isDateInRange
};
