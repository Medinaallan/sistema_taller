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
    console.log('🔄 useClientesFromAPI: Recargando clientes desde API...');
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
        
        console.log(`✅ useClientesFromAPI: ${clientesArray.length} clientes cargados desde API`);
        console.log('📋 Clientes cargados:', clientesArray.map(c => ({
          id: c.usuario_id,
          nombre: c.nombre_completo,
          email: c.correo,
          rol: c.rol
        })));
        
      } else {
        setError(resultado.message || 'Error al cargar clientes');
        setClientes([]);
        setClientesLegacy([]);
        setCount(0);
        console.log('❌ useClientesFromAPI: Error cargando clientes:', resultado.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      setClientes([]);
      setClientesLegacy([]);
      setCount(0);
      console.error('❌ useClientesFromAPI: Error de conexión:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useClientesFromAPI: Iniciando carga inicial de clientes...');
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