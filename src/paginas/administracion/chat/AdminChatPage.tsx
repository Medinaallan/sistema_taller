
import { useEffect, useRef, useState } from 'react';
import { useAdminChat } from '../../../hooks/useAdminChat';
import { ChatMensajeDTO, chatService } from '../../../servicios/chatService';
import { useApp } from '../../../contexto/useApp';
import ImageModal from '../../../componentes/comunes/ImageModal';
import { showError, showSuccess } from '../../../utilidades/sweetAlertHelpers';

// Página de chat para el administrador
// Estructura de dos columnas: lista de clientes + ventana de chat
// Se apoya en el hook useAdminChat para la lógica de estado y comunicación.

interface Usuario {
  usuario_id: number;
  nombre_completo: string;
  email: string;
  rol: string;
}

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
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
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

  // Cargar usuarios del sistema
  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    try {
      const response = await fetch('http://localhost:8080/api/users/list');
      const data = await response.json();
      
      if (data.success) {
        // Filtrar solo Mecánicos y Administradores (excluir al usuario actual)
        const ROLES_PERMITIDOS = ['Mecánico', 'Administrador'];
        const usuariosSistema = data.data.filter((u: Usuario) =>
          ROLES_PERMITIDOS.includes(u.rol) &&
          u.usuario_id !== parseInt(state.user?.id || '0')
        );
        setUsuarios(usuariosSistema);
      } else {
        showError('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showError('Error al cargar usuarios del sistema');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  // Agregar usuario a la sala
  const agregarUsuarioASala = async (usuarioId: number, nombreUsuario: string) => {
    if (!salaActiva || !state.user?.id) return;

    try {
      const registradoPor = parseInt(state.user.id, 10);
      const result = await chatService.agregarParticipante(salaActiva, usuarioId, registradoPor);
      
      if (result.success) {
        showSuccess(`${nombreUsuario} agregado al chat`);
        setShowAddUserModal(false);
      } else {
        showError(result.msg || 'Error al agregar participante');
      }
    } catch (error) {
      console.error('Error agregando participante:', error);
      showError('Error al agregar participante al chat');
    }
  };

  // Abrir modal y cargar usuarios
  const handleOpenAddUserModal = () => {
    setShowAddUserModal(true);
    cargarUsuarios();
  };

  // Filtrar usuarios por búsqueda
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre_completo.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    u.email.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    u.rol.toLowerCase().includes(busquedaUsuario.toLowerCase())
  );

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
                key={c.sala_id}
                onClick={() => {
                  // Solo seleccionar si no es la sala activa
                  if (salaActiva !== c.sala_id) {
                    seleccionarSala(c.sala_id);
                  }
                  setShowClientList(false); // En móvil, ocultar lista después de seleccionar
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 border-b ${salaActiva === c.sala_id ? 'bg-blue-50' : ''}`}
                disabled={salaActiva === c.sala_id} // Deshabilitar si ya está seleccionado
              >
                <img src={c.avatar} alt={c.nombre} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{c.nombre}</span>
                    {c.noLeidos > 0 && (
                      <span className="ml-2 bg-blue-600 text-white rounded-full px-2 text-[10px] font-semibold">{c.noLeidos}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {c.ultimoMensaje || 'Sin mensajes'} • {c.numero_ot}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">{c.vehiculo}</div>
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
                    <span className="truncate">
                      {clientes.find(c => c.sala_id === salaActiva)?.numero_ot || `Sala ${salaActiva}`} 
                      {clientes.find(c => c.sala_id === salaActiva)?.nombre && ` - ${clientes.find(c => c.sala_id === salaActiva)?.nombre}`}
                    </span>
                    {typing && <span className="text-[10px] text-gray-500 animate-pulse hidden sm:inline">escribiendo...</span>}
                  </div>
                </div>
                {/* Botón para agregar participante */}
                <button
                  onClick={handleOpenAddUserModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                  title="Agregar participante a la sala"
                >
                  <span>👤+</span>
                  <span className="hidden sm:inline">Agregar</span>
                </button>
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
                  // Si es un mensaje del sistema, mostrarlo centrado como WhatsApp
                  if (m.es_sistema) {
                    return (
                      <div key={m.mensaje_id} className="flex justify-center my-3">
                        <div className="bg-gray-200 bg-opacity-80 text-gray-700 text-xs px-3 py-1 rounded-full shadow-sm max-w-xs text-center">
                          {m.contenido}
                        </div>
                      </div>
                    );
                  }
                  
                  // Mensaje normal
                  // Determinar si el mensaje es propio
                  const esMio = m.usuario_id === parseInt(state.user?.id || '0');
                  
                  // Asignar colores según el rol
                  let bgColor = '';
                  let textColor = '';
                  let nombreColor = '';
                  
                  if (m.rol === 'admin') {
                    bgColor = 'bg-blue-500';
                    textColor = 'text-white';
                    nombreColor = 'text-blue-200';
                  } else if (m.rol === 'mechanic') {
                    bgColor = 'bg-amber-500';
                    textColor = 'text-white';
                    nombreColor = 'text-amber-200';
                  } else if (m.rol === 'client') {
                    bgColor = 'bg-green-500';
                    textColor = 'text-white';
                    nombreColor = 'text-green-200';
                  } else if (m.rol === 'receptionist') {
                    bgColor = 'bg-purple-500';
                    textColor = 'text-white';
                    nombreColor = 'text-purple-200';
                  } else {
                    // Rol desconocido
                    bgColor = 'bg-gray-500';
                    textColor = 'text-white';
                    nombreColor = 'text-gray-200';
                  }
                  
                  // Obtener nombre para mostrar
                  const nombreMostrar = esMio ? 'Tú' : (m.remitente || m.rol_remitente || m.rol);
                  
                  return (
                    <div key={m.mensaje_id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}> 
                      <div className={`max-w-sm sm:max-w-md rounded-lg px-4 py-3 text-base shadow-md ${bgColor} ${textColor}`}> 
                        {/* Nombre del remitente */}
                        <div className={`text-[12px] font-semibold mb-1 ${nombreColor}`}>
                          {nombreMostrar}
                        </div>
                        
                        {/* Contenido del mensaje */}
                        {m.archivo_url && m.tipo_archivo?.startsWith('image/') ? (
                          <div>
                            <img 
                              src={m.archivo_url} 
                              alt="Imagen del chat" 
                              className="max-w-full h-auto rounded cursor-pointer mb-1"
                              onClick={() => setModalImage(m.archivo_url!)}
                              style={{ maxHeight: '200px' }}
                            />
                            {m.contenido && m.contenido !== '📷 Imagen' && (
                              <div className="whitespace-pre-wrap break-words">{m.contenido}</div>
                            )}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap break-words">{m.contenido}</div>
                        )}
                        
                        {/* Hora */}
                        <div className={`mt-1 text-[11px] opacity-80 text-right`}>
                          {new Date(m.enviado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
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
      
      {/* Modal para agregar participante */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            {/* Header del modal */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Agregar Participante</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Búsqueda */}
            <div className="px-4 py-3 border-b">
              <input
                type="text"
                value={busquedaUsuario}
                onChange={e => setBusquedaUsuario(e.target.value)}
                placeholder="Buscar por nombre, email o rol..."
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Lista de usuarios */}
            <div className="flex-1 overflow-y-auto p-4">
              {cargandoUsuarios ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usuariosFiltrados.map(usuario => (
                    <button
                      key={usuario.usuario_id}
                      onClick={() => agregarUsuarioASala(usuario.usuario_id, usuario.nombre_completo)}
                      className="w-full flex items-center gap-3 p-3 border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {usuario.nombre_completo.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{usuario.nombre_completo}</div>
                        <div className="text-xs text-gray-500 truncate">{usuario.email}</div>
                        <div className="text-xs text-blue-600 font-medium">{usuario.rol}</div>
                      </div>
                      <div className="text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t bg-gray-50">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
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
