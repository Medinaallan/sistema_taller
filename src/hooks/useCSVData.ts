import { useState, useEffect } from 'react';
import { obtenerClientesActualizados } from '../utilidades/BaseDatosJS';
import { Client, Vehicle, WorkOrder } from '../tipos/index';

// Hook para cargar datos del CSV via API del backend
export function useCSVData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 useCSVData: Cargando datos desde API...');
      
      // Intentar obtener clientes de la API
      try {
        const clientesAPI = await obtenerClientesActualizados();
        console.log('📊 useCSVData: Datos recibidos:', clientesAPI.length, 'clientes');
        setClients(clientesAPI);
      } catch (apiError) {
        console.warn('⚠️ No se pudieron cargar clientes desde API, usando array vacío');
        setClients([]);
      }
      
      // Por ahora solo usamos los clientes, los vehículos y órdenes se manejarán después
      setVehicles([]);
      setWorkOrders([]);
      
    } catch (err) {
      console.error('❌ Error en useCSVData:', err);
      // En caso de error, usar arrays vacíos para que la app funcione
      setClients([]);
      setVehicles([]);
      setWorkOrders([]);
      setError(err instanceof Error ? err.message : 'Error cargando datos del CSV via API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useCSVData: Iniciando carga de datos...');
    loadData();
  }, []);

  // Función para recargar los datos (útil cuando se actualiza el CSV)
  const reloadData = () => {
    console.log('🔄 useCSVData: Recargando datos...');
    loadData();
  };

  return {
    clients,
    vehicles,
    workOrders,
    loading,
    error,
    reloadData
  };
}
