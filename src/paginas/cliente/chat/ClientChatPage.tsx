
import { useEffect, useRef, useState } from 'react';
import { chatService, ChatMensajeDTO } from '../../../servicios/chatService';
import { useApp } from '../../../contexto/useApp';
import { obtenerClientesActualizados } from '../../../utilidades/BaseDatosJS';
import ImageModal from '../../../componentes/comunes/ImageModal';

interface LocalMsg extends ChatMensajeDTO {}

export default function ClientChatPage() {
  const { state } = useApp();
  // ID real en la sala: debe ser el mismo que ve el admin (client-1, client-2, ...)
  const [salaId, setSalaId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
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
    // Suscribir ANTES para no perder el primer 'chat:historial'
    const unsubHist = chatService.on('chat:historial', (data: { sala_id: string; mensajes: ChatMensajeDTO[] }) => {
      if (data.sala_id === salaId) {
        setMensajes(data.mensajes);
        // Recibido el historial inicial; podemos dejar de escuchar este evento puntual
        unsubHist();
      }
    });
    // Unir/solicitar cuando haya conexión
    const doJoinAndFetch = () => {
      chatService.unirSala(salaId);
      chatService.solicitarHistorial(salaId);
    };
    if (chatService.estaConectado()) {
      doJoinAndFetch();
    } else {
      const unsubOnConnect = chatService.on('connect', () => {
        doJoinAndFetch();
        unsubOnConnect();
      });
    }
    // Reintento: si en 1200ms no llega historial, re-solicitar (hasta 2 veces aquí)
    let retries = 0;
    const timer = setInterval(() => {
      if (retries >= 2) { clearInterval(timer); return; }
      if (chatService.estaConectado()) {
        // Solo reintentar si aún no hay mensajes
        setMensajes(prev => {
          if (prev.length === 0) {
            chatService.solicitarHistorial(salaId);
            retries += 1;
          }
          return prev;
        });
      }
    }, 1200);
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
  clearInterval(timer);
    };
  }, [salaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleSend = async () => {
    if (!input.trim() && !image) return;
    if (!salaId) return;

    try {
      if (image) {
        // Enviar mensaje con imagen
        await chatService.enviarMensajeConImagen({
          sala_id: salaId,
          contenido: input || '📷 Imagen',
          archivo: image,
          rol: 'client',
          usuario_id: salaId
        });
      } else {
        // Enviar solo texto
        chatService.enviarMensaje({ 
          sala_id: salaId, 
          contenido: input, 
          rol: 'client', 
          usuario_id: salaId 
        });
      }
      
      setInput('');
      setImage(null);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error enviando el mensaje. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col p-2 sm:p-4 relative">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <img src="https://cdn-icons-png.flaticon.com/512/3208/3208722.png" alt="Taller" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border shadow" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-900 truncate">Chat con el Taller</h1>
            <p className="text-xs sm:text-sm text-blue-700">
              Soporte y atención personalizada 
              {typingAdmin && <span className="text-xs text-gray-500 animate-pulse ml-2">Admin escribiendo...</span>}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-lg p-2 sm:p-4 mb-16 sm:mb-20 border border-blue-100" style={{ minHeight: 300 }}>
          {image && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-blue-800">Imagen seleccionada:</span>
                <button
                  onClick={() => setImage(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ✕ Cancelar
                </button>
              </div>
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: '120px' }}
              />
            </div>
          )}
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
              <div key={msg.mensaje_id} className={`mb-4 sm:mb-6 flex ${align} items-end`}>
                <img 
                  src={avatar} 
                  alt={label} 
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border shadow mr-2 ${align === 'justify-end' ? 'order-2 ml-2 mr-0' : ''}`} 
                />
                <div className={`max-w-xs sm:max-w-sm px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-sm sm:text-base font-medium shadow ${bubbleColor} ${textColor} relative`}>
                  {msg.archivo_url && msg.tipo_archivo?.startsWith('image/') ? (
                    <div className="mb-2">
                      <img 
                        src={msg.archivo_url} 
                        alt="Imagen del chat" 
                        className="max-w-full h-auto rounded-lg cursor-pointer"
                        onClick={() => setModalImage(msg.archivo_url!)}
                        style={{ maxHeight: '180px' }}
                      />
                      {msg.contenido && msg.contenido !== '📷 Imagen' && (
                        <p className="mt-2 text-xs sm:text-sm">{msg.contenido}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm">{msg.contenido}</span>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] sm:text-xs font-semibold opacity-70">{label}</span>
                    <span className={`text-[10px] sm:text-xs ml-2 ${esCliente ? 'text-white' : 'text-gray-600'}`}>{new Date(msg.enviado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-4 sm:left-2 sm:right-2 p-2 sm:p-0">
          <div className="flex gap-1 sm:gap-2 items-center bg-white rounded-xl shadow px-2 sm:px-4 py-2 sm:py-3 border border-blue-100 max-w-4xl mx-auto">
            <input
              type="text"
              className="flex-1 border border-blue-300 rounded-lg px-2 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm min-w-0"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              onFocus={() => salaId && chatService.setTyping(salaId, 'client', true)}
              onBlur={() => salaId && chatService.setTyping(salaId, 'client', false)}
            />
            <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 sm:px-3 py-2 rounded-lg font-semibold shadow flex items-center">
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-2 rounded-lg font-semibold shadow text-sm"
              onClick={handleSend}
            >
              <span className="hidden sm:inline">Enviar</span>
              <span className="sm:hidden">📤</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal para mostrar imágenes */}
      <ImageModal
        isOpen={!!modalImage}
        imageUrl={modalImage || ''}
        onClose={() => setModalImage(null)}
        altText="Imagen del chat"
      />
    </div>
  );
}
