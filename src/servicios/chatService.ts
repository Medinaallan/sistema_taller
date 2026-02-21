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
    if (this.socket) return;
    this.socket = io(this.opciones.socketUrl, {
      transports: ['websocket'],
      auth: this.opciones.token ? { token: this.opciones.token } : undefined
    });

    this.socket.on('connect', () => {
      this.conectado = true;
      console.log('💬 Socket.IO conectado');
      this.emitirLocal('connect');
    });

    this.socket.on('disconnect', () => {
      this.conectado = false;
      console.log('💬 Socket.IO desconectado');
      this.emitirLocal('disconnect');
    });

    // Evento de mensaje nuevo
    this.socket.on('chat:mensaje', (msg: any) => {
      console.log('📩 chat:mensaje recibido:', JSON.stringify(msg, null, 2));
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
      console.log('✅ Mensaje normalizado:', JSON.stringify(normalizado, null, 2));
      this.emitirLocal('chat:mensaje', normalizado);
    });

    // Evento de historial
    this.socket.on('chat:historial', (data: any) => {
      console.log('📜 chat:historial recibido, mensajes:', data.mensajes?.length || 0);
      
      // Verificar si hay mensajes con archivos
      const conArchivos = (data.mensajes || []).filter((m: any) => m.archivo_url);
      if (conArchivos.length > 0) {
        console.log('🖼️  Mensajes con archivo_url en historial:', conArchivos.length);
        conArchivos.forEach((m: any, i: number) => {
          console.log(`  [${i+1}] mensaje_id: ${m.mensaje_id}, archivo_url: ${m.archivo_url}, tipo: ${m.tipo_archivo}`);
        });
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
      console.log('✅ Historial normalizado con', mensajes.length, 'mensajes');
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
      console.error('Error de chat:', error);
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
    if (!this.socket) return;
    this.socket.emit('joinRoom', { 
      sala_id, 
      usuario_consultante: usuario_consultante || this.currentUserId 
    });
  }

  salirSala(sala_id: number) {
    if (!this.socket) return;
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
    if (!this.socket) return;
    
    const mensaje = {
      sala_id: data.sala_id,
      usuario_id: data.usuario_id || this.currentUserId,
      rol: data.rol || this.currentRole,
      contenido: data.contenido,
      archivo_url: data.archivo_url,
      tipo_archivo: data.tipo_archivo
    };
    
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
      console.error('Error iniciando sala:', error);
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
      console.error('Error obteniendo chats del usuario:', error);
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
      console.error('Error obteniendo historial:', error);
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
      console.error('Error agregando participante:', error);
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
      console.error('Error subiendo imagen:', error);
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
      console.error('Error enviando mensaje con imagen:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
