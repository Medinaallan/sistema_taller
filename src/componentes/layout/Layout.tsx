import React from 'react';
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
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';
import { getRoleText } from '../../utilidades/globalMockDatabase';
import { clsx } from 'clsx';

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
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

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
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 bg-gray-600 shadow-lg transition-all duration-300',
        state.isNavCollapsed ? 'w-16' : 'w-64'
      )}>
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {!state.isNavCollapsed && (
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-14 w-14 text-blue-300" />
              <span className="ml-2 text-xl font-bold text-white">AutoFlow</span>
            </div>
          )}
          <button 
            onClick={handleToggleNav}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {state.isNavCollapsed ? (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
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
                        'w-full flex items-center justify-between text-sm font-medium rounded-lg transition-colors duration-200',
                        state.isNavCollapsed ? 'justify-center p-2' : 'px-4 py-2',
                        hasActiveChild 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-white hover:bg-gray-100 hover:text-blue-600'
                      )}
                      title={state.isNavCollapsed ? item.name : undefined}
                    >
                      <div className="flex items-center">
                        <item.icon 
                          className={clsx(
                            'h-5 w-5',
                            hasActiveChild ? 'text-blue-600' : '',
                            !state.isNavCollapsed && 'mr-3'
                          )} 
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
                                  'flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200',
                                  isChildActive 
                                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
                                    : 'text-white hover:bg-gray-50 hover:text-blue-600'
                                )}
                              >
                                <child.icon 
                                  className={clsx(
                                    'h-4 w-4 mr-3',
                                    isChildActive ? 'text-blue-600' : 'text-gray-400'
                                  )} 
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
                      'flex items-center text-sm font-medium rounded-lg transition-colors duration-200',
                      state.isNavCollapsed ? 'justify-center p-2' : 'px-4 py-2',
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-white hover:bg-gray-100 hover:text-blue-600'
                    )}
                    title={state.isNavCollapsed ? item.name : undefined}
                  >
                    <item.icon 
                      className={clsx(
                        'h-5 w-5',
                        isActive ? 'text-blue-600' : '',
                        !state.isNavCollapsed && 'mr-3'
                      )} 
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
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
            <div className={`flex items-center ${state.isNavCollapsed ? 'justify-center' : ''}`}>
              {!state.isNavCollapsed ? (
                <>
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-black">
                        {state.user.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {state.user.name}
                    </p>
                    <p className="text-xs text-white truncate">
                      {getRoleText(state.user.role)}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    title="Cerrar Sesión"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
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
        <header className="h-16 bg-gray-600 border-b border-gray-300 flex items-center justify-between px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-white">
              {/* Título dinámico basado en la ruta actual */}
              Control de Talleres Mecanicos
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <button className="p-2 text-white hover:text-white relative">
              <BellIcon className="h-5 w-5" />
              {/* Indicador de notificaciones */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">2</span>
              </span>
            </button>
            
            {/* Información del usuario */}
            <div className="text-sm text-white">
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
