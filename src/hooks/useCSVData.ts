import { useState, useEffect } from 'react';
import { loadCSVData, csvToClients, csvToWorkOrders, CSVClientData } from '../utilidades/csvDatabase';
import { Client, Vehicle, WorkOrder } from '../tipos/index';

// Hook para cargar datos del CSV dinámicamente
export function useCSVData() {
  const [csvData, setCSVData] = useState<CSVClientData[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await loadCSVData();
      setCSVData(data);
      
      const convertedClients = csvToClients(data);
      const convertedVehicles = convertedClients.flatMap(client => client.vehicles);
      const convertedWorkOrders = csvToWorkOrders(data);
      
      setClients(convertedClients);
      setVehicles(convertedVehicles);
      setWorkOrders(convertedWorkOrders);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos del CSV');
      console.error('Error en useCSVData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Función para recargar los datos (útil cuando se actualiza el CSV)
  const reloadData = () => {
    loadData();
  };

  return {
    csvData,
    clients,
    vehicles,
    workOrders,
    loading,
    error,
    reloadData
  };
}
