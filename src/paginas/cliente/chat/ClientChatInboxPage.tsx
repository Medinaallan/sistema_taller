import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService, ChatSalaDTO } from '../../../servicios/chatService';
import { useApp } from '../../../contexto/useApp';
import { showError } from '../../../utilidades/sweetAlertHelpers';
import {
  ChatBubbleBottomCenterTextIcon,
  TruckIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function ClientChatInboxPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [salas, setSalas] = useState<ChatSalaDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState<'abiertos' | 'cerrados'>('abiertos');

  useEffect(() => {
    const cargarSalas = async () => {
      try {
        if (!state.user?.id) {
          console.error('❌ No hay usuario logueado');
          setCargando(false);
          return;
        }

        const usuarioIdNum = parseInt(state.user.id, 10);
        console.log('🔍 Obteniendo salas de chat para usuario_id:', usuarioIdNum);
        
        const salasObtenidas = await chatService.obtenerChatsUsuario(usuarioIdNum);
        console.log('📋 Salas de chat obtenidas:', salasObtenidas.length, salasObtenidas);
        
        setSalas(salasObtenidas || []);
      } catch (error) {
        console.error('❌ Error obteniendo salas de chat:', error);
        showError('Error al cargar las conversaciones');
      } finally {
        setCargando(false);
      }
    };

    cargarSalas();

    // Recargar cada 30 segundos para obtener actualizaciones
    const interval = setInterval(cargarSalas, 30000);
    
    return () => clearInterval(interval);
  }, [state.user]);

  // Filtrar salas según el estado (abiertas/cerradas)
  const salasFiltradas = salas.filter(sala => 
    filtroActivo === 'abiertos' ? !sala.cerrada : sala.cerrada
  );

  // Función para truncar el mensaje
  const truncarMensaje = (mensaje: string, maxLength: number = 50) => {
    if (!mensaje) return 'Sin mensajes';
    if (mensaje.length <= maxLength) return mensaje;
    return mensaje.substring(0, maxLength) + '...';
  };

  // Función para formatear la fecha del último mensaje
  const formatearFecha = (fecha: string): string => {
    if (!fecha) return '';
    
    const fechaMensaje = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaMensaje.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return fechaMensaje.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Manejar click en una sala para abrir el chat
  const abrirChat = (salaId: number) => {
    navigate(`/client-chat/${salaId}`);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center px-2 sm:px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center mb-3 sm:mb-4">
            <ChatBubbleBottomCenterTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Mis Conversaciones</h1>
              <p className="text-xs sm:text-sm text-gray-600">Chats con el taller</p>
            </div>
          </div>

          {/* Pestañas de filtrado */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setFiltroActivo('abiertos')}
                className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 flex items-center ${
                  filtroActivo === 'abiertos'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Abiertos
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  filtroActivo === 'abiertos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {salas.filter(s => !s.cerrada).length}
                </span>
              </button>
              <button
                onClick={() => setFiltroActivo('cerrados')}
                className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 flex items-center ${
                  filtroActivo === 'cerrados'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Cerrados
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  filtroActivo === 'cerrados'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {salas.filter(s => s.cerrada).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="space-y-2 sm:space-y-3">
          {salasFiltradas.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
              <EnvelopeIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No hay conversaciones {filtroActivo === 'abiertos' ? 'abiertas' : 'cerradas'}
              </h3>
              <p className="text-sm text-gray-500">
                {filtroActivo === 'abiertos' 
                  ? 'Cuando tengas una orden de trabajo, podrás chatear con el taller.'
                  : 'Las conversaciones cerradas aparecerán aquí.'}
              </p>
            </div>
          ) : (
            salasFiltradas.map((sala) => (
              <div
                key={sala.sala_id}
                onClick={() => abrirChat(sala.sala_id)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer p-3 sm:p-4 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Cabecera con OT y vehículo */}
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <TruckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                          OT #{sala.numero_ot}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {sala.vehiculo} • {sala.placa}
                        </p>
                      </div>
                    </div>

                    {/* Último mensaje */}
                    <div className="bg-gray-50 rounded p-2 mb-2">
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                        {truncarMensaje(sala.ultimo_mensaje, 80)}
                      </p>
                    </div>

                    {/* Fecha y estado */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {formatearFecha(sala.fecha_ultimo_mensaje)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sala.cerrada 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {sala.cerrada ? 'Cerrado' : 'Activo'}
                      </span>
                    </div>
                  </div>

                  {/* Contador de mensajes no leídos */}
                  {sala.mensajes_no_leidos > 0 && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="bg-red-500 text-white rounded-full h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold">
                          {sala.mensajes_no_leidos > 9 ? '9+' : sala.mensajes_no_leidos}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
