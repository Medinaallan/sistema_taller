import React from 'react';

export type ThemeType = 'gray' | 'dark-blue' | 'green' | 'orange' | 'red';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  sidebar: string;
  header: string;
  text: {
    primary: string;
    secondary: string;
    hover: string;
  };
  hover: string;
  accent: string;
}

export const themes: Record<ThemeType, ThemeColors> = {
  gray: {
    primary: '#60a5fa',
    primaryLight: '#bfdbfe',
    primaryDark: '#2563eb',
    sidebar: '#556575',
    header: '#556575',
    text: {
      primary: '#ffffff',
      secondary: '#e5e7eb',
      hover: '#f3f4f6'
    },
    hover: '#9ca3af',
    accent: '#06b6d4'
  },
  'dark-blue': {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#1e40af',
    sidebar: '#1e3a8a',
    header: '#1e3a8a',
    text: {
      primary: '#ffffff',
      secondary: '#e0e7ff',
      hover: '#c7d2fe'
    },
    hover: '#312e81',
    accent: '#0ea5e9'
  },
  green: {
    primary: '#22c55e',
    primaryLight: '#86efac',
    primaryDark: '#16a34a',
    sidebar: '#15803d',
    header: '#15803d',
    text: {
      primary: '#ffffff',
      secondary: '#dcfce7',
      hover: '#bbf7d0'
    },
    hover: '#166534',
    accent: '#10b981'
  },
  orange: {
    primary: '#f97316',
    primaryLight: '#fed7aa',
    primaryDark: '#ea580c',
    sidebar: '#92400e',
    header: '#92400e',
    text: {
      primary: '#ffffff',
      secondary: '#ffedd5',
      hover: '#fed7aa'
    },
    hover: '#b45309',
    accent: '#fb923c'
  },
  red: {
    primary: '#ef4444',
    primaryLight: '#fca5a5',
    primaryDark: '#dc2626',
    sidebar: '#991b1b',
    header: '#991b1b',
    text: {
      primary: '#ffffff',
      secondary: '#fee2e2',
      hover: '#fecaca'
    },
    hover: '#b91c1c',
    accent: '#f87171'
  }
};

export interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
}

export const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);
