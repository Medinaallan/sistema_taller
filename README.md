# Sistema de Gestión para Talleres Mecánicos

## 📋 Resumen Ejecutivo

Sistema web moderno para la administración integral de talleres mecánicos, desarrollado con tecnologías de vanguardia. Proporciona una solución completa para la gestión de clientes, vehículos, servicios y recordatorios de mantenimiento.

### 🎯 Características Principales

- **Dashboard Administrativo**: Panel de control con métricas en tiempo real
- **Gestión de Clientes**: CRUD completo con historial detallado
- **Administración de Vehículos**: Control de flotas con servicios asociados
- **Portal del Cliente**: Acceso self-service para consultas
- **Sistema de Recordatorios**: Notificaciones automáticas de mantenimiento
- **Diseño Responsive**: Optimizado para desktop, tablet y móvil

### 👥 Roles de Usuario

1. **Administrador del Taller**
   - Acceso completo al sistema
   - Gestión de clientes y vehículos
   - Supervisión de órdenes de trabajo
   - Reportes y estadísticas

2. **Cliente**
   - Portal personalizado
   - Consulta de vehículos propios
   - Historial de servicios
   - Agendamiento de citas

## 🏗️ Arquitectura Técnica

### Frontend
- **React 18** con TypeScript
- **Vite** como build tool
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Heroicons** para iconografía

### Estructura del Proyecto
```
src/
├── componentes/
│   ├── layout/          # Layout principal y navegación
│   └── comunes/         # Componentes UI reutilizables
├── paginas/
│   ├── administracion/  # Páginas del admin
│   ├── cliente/         # Portal del cliente
│   └── autenticacion/   # Login y auth
├── contexto/            # Estado global (Context API)
├── tipos/               # Definiciones TypeScript
├── utilidades/          # Datos mock y helpers
└── estilos/             # Estilos globales
```

## 🚀 Guía de Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Git

### Pasos de Instalación
```bash
# 1. Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd webapp_taller

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev

# 4. Abrir en el navegador
http://localhost:5179
```

### Usuarios de Prueba
```
Administrador:
- Usuario: admin@taller.com
- Contraseña: admin123

Cliente:
- Usuario: juan.perez@email.com
- Contraseña: cliente123
```

## 💻 Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilación para producción
npm run preview      # Preview de la build
npm run lint         # Análisis de código (ESLint)
```

## � Funcionalidades por Módulo

### 1. Dashboard Administrativo
- Métricas de rendimiento del taller
- Órdenes de trabajo activas
- Ingresos y estadísticas
- Alertas y recordatorios pendientes

### 2. Gestión de Clientes
- Registro completo de clientes
- Historial de servicios
- Información de contacto
- Vehículos asociados

### 3. Administración de Vehículos
- Base de datos de vehículos
- Historial de mantenimientos
- Estados de servicio
- Programación de citas

### 4. Portal del Cliente
- Dashboard personalizado
- Consulta de vehículos propios
- Historial de servicios
- Estado de trabajos actuales

### 5. Sistema de Recordatorios
- Recordatorios automáticos
- Notificaciones por email
- Programación de mantenimientos
- Alertas preventivas

## 🔧 Requisitos para Backend

### API Endpoints Necesarios
```
Authentication:
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh

Clients:
GET    /api/clients
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id

Vehicles:
GET    /api/vehicles
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id

Work Orders:
GET    /api/work-orders
POST   /api/work-orders
PUT    /api/work-orders/:id

Reminders:
GET    /api/reminders
POST   /api/reminders
PUT    /api/reminders/:id
```

### Modelos de Datos
Ver archivo `src/tipos/index.ts` para definiciones completas de TypeScript que deben replicarse en el backend.

## 🌐 Despliegue

### Variables de Entorno
```env
VITE_API_URL=https://api.taller.com
VITE_APP_VERSION=1.0.0
```

### Compilación para Producción
```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## 🧪 Testing

```bash
npm run test        # Ejecutar tests unitarios
npm run test:e2e    # Tests end-to-end
npm run coverage    # Reporte de cobertura
```

## 📈 Roadmap

### Versión 1.1 (Próxima)
- [ ] Integración con API real
- [ ] Sistema de notificaciones push
- [ ] Reportes avanzados
- [ ] Multi-idioma

### Versión 1.2
- [ ] App móvil nativa
- [ ] Integración con calendarios
- [ ] Facturación automática
- [ ] Analytics avanzados

## 👨‍💻 Equipo de Desarrollo

- **Frontend**: Sistema desarrollado con React + TypeScript
- **Backend**: Pendiente integración con API REST
- **DevOps**: Configuración con Vite y herramientas modernas

## � Soporte

Para soporte técnico o consultas:
- Email: soporte@taller.com
- Documentación: `/docs`
- Issues: GitHub Issues

---

**Desarrollado con ❤️ para talleres mecánicos modernos**
