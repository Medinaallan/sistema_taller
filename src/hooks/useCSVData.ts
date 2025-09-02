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
      const clientesAPI = await obtenerClientesActualizados();
      
      console.log('📊 useCSVData: Datos recibidos:', clientesAPI.length, 'clientes');
      
      // Por ahora solo usamos los clientes, los vehículos y órdenes se manejarán después
      const vehiculosExtraidos: Vehicle[] = [];
      const ordenesExtraidas: WorkOrder[] = [];
      
      setClients(clientesAPI);
      setVehicles(vehiculosExtraidos);
      setWorkOrders(ordenesExtraidas);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos del CSV via API');
      console.error('❌ Error en useCSVData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
