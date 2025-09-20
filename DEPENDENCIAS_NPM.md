# Dependencias NPM - Sistema Taller Web por amedina

Este documento lista todas las dependencias de npm instaladas en el proyecto Sistema Taller.

## Frontend (React + TypeScript + Vite)

### Dependencias de Producción

| Paquete | Versión | Descripción |

| `@heroicons/react` | ^2.1.1 | Iconos de Heroicons para React |
| `@tanstack/react-table` | ^8.21.3 | Biblioteca para crear tablas potentes en React |
| `@types/file-saver` | ^2.0.7 | Tipos de TypeScript para file-saver |
| `chart.js` | ^4.5.0 | Biblioteca para crear gráficos y visualizaciones |
| `clsx` | ^2.1.0 | Utilidad para construir strings de clases CSS condicionales |
| `date-fns` | ^3.3.1 | Biblioteca moderna para manipulación de fechas en JavaScript |
| `file-saver` | ^2.0.5 | Solución para guardar archivos en el lado del cliente |
| `lucide-react` | ^0.331.0 | Iconos de Lucide como componentes React |
| `multer` | ^2.0.2 | Middleware de Node.js para manejo de formularios multipart/form-data |
| `react` | ^18.2.0 | Biblioteca JavaScript para construir interfaces de usuario |
| `react-chartjs-2` | ^5.3.0 | Wrapper de React para Chart.js |
| `react-dom` | ^18.2.0 | Punto de entrada específico de DOM para React |
| `react-router-dom` | ^6.22.1 | Enrutamiento declarativo para React |
| `socket.io` | ^4.8.1 | Motor de WebSockets en tiempo real |
| `socket.io-client` | ^4.8.1 | Cliente de Socket.IO para el navegador |
| `xlsx` | ^0.18.5 | Analizador y escritor de hojas de cálculo |

### Dependencias de Desarrollo

| Paquete | Versión | Descripción |

| `@tailwindcss/forms` | ^0.5.7 | Plugin de Tailwind CSS para estilos de formularios |
| `@types/react` | ^18.2.55 | Tipos de TypeScript para React |
| `@types/react-dom` | ^18.2.19 | Tipos de TypeScript para React DOM |
| `@types/xlsx` | ^0.0.35 | Tipos de TypeScript para xlsx |
| `@typescript-eslint/eslint-plugin` | ^7.0.1 | Plugin de ESLint con reglas de TypeScript |
| `@typescript-eslint/parser` | ^7.0.1 | Parser de ESLint para TypeScript |
| `@vitejs/plugin-react` | ^4.2.1 | Plugin oficial de React para Vite |
| `autoprefixer` | ^10.4.17 | Plugin de PostCSS para agregar prefijos de navegador |
| `eslint` | ^8.56.0 | Herramienta de análisis de código para identificar patrones problemáticos |
| `eslint-plugin-react-hooks` | ^4.6.0 | Reglas de ESLint para React Hooks |
| `eslint-plugin-react-refresh` | ^0.4.5 | Plugin de ESLint para React Refresh |
| `postcss` | ^8.4.35 | Herramienta para transformar CSS con plugins de JavaScript |
| `tailwindcss` | ^3.4.1 | Framework CSS utility-first |
| `typescript` | ^5.3.3 | Lenguaje que añade tipado estático a JavaScript |
| `vite` | ^5.1.3 | Herramienta de construcción frontend rápida |

---

## Backend (Node.js + Express + SQL Server)

### Dependencias de Producción

| Paquete | Versión | Descripción |
| `bcrypt` | ^5.1.1 | Biblioteca para hash de contraseñas (cuando se conecte a SQL DB)
| `cors` | ^2.8.5 | Middleware para habilitar CORS|
| `csv-parser` | ^3.2.0 | Parser de streaming para archivos CSV |
| `csv-writer` | ^1.6.0 | Módulo para escribir datos en formato CSV |
| `dotenv` | ^16.3.1 | Carga variables de entorno desde archivo .env |
| `express` | ^4.18.2 | Framework web rápido y minimalista para Node.js |
| `express-rate-limit` | ^6.10.0 | Middleware básico de rate-limiting para Express |
| `fs-extra` | ^11.3.1 | Métodos adicionales para el módulo fs nativo |
| `helmet` | ^7.0.0 | Ayuda a asegurar aplicaciones Express estableciendo headers HTTP |
| `mssql` | ^10.0.1 | Cliente de Microsoft SQL Server para Node.js (CUANDO SE TENGA QUE UTILIZAR)
| `multer` | ^2.0.2 | Middleware para manejo de formularios multipart/form-data |
| `node-fetch` | ^3.3.2 | Implementación de window.fetch para Node.js |
| `uuid` | ^13.0.0 | Generador de identificadores únicos universales |
| `xlsx` | ^0.18.5 | Analizador y escritor de hojas de cálculo |

### Dependencias de Desarrollo

| Paquete | Versión | Descripción |

| `@types/multer` | ^2.0.0 | Tipos de TypeScript para multer |
| `@types/uuid` | ^10.0.0 | Tipos de TypeScript para uuid |
| `nodemon` | ^3.0.1 | Utilidad que reinicia automáticamente la aplicación Node.js |

---

## Resumen de Tecnologías

### Frontend
- **Framework UI**: React 18.2.0
- **Lenguaje**: TypeScript 5.3.3
- **Build Tool**: Vite 5.1.3
- **Styling**: Tailwind CSS 3.4.1
- **Gráficos**: Chart.js 4.5.0
- **Enrutamiento**: React Router DOM 6.22.1
- **Comunicación en tiempo real**: Socket.IO 4.8.1

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4.18.2
- **Procesamiento de archivos**: xlsx 0.18.5, multer 2.0.2

---
