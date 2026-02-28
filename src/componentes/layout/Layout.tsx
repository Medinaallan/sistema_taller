import React, { useState, useEffect } from 'react';
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
  ChevronUpIcon,
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
import companyConfigService from '../../servicios/companyConfigService';

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
  // Productos dropdown with nested children: Ver listado, Stock -> Inventario, Proveedores -> Proveedores
  {
    name: 'Productos',
    icon: TruckIcon,
    roles: ['admin', 'receptionist'],
    children: [
      { name: 'Ver listado', href: '/products', icon: TruckIcon, roles: ['admin', 'receptionist'] },
      { name: 'Stock', href: '/inventory', icon: ClipboardDocumentListIcon, roles: ['admin', 'receptionist'] },
      { name: 'Proveedores', href: '/suppliers', icon: UsersIcon, roles: ['admin', 'receptionist'] }
    ]
  },
  { name: 'Servicios', href: '/services', icon: WrenchScrewdriverIcon, roles: ['admin', 'receptionist', 'mechanic'] },
  { name: 'Bitácora', href: '/logs', icon: BellIcon, roles: ['admin'] },
  { name: 'Recordatorios', href: '/reminders', icon: BellIcon, roles: ['admin', 'receptionist', 'mechanic'] },
  { name: 'Mis Recordatorios', href: '/client-reminders', icon: BellIcon, roles: ['client'] },
  { name: 'Historial de Servicios', href: '/client-service-history', icon: DocumentTextIcon, roles: ['client'] },
  { name: 'Historial Global', href: '/admin-historial', icon: DocumentTextIcon, roles: ['admin', 'receptionist'] },
  { name: 'Chat con Taller', href: '/client-chat', icon: BellIcon, roles: ['client'] },
  { 
    name: 'Reportes', 
    icon: ChartBarIcon, 
    roles: ['admin'],
    children: [
      { name: 'Resumen', href: '/reports', icon: ChartBarIcon, roles: ['admin'] },
      { name: 'Arqueos', href: '/reports/arqueos', icon: ChartBarIcon, roles: ['admin'] }
    ]
  },
  { name: 'Chat con Cliente', href: '/admin-chat', icon: BellIcon, roles: ['admin', 'receptionist', 'mechanic'] },
  { name: 'Configuración', href: '/admin', icon: Cog6ToothIcon, roles: ['admin'] },
  { name: 'Ayuda', href: '/help', icon: QuestionMarkCircleIcon, roles: ['admin', 'mechanic', 'receptionist', 'client'] },
];

