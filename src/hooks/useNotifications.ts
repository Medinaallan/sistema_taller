import { useState, useEffect } from 'react';
import notificationsService from '../servicios/notificationsService';

export function useNotifications(clientId: string | null, enabled: boolean = true) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId || !enabled) return;

    const loadUnreadCount = async () => {
      setLoading(true);
      try {
        const count = await notificationsService.getUnreadCount(clientId);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error cargando conteo de notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUnreadCount();

    // Actualizar cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [clientId, enabled]);

  const refreshCount = async () => {
    if (!clientId) return;
    
    try {
      const count = await notificationsService.getUnreadCount(clientId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error actualizando conteo:', error);
    }
  };

  return {
    unreadCount,
    loading,
    refreshCount
  };
}
