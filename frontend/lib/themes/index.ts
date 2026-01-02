import type { Theme } from '@/types/presentation';

export interface ThemeConfig {
  id: Theme;
  name: string;
  description: string;
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    titleSize: number; // in pixels
    bodySize: number; // in pixels
    titleWeight: number; // 400, 500, 600, 700, 800
    bodyWeight: number;
  };
  spacing: {
    padding: string;
    gap: string;
  };
}

export const themes: Record<Theme, ThemeConfig> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean black and white aesthetic',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      accent: '#ffffff',
      border: '#1a1a1a',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      titleSize: 48,
      bodySize: 20,
      titleWeight: 600,
      bodyWeight: 400,
    },
    spacing: {
      padding: '12',
      gap: '8',
    },
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional blue and white',
    colors: {
      background: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#666666',
      accent: '#0066cc',
      border: '#e5e5e5',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      titleSize: 48,
      bodySize: 18,
      titleWeight: 700,
      bodyWeight: 400,
    },
    spacing: {
      padding: '12',
      gap: '6',
    },
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'High contrast with vibrant accents',
    colors: {
      background: '#000000',
      text: '#ffffff',
      textSecondary: '#cccccc',
      accent: '#ff3366',
      border: '#333333',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      titleSize: 56,
      bodySize: 20,
      titleWeight: 800,
      bodyWeight: 500,
    },
    spacing: {
      padding: '16',
      gap: '10',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Gradient backgrounds with contemporary style',
    colors: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#ffffff',
      textSecondary: '#e0e0e0',
      accent: '#ffd700',
      border: 'rgba(255, 255, 255, 0.2)',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      titleSize: 48,
      bodySize: 18,
      titleWeight: 700,
      bodyWeight: 400,
    },
    spacing: {
      padding: '12',
      gap: '8',
    },
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional serif with cream background',
    colors: {
      background: '#f5f5dc',
      text: '#2c2c2c',
      textSecondary: '#5a5a5a',
      accent: '#8b4513',
      border: '#d4c5a0',
    },
    typography: {
      fontFamily: 'Georgia, serif',
      titleSize: 48,
      bodySize: 18,
      titleWeight: 700,
      bodyWeight: 400,
    },
    spacing: {
      padding: '12',
      gap: '6',
    },
  },
};

export function getTheme(themeName: Theme): ThemeConfig {
  return themes[themeName] || themes.minimal;
}

export function getThemeStyles(theme: ThemeConfig) {
  return {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  };
}
