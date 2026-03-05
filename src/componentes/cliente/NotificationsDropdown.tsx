import { useState, useEffect, useCallback } from 'react';
import notificationsService, { Notification } from '../../servicios/notificationsService';

interface NotificationsDropdownProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onNotificationsChanged?: () => void;
}

export default function NotificationsDropdown({ clientId, isOpen, onClose, onNotificationsChanged }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && clientId) {
      loadNotifications();
    }
  }, [isOpen, clientId]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationsService.getClientNotifications(clientId);
      if (response.success && response.data) {
        const notificationsArray = Array.isArray(response.data) ? response.data : [response.data];
        setNotifications(notificationsArray);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update: mark as read immediately in local state
    setNotifications(prev =>
      prev.map(n => String(n.id) === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    setActionLoading(notificationId);

    try {
      const result = await notificationsService.markAsRead(notificationId);
      if (!result.success) {
        console.error('Error del servidor al marcar como leída:', result.error || result.message);
        // Revert optimistic update on failure
        await loadNotifications();
      } else {
        // Notify parent to update badge count
        onNotificationsChanged?.();
      }
    } catch (error) {
      console.error('Error marcando como leída:', error);
      // Revert optimistic update on failure
      await loadNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update: mark all as read immediately
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setActionLoading('all');

    try {
      const result = await notificationsService.markAllAsRead(clientId);
      if (!result.success) {
        console.error('Error del servidor al marcar todas como leídas:', result.error || result.message);
        // Revert optimistic update on failure
        await loadNotifications();
      } else {
        // Notify parent to update badge count
        onNotificationsChanged?.();
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      // Revert optimistic update on failure
      await loadNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    // Optimistic update: remove from list immediately
    setNotifications(prev => prev.filter(n => String(n.id) !== notificationId));
    setActionLoading(notificationId);

    try {
      const result = await notificationsService.deleteNotification(notificationId);
      if (!result.success) {
        console.error('Error del servidor al eliminar:', result.error || result.message);
        await loadNotifications();
      } else {
        onNotificationsChanged?.();
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      await loadNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getNotificationBgColor = (notification: Notification): string => {
    if (notification.isRead) return 'bg-gray-50';
    
    const color = notificationsService.getNotificationColor(notification.type);
    const colors = {
      'blue': 'bg-blue-50',
      'purple': 'bg-purple-50',
      'green': 'bg-green-50',
      'yellow': 'bg-yellow-50',
      'gray': 'bg-gray-50'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-50';
  };

  const getNotificationBorderColor = (notification: Notification): string => {
    if (notification.isRead) return 'border-gray-200';
    
    const color = notificationsService.getNotificationColor(notification.type);
    const colors = {
      'blue': 'border-blue-200',
      'purple': 'border-purple-200',
      'green': 'border-green-200',
      'yellow': 'border-yellow-200',
      'gray': 'border-gray-200'
    };
    return colors[color as keyof typeof colors] || 'border-gray-200';
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>

      {/* Panel de notificaciones */}
      <div className="fixed right-4 top-16 z-50 w-96 max-w-full bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} sin leer</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading === 'all'}
                className={`text-sm text-blue-600 hover:text-blue-800 ${actionLoading === 'all' ? 'opacity-50 cursor-wait' : ''}`}
              >
                {actionLoading === 'all' ? 'Marcando...' : 'Marcar todas'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📬</div>
              <p className="text-gray-500">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getNotificationBgColor(notification)} ${getNotificationBorderColor(notification)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl flex-shrink-0">
                      {notificationsService.getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm ${notification.isRead ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </span>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(String(notification.id))}
                              disabled={actionLoading === String(notification.id)}
                              className={`text-xs text-blue-600 hover:text-blue-800 ${actionLoading === String(notification.id) ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {actionLoading === String(notification.id) ? 'Marcando...' : 'Marcar leída'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(String(notification.id))}
                            disabled={actionLoading === String(notification.id)}
                            className={`text-xs text-red-600 hover:text-red-800 ${actionLoading === String(notification.id) ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
