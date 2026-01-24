import Swal from 'sweetalert2';

/**
 * Muestra una alerta de información
 */
export const showAlert = async (message: string, title?: string): Promise<void> => {
  await Swal.fire({
    icon: 'info',
    title: title || 'Información',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#3b82f6'
  });
};

/**
 * Muestra una alerta de éxito
 */
export const showSuccess = async (message: string, title?: string): Promise<void> => {
  await Swal.fire({
    icon: 'success',
    title: title || '¡Éxito!',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#10b981'
  });
};

/**
 * Muestra una alerta de error
 */
export const showError = async (message: string, title?: string): Promise<void> => {
  await Swal.fire({
    icon: 'error',
    title: title || 'Error',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#ef4444'
  });
};

/**
 * Muestra una alerta de advertencia
 */
export const showWarning = async (message: string, title?: string): Promise<void> => {
  await Swal.fire({
    icon: 'warning',
    title: title || 'Advertencia',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#f59e0b'
  });
};

/**
 * Muestra un diálogo de confirmación (reemplazo de confirm())
 * @returns true si el usuario confirma, false si cancela
 */
export const showConfirm = async (message: string, title?: string): Promise<boolean> => {
  const result = await Swal.fire({
    icon: 'question',
    title: title || '¿Estás seguro?',
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    reverseButtons: true
  });
  
  return result.isConfirmed;
};

/**
 * Muestra un prompt para ingresar texto (reemplazo de prompt())
 * @returns el texto ingresado o null si se cancela
 */
export const showPrompt = async (message: string, title?: string, defaultValue?: string): Promise<string | null> => {
  const result = await Swal.fire({
    title: title || 'Ingresa la información',
    text: message,
    input: 'text',
    inputValue: defaultValue || '',
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    inputValidator: (value) => {
      if (!value) {
        return 'Debes ingresar un valor';
      }
      return null;
    }
  });
  
  return result.isConfirmed ? result.value : null;
};

/**
 * Muestra una alerta de confirmación de eliminación
 */
export const showDeleteConfirm = async (itemName?: string): Promise<boolean> => {
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Estás seguro?',
    text: itemName 
      ? `¿Deseas eliminar ${itemName}? Esta acción no se puede deshacer.`
      : 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    reverseButtons: true
  });
  
  return result.isConfirmed;
};
