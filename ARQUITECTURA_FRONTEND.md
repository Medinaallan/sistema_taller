# 🏗️ Arquitectura Frontend - Sistema Taller Mecánico

## 📁 Estructura de Carpetas Propuesta

```
src/
├── modules/                    # Módulos por dominio de negocio
│   ├── auth/                  # Autenticación y autorización
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RecoveryForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useRoles.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── usuarios/              # Gestión de usuarios
│   │   ├── components/
│   │   │   ├── UserForm.tsx
│   │   │   ├── UserList.tsx
│   │   │   ├── UserDetail.tsx
│   │   │   └── RoleSelector.tsx
│   │   ├── hooks/
│   │   │   └── useUsers.ts
│   │   ├── services/
│   │   │   └── userService.ts
│   │   └── types/
│   │       └── user.types.ts
│   │
│   ├── vehiculos/             # Gestión de vehículos
│   │   ├── components/
│   │   │   ├── VehicleForm.tsx
│   │   │   ├── VehicleList.tsx
│   │   │   ├── VehicleDetail.tsx
│   │   │   └── VehicleHistory.tsx
│   │   ├── hooks/
│   │   │   └── useVehicles.ts
│   │   ├── services/
│   │   │   └── vehicleService.ts
│   │   └── types/
│   │       └── vehicle.types.ts
│   │
│   ├── citas/                 # Gestión de citas
│   │   ├── components/
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   ├── AppointmentList.tsx
│   │   │   ├── AppointmentDetail.tsx
│   │   │   ├── StatusHistory.tsx
│   │   │   └── AppointmentModal.tsx
│   │   ├── hooks/
│   │   │   ├── useAppointments.ts
│   │   │   └── useAppointmentForm.ts
│   │   ├── services/
│   │   │   └── appointmentService.ts
│   │   └── types/
│   │       └── appointment.types.ts
│   │
│   ├── ordenes/               # Órdenes de trabajo
│   │   ├── components/
│   │   │   ├── WorkOrderForm.tsx
│   │   │   ├── WorkOrderList.tsx
│   │   │   ├── WorkOrderDetail.tsx
│   │   │   ├── TaskManager.tsx
│   │   │   └── ProgressTracker.tsx
│   │   ├── hooks/
│   │   │   └── useWorkOrders.ts
│   │   ├── services/
│   │   │   └── workOrderService.ts
│   │   └── types/
│   │       └── workOrder.types.ts
│   │
│   ├── cotizaciones/          # Gestión de cotizaciones
│   │   ├── components/
│   │   │   ├── QuotationForm.tsx
│   │   │   ├── QuotationList.tsx
│   │   │   ├── QuotationDetail.tsx
│   │   │   ├── ItemManager.tsx
│   │   │   ├── ApprovalModal.tsx
│   │   │   └── QuotationPreview.tsx
│   │   ├── hooks/
│   │   │   └── useQuotations.ts
│   │   ├── services/
│   │   │   └── quotationService.ts
│   │   └── types/
│   │       └── quotation.types.ts
│   │
│   ├── dashboard/             # Dashboard principal
│   │   ├── components/
│   │   │   ├── DashboardHome.tsx
│   │   │   ├── MetricsCards.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── Charts/
│   │   │       ├── AppointmentsChart.tsx
│   │   │       └── RevenueChart.tsx
│   │   ├── hooks/
│   │   │   └── useDashboard.ts
│   │   ├── services/
│   │   │   └── dashboardService.ts
│   │   └── types/
│   │       └── dashboard.types.ts
│   │
│   └── notificaciones/        # Sistema de notificaciones
│       ├── components/
│       │   ├── NotificationCenter.tsx
│       │   ├── NotificationItem.tsx
│       │   └── NotificationBell.tsx
│       ├── hooks/
│       │   └── useNotifications.ts
│       ├── services/
│       │   └── notificationService.ts
│       └── types/
│           └── notification.types.ts
│
├── shared/                    # Componentes y utilidades compartidas
│   ├── components/
│   │   ├── ui/               # Componentes UI básicos
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/           # Componentes de layout
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Breadcrumb.tsx
│   │   └── forms/            # Componentes de formularios
│   │       ├── FormField.tsx
│   │       ├── ValidationMessage.tsx
│   │       └── SearchBox.tsx
│   │
│   ├── hooks/                # Hooks reutilizables
│   │   ├── useApi.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   └── useForm.ts
│   │
│   ├── services/             # Servicios compartidos
│   │   ├── api.ts           # Cliente HTTP base
│   │   ├── storage.ts       # LocalStorage utilities
│   │   └── validation.ts    # Validaciones
│   │
│   ├── utils/                # Utilidades
│   │   ├── formatters.ts    # Formateo de datos
│   │   ├── validators.ts    # Validadores
│   │   ├── constants.ts     # Constantes
│   │   └── helpers.ts       # Funciones helper
│   │
│   └── types/                # Tipos compartidos
│       ├── api.types.ts
│       ├── common.types.ts
│       └── index.ts
│
├── store/                    # Estado global
│   ├── index.ts             # Store principal
│   ├── authSlice.ts         # Estado de autenticación
│   ├── notificationSlice.ts # Estado de notificaciones
│   └── uiSlice.ts           # Estado de UI
│
├── routes/                   # Configuración de rutas
│   ├── AppRoutes.tsx        # Rutas principales
│   ├── ProtectedRoute.tsx   # Rutas protegidas
│   └── routes.config.ts     # Configuración de rutas
│
├── assets/                   # Recursos estáticos
│   ├── images/
│   ├── icons/
│   └── styles/
│       ├── globals.css
│       └── components.css
│
├── App.tsx                   # Componente principal
├── main.tsx                  # Punto de entrada
└── vite-env.d.ts            # Tipos de Vite
```

