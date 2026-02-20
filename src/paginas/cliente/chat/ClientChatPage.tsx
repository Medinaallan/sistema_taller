
import { useEffect, useRef, useState } from 'react';
import { chatService, ChatMensajeDTO } from '../../../servicios/chatService';
import { useApp } from '../../../contexto/useApp';
import ImageModal from '../../../componentes/comunes/ImageModal';
import { showError } from '../../../utilidades/sweetAlertHelpers';

interface LocalMsg extends ChatMensajeDTO {}

export default function ClientChatPage() {
  const { state } = useApp();
  // ID de la sala y del usuario (ahora números)
  const [salaId, setSalaId] = useState<number | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [typingAdmin, setTypingAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obtener el ID del usuario directamente del contexto (ya viene del login)
  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!state.user?.id) {
        console.error('❌ No hay usuario logueado');
        setCargando(false);
        return;
      }

      try {
        // El state.user.id ya contiene el usuario_id de la BD (viene del SP_LOGIN)
        const usuarioIdNum = parseInt(state.user.id, 10);
        console.log('✅ Usuario logueado con ID:', usuarioIdNum, 'Email:', state.user.email);
        setUsuarioId(usuarioIdNum);
        
        // Conectar socket UNA SOLA VEZ
        chatService.conectar();
        chatService.setUserContext(usuarioIdNum, 'client');
        
        // Obtener las salas de chat del usuario usando SP_OBTENER_CHATS_USUARIO
        console.log('🔍 Obteniendo salas de chat para usuario_id:', usuarioIdNum);
        const salas = await chatService.obtenerChatsUsuario(usuarioIdNum);
        console.log('📋 Salas de chat obtenidas:', salas.length, salas);
        
        if (salas && salas.length > 0) {
          // Usar la primera sala disponible (o la más reciente)
          setSalaId(salas[0].sala_id);
          console.log('✅ Sala seleccionada:', salas[0].sala_id, 'OT:', salas[0].numero_ot);
        } else {
          console.warn('⚠️ No se encontraron salas de chat para el usuario');
          console.warn('⚠️ Asegúrate de tener una orden de trabajo asignada');
        }
      } catch (error) {
        console.error('❌ Error obteniendo salas de chat:', error);
        if (!cancelado) {
          showError('Error al cargar el chat');
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, [state.user]);

  // Conectar y unir a la sala ya resuelta
  useEffect(() => {
    if (!salaId || !usuarioId) return;
    
    // Suscribir a historial
    const unsubHist = chatService.on('chat:historial', (data: { sala_id: number; mensajes: ChatMensajeDTO[] }) => {
      if (data.sala_id === salaId) {
        setMensajes(data.mensajes);
      }
    });
    
    // Suscribir a mensajes nuevos
    const unsubMsg = chatService.on('chat:mensaje', (msg: ChatMensajeDTO) => {
      if (msg.sala_id === salaId) {
        setMensajes((prev: LocalMsg[]) => {
          const existe = prev.find((m: LocalMsg) => m.mensaje_id === msg.mensaje_id);
          return existe ? prev : [...prev, msg];
        });
      }
    });
    
    // Suscribir a indicador de escritura
    const unsubTyping = chatService.on('chat:typing', (info: any) => {
      if (info.sala_id === salaId && info.rol !== 'client') {
        setTypingAdmin(!!info.escribiendo);
      }
    });
    
    // Función para unirse y solicitar historial
    const doJoinAndFetch = () => {
      chatService.unirSala(salaId, usuarioId);
      chatService.solicitarHistorial(salaId, usuarioId);
    };
    
    // Ejecutar si ya hay conexión, o esperar a que conecte
    if (chatService.estaConectado()) {
      doJoinAndFetch();
    } else {
      const unsubOnConnect = chatService.on('connect', () => {
        doJoinAndFetch();
        unsubOnConnect();
      });
    }
    
    // Cleanup: desuscribir de todos los eventos y salir de la sala
    return () => {
      unsubHist();
      unsubMsg();
      unsubTyping();
      if (salaId) {
        chatService.salirSala(salaId);
      }
    };
  }, [salaId, usuarioId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleSend = async () => {
    if (!input.trim() && !image) return;
    if (!salaId || !usuarioId) return;

    try {
      if (image) {
        // Enviar mensaje con imagen
        await chatService.enviarMensajeConImagen({
          sala_id: salaId,
          contenido: input || '📷 Imagen',
          archivo: image,
          rol: 'client',
          usuario_id: usuarioId
        });
      } else {
        // Enviar solo texto
        chatService.enviarMensaje({ 
          sala_id: salaId, 
          contenido: input, 
          rol: 'client', 
          usuario_id: usuarioId
        });
      }
      
      setInput('');
      setImage(null);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      showError('Error enviando el mensaje. Intenta de nuevo.');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (!salaId || !usuarioId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Chat no disponible</h2>
          <p className="text-gray-600">
            No tienes una conversación activa. El chat se activará cuando tengas una orden de trabajo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col p-2 sm:p-4 relative">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <img src="https://cdn-icons-png.flaticon.com/512/3208/3208722.png" alt="Taller" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border shadow" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-900 truncate">Chat con el Taller</h1>
            <p className="text-xs sm:text-sm text-blue-700">
              Soporte y atención personalizada 
              {typingAdmin && <span className="text-xs text-gray-500 animate-pulse ml-2">Escribiendo...</span>}
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
            const esMio = msg.es_mio || msg.usuario_id === usuarioId;
            let bubbleColor = esMio ? 'bg-blue-500' : 'bg-green-100';
            let textColor = esMio ? 'text-white' : 'text-green-900';
            let align = esMio ? 'justify-end' : 'justify-start';
            let label = esMio ? 'Tú' : (msg.remitente || msg.rol_remitente || 'Taller');
            let avatar = esMio
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
                    <span className={`text-[10px] sm:text-xs ml-2 ${esMio ? 'text-white' : 'text-gray-600'}`}>
                      {new Date(msg.enviado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
