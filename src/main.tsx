import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/index.css'
import App from './App.tsx'
import { inicializarClientesDesdeCSV } from './utilidades/BaseDatosJS'

// Inicializar clientes desde CSV al arrancar la aplicación
inicializarClientesDesdeCSV().then(() => {
  console.log('🚀 Clientes cargados desde CSV');
}).catch((error) => {
  console.error('❌ Error inicializando clientes:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
