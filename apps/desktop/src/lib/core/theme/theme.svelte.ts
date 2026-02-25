/**
 * Theme Store - Svelte 5 Runes-based Theme Management
 *
 * Provides reactive theme state management with:
 * - System preference detection (prefers-color-scheme)
 * - localStorage persistence
 * - Custom theme support
 */

import { themes, themeToCssVariables, type Theme, type ThemeId } from './themes';
import { eventBus } from '../event-bus';

const STORAGE_KEY = 'rdtect-os:theme';

export type ThemePreference = ThemeId | 'system';

class ThemeStore {
  // === STATE ===
  private _preference = $state<ThemePreference>('system');
  private _systemTheme = $state<'dark' | 'light'>('dark');
  private _customThemes = $state<Record<string, Theme>>({});

  // === DERIVED ===
  /**
   * The active theme ID (resolved from preference)
   */
  activeThemeId = $derived<ThemeId>(
    this._preference === 'system' ? this._systemTheme : this._preference
  );

  /**
   * The currently active theme object
   */
  activeTheme = $derived<Theme>(
    this.getAllThemes()[this.activeThemeId] ?? themes.dark
  );

  /**
   * CSS variables for the active theme
   */
  cssVariables = $derived<Record<string, string>>(
    themeToCssVariables(this.activeTheme)
  );

  /**
   * Current theme preference ('system', 'dark', 'light', or custom theme id)
   */
  get preference(): ThemePreference {
    return this._preference;
  }

  /**
   * Detected system theme preference
   */
  get systemTheme(): 'dark' | 'light' {
    return this._systemTheme;
  }

  /**
   * Whether currently using system preference
   */
  isSystemPreference = $derived(this._preference === 'system');

  /**
   * All available themes (built-in + custom)
   */
  getAllThemes(): Record<string, Theme> {
    return { ...themes, ...this._customThemes };
  }

  /**
   * List of all available theme IDs
   */
  availableThemes = $derived<string[]>(
    Object.keys(this.getAllThemes())
  );

  // === INITIALIZATION ===
  /**
   * Initialize the theme store (call once on app startup, client-side only)
   */
  initialize(): void {
    if (typeof window === 'undefined') return;

    // Detect system preference
    this._detectSystemTheme();
    this._watchSystemTheme();

    // Load saved preference
    this._loadPreference();
  }

  private _detectSystemTheme(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._systemTheme = mediaQuery.matches ? 'dark' : 'light';
  }

  private _watchSystemTheme(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      this._systemTheme = e.matches ? 'dark' : 'light';
    });
  }

  private _loadPreference(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const preference = stored as ThemePreference;
        // Validate the stored preference
        if (preference === 'system' || this.getAllThemes()[preference]) {
          this._preference = preference;
        }
      }
    } catch (e) {
      // localStorage may be unavailable
      console.warn('Failed to load theme preference:', e);
    }
  }

  private _savePreference(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, this._preference);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  }

  // === ACTIONS ===
  /**
   * Set the theme preference
   * @param themeId - 'system', 'dark', 'light', or a custom theme ID
   */
  setTheme(themeId: ThemePreference): void {
    if (themeId === 'system' || this.getAllThemes()[themeId]) {
      const previousThemeId = this.activeThemeId;
      this._preference = themeId;
      this._savePreference();

      // Emit theme changed event
      eventBus.emit('theme:changed', {
        themeId: this.activeThemeId,
        previousThemeId,
      });
    } else {
      console.warn(`Theme "${themeId}" not found`);
    }
  }

  /**
   * Toggle between dark and light themes
   * If using system preference, switches to the opposite of current system theme
   */
  toggle(): void {
    const current = this.activeThemeId;
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  /**
   * Reset to system preference
   */
  useSystemPreference(): void {
    this.setTheme('system');
  }

  // === CUSTOM THEMES ===
  /**
   * Register a custom theme
   */
  registerTheme(theme: Theme): void {
    if (themes[theme.id]) {
      console.warn(`Cannot override built-in theme "${theme.id}"`);
      return;
    }
    this._customThemes[theme.id] = theme;
  }

  /**
   * Remove a custom theme
   */
  unregisterTheme(themeId: string): void {
    if (themes[themeId]) {
      console.warn(`Cannot remove built-in theme "${themeId}"`);
      return;
    }
    delete this._customThemes[themeId];

    // If the removed theme was active, fall back to system
    if (this._preference === themeId) {
      this.setTheme('system');
    }
  }

  /**
   * Check if a theme exists
   */
  hasTheme(themeId: string): boolean {
    return !!this.getAllThemes()[themeId];
  }
}

// Singleton export
export const theme = new ThemeStore();
