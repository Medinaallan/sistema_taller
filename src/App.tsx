import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexto/AppProvider';
import { useApp } from './contexto/useApp';
import { Layout } from './componentes/layout/Layout';
import { LoginPage } from './paginas/autenticacion/LoginPage';
import { DashboardPage } from './paginas/administracion/DashboardPage';
import { ClientsPage } from './paginas/administracion/ClientsPage';
import { VehiclesPage } from './paginas/administracion/VehiclesPage';
import { ClientDashboardPage } from './paginas/cliente/ClientDashboardPage';
import { ClientVehiclesPage } from './paginas/cliente/ClientVehiclesPage';
import { ClientAppointmentsPage } from './paginas/cliente/ClientAppointmentsPage';
import { HelpPage } from './paginas/sistema/HelpPage';

// Componente para proteger rutas autenticadas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

// Componente principal de las rutas
function AppRoutes() {
  const { state } = useApp();
  
  if (!state.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const getDefaultRoute = () => {
    if (state.user?.role === 'client') {
      return '/client-dashboard';
    }
    return '/dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      
      {/* Rutas para roles internos (admin, mechanic, receptionist) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      {/* Rutas para clientes */}
      <Route
        path="/client-dashboard"
        element={
          <ProtectedRoute>
            <ClientDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-vehicles"
        element={
          <ProtectedRoute>
            <ClientVehiclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-appointments"
        element={
          <ProtectedRoute>
            <ClientAppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-reminders"
        element={
          <ProtectedRoute>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Recordatorios</h1>
                <p className="text-gray-600">Recordatorios de mantenimiento para tus vehículos</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                  Página en desarrollo... Aquí verás todos tus recordatorios de mantenimiento.
                </p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      
      {/* Rutas para roles internos */}
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <VehiclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <ProtectedRoute>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
                <p className="text-gray-600">Gestión de servicios y reparaciones</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                  Página en desarrollo... Aquí se gestionarán las órdenes de trabajo.
                </p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reminders"
        element={
          <ProtectedRoute>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recordatorios</h1>
                <p className="text-gray-600">Recordatorios de mantenimiento</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                  Página en desarrollo... Aquí se gestionarán los recordatorios de mantenimiento xd xd .
                </p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
                <p className="text-gray-600">Análisis y reportes del taller</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                  Página en desarrollo... Aquí se generarán los reportes del taller.
                </p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
                <p className="text-gray-600">Configuración y usuarios del sistema</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                  Página en desarrollo... Aquí se administrarán los usuarios y configuraciones.
                </p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <HelpPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