## 🛣️ Rutas Principales

### Rutas Públicas
- `/login` - Inicio de sesión
- `/recovery` - Recuperación de contraseña

### Rutas Protegidas por Roles

#### Administrador (Acceso total)
- `/dashboard` - Dashboard principal
- `/usuarios` - Gestión de usuarios
- `/usuarios/create` - Crear usuario
- `/usuarios/:id` - Detalle de usuario
- `/reportes` - Reportes del sistema
- `/configuracion` - Configuración del sistema

#### Recepcionista
- `/dashboard` - Dashboard
- `/citas` - Gestión de citas
- `/citas/create` - Nueva cita
- `/citas/:id` - Detalle de cita
- `/vehiculos` - Gestión de vehículos
- `/vehiculos/create` - Registrar vehículo
- `/vehiculos/:id` - Detalle de vehículo
- `/cotizaciones` - Ver cotizaciones
- `/cotizaciones/:id` - Detalle de cotización

#### Mecánico/Asesor
- `/dashboard` - Dashboard
- `/ordenes` - Órdenes de trabajo asignadas
- `/ordenes/:id` - Detalle de orden
- `/cotizaciones/create` - Crear cotización
- `/cotizaciones/:id/edit` - Editar cotización

##  Interfaces TypeScript Principales

### Usuario y Autenticación
```typescript
export interface User {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rolId: string;
  rol: Role;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface Role {
  id: string;
  nombre: string;
  descripcion?: string;
  permisos: Permission[];
}

export interface Permission {
  id: string;
  nombre: string;
  modulo: string;
  accion: 'create' | 'read' | 'update' | 'delete';
}
```

### Vehículos
```typescript
export interface Vehicle {
  id: string;
  usuarioId: string;
  marca: string;
  modelo: string;
  año: number;
  placa: string;
  color: string;
  kilometraje?: number;
  vin?: string;
  numeroMotor?: string;
  activo: boolean;
  fechaRegistro: Date;
  usuario: User;
  citas: Appointment[];
  historialServicios: ServiceHistory[];
}
```

