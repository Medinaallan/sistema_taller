import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chatService, ChatMensajeDTO, ChatSalaDTO } from '../servicios/chatService';
import { useApp } from '../contexto/useApp';

export interface ChatClienteItem {
  sala_id: number;         // ID de la sala de chat
  ot_id: number;           // ID de la orden de trabajo
  numero_ot: string;       // Número de OT
  nombre: string;          // Placa o identificador
  vehiculo: string;        // Descripción del vehículo
  estado_ot: string;       // Estado de la OT
  avatar?: string;
  ultimoMensaje?: string;
  timestampUltimo?: string;
  noLeidos: number;
  cerrada: boolean;
}

interface SalaEstado {
  sala_id: number;
  mensajes: ChatMensajeDTO[];
  cargandoHistorial: boolean;
  historialCargado: boolean;
  error?: string;
  intentosHistorial?: number;
}

export function useAdminChat() {
  const { state } = useApp();
  const [clientes, setClientes] = useState<ChatClienteItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [salaActiva, setSalaActiva] = useState<number | null>(null);
  const salasRef = useRef<Map<number, SalaEstado>>(new Map());
  const [renderTick, setRenderTick] = useState(0);
  const [conectado, setConectado] = useState(false);
  const [typingMap, setTypingMap] = useState<Record<number, boolean>>({});
  const salaActivaRef = useRef<number | null>(null);
  
  // Mantener la referencia actualizada
  useEffect(() => {
    salaActivaRef.current = salaActiva;
  }, [salaActiva]);

  const generarAvatar = (nombre: string) => {
    const encoded = encodeURIComponent(nombre);
    return `https://ui-avatars.com/api/?name=${encoded}&background=random&rounded=true&size=64`;
  };

  // Función para obtener todas las salas de chat del admin desde API REST
  const obtenerSalasChat = async (): Promise<ChatClienteItem[]> => {
    try {
      if (!state.user?.id) {
        console.warn('No hay usuario ID disponible');
        return [];
      }

      const usuarioIdNum = parseInt(state.user.id, 10);
      if (isNaN(usuarioIdNum)) {
        return [];
      }

      const salasAPI: ChatSalaDTO[] = await chatService.obtenerChatsUsuario(usuarioIdNum);
      
      // Mapear a estructura ChatClienteItem
      const salasChat: ChatClienteItem[] = salasAPI.map(sala => ({
        sala_id: sala.sala_id,
        ot_id: sala.ot_id,
        numero_ot: sala.numero_ot,
        nombre: sala.placa || sala.numero_ot,
        vehiculo: sala.vehiculo,
        estado_ot: sala.estado_ot,
        avatar: generarAvatar(sala.placa || sala.numero_ot),
        ultimoMensaje: sala.ultimo_mensaje,
        timestampUltimo: sala.fecha_ultimo_mensaje,
        noLeidos: sala.mensajes_no_leidos,
        cerrada: sala.cerrada
      }));
      
      return salasChat;
    } catch (error) {
      return [];
    }
  };

  const seleccionarSala = useCallback(async (salaId: number) => {
    // Evitar re-seleccionar la misma sala
    if (salaActiva === salaId) {
      return;
    }
    
    setSalaActiva(salaId);
    setClientes(prev => prev.map(c => c.sala_id === salaId ? { ...c, noLeidos: 0 } : c));
    let sala = salasRef.current.get(salaId);
    if (!sala) {
      sala = { sala_id: salaId, mensajes: [], cargandoHistorial: false, historialCargado: false };
      salasRef.current.set(salaId, sala);
    }
    // Importante: suscribir ANTES de solicitar/unir para no perder el evento 'chat:historial'
    if (!sala.historialCargado && !sala.cargandoHistorial) {
      sala.cargandoHistorial = true;
      sala.intentosHistorial = (sala.intentosHistorial || 0) + 1;
      const unsubHist = chatService.on('chat:historial', (data: { sala_id: number; mensajes: ChatMensajeDTO[] }) => {
        if (data.sala_id === salaId) {
          sala!.mensajes = [...data.mensajes, ...sala!.mensajes];
          sala!.historialCargado = true;
          sala!.cargandoHistorial = false;
          setRenderTick(n => n + 1);
          unsubHist();
        }
      });
      // Ahora sí,solicitar historial y unirse a la sala (si ya hay conexión)
      const usuarioIdNum = state.user?.id ? parseInt(state.user.id, 10) : undefined;
      if (chatService.estaConectado()) {
        chatService.unirSala(salaId, usuarioIdNum);
        chatService.solicitarHistorial(salaId, usuarioIdNum);
      } else {
        // Deferir acciones hasta conectarse
        const unsubOnConnect = chatService.on('connect', () => {
          chatService.unirSala(salaId, usuarioIdNum);
          chatService.solicitarHistorial(salaId, usuarioIdNum);
          unsubOnConnect();
        });
      }

      // Reintento: si en 1200ms no llega historial, solicitar de nuevo hasta 3 veces
      const intentoActual = sala.intentosHistorial;
      setTimeout(() => {
        const salaAun = salasRef.current.get(salaId);
        if (!salaAun) return;
        const sigueActiva = salaActiva === salaId;
        const noLlego = !salaAun.historialCargado && salaAun.cargandoHistorial && (salaAun.intentosHistorial === intentoActual);
        if (sigueActiva && noLlego && (salaAun.intentosHistorial || 0) < 3) {
          salaAun.intentosHistorial = (salaAun.intentosHistorial || 0) + 1;
          if (chatService.estaConectado()) {
            chatService.solicitarHistorial(salaId, usuarioIdNum);
          }
        }
      }, 1200);
    } else {
      // Asegurar que estamos unidos a la sala aunque ya haya historial
      const usuarioIdNum = state.user?.id ? parseInt(state.user.id, 10) : undefined;
      if (chatService.estaConectado()) {
        chatService.unirSala(salaId, usuarioIdNum);
      } else {
        const unsubOnConnect = chatService.on('connect', () => {
          chatService.unirSala(salaId, usuarioIdNum);
          unsubOnConnect();
        });
      }
  // Si ya había historial, aseguramos un re-render para mostrar mensajes previos
  setRenderTick(n => n + 1);
    }
    // Marcar leídos (también sensible a conexión)
    const usuarioIdNum = state.user?.id ? parseInt(state.user.id, 10) : undefined;
    if (chatService.estaConectado()) {
      chatService.marcarLeidos(salaId, usuarioIdNum);
    } else {
      const unsubOnConnect2 = chatService.on('connect', () => {
        chatService.marcarLeidos(salaId, usuarioIdNum);
        unsubOnConnect2();
      });
    }
  }, [salaActiva, state.user?.id]);

  // Inicializar conexión socket una sola vez
  useEffect(() => {
    chatService.conectar();
    const unsubConnect = chatService.on('connect', () => setConectado(true));
    const unsubDisconnect = chatService.on('disconnect', () => setConectado(false));
    const unsubMensaje = chatService.on('chat:mensaje', (msg: ChatMensajeDTO) => {
      const salaId = msg.sala_id;
      let sala = salasRef.current.get(salaId);
      if (!sala) {
        console.log('  ➕ Creando nueva sala en salasRef:', salaId);
        sala = { sala_id: salaId, mensajes: [], cargandoHistorial: false, historialCargado: false };
        salasRef.current.set(salaId, sala);
      }
      // Evitar duplicados por optimistic UI - usar actualización inmutable
      if (!sala.mensajes.find(m => m.mensaje_id === msg.mensaje_id)) {
        console.log('  ✅ Agregando mensaje a sala', salaId);
        // Crear nuevo array inmutable en lugar de mutar
        sala.mensajes = [...sala.mensajes, msg];
        // Actualizar la referencia en el Map
        salasRef.current.set(salaId, { ...sala });
      } else {
        console.log('  ⏭️  Mensaje duplicado ignorado');
      }
      // Actualizar datos de cliente (ultimo mensaje / no leidos)
      setClientes(prev => prev.map(c => {
        if (c.sala_id === salaId) {
          // Usar la referencia para obtener el valor actual de salaActiva
          const esSalaActiva = salaActivaRef.current === salaId;
            return {
              ...c,
              ultimoMensaje: msg.contenido,
              timestampUltimo: msg.enviado_en,
              noLeidos: esSalaActiva ? 0 : c.noLeidos + (msg.rol !== 'admin' ? 1 : 0)
            };
        }
        return c;
      }));
  console.log('  🔄 Forzando re-render con setRenderTick');
  setRenderTick(n => n + 1);
    });
    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMensaje();
    };
  }, []);

  // Typing listener separado para no recrear en cada salaActiva cambio
  useEffect(() => {
    const unsubTyping = chatService.on('chat:typing', (info: any) => {
      setTypingMap(prev => ({ ...prev, [info.sala_id]: !!info.escribiendo && info.rol !== 'admin' }));
    });
    return () => { unsubTyping(); };
  }, []);

  // Cargar salas de chat al montar
  useEffect(() => {
    if (!state.user?.id) return;
    
    (async () => {
      const salas = await obtenerSalasChat();
      setClientes(salas);
    })();
  }, [state.user?.id]);

  // Auto-seleccionar primera sala SOLO una vez cuando se cargan las salas inicialmente
  useEffect(() => {
    if (!salaActiva && clientes.length > 0) {
      // Solo auto-seleccionar si no hay sala activa y hay salas
      // Usar setTimeout para evitar que se ejecute múltiples veces en el mismo tick
      const timer = setTimeout(() => {
        if (!salaActiva && clientes.length > 0) {
          seleccionarSala(clientes[0].sala_id);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [clientes.length]);

  const enviarMensaje = useCallback((contenido: string) => {
    if (!salaActiva || !contenido.trim() || !state.user?.id) return;
    const usuarioIdNum = parseInt(state.user.id, 10);
    if (isNaN(usuarioIdNum)) {
      return;
    }
    chatService.enviarMensaje({ 
      sala_id: salaActiva, 
      contenido,
      usuario_id: usuarioIdNum,
      rol: 'admin'
    });
  }, [salaActiva, state.user?.id]);

  const enviarMensajeConImagen = useCallback(async (contenido: string, archivo: File) => {
    if (!salaActiva || !state.user?.id) return;
    const usuarioIdNum = parseInt(state.user.id, 10);
    if (isNaN(usuarioIdNum)) {
      console.error('ID de usuario no válido');
      return;
    }
    try {
      await chatService.enviarMensajeConImagen({
        sala_id: salaActiva,
        contenido: contenido || '📷 Imagen',
        archivo: archivo,
        rol: 'admin',
        usuario_id: usuarioIdNum
      });
    } catch (error) {
      throw error;
    }
  }, [salaActiva, state.user?.id]);

  const mensajesSalaActiva: ChatMensajeDTO[] = useMemo(() => {
    if (!salaActiva) return [];
    return salasRef.current.get(salaActiva)?.mensajes || [];
  }, [salaActiva, renderTick]);

  const clientesFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    if (!term) return clientes;
    return clientes.filter(c => 
      c.nombre.toLowerCase().includes(term) || 
      c.numero_ot.toLowerCase().includes(term) ||
      c.vehiculo.toLowerCase().includes(term)
    );
  }, [clientes, busqueda]);

  return {
    clientes: clientesFiltrados,
    setBusqueda,
    busqueda,
    seleccionarSala,
    salaActiva,
    mensajes: mensajesSalaActiva,
    enviarMensaje,
    enviarMensajeConImagen,
    conectado,
    typing: salaActiva ? typingMap[salaActiva] : false
  };
}
