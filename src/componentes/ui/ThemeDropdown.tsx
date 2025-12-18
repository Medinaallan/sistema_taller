import React, { useContext } from 'react';
import { ThemeContext } from '../../contexto/themeContext';
import type { ThemeType } from '../../contexto/themeContext';
import { themes } from '../../contexto/themeContext';
import { PaintBrushIcon } from '@heroicons/react/24/outline';

const themeOptions: { value: ThemeType; label: string; color: string }[] = [
  { value: 'gray', label: 'Gris', color: '#4b5563' },
  { value: 'dark-blue', label: 'Azul Oscuro', color: '#0f172a' },
  { value: 'green', label: 'Verde', color: '#1b4332' },
  { value: 'orange', label: 'Naranja', color: '#7c2d12' },
  { value: 'red', label: 'Rojo', color: '#7f1d1d' }
];

export function ThemeDropdown() {
  const context = useContext(ThemeContext);
  const [isOpen, setIsOpen] = React.useState(false);

  if (!context) {
    return null;
  }

  const { theme, setTheme } = context;

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-2 border"
        style={{ 
          backgroundColor: themes[theme].primary,
          color: themes[theme].text.primary,
          borderColor: themes[theme].primaryLight
        }}
        title="Cambiar tema de colores"
      >
        <PaintBrushIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown Menu */}
          <div
            className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-xl z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-800 mb-2">Tema de Colores</p>
              <div className="space-y-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      theme === option.value
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2"
                      style={{ 
                        backgroundColor: option.color,
                        borderColor: option.color
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    {theme === option.value && (
                      <span className="ml-auto text-blue-600 font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
