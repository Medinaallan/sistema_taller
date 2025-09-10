// Servicio de Chat en tiempo real para el panel de administración y clientes
// Usa Socket.IO para manejar salas basadas en el ID de cliente.
// Cada sala representa la conversación cliente <-> taller (admin / staff).

import { io, Socket } from 'socket.io-client';

export interface ChatMensajeDTO {
  mensaje_id: number;           // Identificador único del mensaje (puede venir del backend)
  sala_id: string;              // ID lógico de la sala (por convención usamos clientId)
  usuario_id: string;           // ID del usuario que envía (admin o client)
  rol: 'admin' | 'client' | 'mechanic' | 'receptionist';
  contenido: string;            // Texto del mensaje
  es_sistema: boolean;          // Mensajes generados por el sistema
  enviado_en: string;           // ISO string
  leido: boolean;               // Bandera de lectura
  // Campos opcionales para futura extensión (archivos, imágenes, etc.)
  archivo_url?: string;
  tipo_archivo?: string;
}

export interface ChatHistorialResponse {
  sala_id: string;
  mensajes: ChatMensajeDTO[];
}

// Opciones de inicialización del servicio
interface ChatServiceOptions {
  baseUrl?: string;      // URL del backend HTTP
  socketUrl?: string;    // URL del servidor Socket.IO
  token?: string;        // (Preparado) Token de autenticación si se requiere
  adminId?: string;      // ID del usuario admin actual
}

// Eventos que el backend debería soportar (se documentan para alineación futura):
// 'joinRoom' -> payload: { sala_id }
// 'leaveRoom' -> payload: { sala_id }
// 'chat:send' -> payload: ChatMensajeDTO (sin mensaje_id si el backend lo genera)
// 'chat:mensaje' -> mensaje individual recibido
// 'chat:historial' -> ChatHistorialResponse para una sala
// 'chat:notificacion' -> { sala_id, ultimo_contenido, conteo_no_leidos }
// Actualmente el backend solo reemite 'chatMessage'. Extenderemos client-side
// para encapsular y permitir futura evolución sin cambiar la UI.

class ChatService {
  private socket: Socket | null = null;
  private opciones: Required<ChatServiceOptions>;
  private listeners: { [evento: string]: Function[] } = {};
  private conectado = false;
  private currentUserId: string;
  private currentRole: ChatMensajeDTO['rol'];

  constructor(opts?: ChatServiceOptions) {
    this.opciones = {
      baseUrl: opts?.baseUrl || 'http://localhost:8080',
      socketUrl: opts?.socketUrl || 'http://localhost:8080',
      token: opts?.token || '',
      adminId: opts?.adminId || 'admin-1'
    };
    this.currentUserId = this.opciones.adminId;
    this.currentRole = 'admin';
  }

  setUserContext(id: string, rol: ChatMensajeDTO['rol']) {
    this.currentUserId = id;
    this.currentRole = rol;
  }

  conectar() {
    if (this.socket) return;
    this.socket = io(this.opciones.socketUrl, {
      transports: ['websocket'],
      auth: this.opciones.token ? { token: this.opciones.token } : undefined
    });

    this.socket.on('connect', () => {
      this.conectado = true;
      this.emitirLocal('connect');
    });

    this.socket.on('disconnect', () => {
      this.conectado = false;
      this.emitirLocal('disconnect');
    });

    // Compat: backend actual solo usa 'chatMessage'
    this.socket.on('chatMessage', (msg: any) => {
      // Adaptar estructura recibida a nuestro DTO estándar
      const normalizado: ChatMensajeDTO = {
        mensaje_id: Number(msg.id) || Date.now(),
        sala_id: msg.sala_id || msg.clientId || 'global',
        usuario_id: msg.usuario_id || msg.sender || 'desconocido',
        rol: msg.rol || msg.sender || 'client',
        contenido: msg.text || msg.contenido || '',
        es_sistema: msg.es_sistema || false,
        enviado_en: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
        leido: msg.leido ?? true,
        archivo_url: msg.archivo_url,
        tipo_archivo: msg.tipo_archivo
      };
      this.emitirLocal('chat:mensaje', normalizado);
    });

    // Eventos avanzados del backend nuevo
    this.socket.on('chat:mensaje', (msg: any) => {
      const normalizado: ChatMensajeDTO = {
        mensaje_id: msg.mensaje_id || Date.now(),
        sala_id: msg.sala_id,
        usuario_id: msg.usuario_id,
        rol: msg.rol,
        contenido: msg.contenido,
        es_sistema: !!msg.es_sistema,
        enviado_en: msg.enviado_en || new Date().toISOString(),
        leido: !!msg.leido,
        archivo_url: msg.archivo_url,
        tipo_archivo: msg.tipo_archivo
      };
      this.emitirLocal('chat:mensaje', normalizado);
    });

    this.socket.on('chat:historial', (data: any) => {
      const mensajes: ChatMensajeDTO[] = (data.mensajes || []).map((m: any) => ({
        mensaje_id: m.mensaje_id || Date.now(),
        sala_id: m.sala_id,
        usuario_id: m.usuario_id,
        rol: m.rol,
        contenido: m.contenido,
        es_sistema: !!m.es_sistema,
        enviado_en: m.enviado_en || new Date().toISOString(),
        leido: !!m.leido,
        archivo_url: m.archivo_url,
        tipo_archivo: m.tipo_archivo
      }));
      this.emitirLocal('chat:historial', { sala_id: data.sala_id, mensajes });
    });

    this.socket.on('chat:leido', (info: any) => {
      this.emitirLocal('chat:leido', info);
    });

    this.socket.on('chat:typing', (info: any) => {
      this.emitirLocal('chat:typing', info);
    });
  }

