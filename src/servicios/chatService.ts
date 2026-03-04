// Servicio de Chat en tiempo real para el panel de administración y clientes
// Usa Socket.IO para manejar salas basadas en el ID de sala.
// Cada sala representa la conversación cliente <-> taller (admin / staff).
// Los mensajes se almacenan en SQL Server usando Stored Procedures.

import { io, Socket } from 'socket.io-client';

export interface ChatMensajeDTO {
  mensaje_id: number;           // Identificador único del mensaje (viene del backend)
  sala_id: number;              // ID de la sala de chat
  usuario_id: number;           // ID del usuario que envía
  remitente?: string;           // Nombre del remitente (opcional, viene del historial)
  rol: 'admin' | 'client' | 'mechanic' | 'receptionist';
  rol_remitente?: string;       // Rol del remitente (opcional, viene del historial)
  contenido: string;            // Texto del mensaje
  es_sistema: boolean;          // Mensajes generados por el sistema
  enviado_en: string;           // ISO string
  leido: boolean;               // Bandera de lectura
  es_mio?: boolean;             // Para saber si el mensaje es del usuario actual
  // Campos opcionales para archivos
  archivo_url?: string;
  tipo_archivo?: string;
}

export interface ChatHistorialResponse {
  sala_id: number;
  mensajes: ChatMensajeDTO[];
}

export interface ChatSalaDTO {
  sala_id: number;
  ot_id: number;
  numero_ot: string;
  estado_ot: string;
  placa: string;
  vehiculo: string;
  cerrada: boolean;
  ultimo_mensaje: string;
  fecha_ultimo_mensaje: string;
  mensajes_no_leidos: number;
}

// Opciones de inicialización del servicio
interface ChatServiceOptions {
  baseUrl?: string;      // URL del backend HTTP
  socketUrl?: string;    // URL del servidor Socket.IO
  token?: string;        // (Preparado) Token de autenticación si se requiere
  userId?: number;       // ID del usuario actual
}

class ChatService {
  private socket: Socket | null = null;
  private opciones: Required<ChatServiceOptions>;
  private listeners: { [evento: string]: Function[] } = {};
  private conectado = false;
  private currentUserId: number;
  private currentRole: ChatMensajeDTO['rol'];

  constructor(opts?: ChatServiceOptions) {
    this.opciones = {
      baseUrl: opts?.baseUrl || 'http://localhost:8080',
      socketUrl: opts?.socketUrl || 'http://localhost:8080',
      token: opts?.token || '',
      userId: opts?.userId || 0
    };
    this.currentUserId = this.opciones.userId;
    this.currentRole = 'admin';
  }

  setUserContext(id: number, rol: ChatMensajeDTO['rol']) {
    this.currentUserId = id;
    this.currentRole = rol;
  }

