import { useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AppContext } from './AppContext';
import { appReducer, getInitialState } from './appReducer';

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch
    }}>
      {children}
    </AppContext.Provider>
  );
}
