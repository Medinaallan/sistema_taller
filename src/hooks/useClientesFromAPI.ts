// Hook para cargar clientes desde la API (SP_OBTENER_USUARIOS)
import { useState, useEffect } from 'react';
import clientesService, { Cliente } from '../servicios/clientesService';

interface UseClientesFromAPI {
  clientes: Cliente[];
  clientesLegacy: any[];
  loading: boolean;
  error: string | null;
  recargarClientes: () => Promise<void>;
  count: number;
}

export const useClientesFromAPI = (): UseClientesFromAPI => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesLegacy, setClientesLegacy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const recargarClientes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar clientes desde la API
      const resultado = await clientesService.obtenerClientes();
      
      if (resultado.success && resultado.data) {
        const clientesArray = Array.isArray(resultado.data) ? resultado.data : [resultado.data];
        setClientes(clientesArray);
        setCount(clientesArray.length);
        
        // Convertir a formato legacy para compatibilidad
        const clientesLegacyArray = clientesArray.map(cliente => 
          clientesService.convertirAFormatoLegacy(cliente)
        );
        setClientesLegacy(clientesLegacyArray);
        
      } else {
        setError(resultado.message || 'Error al cargar clientes');
        setClientes([]);
        setClientesLegacy([]);
        setCount(0);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      setClientes([]);
      setClientesLegacy([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    recargarClientes();
  }, []);

  return {
    clientes,
    clientesLegacy,
    loading,
    error,
    recargarClientes,
    count
  };
};