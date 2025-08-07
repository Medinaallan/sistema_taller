# 🎨 TallerPro - Especificaciones de Design System para Figma

## 🎯 **INFORMACIÓN CRÍTICA**

**Aplicación:** Sistema completo corriendo en http://localhost:5180/
**Estado:** Sin datos de ejemplo - Sistema limpio para captura de pantallas
**Proyecto compilado:** Disponible en carpeta `dist/` para export HTML/CSS

---

## 🎨 **PALETA DE COLORES EXACTA**

### **Colores Primarios (Azul):**
```
Blue 50:  #eff6ff
Blue 100: #dbeafe
Blue 200: #bfdbfe
Blue 300: #93c5fd
Blue 400: #60a5fa
Blue 500: #3b82f6  ← Color principal
Blue 600: #2563eb  ← Botones primarios
Blue 700: #1d4ed8
Blue 800: #1e40af
Blue 900: #1e3a8a
```

### **Colores de Estado:**
```
Success (Verde):
- Green 500: #10b981
- Green 600: #059669
- Green 700: #047857

Warning (Amarillo):
- Yellow 500: #f59e0b
- Yellow 600: #d97706
- Yellow 700: #b45309

Danger (Rojo):
- Red 500: #ef4444
- Red 600: #dc2626
- Red 700: #b91c1c
```

### **Colores Neutros:**
```
Gray 50:  #f9fafb  ← Background principal
Gray 100: #f3f4f6
Gray 200: #e5e7eb  ← Bordes
Gray 300: #d1d5db
Gray 400: #9ca3af
Gray 500: #6b7280
Gray 600: #4b5563
Gray 700: #374151  ← Texto secundario
Gray 800: #1f2937
Gray 900: #111827  ← Texto principal
```

---

## 📝 **TIPOGRAFÍA**

### **Fuente Principal:**
- **Family:** Inter (Google Fonts)
- **Weights:** 400, 500, 600, 700, 800, 900
- **URL:** `https://fonts.google.com/specimen/Inter`

### **Jerarquía de Tamaños:**
```
Text xs:   12px / 16px  (line-height)
Text sm:   14px / 20px
Text base: 16px / 24px  ← Base
Text lg:   18px / 28px
Text xl:   20px / 28px
Text 2xl:  24px / 32px
Text 3xl:  30px / 36px  ← Títulos principales
```

---

## 🧩 **COMPONENTES PRINCIPALES**

### **Botones:**
```css
Primary Button:
- Background: #2563eb (Blue 600)
- Hover: #1d4ed8 (Blue 700)
- Padding: 12px 24px
- Border radius: 8px
- Font weight: 500
- Focus ring: 2px #3b82f6

Secondary Button:
- Background: #f3f4f6 (Gray 100)
- Text: #374151 (Gray 700)
- Hover: #e5e7eb (Gray 200)

Success Button:
- Background: #059669 (Green 600)
- Hover: #047857 (Green 700)
```

### **Cards:**
```css
Card:
- Background: #ffffff
- Border: 1px solid #e5e7eb
- Border radius: 8px
- Padding: 24px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
```

### **Input Fields:**
```css
Input:
- Border: 1px solid #d1d5db
- Border radius: 8px
- Padding: 8px 12px
- Focus border: #2563eb
- Focus ring: 2px #3b82f6 (20% opacity)
```

---

## 📱 **BREAKPOINTS Y ESPACIADO**

### **Responsive Breakpoints:**
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### **Sistema de Espaciado (8px base):**
```
Space 1:  4px
Space 2:  8px
Space 3:  12px
Space 4:  16px
Space 6:  24px
Space 8:  32px
Space 12: 48px
Space 16: 64px
Space 20: 80px
Space 24: 96px
```

---

## 🖼️ **CAPTURAS DE PANTALLA NECESARIAS**

### **1. Autenticación:**
- Login inicial (configuración admin)
- Login normal
- Estados de error

### **2. Dashboard Administrador:**
- Vista principal con estadísticas
- Navigation sidebar
- Estados vacíos (sin datos)

### **3. Gestión de Clientes:**
- Lista de clientes (vacía)
- Formulario nuevo cliente
- Vista detalle cliente

### **4. Gestión de Vehículos:**
- Lista de vehículos
- Formulario nuevo vehículo
- Vista detalle vehículo

### **5. Órdenes de Trabajo:**
- Lista de órdenes
- Formulario nueva orden
- Vista detalle orden
- Estados diferentes

### **6. Sistema de Recordatorios:**
- Lista de recordatorios
- Crear recordatorio
- Notificaciones

### **7. Panel Cliente:**
- Dashboard cliente
- Mis vehículos
- Mis citas/órdenes

---

## 🎯 **INSTRUCCIONES PARA FIGMA**

### **Paso 1: Setup inicial**
1. Ve a http://localhost:5180/
2. Registra un usuario admin desde cero
3. Navega por todos los módulos
4. Toma screenshots en resoluciones: 375px (móvil) y 1440px (desktop)

### **Paso 2: Crear Design System**
1. Importa colores exactos de esta guía
2. Configura tipografía Inter
3. Crea componentes base (botones, inputs, cards)
4. Define espaciado 8px grid

### **Paso 3: Recrear interfaces**
1. Usa screenshots como referencia
2. Recrea con componentes del design system
3. Crea variants para estados (hover, active, disabled)
4. Implementa Auto Layout para responsive

### **Paso 4: Prototipo**
1. Conecta pantallas con flujos de usuario
2. Define interacciones y transiciones
3. Crea overlay para modales y dropdowns

---

## 🔧 **ALTERNATIVA: EXPORT HTML/CSS**

### **Archivos disponibles en /dist:**
- `index.html` - Estructura completa
- `assets/index-Be2V2wUy.css` - CSS compilado con Tailwind
- `assets/index-C5IivCiw.js` - JavaScript compilado

### **Para usar con plugins de Figma:**
1. **html.to.design plugin**
2. **CSS to Figma plugin**  
3. **Figma to HTML plugin** (proceso inverso)

---

## 📋 **CHECKLIST DE COMPONENTES**

### **✅ Básicos:**
- [ ] Buttons (Primary, Secondary, Success, Warning, Danger)
- [ ] Input Fields (Text, Email, Password, Number, Tel)
- [ ] Cards con diferentes contenidos
- [ ] Navigation (Sidebar, Breadcrumbs)
- [ ] Tables con datos
- [ ] Forms con validation

### **✅ Avanzados:**
- [ ] Modals y overlays
- [ ] Dropdowns y selects
- [ ] Date pickers
- [ ] File uploads
- [ ] Progress indicators
- [ ] Toast notifications
- [ ] Empty states
- [ ] Loading states

---

## 💡 **TIPS IMPORTANTES**

1. **🎯 Usa los colores exactos** - No improvises
2. **📱 Mobile First** - Diseña primero móvil
3. **🔄 Auto Layout** - Para componentes flexibles
4. **📊 Estados vacíos** - Muy importante para primera impresión
5. **🌙 Considera dark mode** - Para futuras versiones
6. **♿ Accesibilidad** - Contraste, focus states
7. **📏 Consistencia** - Espaciado y medidas exactas

---

**🚀 ¡El sistema está corriendo en localhost:5180 listo para capturar!**