  estaConectado() {
    return this.conectado;
  }

  // Suscripción a eventos locales abstractos
  on(evento: string, handler: Function) {
    if (!this.listeners[evento]) this.listeners[evento] = [];
    this.listeners[evento].push(handler);
    return () => {
      this.listeners[evento] = this.listeners[evento].filter(h => h !== handler);
    };
  }

  private emitirLocal(evento: string, payload?: any) {
    (this.listeners[evento] || []).forEach(h => h(payload));
  }

  // Unir a sala (lado cliente - el backend futuro debería manejar rooms reales)
  unirSala(sala_id: string) {
    if (!this.socket) return;
    this.socket.emit('joinRoom', { sala_id }); // Backend futuro
  }

  salirSala(sala_id: string) {
    if (!this.socket) return;
    this.socket.emit('leaveRoom', { sala_id });
  }

  // Enviar mensaje estándar
  enviarMensaje(data: { sala_id: string; contenido: string; rol?: ChatMensajeDTO['rol']; usuario_id?: string; archivo_url?: string; tipo_archivo?: string; }) {
    if (!this.socket) return;
    const mensaje: ChatMensajeDTO = {
      mensaje_id: this.generarId(),
      sala_id: data.sala_id,
      usuario_id: data.usuario_id || this.currentUserId,
      rol: data.rol || this.currentRole,
      contenido: data.contenido,
      es_sistema: false,
      enviado_en: new Date().toISOString(),
      leido: false,
      archivo_url: data.archivo_url,
      tipo_archivo: data.tipo_archivo
    };
  // Camino nuevo principal únicamente
  this.socket.emit('chat:send', mensaje);
  // Ya no hacemos optimistic UI para evitar duplicados; la respuesta llegará vía 'chat:mensaje'
  }

  // Simulación de historial (hasta tener endpoint real) - se puede reemplazar por fetch/solicitud socket
  async obtenerHistorialSala(_sala_id: string): Promise<ChatMensajeDTO[]> { // _ prefijo para evitar warning de no uso
    // En un backend real: this.socket.emit('chat:historial:solicitar', { sala_id }) y esperar 'chat:historial'
    // Por ahora devolvemos array vacío (persistencia no implementada todavía en backend)
    return [];
  }

  solicitarHistorial(sala_id: string) {
    if (!this.socket) return;
    this.socket.emit('chat:historial:solicitar', { sala_id });
  }

  marcarLeidos(sala_id: string, rolLectura: string = 'admin') {
    if (!this.socket) return;
    this.socket.emit('chat:leer', { sala_id, rolLectura });
  }

  setTyping(sala_id: string, rol: string = 'admin', escribiendo: boolean) {
    if (!this.socket) return;
    this.socket.emit('chat:typing', { sala_id, rol, escribiendo });
  }

  // Subir imagen al servidor
  async subirImagen(archivo: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', archivo);

    try {
      const response = await fetch(`${this.opciones.baseUrl}/api/upload-image`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        return result.imageUrl;
      } else {
        throw new Error(result.error || 'Error subiendo imagen');
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  }

  // Enviar mensaje con imagen
  async enviarMensajeConImagen(data: { sala_id: string; contenido?: string; archivo: File; rol?: ChatMensajeDTO['rol']; usuario_id?: string; }) {
    try {
      const imageUrl = await this.subirImagen(data.archivo);
      
      this.enviarMensaje({
        sala_id: data.sala_id,
        contenido: data.contenido || '📷 Imagen',
        rol: data.rol,
        usuario_id: data.usuario_id,
        archivo_url: imageUrl,
        tipo_archivo: data.archivo.type
      });
      
      return imageUrl;
    } catch (error) {
      console.error('Error enviando mensaje con imagen:', error);
      throw error;
    }
  }

  private generarId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}

export const chatService = new ChatService();
