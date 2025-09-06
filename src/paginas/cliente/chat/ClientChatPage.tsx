
import { useEffect, useRef, useState } from 'react';
import { chatService, ChatMensajeDTO } from '../../../servicios/chatService';
import { useApp } from '../../../contexto/useApp';
import { obtenerClientesActualizados } from '../../../utilidades/BaseDatosJS';

interface LocalMsg extends ChatMensajeDTO {}

export default function ClientChatPage() {
  const { state } = useApp();
  // ID real en la sala: debe ser el mismo que ve el admin (client-1, client-2, ...)
  const [salaId, setSalaId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [typingAdmin, setTypingAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conectar y unir sala del cliente
  // Resolver el ID de la sala a partir del email del usuario (coincide con CSV)
  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!state.user?.email) return;
      try {
        const lista = await obtenerClientesActualizados();
        const found = lista.find(c => c.email.toLowerCase() === state.user!.email.toLowerCase());
        if (!cancelado) {
          if (found) {
            setSalaId(found.id); // client-N
          } else {
            // fallback: usar id actual o derivar uno determinista
            setSalaId(state.user.id.startsWith('client-') ? state.user.id : 'client-fallback');
          }
        }
      } catch {
        if (!cancelado) setSalaId(state.user?.id || 'client-fallback');
      }
    })();
    return () => { cancelado = true; };
  }, [state.user]);

  // Conectar y unir a la sala ya resuelta
  useEffect(() => {
    if (!salaId) return;
    chatService.conectar();
    chatService.setUserContext(salaId, 'client');
    chatService.unirSala(salaId);
    chatService.solicitarHistorial(salaId);
    const unsubHist = chatService.on('chat:historial', (data: { sala_id: string; mensajes: ChatMensajeDTO[] }) => {
      if (data.sala_id === salaId) {
        setMensajes(data.mensajes);
      }
    });
    const unsubMsg = chatService.on('chat:mensaje', (msg: ChatMensajeDTO) => {
      if (msg.sala_id === salaId) {
        setMensajes((prev: LocalMsg[]) => prev.find((m: LocalMsg) => m.mensaje_id === msg.mensaje_id) ? prev : [...prev, msg]);
      }
    });
    const unsubTyping = chatService.on('chat:typing', (info: any) => {
      if (info.sala_id === salaId && info.rol === 'admin') setTypingAdmin(!!info.escribiendo);
    });
    return () => {
      unsubHist();
      unsubMsg();
      unsubTyping();
      chatService.salirSala(salaId);
    };
  }, [salaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleSend = () => {
    if (!input.trim() && !image) return;
    // TODO: manejo de imagen futura (subida y obtener URL)
  if (!salaId) return;
  chatService.enviarMensaje({ sala_id: salaId, contenido: input, rol: 'client', usuario_id: salaId });
    setInput('');
    setImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-4 relative" style={{ position: 'relative' }}>
        <div className="flex items-center gap-3 mb-4">
          <img src="https://cdn-icons-png.flaticon.com/512/3208/3208722.png" alt="Taller" className="w-10 h-10 rounded-full border shadow" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Chat con el Taller</h1>
              <p className="text-sm text-blue-700">Soporte y atención personalizada {typingAdmin && <span className="text-xs text-gray-500 animate-pulse ml-2">Admin escribiendo...</span>}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-lg p-4 mb-2 border border-blue-100" style={{ minHeight: 350, marginBottom: '80px' }}>
          {mensajes.map((msg: LocalMsg) => {
            const esCliente = msg.rol === 'client';
            let bubbleColor = esCliente ? 'bg-blue-500' : 'bg-green-100';
            let textColor = esCliente ? 'text-white' : 'text-green-900';
            let align = esCliente ? 'justify-end' : 'justify-start';
            let label = esCliente ? 'Tú' : (msg.rol === 'admin' ? 'Admin' : msg.rol);
            let avatar = esCliente
              ? 'https://cdn-icons-png.flaticon.com/512/921/921347.png'
              : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
            return (
              <div key={msg.mensaje_id} className={`mb-6 flex ${align} items-end`}>
                <img src={avatar} alt={label} className={`w-8 h-8 rounded-full border shadow mr-2 ${align === 'justify-end' ? 'order-2 ml-2' : ''}`} />
                <div className={`max-w-xs px-4 py-3 rounded-2xl text-base font-medium shadow ${bubbleColor} ${textColor} relative`}>
                  <span>{msg.contenido}</span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-semibold opacity-70">{label}</span>
                    <span className="text-xs text-gray-200 ml-2">{new Date(msg.enviado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 items-center bg-white rounded-xl shadow px-4 py-3 border border-blue-100 sticky bottom-0" style={{ width: '100%', zIndex: 10 }}>
          <input
            type="text"
            className="flex-1 border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            onFocus={() => salaId && chatService.setTyping(salaId, 'client', true)}
            onBlur={() => salaId && chatService.setTyping(salaId, 'client', false)}
          />
          <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-semibold shadow flex items-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setImage(e.target.files[0]);
                }
              }}
            />
            📎
          </label>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow"
            onClick={handleSend}
          >Enviar</button>
        </div>
      </div>
    </div>
  );
}
