/**
 * Utilidades de formato para el sistema
 */

/**
 * Formatea un número como moneda en Lempiras hondureños
 * @param amount - Cantidad a formatear
 * @returns Cadena formateada (ej: "L. 1,234.56")
 */
export const formatCurrency = (amount: number): string => {
  return `L. ${new Intl.NumberFormat('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

/**
 * Formatea una fecha en formato local hondureño
 * @param date - Fecha a formatear
 * @returns Cadena formateada (ej: "1 de enero de 2024")
 */
export const formatDate = (date: Date): string => {
  if (!date || isNaN(new Date(date).getTime())) {
    return 'Fecha no disponible';
  }
  return new Intl.DateTimeFormat('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

/**
 * Formatea una fecha y hora en formato local hondureño
 * @param date - Fecha a formatear
 * @returns Cadena formateada (ej: "1 ene 2024, 13:45")
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('es-HN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
