import { useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AppContext } from './AppContext';
import { appReducer, getInitialState } from './appReducer';
import { useCSVData } from '../hooks/useCSVData';

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  const { clients, vehicles, workOrders, loading: csvLoading, reloadData } = useCSVData();

  // Actualizar el estado cuando se cargan los datos del CSV
  useEffect(() => {
    if (clients.length > 0) {
      dispatch({ type: 'LOAD_CSV_DATA', payload: { clients, vehicles, workOrders } });
    }
  }, [clients, vehicles, workOrders]);

  // Función para recargar datos CSV manualmente
  const reloadCSVData = useCallback(() => {
    console.log('🔄 Recargando datos CSV desde el contexto...');
    reloadData();
  }, [reloadData]);

  return (
    <AppContext.Provider value={{ 
      state: { ...state, loading: state.loading || csvLoading }, 
      dispatch,
      reloadCSVData 
    }}>
      {children}
    </AppContext.Provider>
  );
}
