const fs = require('fs');
const path = require('path');

// Lista completa de archivos y sus imports actualizados
const filesToUpdate = [
  {
    file: 'src/App.tsx',
    updates: [
      { from: "import { AppProvider } from './context/AppContext';", to: "import { AppProvider } from './contexto/AppContext';" },
      { from: "import LoginPage from './pages/LoginPage';", to: "import LoginPage from './paginas/autenticacion/LoginPage';" },
      { from: "import Layout from './components/Layout';", to: "import Layout from './componentes/layout/Layout';" },
      { from: "import DashboardPage from './pages/DashboardPage';", to: "import DashboardPage from './paginas/administracion/DashboardPage';" },
      { from: "import ClientsPage from './pages/ClientsPage';", to: "import ClientsPage from './paginas/administracion/ClientsPage';" },
      { from: "import VehiclesPage from './pages/VehiclesPage';", to: "import VehiclesPage from './paginas/administracion/VehiclesPage';" },
      { from: "import ClientDashboardPage from './pages/ClientDashboardPage';", to: "import ClientDashboardPage from './paginas/cliente/ClientDashboardPage';" },
      { from: "import ClientVehiclesPage from './pages/ClientVehiclesPage';", to: "import ClientVehiclesPage from './paginas/cliente/ClientVehiclesPage';" },
      { from: "import ClientAppointmentsPage from './pages/ClientAppointmentsPage';", to: "import ClientAppointmentsPage from './paginas/cliente/ClientAppointmentsPage';" },
      { from: "import './index.css';", to: "import './estilos/index.css';" }
    ]
  },
  {
    file: 'src/main.tsx',
    updates: [
      { from: "import './index.css'", to: "import './estilos/index.css'" }
    ]
  },
  {
    file: 'src/contexto/AppContext.tsx',
    updates: [
      { from: "import type { User } from '../types/index';", to: "import type { User } from '../tipos/index';" },
      { from: "import { mockUsers } from '../utils/mockData';", to: "import { mockUsers } from '../utilidades/mockData';" }
    ]
  },
  {
    file: 'src/componentes/layout/Layout.tsx',
    updates: [
      { from: '"../../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../../utils/mockData"', to: '"../../utilidades/mockData"' },
      { from: '"../UI"', to: '"../comunes/UI"' }
    ]
  },
  {
    file: 'src/paginas/autenticacion/LoginPage.tsx',
    updates: [
      { from: '"../components/UI"', to: '"../../componentes/comunes/UI"' },
      { from: '"../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../utils/mockData"', to: '"../../utilidades/mockData"' }
    ]
  },
  {
    file: 'src/paginas/administracion/DashboardPage.tsx',
    updates: [
      { from: '"../components/UI"', to: '"../../componentes/comunes/UI"' },
      { from: '"../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../utils/mockData"', to: '"../../utilidades/mockData"' }
    ]
  },
  {
    file: 'src/paginas/administracion/ClientsPage.tsx',
    updates: [
      { from: '"../components/UI"', to: '"../../componentes/comunes/UI"' },
      { from: '"../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../utils/mockData"', to: '"../../utilidades/mockData"' }
    ]
  },
  {
    file: 'src/paginas/administracion/VehiclesPage.tsx',
    updates: [
      { from: '"../components/UI"', to: '"../../componentes/comunes/UI"' },
      { from: '"../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../utils/mockData"', to: '"../../utilidades/mockData"' }
    ]
  },
  {
    file: 'src/paginas/cliente/ClientDashboardPage.tsx',
    updates: [
      { from: '"../components/UI"', to: '"../../componentes/comunes/UI"' },
      { from: '"../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../utils/mockData"', to: '"../../utilidades/mockData"' }
    ]
  },
  {
    file: 'src/paginas/cliente/ClientVehiclesPage.tsx',
    updates: [
      { from: '"../components/UI"', to: '"../../componentes/comunes/UI"' },
      { from: '"../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../utils/mockData"', to: '"../../utilidades/mockData"' }
    ]
  },
  {
    file: 'src/paginas/cliente/ClientAppointmentsPage.tsx',
    updates: [
      { from: '"../components/UI"', to: '"../../componentes/comunes/UI"' },
      { from: '"../context/AppContext"', to: '"../../contexto/AppContext"' },
      { from: '"../utils/mockData"', to: '"../../utilidades/mockData"' }
    ]
  }
];

console.log('Actualizando imports...\n');

filesToUpdate.forEach(({ file, updates }) => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    updates.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(` ${file} - imports actualizados`);
    } else {
      console.log(` ${file} - sin cambios necesarios`);
    }
  } else {
    console.log(` ${file} - archivo no encontrado`);
  }
});

console.log('\n Actualización de imports completada!');
