import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chatService, ChatMensajeDTO } from '../servicios/chatService';
import { obtenerClientesActualizados } from '../utilidades/BaseDatosJS';

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
}

export function useAdminChat() {
  const [clientes, setClientes] = useState<ChatClienteItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [salaActiva, setSalaActiva] = useState<string | null>(null);
  const salasRef = useRef<Map<string, SalaEstado>>(new Map());
  const [, forzarRender] = useState(0);
  const [conectado, setConectado] = useState(false);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});

  const generarAvatar = (nombre: string) => {
    const encoded = encodeURIComponent(nombre);
    return `https://ui-avatars.com/api/?name=${encoded}&background=random&rounded=true&size=64`;
  };

  const seleccionarSala = useCallback(async (clientId: string) => {
    setSalaActiva(clientId);
    setClientes(prev => prev.map(c => c.id === clientId ? { ...c, noLeidos: 0 } : c));
    let sala = salasRef.current.get(clientId);
    if (!sala) {
      sala = { sala_id: clientId, mensajes: [], cargandoHistorial: false, historialCargado: false };
      salasRef.current.set(clientId, sala);
    }
    chatService.unirSala(clientId);
    if (!sala.historialCargado && !sala.cargandoHistorial) {
      sala.cargandoHistorial = true;
      try {
        chatService.solicitarHistorial(clientId);
        const unsubHist = chatService.on('chat:historial', (data: { sala_id: string; mensajes: ChatMensajeDTO[] }) => {
          if (data.sala_id === clientId) {
            sala!.mensajes = [...data.mensajes, ...sala!.mensajes];
            sala!.historialCargado = true;
            sala!.cargandoHistorial = false;
            forzarRender(n => n + 1);
            unsubHist();
          }
        });
      } catch (e: any) {
        sala.error = e.message || 'Error cargando historial';
      } finally {
        sala.cargandoHistorial = false;
        forzarRender(n => n + 1);
      }
    }
    chatService.marcarLeidos(clientId);
  }, []);

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
          const esSalaActiva = salaActiva === salaId;
            return {
              ...c,
              ultimoMensaje: msg.contenido,
              timestampUltimo: msg.enviado_en,
              noLeidos: esSalaActiva ? 0 : c.noLeidos + (msg.rol !== 'admin' ? 1 : 0)
            };
        }
        return c;
      }));
      forzarRender(n => n + 1);
    });
    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMensaje();
    };
  }, [salaActiva]);

  // Typing listener separado para no recrear en cada salaActiva cambio
  useEffect(() => {
    const unsubTyping = chatService.on('chat:typing', (info: any) => {
      setTypingMap(prev => ({ ...prev, [info.sala_id]: !!info.escribiendo && info.rol !== 'admin' }));
    });
    return () => { unsubTyping(); };
  }, []);

  // Cargar clientes al montar
  useEffect(() => {
    (async () => {
      const lista = await obtenerClientesActualizados();
      const adaptados: ChatClienteItem[] = lista.map(c => ({
        id: c.id,
        nombre: c.name,
        avatar: generarAvatar(c.name),
        noLeidos: 0
      }));
      setClientes(adaptados);
    })();
  }, []);

  useEffect(() => {
    if (!salaActiva && clientes.length) {
      seleccionarSala(clientes[0].id);
    }
  }, [clientes, salaActiva, seleccionarSala]);


  const enviarMensaje = useCallback((contenido: string) => {
    if (!salaActiva || !contenido.trim()) return;
    chatService.enviarMensaje({ sala_id: salaActiva, contenido });
  }, [salaActiva]);

  const mensajesSalaActiva: ChatMensajeDTO[] = useMemo(() => {
    if (!salaActiva) return [];
    return salasRef.current.get(salaActiva)?.mensajes || [];
  }, [salaActiva, salasRef.current, conectado]);

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
  conectado,
  typing: salaActiva ? typingMap[salaActiva] : false
  };
}