  conectar() {
    if (this.socket) {
      console.log('⚠️ [chatService] Socket ya está conectado');
      return;
    }
    console.log('🔌 [chatService] Conectando socket a:', this.opciones.socketUrl);
    this.socket = io(this.opciones.socketUrl, {
      transports: ['websocket'],
      auth: this.opciones.token ? { token: this.opciones.token } : undefined
    });

    this.socket.on('connect', () => {
      console.log('✅ [chatService] Socket conectado, ID:', this.socket?.id);
      this.conectado = true;
      this.emitirLocal('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ [chatService] Socket desconectado');
      this.conectado = false;
      this.emitirLocal('disconnect');
    });

    // Evento de mensaje nuevo
    this.socket.on('chat:mensaje', (msg: any) => {
      console.log('📥 [chatService] Socket recibió chat:mensaje:', { sala_id: msg.sala_id, mensaje_id: msg.mensaje_id, contenido: msg.contenido });
      const normalizado: ChatMensajeDTO = {
        mensaje_id: msg.mensaje_id,
        sala_id: msg.sala_id,
        usuario_id: msg.usuario_id,
        remitente: msg.remitente,
        rol: msg.rol || msg.rol_remitente,
        rol_remitente: msg.rol_remitente || msg.rol,
        contenido: msg.contenido,
        es_sistema: !!msg.es_sistema,
        enviado_en: msg.enviado_en || new Date().toISOString(),
        leido: !!msg.leido,
        es_mio: msg.usuario_id === this.currentUserId,
        archivo_url: msg.archivo_url,
        tipo_archivo: msg.tipo_archivo
      };
      console.log('  🔄 Emitiendo local a listeners');
      this.emitirLocal('chat:mensaje', normalizado);
    });

    // Evento de historial
    this.socket.on('chat:historial', (data: any) => {
      
      // Verificar si hay mensajes con archivos
      const conArchivos = (data.mensajes || []).filter((m: any) => m.archivo_url);
      if (conArchivos.length > 0) {
        // detalles de mensajes con archivos omitidos en logs
      }
      
      const mensajes: ChatMensajeDTO[] = (data.mensajes || []).map((m: any) => ({
        mensaje_id: m.mensaje_id,
        sala_id: m.sala_id,
        usuario_id: m.usuario_id,
        remitente: m.remitente,
        rol: m.rol || m.rol_remitente,
        rol_remitente: m.rol_remitente || m.rol,
        contenido: m.contenido,
        es_sistema: !!m.es_sistema,
        enviado_en: m.enviado_en || new Date().toISOString(),
        leido: !!m.leido,
        es_mio: !!m.es_mio || m.usuario_id === this.currentUserId,
        archivo_url: m.archivo_url,
        tipo_archivo: m.tipo_archivo
      }));
      this.emitirLocal('chat:historial', { sala_id: data.sala_id, mensajes });
    });

    // Evento de mensajes leídos
    this.socket.on('chat:leido', (info: any) => {
      this.emitirLocal('chat:leido', info);
    });

    // Evento de indicador escribiendo
    this.socket.on('chat:typing', (info: any) => {
      this.emitirLocal('chat:typing', info);
    });

    // Evento de error
    this.socket.on('chat:error', (error: any) => {
      this.emitirLocal('chat:error', error);
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

  // Unir a sala (el backend maneja rooms reales con Socket.IO)
  unirSala(sala_id: number, usuario_consultante?: number) {
    if (!this.socket) {
      console.warn('⚠️ [chatService] No se puede unir a sala - socket no conectado');
      return;
    }
    console.log('🚪 [chatService] Uniéndose a sala:', { sala_id, usuario_consultante: usuario_consultante || this.currentUserId });
    this.socket.emit('joinRoom', { 
      sala_id, 
      usuario_consultante: usuario_consultante || this.currentUserId 
    });
  }

  salirSala(sala_id: number) {
    if (!this.socket) return;
    console.log('🚪 [chatService] Saliendo de sala:', sala_id);
    this.socket.emit('leaveRoom', { sala_id });
  }

  // Enviar mensaje estándar (usando SP del backend)
  enviarMensaje(data: { 
    sala_id: number; 
    contenido: string; 
    rol?: ChatMensajeDTO['rol']; 
    usuario_id?: number; 
    archivo_url?: string; 
    tipo_archivo?: string; 
  }) {
    if (!this.socket) {
      console.warn('⚠️ [chatService] No se puede enviar mensaje - socket no conectado');
      return;
    }
    
    const mensaje = {
      sala_id: data.sala_id,
      usuario_id: data.usuario_id || this.currentUserId,
      rol: data.rol || this.currentRole,
      contenido: data.contenido,
      archivo_url: data.archivo_url,
      tipo_archivo: data.tipo_archivo
    };
    
    console.log('💬 [chatService] Enviando mensaje:', { sala_id: mensaje.sala_id, contenido: mensaje.contenido.substring(0, 50) });
    this.socket.emit('chat:send', mensaje);
  }

  // Solicitar historial de una sala
  solicitarHistorial(sala_id: number, usuario_consultante?: number) {
    if (!this.socket) return;
    this.socket.emit('chat:historial:solicitar', { 
      sala_id, 
      usuario_consultante: usuario_consultante || this.currentUserId 
    });
  }

  // Marcar mensajes como leídos
  marcarLeidos(sala_id: number, usuario_id?: number) {
    if (!this.socket) return;
    this.socket.emit('chat:leer', { 
      sala_id, 
      usuario_id: usuario_id || this.currentUserId 
    });
  }

  // Indicador de escritura
  setTyping(sala_id: number, rol?: string, escribiendo: boolean = false) {
    if (!this.socket) return;
    this.socket.emit('chat:typing', { 
      sala_id, 
      rol: rol || this.currentRole, 
      escribiendo 
    });
  }

  // ==================== API REST ENDPOINTS ====================

  // Iniciar sala de chat para una OT
  async iniciarSala(ot_id: number, registrado_por: number): Promise<any> {
    try {
      const response = await fetch(`${this.opciones.baseUrl}/api/chat/iniciar-sala`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ot_id, registrado_por })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al iniciar sala');
      }
      
      return result.data;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todas las salas de chat de un usuario
  async obtenerChatsUsuario(usuario_id: number): Promise<ChatSalaDTO[]> {
    try {
      const response = await fetch(
        `${this.opciones.baseUrl}/api/chat/chats-usuario/${usuario_id}`
      );
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener chats');
      }
      
      return result.data;
    } catch (error) {
      throw error;
    }
  }

  // Obtener historial de una sala (vía REST, alternativa a Socket.IO)
  async obtenerHistorialSala(sala_id: number, usuario_consultante: number): Promise<ChatMensajeDTO[]> {
    try {
      const response = await fetch(
        `${this.opciones.baseUrl}/api/chat/historial-sala/${sala_id}?usuario_consultante=${usuario_consultante}`
      );
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener historial');
      }
      
      return result.data;
    } catch (error) {
      throw error;
    }
  }

  // Agregar participante a una sala
  async agregarParticipante(sala_id: number, nuevo_usuario_id: number, registrado_por: number): Promise<any> {
    try {
      const response = await fetch(`${this.opciones.baseUrl}/api/chat/agregar-participante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sala_id, nuevo_usuario_id, registrado_por })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.msg || 'Error al agregar participante');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
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
      throw error;
    }
  }

  // Enviar mensaje con imagen
  async enviarMensajeConImagen(data: { 
    sala_id: number; 
    contenido?: string; 
    archivo: File; 
    rol?: ChatMensajeDTO['rol']; 
    usuario_id?: number; 
  }) {
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
      throw error;
    }
  }
}

export const chatService = new ChatService();
