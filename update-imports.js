import fs from 'fs';
import path from 'path';

// Mapeo de importaciones a actualizar
const importMappings = {
  "../components/UI": "../../componentes/comunes/UI",
  "../components/Layout": "../../componentes/layout/Layout", 
  "../context/AppContext": "../../contexto/AppContext",
  "../utils/mockData": "../../utilidades/mockData",
  "../types": "../../tipos",
  "./context/AppContext": "./contexto/AppContext",
  "./components/Layout": "./componentes/layout/Layout",
  "./pages/LoginPage": "./paginas/autenticacion/LoginPage",
  "./pages/DashboardPage": "./paginas/administracion/DashboardPage",
  "./pages/ClientsPage": "./paginas/administracion/ClientsPage", 
  "./pages/VehiclesPage": "./paginas/administracion/VehiclesPage",
  "./pages/ClientDashboardPage": "./paginas/cliente/ClientDashboardPage",
  "./pages/ClientVehiclesPage": "./paginas/cliente/ClientVehiclesPage",
  "./pages/ClientAppointmentsPage": "./paginas/cliente/ClientAppointmentsPage"
};

// Función para actualizar importaciones en un archivo
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const regex = new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldImport)) {
        content = content.replace(regex, newImport);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Actualizado: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message);
  }
}

// Función para procesar directorio recursivamente
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(item)) {
      processDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      updateImports(fullPath);
    }
  }
}

// Ejecutar la actualización
console.log('Actualizando importaciones...');
processDirectory('./src');
console.log('¡Actualización completada!');
