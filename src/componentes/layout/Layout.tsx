import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  TruckIcon, 
  WrenchScrewdriverIcon,
  BellIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import { getRoleText } from '../../utilidades/globalMockDatabase';
import { clsx } from 'clsx';
import { ThemeDropdown } from '../ui/ThemeDropdown';
import NotificationsDropdown from '../cliente/NotificationsDropdown';

interface LayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'mechanic', 'receptionist'] },
  { name: 'Mi Panel', href: '/client-dashboard', icon: HomeIcon, roles: ['client'] },
  { 
    name: 'Gestión', 
    icon: ClipboardDocumentListIcon, 
    roles: ['admin', 'receptionist'], 
    children: [
      { name: 'Citas', href: '/appointments', icon: CalendarDaysIcon, roles: ['admin', 'receptionist', 'mechanic'] },
      { name: 'Cotizaciones', href: '/quotations', icon: DocumentTextIcon, roles: ['admin', 'receptionist'] },
      { name: 'Órdenes de Trabajo', href: '/work-orders', icon: WrenchScrewdriverIcon, roles: ['admin', 'receptionist', 'mechanic'] },
      { name: 'Facturas', href: '/invoices', icon: DocumentTextIcon, roles: ['admin', 'receptionist'] },
      { name: 'Punto de Venta', href: '/pos', icon: CreditCardIcon, roles: ['admin', 'receptionist'] },
    ]
  },
  { 
    name: 'Clientes', 
    icon: UsersIcon, 
    roles: ['admin', 'receptionist'], 
    children: [
      { name: 'Ver y Añadir', href: '/clients', icon: UsersIcon, roles: ['admin', 'receptionist'] },
      { name: 'Perfil de Cliente', href: '/client-profile', icon: ChartBarIcon, roles: ['admin', 'receptionist'] },
    ]
  },
  { name: 'Vehículos', href: '/vehicles', icon: TruckIcon, roles: ['admin', 'receptionist', 'mechanic'] },
  { name: 'Mis Vehículos', href: '/client-vehicles', icon: TruckIcon, roles: ['client'] },
  { name: 'Solicitar Cita', href: '/client-appointments', icon: CalendarDaysIcon, roles: ['client'] },
  { name: 'Mis Cotizaciones', href: '/client-quotations', icon: DocumentTextIcon, roles: ['client'] },
  { name: 'Mis Órdenes de Trabajo', href: '/client-workorders', icon: ClipboardDocumentCheckIcon, roles: ['client'] },
  { name: 'Inventario', href: '/inventory', icon: TruckIcon, roles: ['admin', 'receptionist'] },
  { name: 'Proveedores', href: '/suppliers', icon: UsersIcon, roles: ['admin', 'receptionist'] },
  { name: 'Productos', href: '/products', icon: TruckIcon, roles: ['admin', 'receptionist'] },
  { name: 'Servicios', href: '/services', icon: WrenchScrewdriverIcon, roles: ['admin', 'receptionist', 'mechanic'] },
  { name: 'Bitácora', href: '/logs', icon: BellIcon, roles: ['admin'] },
  { name: 'Recordatorios', href: '/reminders', icon: BellIcon, roles: ['admin', 'receptionist'] },
  { name: 'Mis Recordatorios', href: '/client-reminders', icon: BellIcon, roles: ['client'] },
  { name: 'Historial de Servicios', href: '/client-service-history', icon: DocumentTextIcon, roles: ['client'] },
  { name: 'Historial Global', href: '/admin-historial', icon: DocumentTextIcon, roles: ['admin', 'receptionist'] },
  { name: 'Chat con Taller', href: '/client-chat', icon: BellIcon, roles: ['client'] },
  { name: 'Reportes', href: '/reports', icon: ChartBarIcon, roles: ['admin'] },
  { name: 'Chat con Cliente', href: '/admin-chat', icon: BellIcon, roles: ['admin', 'receptionist', 'mechanic'] },
  { name: 'Administración', href: '/admin', icon: Cog6ToothIcon, roles: ['admin'] },
  { name: 'Ayuda', href: '/help', icon: QuestionMarkCircleIcon, roles: ['admin', 'mechanic', 'receptionist', 'client'] },
];

