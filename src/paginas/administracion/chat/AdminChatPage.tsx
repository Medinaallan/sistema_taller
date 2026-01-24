
import { useEffect, useRef, useState } from 'react';
import { useAdminChat } from '../../../hooks/useAdminChat';
import { ChatMensajeDTO, chatService } from '../../../servicios/chatService';
import { useApp } from '../../../contexto/useApp';
import ImageModal from '../../../componentes/comunes/ImageModal';
import { showError } from '../../../utilidades/sweetAlertHelpers';

// Página de chat para el administrador
// Estructura de dos columnas: lista de clientes + ventana de chat
// Se apoya en el hook useAdminChat para la lógica de estado y comunicación.

export default function AdminChatPage() {
  const {
    clientes,
    setBusqueda,
    busqueda,
    seleccionarSala,
    salaActiva,
    mensajes,
    enviarMensaje,
    enviarMensajeConImagen,
    conectado,
    typing
  } = useAdminChat();
  const { state } = useApp();

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showClientList, setShowClientList] = useState(true);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Configurar contexto de usuario admin para IDs correctos
  useEffect(() => {
    if (state.user) {
      chatService.setUserContext(state.user.id, state.user.role as any);
    }
  }, [state.user]);

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    
    try {
      if (selectedImage) {
        await enviarMensajeConImagen(input.trim(), selectedImage);
      } else {
        enviarMensaje(input.trim());
      }
      
      setInput('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      showError('Error enviando el mensaje. Intenta de nuevo.');
    }
  };

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex-1 flex overflow-hidden border rounded-lg bg-white shadow-sm relative">
        {/* Columna izquierda: Lista de clientes */}
        <div className={`${showClientList ? 'flex' : 'hidden'} lg:flex w-full lg:w-72 border-r flex-col absolute lg:relative inset-0 lg:inset-auto bg-white z-10 lg:z-auto`}>
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-sm font-semibold tracking-wide">Clientes</h2>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="mt-2 w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring"
              />
              <div className="text-[10px] mt-1 text-gray-500">Estado: {conectado ? 'Conectado' : 'Desconectado'}</div>
            </div>
            <button
              onClick={() => setShowClientList(false)}
              className="lg:hidden ml-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {clientes.length === 0 && (
              <div className="p-4 text-xs text-gray-500">Sin clientes cargados.</div>
            )}
            {clientes.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  // Solo seleccionar si no es la sala activa
                  if (salaActiva !== c.id) {
                    seleccionarSala(c.id);
                  }
                  setShowClientList(false); // En móvil, ocultar lista después de seleccionar
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 border-b ${salaActiva === c.id ? 'bg-blue-50' : ''}`}
                disabled={salaActiva === c.id} // Deshabilitar si ya está seleccionado
              >
                <img src={c.avatar} alt={c.nombre} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{c.nombre}</span>
                    {c.noLeidos > 0 && (
                      <span className="ml-2 bg-blue-600 text-white rounded-full px-2 text-[10px] font-semibold">{c.noLeidos}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{c.ultimoMensaje || 'Sin mensajes'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Columna derecha: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {salaActiva ? (
            <>
              {/* Header */}
              <div className="px-3 sm:px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowClientList(true)}
                    className="lg:hidden p-1 hover:bg-gray-200 rounded"
                  >
                    ☰
                  </button>
                  <div className="text-xs sm:text-sm font-semibold flex items-center gap-2 min-w-0">
                    <span className="truncate">Chat con cliente #{salaActiva}</span>
                    {typing && <span className="text-[10px] text-gray-500 animate-pulse hidden sm:inline">escribiendo...</span>}
                  </div>
                </div>
              </div>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50">
                {selectedImage && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-yellow-800">Imagen seleccionada:</span>
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="text-yellow-600 hover:text-yellow-800 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="max-w-full h-auto rounded"
                      style={{ maxHeight: '100px' }}
                    />
                  </div>
                )}
                {mensajes.map((m: ChatMensajeDTO) => {
                  const esAdmin = m.rol === 'admin';
                  return (
                    <div key={m.mensaje_id} className={`flex ${esAdmin ? 'justify-end' : 'justify-start'}`}> 
                      <div className={`max-w-xs sm:max-w-sm rounded px-2 sm:px-3 py-2 text-xs shadow ${esAdmin ? 'bg-blue-100' : 'bg-gray-100'}`}> 
                        {m.archivo_url && m.tipo_archivo?.startsWith('image/') ? (
                          <div>
                            <img 
                              src={m.archivo_url} 
                              alt="Imagen del chat" 
                              className="max-w-full h-auto rounded cursor-pointer mb-1"
                              onClick={() => setModalImage(m.archivo_url!)}
                              style={{ maxHeight: '150px' }}
                            />
                            {m.contenido && m.contenido !== '📷 Imagen' && (
                              <div className="whitespace-pre-wrap break-words">{m.contenido}</div>
                            )}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap break-words">{m.contenido}</div>
                        )}
                        <div className="mt-1 text-[10px] text-gray-500 text-right">{new Date(m.enviado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={mensajesEndRef} />
              </div>
              {/* Input */}
              <div className="p-2 sm:p-3 border-t flex items-center gap-1 sm:gap-2 bg-white">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border rounded px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none min-w-0"
                  onFocus={() => salaActiva && chatService.setTyping(salaActiva, 'admin', true)}
                  onBlur={() => salaActiva && chatService.setTyping(salaActiva, 'admin', false)}
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedImage(e.target.files[0]);
                      }
                    }}
                  />
                  📎
                </label>
                <button
                  onClick={handleSend}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-2 sm:px-4 py-1 sm:py-2 rounded"
                >
                  <span className="hidden sm:inline">Enviar</span>
                  <span className="sm:hidden">📤</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 p-4">
              <div className="text-center">
                <div className="mb-2">Selecciona un cliente para iniciar el chat</div>
                <button
                  onClick={() => setShowClientList(true)}
                  className="lg:hidden bg-blue-600 text-white px-4 py-2 rounded text-sm"
                >
                  Ver Clientes
                </button>
              </div>
            </div>
          )}
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
