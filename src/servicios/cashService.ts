import { appConfig } from '../config/config';
const API_BASE = appConfig.apiBaseUrl;

async function handleResponse(response: Response) {
  try {
    const data = await response.json();
    if (!response.ok) return { success: false, ...data };
    return data;
  } catch (err) {
    return { success: false, message: 'Error procesando respuesta' };
  }
}

export const cashService = {
  /**
   * Abrir caja - SP_ABRIR_CAJA
   * @param usuario_id - ID del usuario que abre la caja
   * @param monto_inicial - Monto inicial en la caja
   */
  async openSession(usuario_id: number, monto_inicial: number) {
    const res = await fetch(`${API_BASE}/cash-sessions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id, monto_inicial })
    });
    return handleResponse(res);
  },

  /**
   * Verificar estado de caja - SP_VERIFICAR_ESTADO_CAJA
   * @param usuario_id - ID del usuario
   * @returns estado: 'Abierta' | 'Cerrada', arqueo_id si está abierta
   */
  async checkStatus(usuario_id: number) {
    const res = await fetch(`${API_BASE}/cash-sessions/status?usuario_id=${usuario_id}`);
    return handleResponse(res);
  },

  /**
   * Obtener resumen de caja actual - SP_OBTENER_RESUMEN_CAJA_ACTUAL
   * @param usuario_id - ID del usuario
   * @returns Resumen con totales, fecha apertura, diferencia, etc.
   */
  async getCurrentSummary(usuario_id: number) {
    const res = await fetch(`${API_BASE}/cash-sessions/current-summary?usuario_id=${usuario_id}`);
    return handleResponse(res);
  },

  /**
   * Cerrar caja - SP_CERRAR_CAJA
   * @param usuario_id - ID del usuario que cierra
   * @param monto_final_real - Monto contado físicamente
   * @param observaciones - Notas opcionales
   */
  async closeSession(usuario_id: number, monto_final_real: number, observaciones?: string) {
    const res = await fetch(`${API_BASE}/cash-sessions/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id, monto_final_real, observaciones })
    });
    return handleResponse(res);
  },

  /**
   * Obtener historial de arqueos - SP_OBTENER_HISTORIAL_ARQUEOS
   * @param usuario_id - ID del usuario
   * @param fecha_inicio - Fecha de inicio opcional (YYYY-MM-DD)
   * @param fecha_fin - Fecha de fin opcional (YYYY-MM-DD)
   */
  async getHistory(usuario_id: number, fecha_inicio?: string, fecha_fin?: string) {
    let url = `${API_BASE}/cash-sessions/history?usuario_id=${usuario_id}`;
    if (fecha_inicio) url += `&fecha_inicio=${fecha_inicio}`;
    if (fecha_fin) url += `&fecha_fin=${fecha_fin}`;
    const res = await fetch(url);
    return handleResponse(res);
  }
};

export default cashService;
