/**
 * Widget Registry - Manages desktop widgets for plugins
 *
 * Provides registration, positioning, and persistence for
 * desktop widgets that plugins can provide.
 */
import type { Component } from 'svelte';

const STORAGE_KEY = 'desktop-os:widget-positions';

export interface WidgetConfig {
  width?: number;
  height?: number;
  defaultX?: number;
  defaultY?: number;
}

export interface WidgetInstance {
  id: string;
  pluginId: string;
  component: Component;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  name: string;
  icon: string;
}

interface StoredWidgetState {
  positions: Record<string, { x: number; y: number }>;
  visibility: Record<string, boolean>;
  sizes: Record<string, { width: number; height: number }>;
}

class WidgetRegistry {
  // === STATE (Svelte 5 reactive) ===
  widgets = $state<WidgetInstance[]>([]);
  private idCounter = 0;

  constructor() {
    // Load saved state on initialization (browser only)
    if (typeof window !== 'undefined') {
      this.loadState();
    }
  }

  /**
   * Register a new widget from a plugin
   */
  register(
    pluginId: string,
    component: Component,
    config?: WidgetConfig & { name?: string; icon?: string }
  ): string {
    // Check if widget for this plugin already exists
    const existing = this.widgets.find(w => w.pluginId === pluginId);
    if (existing) {
      return existing.id;
    }

    const id = `widget-${pluginId}-${this.idCounter++}`;
    const savedState = this.getSavedState();

    // Determine position from saved state or defaults
    const savedPosition = savedState.positions[pluginId];
    const position = savedPosition ?? {
      x: config?.defaultX ?? 16,
      y: config?.defaultY ?? 16
    };

    // Determine visibility from saved state (default to FALSE - user must enable widgets)
    const visible = savedState.visibility[pluginId] ?? false;

    // Determine size from saved state or defaults
    const savedSize = savedState.sizes[pluginId];
    const size = savedSize ?? {
      width: config?.width ?? 200,
      height: config?.height ?? 100
    };

    const widget: WidgetInstance = {
      id,
      pluginId,
      component,
      position,
      size,
      visible,
      name: config?.name ?? pluginId,
      icon: config?.icon ?? ''
    };

    this.widgets.push(widget);
    return id;
  }

  /**
   * Unregister a widget
   */
  unregister(widgetId: string): void {
    const idx = this.widgets.findIndex(w => w.id === widgetId);
    if (idx !== -1) {
      this.widgets.splice(idx, 1);
    }
  }

  /**
   * Toggle widget visibility
   */
  toggle(widgetId: string): void {
    const widget = this.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.visible = !widget.visible;
      this.saveState();
    }
  }

  /**
   * Toggle widget visibility by plugin ID
   */
  toggleByPlugin(pluginId: string): void {
    const widget = this.widgets.find(w => w.pluginId === pluginId);
    if (widget) {
      widget.visible = !widget.visible;
      this.saveState();
    }
  }

  /**
   * Show a widget
   */
  show(widgetId: string): void {
    const widget = this.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.visible = true;
      this.saveState();
    }
  }

  /**
   * Hide a widget
   */
  hide(widgetId: string): void {
    const widget = this.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.visible = false;
      this.saveState();
    }
  }

  /**
   * Move a widget to a new position
   */
  move(widgetId: string, x: number, y: number): void {
    const widget = this.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.position = { x, y };
      this.saveState();
    }
  }

  /**
   * Resize a widget
   */
  resize(widgetId: string, width: number, height: number): void {
    const widget = this.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.size = { width, height };
      this.saveState();
    }
  }

  /**
   * Set widget size preset
   */
  setSize(widgetId: string, size: 'small' | 'medium' | 'large'): void {
    const sizes = {
      small: { width: 150, height: 80 },
      medium: { width: 200, height: 120 },
      large: { width: 300, height: 180 }
    };
    const widget = this.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.size = sizes[size];
      this.saveState();
    }
  }

  /**
   * Get a widget by its ID
   */
  get(widgetId: string): WidgetInstance | undefined {
    return this.widgets.find(w => w.id === widgetId);
  }

  /**
   * Get a widget by plugin ID
   */
  getByPlugin(pluginId: string): WidgetInstance | undefined {
    return this.widgets.find(w => w.pluginId === pluginId);
  }

  /**
   * Get all visible widgets
   */
  get visibleWidgets(): WidgetInstance[] {
    return this.widgets.filter(w => w.visible);
  }

  /**
   * Get all available widgets (for menu)
   */
  get availableWidgets(): Array<{ pluginId: string; name: string; icon: string; visible: boolean }> {
    return this.widgets.map(w => ({
      pluginId: w.pluginId,
      name: w.name,
      icon: w.icon,
      visible: w.visible
    }));
  }

  /**
   * Reset all widget positions to defaults
   */
  resetPositions(): void {
    // Clear saved positions
    const savedState = this.getSavedState();
    savedState.positions = {};
    this.saveStateData(savedState);

    // Reset in-memory positions with staggered layout
    this.widgets.forEach((widget, idx) => {
      widget.position = {
        x: 16 + (idx % 3) * 220,
        y: 16 + Math.floor(idx / 3) * 120
      };
    });
  }

  /**
   * Show all widgets
   */
  showAll(): void {
    this.widgets.forEach(w => {
      w.visible = true;
    });
    this.saveState();
  }

  /**
   * Hide all widgets
   */
  hideAll(): void {
    this.widgets.forEach(w => {
      w.visible = false;
    });
    this.saveState();
  }

  // === PERSISTENCE ===

  private getSavedState(): StoredWidgetState {
    if (typeof window === 'undefined') {
      return { positions: {}, visibility: {}, sizes: {} };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { positions: {}, visibility: {}, sizes: {}, ...parsed };
      }
    } catch (e) {
      console.warn('[WidgetRegistry] Failed to load saved state:', e);
    }

    return { positions: {}, visibility: {}, sizes: {} };
  }

  private saveState(): void {
    const state: StoredWidgetState = {
      positions: {},
      visibility: {},
      sizes: {}
    };

    this.widgets.forEach(w => {
      state.positions[w.pluginId] = w.position;
      state.visibility[w.pluginId] = w.visible;
      state.sizes[w.pluginId] = w.size;
    });

    this.saveStateData(state);
  }

  private saveStateData(state: StoredWidgetState): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[WidgetRegistry] Failed to save state:', e);
    }
  }

  private loadState(): void {
    // State is loaded lazily when widgets are registered
    // This method exists for future initialization needs
  }
}

// Singleton export
export const widgetRegistry = new WidgetRegistry();
