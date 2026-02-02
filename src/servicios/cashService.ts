const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
  async getAll() {
    const res = await fetch(`${API_BASE}/cash-sessions`);
    return handleResponse(res);
  },
  async getOpen() {
    const res = await fetch(`${API_BASE}/cash-sessions/open`);
    return handleResponse(res);
  },
  async getReport() {
    const res = await fetch(`${API_BASE}/cash-sessions/report/all`);
    return handleResponse(res);
  },
  async openSession(payload: { openedBy: string; openingAmount: number; notes?: string }) {
    const res = await fetch(`${API_BASE}/cash-sessions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async closeSession(payload: { sessionId: string; closingBy?: string; countedCash: number; shortages?: number; overages?: number; closingNotes?: string }) {
    const res = await fetch(`${API_BASE}/cash-sessions/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async addMovement(payload: { sessionId: string; type: 'in' | 'out'; amount: number; reason?: string; createdBy?: string }) {
    const res = await fetch(`${API_BASE}/cash-sessions/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  }
};

export default cashService;
