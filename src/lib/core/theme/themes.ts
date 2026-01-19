/**
 * Theme Definitions
 *
 * Defines the structure and default themes for the desktop environment.
 * Themes use CSS custom properties for easy customization.
 */

export type ThemeId = 'dark' | 'light' | string;

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgSurface: string;
  bgSurfaceHover: string;
  bgSurfaceActive: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  borderFocus: string;

  // Accent colors
  accent: string;
  accentHover: string;
  accentActive: string;
  accentMuted: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Shadow definitions (as CSS box-shadow values)
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  colors: ThemeColors;
}

/**
 * Dark theme - the default theme matching the current desktop colors
 */
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    // Background colors
    bgPrimary: '#0f172a',      // slate-900
    bgSecondary: '#1e293b',    // slate-800
    bgSurface: '#1e293b',      // slate-800
    bgSurfaceHover: '#334155', // slate-700
    bgSurfaceActive: '#475569', // slate-600

    // Text colors
    textPrimary: '#f8fafc',    // slate-50
    textSecondary: '#e2e8f0',  // slate-200
    textMuted: '#94a3b8',      // slate-400
    textInverse: '#0f172a',    // slate-900

    // Border colors
    borderPrimary: '#334155',  // slate-700
    borderSecondary: '#475569', // slate-600
    borderFocus: '#6366f1',    // indigo-500

    // Accent colors
    accent: '#6366f1',         // indigo-500
    accentHover: '#818cf8',    // indigo-400
    accentActive: '#4f46e5',   // indigo-600
    accentMuted: '#4338ca',    // indigo-700

    // Semantic colors
    success: '#22c55e',        // green-500
    warning: '#f59e0b',        // amber-500
    error: '#ef4444',          // red-500
    info: '#3b82f6',           // blue-500

    // Shadows (dark theme uses lighter shadows with low opacity)
    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Light theme
 */
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    // Background colors
    bgPrimary: '#f8fafc',      // slate-50
    bgSecondary: '#f1f5f9',    // slate-100
    bgSurface: '#ffffff',      // white
    bgSurfaceHover: '#f1f5f9', // slate-100
    bgSurfaceActive: '#e2e8f0', // slate-200

    // Text colors
    textPrimary: '#0f172a',    // slate-900
    textSecondary: '#334155',  // slate-700
    textMuted: '#64748b',      // slate-500
    textInverse: '#f8fafc',    // slate-50

    // Border colors
    borderPrimary: '#e2e8f0',  // slate-200
    borderSecondary: '#cbd5e1', // slate-300
    borderFocus: '#6366f1',    // indigo-500

    // Accent colors
    accent: '#6366f1',         // indigo-500
    accentHover: '#4f46e5',    // indigo-600
    accentActive: '#4338ca',   // indigo-700
    accentMuted: '#a5b4fc',    // indigo-300

    // Semantic colors
    success: '#16a34a',        // green-600
    warning: '#d97706',        // amber-600
    error: '#dc2626',          // red-600
    info: '#2563eb',           // blue-600

    // Shadows (light theme uses darker shadows)
    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * All built-in themes
 */
export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};

/**
 * Convert a Theme to CSS custom property format
 */
export function themeToCssVariables(theme: Theme): Record<string, string> {
  const { colors } = theme;
  return {
    '--theme-bg-primary': colors.bgPrimary,
    '--theme-bg-secondary': colors.bgSecondary,
    '--theme-bg-surface': colors.bgSurface,
    '--theme-bg-surface-hover': colors.bgSurfaceHover,
    '--theme-bg-surface-active': colors.bgSurfaceActive,

    '--theme-text-primary': colors.textPrimary,
    '--theme-text-secondary': colors.textSecondary,
    '--theme-text-muted': colors.textMuted,
    '--theme-text-inverse': colors.textInverse,

    '--theme-border-primary': colors.borderPrimary,
    '--theme-border-secondary': colors.borderSecondary,
    '--theme-border-focus': colors.borderFocus,

    '--theme-accent': colors.accent,
    '--theme-accent-hover': colors.accentHover,
    '--theme-accent-active': colors.accentActive,
    '--theme-accent-muted': colors.accentMuted,

    '--theme-success': colors.success,
    '--theme-warning': colors.warning,
    '--theme-error': colors.error,
    '--theme-info': colors.info,

    '--theme-shadow-sm': colors.shadowSm,
    '--theme-shadow-md': colors.shadowMd,
    '--theme-shadow-lg': colors.shadowLg,
    '--theme-shadow-xl': colors.shadowXl,
  };
}
