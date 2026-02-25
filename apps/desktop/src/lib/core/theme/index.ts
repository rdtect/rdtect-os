/**
 * Theme System Module
 *
 * Provides a complete theming solution for the desktop environment:
 * - theme: Reactive theme store with Svelte 5 runes
 * - ThemeProvider: Component that applies CSS variables
 * - Theme types and utilities
 */

// Singleton instance
export { theme } from './theme.svelte';
export type { ThemePreference } from './theme.svelte';

// Theme definitions and utilities
export {
  themes,
  darkTheme,
  lightTheme,
  themeToCssVariables,
  type Theme,
  type ThemeId,
  type ThemeColors,
} from './themes';

// Theme provider component
export { default as ThemeProvider } from './ThemeProvider.svelte';
