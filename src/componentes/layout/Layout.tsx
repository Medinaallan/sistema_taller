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
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/AppContext';
import { getRoleText } from '../../utilidades/mockData';

interface LayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon,
    roles: ['admin', 'mechanic', 'receptionist']
  },
  { 
    name: 'Mi Panel', 
    href: '/client-dashboard', 
    icon: HomeIcon,
    roles: ['client']
  },
  { 
    name: 'Clientes', 
    href: '/clients', 
    icon: UsersIcon,
    roles: ['admin', 'receptionist']
  },
  { 
    name: 'Vehículos', 
    href: '/vehicles', 
    icon: TruckIcon,
    roles: ['admin', 'receptionist', 'mechanic']
  },
  { 
    name: 'Mis Vehículos', 
    href: '/client-vehicles', 
    icon: TruckIcon,
    roles: ['client']
  },
  { 
    name: 'Órdenes de Trabajo', 
    href: '/work-orders', 
    icon: WrenchScrewdriverIcon,
    roles: ['admin', 'receptionist', 'mechanic']
  },
  { 
    name: 'Solicitar Cita', 
    href: '/client-appointments', 
    icon: CalendarDaysIcon,
    roles: ['client']
  },
  { 
    name: 'Recordatorios', 
    href: '/reminders', 
    icon: BellIcon,
    roles: ['admin', 'receptionist']
  },
  { 
    name: 'Mis Recordatorios', 
    href: '/client-reminders', 
    icon: BellIcon,
    roles: ['client']
  },
  { 
    name: 'Reportes', 
    href: '/reports', 
    icon: ChartBarIcon,
    roles: ['admin']
  },
  { 
    name: 'Administración', 
    href: '/admin', 
    icon: Cog6ToothIcon,
    roles: ['admin']
  },
];

export function Layout({ children }: LayoutProps) {
  const { state, dispatch } = useApp();
  const location = useLocation();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const filteredNavigation = navigation.filter(item => 
    state.user ? item.roles.includes(state.user.role) : false
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">TallerPro</span>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        {state.user && (
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {state.user.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {state.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
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
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {/* Título dinámico basado en la ruta actual */}
              Sistema de Gestión de Taller
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <BellIcon className="h-5 w-5" />
              {/* Indicador de notificaciones */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">2</span>
              </span>
            </button>
            
            {/* Información del usuario */}
            <div className="text-sm text-gray-700">
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
