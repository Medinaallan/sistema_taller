import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chatService, ChatMensajeDTO } from '../servicios/chatService';
import { obtenerClientesActualizados } from '../utilidades/BaseDatosJS';
import { SP_OBTENER_CLIENTES_REGISTRADOS } from '../utilidades/storedProceduresBackend';

export interface ChatClienteItem {
  id: string;              // client.id
  nombre: string;
  avatar?: string;
  ultimoMensaje?: string;
  timestampUltimo?: string; // ISO
  noLeidos: number;
}

interface SalaEstado {
  sala_id: string;                 // = client.id
  mensajes: ChatMensajeDTO[];
  cargandoHistorial: boolean;
  historialCargado: boolean;
  error?: string;
  intentosHistorial?: number;
}

export function useAdminChat() {
  const [clientes, setClientes] = useState<ChatClienteItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [salaActiva, setSalaActiva] = useState<string | null>(null);
  const salasRef = useRef<Map<string, SalaEstado>>(new Map());
  const [renderTick, setRenderTick] = useState(0);
  const [conectado, setConectado] = useState(false);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const salaActivaRef = useRef<string | null>(null);
  
  // Mantener la referencia actualizada
  useEffect(() => {
    salaActivaRef.current = salaActiva;
  }, [salaActiva]);

  const generarAvatar = (nombre: string) => {
    const encoded = encodeURIComponent(nombre);
    return `https://ui-avatars.com/api/?name=${encoded}&background=random&rounded=true&size=64`;
  };

  // Función para obtener TODOS los clientes (CSV + BD registrados)
  const obtenerTodosLosClientes = async (): Promise<ChatClienteItem[]> => {
    try {
      console.log('🔄 Cargando clientes para chat admin...');
      
      // 1. Clientes del CSV local
      const clientesCSV = await obtenerClientesActualizados();
      console.log('📋 Clientes CSV:', clientesCSV.length);
      
      // 2. Clientes registrados en BD
      const clientesBD = await SP_OBTENER_CLIENTES_REGISTRADOS();
      console.log('💾 Clientes BD:', clientesBD.length);
      
      // 3. Combinar y evitar duplicados (priorizar BD sobre CSV)
      const clientesUnicos = new Map<string, ChatClienteItem>();
      
      // Primero agregar clientes CSV
      clientesCSV.forEach(cliente => {
        clientesUnicos.set(cliente.email, {
          id: cliente.id,
          nombre: cliente.name,
          avatar: generarAvatar(cliente.name),
          noLeidos: 0
        });
      });
      
      // Después agregar clientes BD (sobrescribe si hay email duplicado)
      clientesBD.forEach(cliente => {
        // Generar ID compatible con el sistema de chat
        const chatId = `client-bd-${cliente.userId}`;
        clientesUnicos.set(cliente.email, {
          id: chatId,
          nombre: cliente.fullName,
          avatar: generarAvatar(cliente.fullName),
          noLeidos: 0
        });
      });
      
      const clientesFinales = Array.from(clientesUnicos.values());
      console.log('✅ Total clientes únicos:', clientesFinales.length);
      
      return clientesFinales;
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
      // Fallback a solo CSV si falla la BD
      const clientesCSV = await obtenerClientesActualizados();
      return clientesCSV.map(c => ({
        id: c.id,
        nombre: c.name,
        avatar: generarAvatar(c.name),
        noLeidos: 0
      }));
    }
  };

  const seleccionarSala = useCallback(async (clientId: string) => {
    // Evitar re-seleccionar la misma sala
    if (salaActiva === clientId) {
      return;
    }
    
    setSalaActiva(clientId);
    setClientes(prev => prev.map(c => c.id === clientId ? { ...c, noLeidos: 0 } : c));
    let sala = salasRef.current.get(clientId);
    if (!sala) {
      sala = { sala_id: clientId, mensajes: [], cargandoHistorial: false, historialCargado: false };
      salasRef.current.set(clientId, sala);
    }
    // Importante: suscribir ANTES de solicitar/unir para no perder el evento 'chat:historial'
    if (!sala.historialCargado && !sala.cargandoHistorial) {
      sala.cargandoHistorial = true;
      sala.intentosHistorial = (sala.intentosHistorial || 0) + 1;
      const unsubHist = chatService.on('chat:historial', (data: { sala_id: string; mensajes: ChatMensajeDTO[] }) => {
        if (data.sala_id === clientId) {
          sala!.mensajes = [...data.mensajes, ...sala!.mensajes];
          sala!.historialCargado = true;
          sala!.cargandoHistorial = false;
          setRenderTick(n => n + 1);
          unsubHist();
        }
      });
      // Ahora sí, solicitar historial y unirse a la sala (si ya hay conexión)
      if (chatService.estaConectado()) {
        chatService.unirSala(clientId);
        chatService.solicitarHistorial(clientId);
      } else {
        // Deferir acciones hasta conectarse
        const unsubOnConnect = chatService.on('connect', () => {
          chatService.unirSala(clientId);
          chatService.solicitarHistorial(clientId);
          unsubOnConnect();
        });
      }

      // Reintento: si en 1200ms no llega historial, solicitar de nuevo hasta 3 veces
      const intentoActual = sala.intentosHistorial;
      setTimeout(() => {
        const salaAun = salasRef.current.get(clientId);
        if (!salaAun) return;
        const sigueActiva = salaActiva === clientId;
        const noLlego = !salaAun.historialCargado && salaAun.cargandoHistorial && (salaAun.intentosHistorial === intentoActual);
        if (sigueActiva && noLlego && (salaAun.intentosHistorial || 0) < 3) {
          salaAun.intentosHistorial = (salaAun.intentosHistorial || 0) + 1;
          if (chatService.estaConectado()) {
            chatService.solicitarHistorial(clientId);
          }
        }
      }, 1200);
    } else {
      // Asegurar que estamos unidos a la sala aunque ya haya historial
      if (chatService.estaConectado()) {
        chatService.unirSala(clientId);
      } else {
        const unsubOnConnect = chatService.on('connect', () => {
          chatService.unirSala(clientId);
          unsubOnConnect();
        });
      }
  // Si ya había historial, aseguramos un re-render para mostrar mensajes previos
  setRenderTick(n => n + 1);
    }
    // Marcar leídos (también sensible a conexión)
    if (chatService.estaConectado()) {
      chatService.marcarLeidos(clientId);
    } else {
      const unsubOnConnect2 = chatService.on('connect', () => {
        chatService.marcarLeidos(clientId);
        unsubOnConnect2();
      });
    }
  }, [salaActiva]); // Agregar salaActiva como dependencia

  // Inicializar conexión socket una sola vez
  useEffect(() => {
    chatService.conectar();
    const unsubConnect = chatService.on('connect', () => setConectado(true));
    const unsubDisconnect = chatService.on('disconnect', () => setConectado(false));
    const unsubMensaje = chatService.on('chat:mensaje', (msg: ChatMensajeDTO) => {
      const salaId = msg.sala_id || 'global';
      let sala = salasRef.current.get(salaId);
      if (!sala) {
        sala = { sala_id: salaId, mensajes: [], cargandoHistorial: false, historialCargado: false };
        salasRef.current.set(salaId, sala);
      }
      // Evitar duplicados por optimistic UI
      if (!sala.mensajes.find(m => m.mensaje_id === msg.mensaje_id)) {
        sala.mensajes.push(msg);
      }
      // Actualizar datos de cliente (ultimo mensaje / no leidos)
      setClientes(prev => prev.map(c => {
        if (c.id === salaId) {
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
  setRenderTick(n => n + 1);
    });
    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMensaje();
    };
  }, []); // Remover salaActiva de dependencias para evitar re-suscripciones

  // Typing listener separado para no recrear en cada salaActiva cambio
  useEffect(() => {
    const unsubTyping = chatService.on('chat:typing', (info: any) => {
      setTypingMap(prev => ({ ...prev, [info.sala_id]: !!info.escribiendo && info.rol !== 'admin' }));
    });
    return () => { unsubTyping(); };
  }, []);

  // Cargar clientes al montar - AHORA incluye clientes de BD
  useEffect(() => {
    (async () => {
      const clientesCombinados = await obtenerTodosLosClientes();
      setClientes(clientesCombinados);
    })();
  }, []);

  // Auto-seleccionar primer cliente SOLO una vez cuando se cargan los clientes inicialmente
  useEffect(() => {
    if (!salaActiva && clientes.length > 0) {
      // Solo auto-seleccionar si no hay sala activa y hay clientes
      // Usar setTimeout para evitar que se ejecute múltiples veces en el mismo tick
      const timer = setTimeout(() => {
        if (!salaActiva && clientes.length > 0) {
          seleccionarSala(clientes[0].id);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [clientes.length]); // Solo depende del length, no de clientes completo ni seleccionarSala


  const enviarMensaje = useCallback((contenido: string) => {
    if (!salaActiva || !contenido.trim()) return;
    chatService.enviarMensaje({ sala_id: salaActiva, contenido });
  }, [salaActiva]);

  const enviarMensajeConImagen = useCallback(async (contenido: string, archivo: File) => {
    if (!salaActiva) return;
    try {
      await chatService.enviarMensajeConImagen({
        sala_id: salaActiva,
        contenido: contenido || '📷 Imagen',
        archivo: archivo,
        rol: 'admin'
      });
    } catch (error) {
      console.error('Error enviando mensaje con imagen:', error);
      throw error;
    }
  }, [salaActiva]);

  const mensajesSalaActiva: ChatMensajeDTO[] = useMemo(() => {
    if (!salaActiva) return [];
    return salasRef.current.get(salaActiva)?.mensajes || [];
  }, [salaActiva, renderTick]);

  const clientesFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    if (!term) return clientes;
    return clientes.filter(c => c.nombre.toLowerCase().includes(term));
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