### Citas
```typescript
export interface Appointment {
  id: string;
  usuarioId: string;
  vehiculoId: string;
  tipoServicioId: string;
  fechaCita: Date;
  horaCita: string;
  estadoActual: AppointmentStatus;
  observaciones?: string;
  fechaCreacion: Date;
  usuario: User;
  vehiculo: Vehicle;
  tipoServicio: ServiceType;
  historialEstados: AppointmentStatusHistory[];
  ordenTrabajo?: WorkOrder;
}

export interface AppointmentStatusHistory {
  id: string;
  citaId: string;
  estadoAnterior?: AppointmentStatus;
  estadoNuevo: AppointmentStatus;
  fechaCambio: Date;
  usuarioId: string;
  observaciones?: string;
}

export type AppointmentStatus = 
  | 'programada' 
  | 'confirmada' 
  | 'en_proceso' 
  | 'completada' 
  | 'cancelada' 
  | 'no_asistio';
```

### Órdenes de Trabajo
```typescript
export interface WorkOrder {
  id: string;
  citaId: string;
  asesorId: string;
  numeroOrden: string;
  fechaInicio: Date;
  fechaFinEstimada?: Date;
  fechaFinReal?: Date;
  estado: WorkOrderStatus;
  observaciones?: string;
  cita: Appointment;
  asesor: User;
  cotizaciones: Quotation[];
  tareas: WorkOrderTask[];
}

export interface WorkOrderTask {
  id: string;
  ordenId: string;
  descripcion: string;
  estado: TaskStatus;
  fechaInicio?: Date;
  fechaFin?: Date;
  mecanicoId?: string;
  observaciones?: string;
}

export type WorkOrderStatus = 
  | 'creada' 
  | 'en_progreso' 
  | 'esperando_aprobacion' 
  | 'esperando_repuestos' 
  | 'completada' 
  | 'cancelada';
```

### Cotizaciones
```typescript
export interface Quotation {
  id: string;
  ordenTrabajoId: string;
  numeroCotizacion: string;
  fechaCotizacion: Date;
  validezHasta: Date;
  subtotal: number;
  impuestos: number;
  descuento: number;
  total: number;
  estado: QuotationStatus;
  observaciones?: string;
  ordenTrabajo: WorkOrder;
  items: QuotationItem[];
  aprobacion?: QuotationApproval;
}

export interface QuotationItem {
  id: string;
  cotizacionId: string;
  tipo: 'servicio' | 'repuesto';
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface QuotationApproval {
  id: string;
  cotizacionId: string;
  aprobadaPor: string;
  fechaAprobacion: Date;
  observaciones?: string;
  usuario: User;
}
```

##  Componentes Clave por Módulo

### Módulo Citas
```typescript
// Hook personalizado para formularios de citas
export const useAppointmentForm = (initialData?: Partial<Appointment>) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    usuarioId: '',
    vehiculoId: '',
    tipoServicioId: '',
    fechaCita: '',
    horaCita: '',
    observaciones: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.usuarioId) {
      newErrors.usuarioId = 'Seleccione un cliente';
    }

    if (!formData.vehiculoId) {
      newErrors.vehiculoId = 'Seleccione un vehículo';
    }

    if (!formData.fechaCita) {
      newErrors.fechaCita = 'Seleccione una fecha';
    } else {
      const selectedDate = new Date(formData.fechaCita);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.fechaCita = 'La fecha no puede ser anterior a hoy';
      }
    }

    if (!formData.horaCita) {
      newErrors.horaCita = 'Seleccione una hora';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (onSubmit: (data: AppointmentFormData) => Promise<void>) => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    validate,
    handleSubmit
  };
};
```

### Componente Modal Reutilizable
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## ✅ Validaciones Recomendadas

