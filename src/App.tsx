import AdminChatPage from './paginas/administracion/chat/AdminChatPage';
import ClientChatPage from './paginas/cliente/chat/ClientChatPage';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexto/AppProvider';
import { useApp } from './contexto/useApp';
import { Layout } from './componentes/layout/Layout';
import { LoginPage } from './paginas/autenticacion/LoginPage';
import { DashboardPage } from './paginas/administracion/DashboardPage';
import AdminPage from './paginas/administracion/AdminPage';
import { ClientsPage } from './paginas/administracion/ClientsPage';
import { VehiclesPage } from './paginas/administracion/VehiclesPage';
import GestionPage from './paginas/administracion/GestionPage';
import { ClientDashboardPage } from './paginas/cliente/ClientDashboardPage';
import { ClientVehiclesPage } from './paginas/cliente/ClientVehiclesPage';
import { ClientAppointmentsPage } from './paginas/cliente/ClientAppointmentsPage';
import ClientRemindersPage from './paginas/cliente/ClientRemindersPage';
import { ClientServiceHistoryPage } from './paginas/cliente/ClientServiceHistoryPage';
import { HelpPage } from './paginas/sistema/HelpPage';
import { ReportsPage } from './paginas/administracion/ReportsPage';
import { WorkOrdersPage } from './paginas/administracion/WorkOrdersPage';
import AppointmentsPage from './paginas/appointments/AppointmentsPage';
import QuotationsPage from './paginas/quotations/QuotationsPage';
import InvoicesPage from './paginas/invoices/InvoicesPage';
import PaymentsPage from './paginas/payments/PaymentsPage';
import InventoryPage from './paginas/inventory/InventoryPage';
import SuppliersPage from './paginas/suppliers/SuppliersPage';
import ProductsPage from './paginas/products/ProductsPage';
import ServicesPage from './paginas/services/ServicesPage';
import LogsPage from './paginas/logs/LogsPage';
import RemindersPage from './paginas/administracion/RemindersPage';
import ClientProfilePage from './paginas/administracion/ClientProfilePage';
import { DebugPage } from './paginas/DebugPage';
import { TestLogin } from './paginas/TestLogin';

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
      <Route
        path="/admin-chat"
        element={
          <ProtectedRoute>
            <AdminChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gestion"
        element={
          <ProtectedRoute>
            <GestionPage />
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
        path="/reminders"
        element={
          <ProtectedRoute>
            <RemindersPage />
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
            <ClientRemindersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-chat"
        element={
          <ProtectedRoute>
            <ClientChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-service-history"
        element={
          <ProtectedRoute>
            <ClientServiceHistoryPage />
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
        path="/client-profile"
        element={
          <ProtectedRoute>
            <ClientProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <ProtectedRoute>
            <WorkOrdersPage />
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
            <ReportsPage />
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
      {/* Nuevos módulos administrativos y de gestión */}
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotations"
        element={
          <ProtectedRoute>
            <QuotationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <SuppliersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <LogsPage />
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
      <Route
        path="/debug"
        element={
          <ProtectedRoute>
            <DebugPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-login"
        element={<TestLogin />}
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
