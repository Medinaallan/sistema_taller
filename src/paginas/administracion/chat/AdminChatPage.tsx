
import { useEffect, useRef, useState } from 'react';
import { useAdminChat } from '../../../hooks/useAdminChat';
import { ChatMensajeDTO, chatService } from '../../../servicios/chatService';
import { useApp } from '../../../contexto/useApp';

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
    conectado,
    typing
  } = useAdminChat();
  const { state } = useApp();

  const [input, setInput] = useState('');
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

  const handleSend = () => {
    if (!input.trim()) return;
    enviarMensaje(input.trim());
    setInput('');
  };

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex-1 flex overflow-hidden border rounded-lg bg-white shadow-sm">
        {/* Columna izquierda: Lista de clientes */}
        <div className="w-72 border-r flex flex-col">
          <div className="p-3 border-b bg-gray-50">
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
          <div className="flex-1 overflow-y-auto">
            {clientes.length === 0 && (
              <div className="p-4 text-xs text-gray-500">Sin clientes cargados.</div>
            )}
            {clientes.map(c => (
              <button
                key={c.id}
                onClick={() => seleccionarSala(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 border-b ${salaActiva === c.id ? 'bg-blue-50' : ''}`}
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
        <div className="flex-1 flex flex-col">
          {salaActiva ? (
            <>
              {/* Header */}
              <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                <div className="text-sm font-semibold flex items-center gap-2">Chat con cliente #{salaActiva}
                  {typing && <span className="text-[10px] text-gray-500 animate-pulse">escribiendo...</span>}
                </div>
              </div>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {mensajes.map((m: ChatMensajeDTO) => {
                  const esAdmin = m.rol === 'admin';
                  return (
                    <div key={m.mensaje_id} className={`flex ${esAdmin ? 'justify-end' : 'justify-start'}`}> 
                      <div className={`max-w-xs rounded px-3 py-2 text-xs shadow ${esAdmin ? 'bg-blue-100' : 'bg-gray-100'}`}> 
                        <div className="whitespace-pre-wrap break-words">{m.contenido}</div>
                        <div className="mt-1 text-[10px] text-gray-500 text-right">{new Date(m.enviado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={mensajesEndRef} />
              </div>
              {/* Input */}
              <div className="p-3 border-t flex items-center gap-2 bg-white">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none"
                  onFocus={() => salaActiva && chatService.setTyping(salaActiva, 'admin', true)}
                  onBlur={() => salaActiva && chatService.setTyping(salaActiva, 'admin', false)}
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
                >Enviar</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500">Selecciona un cliente para iniciar el chat</div>
          )}
        </div>
      </div>
    </div>
  );
}