export function Layout({ children }: LayoutProps) {
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  
  // Obtener cliente ID si el usuario es cliente
  const clientId = state.user?.role === 'client' ? state.user.id : null;
  const { unreadCount, refreshCount } = useNotifications(clientId, state.user?.role === 'client');

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Formatear fecha y hora según el formato solicitado: dd/mm(letras)/yy - hh:mm:ss AM/PM
  const formatDateTime = (date: Date) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Si es 0, mostrar 12
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${day}/${month}/${year} - ${hoursStr}:${minutes}:${seconds} ${ampm}`;
  };

  // Dividir fecha y hora para mostrar la hora en una segunda línea en móviles
  const formattedDateTime = formatDateTime(currentDateTime);
  const [dateOnly, timeOnly] = formattedDateTime.includes(' - ') ? formattedDateTime.split(' - ') : [formattedDateTime, ''];

  // Cargar logo de la empresa
  useEffect(() => {
    const loadCompanyLogo = async () => {
      try {
        const companyInfo = companyConfigService.getCompanyInfo();
        if (!companyInfo) {
          await companyConfigService.fetchCompanyInfo();
          const updatedInfo = companyConfigService.getCompanyInfo();
          if (updatedInfo?.logoUrl) {
            setCompanyLogo(updatedInfo.logoUrl);
          }
        } else if (companyInfo.logoUrl) {
          setCompanyLogo(companyInfo.logoUrl);
        }
      } catch (error) {
        console.error('Error cargando logo:', error);
      }
    };
    
    loadCompanyLogo();
  }, []);

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

  const filteredNavigation = navigationItems.filter(item => {
    if (!state.user) return false;
    if (item.roles.includes(state.user.role)) return true;
    if (item.children) {
      return item.children.some(child => child.roles.includes(state.user.role));
    }
    return false;
  });

  // Ajuste de padding responsive para evitar desbordes en móvil
  // When collapsed we remove left padding on mobile; on desktop (lg+) we keep
  // padding that matches the sidebar width: collapsed -> 16, expanded -> 64.
  const mainPadding = state.isNavCollapsed ? 'pl-0 lg:pl-16' : 'pl-0 lg:pl-64';

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#f9fafb' }}>
      {/* Sidebar (desktop) */}
      <div className={clsx(
        'hidden lg:flex fixed inset-y-0 left-0 z-50 shadow-lg transition-all duration-300 overflow-hidden flex-col overflow-x-hidden',
        // On desktop we show a narrow collapsed sidebar (icons) or expanded one
        state.isNavCollapsed ? 'w-16' : 'w-64'
      )}
      style={{ backgroundColor: colors.sidebar }}>
        <div className="flex h-16 items-center justify-between border-b px-4" style={{ borderColor: colors.primaryDark }}>
          {!state.isNavCollapsed && (
            <div className="flex items-center">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Logo de la empresa" 
                  className="h-12 w-auto object-contain"
                  style={{
                    filter: 'brightness(0) invert(1)',
                    opacity: 0.95
                  }}
                  onError={(e) => {
                    // Si falla la carga, mostrar el icono por defecto
                    e.currentTarget.style.display = 'none';
                    const icon = e.currentTarget.nextElementSibling;
                    if (icon) (icon as HTMLElement).style.display = 'block';
                  }}
                />
              ) : (
                <WrenchScrewdriverIcon className="h-14 w-14" style={{ color: colors.primaryLight }} />
              )}
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
          'mt-8 overflow-y-auto w-full overflow-x-hidden',
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
                          const childKey = `${item.name}__${child.name}`;
                          const isChildExpanded = expandedItems.has(childKey);
                          const hasGrandChildren = !!child.children && child.children.length > 0;

                          // Determine active state: either child href matches or any grandchild href matches
                          const isChildActive = location.pathname === child.href || (
                            child.children ? child.children.some(g => location.pathname === g.href) : false
                          );

                          return (
                            <li key={child.name}>
                              {hasGrandChildren ? (
                                <>
                                  <button
                                    onClick={() => handleToggleExpanded(childKey)}
                                    className={clsx(
                                      'w-full flex items-center justify-between text-sm font-semibold rounded-lg transition-all duration-200 px-3 py-2',
                                      isChildActive ? 'text-white shadow-md' : ''
                                    )}
                                    style={{
                                      backgroundColor: isChildActive ? `${colors.primary}60` : 'transparent',
                                      color: isChildActive ? colors.text.primary : colors.text.primary,
                                      borderColor: isChildActive ? colors.primary : 'transparent'
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <child.icon className="h-4 w-4 mr-3" style={{ color: isChildActive ? colors.primary : colors.text.secondary }} />
                                      <span className="font-semibold">{child.name}</span>
                                    </div>
                                    <ChevronRightIcon className={clsx('h-4 w-4 transition-transform duration-200', isChildExpanded ? 'rotate-90' : '')} />
                                  </button>

                                  {isChildExpanded && (
                                    <ul className="mt-2 ml-4 space-y-1">
                                      {child.children!.filter(g => state.user ? g.roles.includes(state.user.role) : false).map((g) => {
                                        const isGrandActive = location.pathname === g.href;
                                        return (
                                          <li key={g.name}>
                                            <Link
                                              to={g.href!}
                                              className={clsx(
                                                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border-l-4',
                                                isGrandActive ? 'shadow-md text-white' : ''
                                              )}
                                              style={{
                                                backgroundColor: isGrandActive ? `${colors.primary}60` : 'transparent',
                                                color: isGrandActive ? colors.text.primary : colors.text.primary,
                                                borderColor: isGrandActive ? colors.primary : 'transparent'
                                              }}
                                            >
                                              <g.icon className="h-4 w-4 mr-3" style={{ color: isGrandActive ? colors.primary : colors.text.secondary }} />
                                              {g.name}
                                            </Link>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </>
                              ) : (
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
                                  <child.icon className="h-4 w-4 mr-3" style={{ color: isChildActive ? colors.primary : colors.text.secondary }} />
                                  {child.name}
                                </Link>
                              )}
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
                      'w-full flex items-center text-sm font-bold rounded-lg transition-all duration-200',
                      state.isNavCollapsed ? 'justify-center p-2' : 'px-4 py-2 text-left',
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

      {/* (removed fixed floating toggle) */}

      {/* Main content */}
      <div className={`transition-all duration-300 ${mainPadding} w-full`}>
        {/* Header */}
        <header className="h-14 sm:h-16 border-b flex items-center justify-between px-4 sm:px-8" style={{ backgroundColor: colors.header, borderColor: colors.primaryDark }}>
          <div className="flex items-center">
            {/* Mobile menu button: stays inside header on small screens */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex items-center px-3 py-1.5 mr-3 rounded-md"
              style={{ backgroundColor: colors.primary }}
              aria-label="Open navigation"
            >
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>MENU</span>
            </button>

            <h1 className="hidden sm:block text-xl font-semibold" style={{ color: colors.text.primary }}>
              {/* Título dinámico basado en la ruta actual (oculto en móviles) */}
              Control de Talleres Mecanicos
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-6 min-w-0">
            {/* Reloj en tiempo real */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: '#ffffff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex flex-col sm:flex-row sm:items-center text-sm sm:text-md font-medium sm:font-semibold tracking-wide min-w-0" 
                   style={{ 
                     color: colors.text.primary,
                     fontFamily: "'Inter', 'Segoe UI', sans-serif",
                     letterSpacing: '0.4px'
                   }}>
                <span className="truncate">{dateOnly}</span>
                <span className="text-sm text-opacity-90 truncate">{timeOnly}</span>
              </div>
            </div>

            {/* Botón de Tema */}
            <div className="transform scale-90 sm:scale-100">
              <ThemeDropdown />
            </div>

            {/* Notificaciones (solo para clientes) */}
            {state.user?.role === 'client' && (
              <>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-3 sm:p-2 hover:opacity-80 transition-opacity relative rounded-md" 
                  style={{ color: colors.text.primary }}
                >
                  <BellIcon className="h-6 w-6 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-4 sm:w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs sm:text-xs text-white font-medium">{unreadCount > 9 ? '9+' : unreadCount}</span>
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

            {/* Mobile overlay sidebar (hidden on lg+) */}
            {mobileOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                <div className="relative w-64 shadow-xl" style={{ backgroundColor: colors.sidebar }}>
                  <div className="flex h-16 items-center justify-between border-b px-4" style={{ borderColor: colors.primaryDark }}>
                    <div className="flex items-center">
                      {companyLogo ? (
                        <img src={companyLogo} alt="Logo de la empresa" className="h-12 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }} />
                      ) : (
                        <WrenchScrewdriverIcon className="h-14 w-14" style={{ color: colors.text.primary }} />
                      )}
                    </div>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: colors.hover }}
                    >
                      <ChevronLeftIcon className="h-5 w-5" style={{ color: colors.text.primary }} />
                    </button>
                  </div>

                  <nav className={clsx('mt-8 overflow-y-auto max-h-[calc(100vh-166px)] px-4')}>
                    <ul className="space-y-2">
                      {filteredNavigation.map((item) => (
                        <li key={item.name}>
                          <Link to={item.href || '#'} className="flex items-center px-4 py-2 text-sm font-bold rounded-lg" onClick={() => setMobileOpen(false)} style={{ color: colors.text.primary }}>
                            <item.icon className="h-5 w-5 mr-3" style={{ color: colors.text.primary }} />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </div>
            )}
            
            {/* Información del usuario */}
            <div className="hidden sm:block text-sm" style={{ color: colors.text.primary }}>
              Bienvenido, <span className="font-medium">{state.user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">
          {children}
        </main>
        {/* Scroll to top floating button */}
        {showTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-4 z-50 p-3 rounded-full shadow-lg flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            aria-label="Scroll to top"
          >
            <ChevronUpIcon className="h-5 w-5" style={{ color: colors.text.primary }} />
          </button>
        )}
      </div>
    </div>
  );
}

// Track scroll to show/hide the floating button
// (kept outside component to avoid lint warnings about hooks — we'll attach inside via effect)