export function Layout({ children }: LayoutProps) {
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Obtener cliente ID si el usuario es cliente
  const clientId = state.user?.role === 'client' ? state.user.id : null;
  const { unreadCount, refreshCount } = useNotifications(clientId, state.user?.role === 'client');

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleToggleNav = () => {
    dispatch({ type: 'TOGGLE_NAV' });
  };

  const handleToggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const filteredNavigation = navigationItems.filter(item => 
    state.user ? item.roles.includes(state.user.role) : false
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 shadow-lg transition-all duration-300',
        state.isNavCollapsed ? 'w-16' : 'w-64'
      )}
      style={{ backgroundColor: colors.sidebar }}>
        <div className="flex h-16 items-center justify-between border-b px-4" style={{ borderColor: colors.primaryDark }}>
          {!state.isNavCollapsed && (
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-14 w-14" style={{ color: colors.primaryLight }} />
              <span className="ml-2 text-xl font-bold" style={{ color: colors.text.primary }}>TALLER</span>
            </div>
          )}
          <button 
            onClick={handleToggleNav}
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colors.hover }}
          >
            {state.isNavCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" style={{ color: colors.text.secondary }} />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" style={{ color: colors.text.secondary }} />
            )}
          </button>
        </div>
        
        <nav className={clsx(
          'mt-8 overflow-y-auto',
          'max-h-[calc(100vh-166px)]',
          state.isNavCollapsed ? 'px-2' : 'px-4'
        )}>
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              // Si tiene hijos, es un dropdown
              if (item.children) {
                const isExpanded = expandedItems.has(item.name);
                const hasActiveChild = item.children.some(child => location.pathname === child.href);
                
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleToggleExpanded(item.name)}
                      className={clsx(
                        'w-full flex items-center justify-between text-sm font-bold rounded-lg transition-all duration-200',
                        state.isNavCollapsed ? 'justify-center p-2' : 'px-4 py-2',
                        hasActiveChild 
                          ? 'text-white shadow-md'
                          : 'text-opacity-100 hover:bg-opacity-10'
                      )}
                      style={{
                        backgroundColor: hasActiveChild ? colors.primary : 'transparent',
                        color: hasActiveChild ? colors.text.primary : colors.text.primary
                      }}
                      title={state.isNavCollapsed ? item.name : undefined}
                    >
                      <div className="flex items-center">
                        <item.icon 
                          className={clsx(
                            'h-5 w-5',
                            !state.isNavCollapsed && 'mr-3'
                          )}
                          style={{ color: hasActiveChild ? colors.primary : colors.text.primary }}
                          aria-hidden="true" 
                        />
                        {!state.isNavCollapsed && <span>{item.name}</span>}
                      </div>
                      {!state.isNavCollapsed && (
                        <ChevronRightIcon 
                          className={clsx(
                            'h-4 w-4 transition-transform duration-200',
                            isExpanded ? 'rotate-90' : ''
                          )}
                        />
                      )}
                    </button>
                    
                    {/* Submenú */}
                    {isExpanded && !state.isNavCollapsed && (
                      <ul className="mt-2 ml-6 space-y-1">
                        {item.children.filter(child => 
                          state.user ? child.roles.includes(state.user.role) : false
                        ).map((child) => {
                          const isChildActive = location.pathname === child.href;
                          return (
                            <li key={child.name}>
                              <Link
                                to={child.href!}
                                className={clsx(
                                  'flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-l-4',
                                  isChildActive ? 'shadow-md text-white' : ''
                                )}
                                style={{
                                  backgroundColor: isChildActive ? `${colors.primary}60` : 'transparent',
                                  color: isChildActive ? colors.text.primary : colors.text.primary,
                                  borderColor: isChildActive ? colors.primary : 'transparent'
                                }}
                              >
                                <child.icon 
                                  className={clsx(
                                    'h-4 w-4 mr-3',
                                  )}
                                  style={{ color: isChildActive ? colors.primary : colors.text.secondary }}
                                />
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
              
              // Elemento normal sin hijos
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href!}
                    className={clsx(
                      'flex items-center text-sm font-bold rounded-lg transition-all duration-200',
                      state.isNavCollapsed ? 'justify-center p-2' : 'px-4 py-2',
                      isActive ? 'text-white shadow-md' : ''
                    )}
                    style={{
                      backgroundColor: isActive ? `${colors.primary}90` : 'transparent',
                      color: isActive ? colors.text.primary : colors.text.secondary
                    }}
                    title={state.isNavCollapsed ? item.name : undefined}
                  >
                    <item.icon 
                      className={clsx(
                        'h-5 w-5',
                        !state.isNavCollapsed && 'mr-3'
                      )}
                      style={{ color: isActive ? colors.text.primary : colors.text.secondary }}
                      aria-hidden="true" 
                    />
                    {!state.isNavCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        {state.user && (
          <div className="absolute bottom-0 w-full p-4" style={{ borderTop: `1px solid ${colors.primaryDark}` }}>
            <div className={`flex items-center ${state.isNavCollapsed ? 'justify-center' : ''}`}>
              {!state.isNavCollapsed ? (
                <>
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                      <span className="text-sm font-medium text-white">
                        {state.user.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: colors.text.primary }}>
                      {state.user.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: colors.text.secondary }}>
                      {getRoleText(state.user.role)}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-1 hover:opacity-80 transition-opacity"
                    style={{ color: colors.text.secondary }}
                    title="Cerrar Sesión"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <span className="text-sm font-medium text-white">
                      {state.user.name.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${state.isNavCollapsed ? 'pl-16' : 'pl-64'}`}>
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-8" style={{ backgroundColor: colors.header, borderColor: colors.primaryDark }}>
          <div className="flex items-center">
            <h1 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
              {/* Título dinámico basado en la ruta actual */}
              Control de Talleres Mecanicos
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Botón de Tema */}
            <ThemeDropdown />

            {/* Notificaciones (solo para clientes) */}
            {state.user?.role === 'client' && (
              <>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 hover:opacity-80 transition-opacity relative" 
                  style={{ color: colors.text.primary }}
                >
                  <BellIcon className="h-5 w-5" />
                  {/* Indicador de notificaciones */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </span>
                  )}
                </button>
                
                {clientId && (
                  <NotificationsDropdown
                    clientId={clientId}
                    isOpen={notificationsOpen}
                    onClose={() => {
                      setNotificationsOpen(false);
                      refreshCount();
                    }}
                  />
                )}
              </>
            )}
            
            {/* Información del usuario */}
            <div className="text-sm" style={{ color: colors.text.primary }}>
              Bienvenido, <span className="font-medium">{state.user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