### Validaciones de Negocio
```typescript
export const validators = {
  // Validación de placa vehicular (formato hondureño)
  placa: (value: string): string | null => {
    const honduranPlateRegex = /^[A-Z]{3}-\d{4}$/;
    if (!honduranPlateRegex.test(value)) {
      return 'Formato de placa inválido (Ej: ABC-1234)';
    }
    return null;
  },

  // Validación de kilometraje
  kilometraje: (value: number): string | null => {
    if (value < 0) return 'El kilometraje no puede ser negativo';
    if (value > 1000000) return 'Kilometraje muy alto';
    return null;
  },

  // Validación de fecha de cita
  fechaCita: (fecha: string, hora: string): string | null => {
    const appointmentDateTime = new Date(`${fecha}T${hora}`);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      return 'La cita debe ser programada para el futuro';
    }
    
    const dayOfWeek = appointmentDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Las citas solo se pueden programar de lunes a viernes';
    }
    
    const hour = appointmentDateTime.getHours();
    if (hour < 8 || hour >= 17) {
      return 'Las citas solo se pueden programar de 8:00 AM a 5:00 PM';
    }
    
    return null;
  },

  // Validación de VIN
  vin: (value: string): string | null => {
    if (value.length !== 17) {
      return 'El VIN debe tener exactamente 17 caracteres';
    }
    if (!/^[A-HJ-NPR-Z0-9]+$/.test(value)) {
      return 'VIN contiene caracteres inválidos';
    }
    return null;
  }
};
```

## 🎨 Optimización UX/UI con Tailwind

### Sistema de Colores Personalizado
```css
/* tailwind.config.js */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      }
    }
  }
}
```

### Componentes UI Consistentes
```typescript
// Componente Button reutilizable
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  onClick,
  disabled,
  loading
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2">Cargando...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
```

## 📊 Dashboard Principal

### Métricas Clave
```typescript
interface DashboardMetrics {
  citasHoy: number;
  citasPendientes: number;
  ordenesEnProceso: number;
  cotizacionesPendientes: number;
  ingresosMes: number;
  clientesNuevos: number;
  vehiculosEnTaller: number;
  eficienciaPromedio: number;
}

// Componente de tarjetas métricas
export const MetricsCards: React.FC<{ metrics: DashboardMetrics }> = ({ metrics }) => {
  const cards = [
    {
      title: 'Citas Hoy',
      value: metrics.citasHoy,
      icon: CalendarIcon,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Órdenes en Proceso',
      value: metrics.ordenesEnProceso,
      icon: WrenchIcon,
      color: 'yellow',
      change: '+5%'
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(metrics.ingresosMes),
      icon: CurrencyDollarIcon,
      color: 'green',
      change: '+18%'
    },
    {
      title: 'Eficiencia Promedio',
      value: `${metrics.eficienciaPromedio}%`,
      icon: ChartBarIcon,
      color: 'purple',
      change: '+3%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <MetricCard key={index} {...card} />
      ))}
    </div>
  );
};
```

## 🔐 Autenticación y Roles

### Sistema de Permisos
```typescript
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (module: string, action: Permission['accion']): boolean => {
    if (!user?.rol?.permisos) return false;
    
    return user.rol.permisos.some(
      permission => permission.modulo === module && permission.accion === action
    );
  };

  const canCreate = (module: string) => hasPermission(module, 'create');
  const canRead = (module: string) => hasPermission(module, 'read');
  const canUpdate = (module: string) => hasPermission(module, 'update');
  const canDelete = (module: string) => hasPermission(module, 'delete');

  return {
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete
  };
};

// Componente para proteger secciones por permisos
export const PermissionGuard: React.FC<{
  module: string;
  action: Permission['accion'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ module, action, children, fallback }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, action)) {
    return fallback || <div>No tienes permisos para ver esta sección</div>;
  }

  return <>{children}</>;
};
```

## 🔔 Sistema de Notificaciones

### Estado Global de Notificaciones
```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface Notification {
  id: string;
  tipo: 'cita_programada' | 'cotizacion_aprobada' | 'orden_completada' | 'recordatorio';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: Date;
  usuarioId: string;
  metadata?: Record<string, any>;
}

// Hook para manejar notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, leida: true }))
    );
  };

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.leida).length,
    markAsRead,
    markAllAsRead
  };
};
```

## 🚀 Manejo de Estado y Datos

### Recomendaciones de Estado
- **Estado Global**: Usuario logueado, permisos, notificaciones, configuración UI
- **Estado Local**: Formularios, filtros de tablas, modals
- **Cache de Datos**: React Query para datos del servidor
- **Persistencia**: LocalStorage para preferencias del usuario

### Hook de API con React Query
```typescript
export const useAppointments = (filters?: AppointmentFilters) => {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentService.getAppointments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear la cita');
    }
  });
};
```

