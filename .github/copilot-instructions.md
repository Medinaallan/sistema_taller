<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TallerPro - Sistema de Gestión para Talleres Mecánicos

Este es un proyecto de frontend desarrollado con React + TypeScript + Vite para la gestión integral de talleres mecánicos.

## Arquitectura del Proyecto

- **Frontend Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **State Management**: Context API + useReducer
- **Routing**: React Router v6

## Estructura de Módulos

1. **Gestión de Clientes y Vehículos**: Registro y administración de clientes y sus vehículos
2. **Servicios y Mantenimiento**: Creación de órdenes de trabajo, historial de servicios
3. **Recordatorios**: Sistema de recordatorios preventivos por kilometraje o fecha
4. **Administración del Taller**: Gestión de usuarios, órdenes y facturación
5. **Interfaz Responsive**: Diseño adaptativo para web y móvil

## Convenciones de Código

- Usar TypeScript strict mode
- Componentes funcionales con hooks
- Props interfaces claramente definidas
- Nombres de componentes en PascalCase
- Nombres de archivos en camelCase para utils, PascalCase para componentes
- Usar el patrón de custom hooks para lógica reutilizable
- Manejar estados con Context API para datos globales
- Implementar loading states y error handling

## Estructura de Archivos

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas/vistas principales
├── context/       # Contextos de React
├── types/         # Definiciones de TypeScript
├── utils/         # Funciones auxiliares y datos mock
└── styles/        # Archivos de estilo adicionales
```

## Estilo y UI

- Usar Tailwind CSS para estilos
- Seguir el sistema de diseño definido en index.css
- Usar componentes de UI reutilizables del archivo UI.tsx
- Implementar diseño responsive mobile-first
- Usar colores del tema definido (primary, secondary, success, warning, danger)

## Datos Mock

El proyecto incluye datos mock completos para desarrollo y demostración:
- Usuarios con diferentes roles (admin, mechanic, receptionist)
- Clientes con vehículos asociados
- Órdenes de trabajo con diferentes estados
- Tipos de servicios predefinidos
- Recordatorios de mantenimiento

## Funcionalidades Principales

- Sistema de autenticación por roles
- Dashboard con estadísticas y resúmenes
- Gestión completa de clientes y vehículos
- Seguimiento de órdenes de trabajo
- Sistema de recordatorios automáticos
- Interfaz responsive para dispositivos móviles
