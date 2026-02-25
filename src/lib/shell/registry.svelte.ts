/**
 * Window Manager - Registry & State Controller
 *
 * CONTRACT: AppDefinition (what plugins look like)
 * HANDSHAKE: registerApp() (how plugins join)
 * RUN: openWindow() (how host uses plugins)
 *
 * Supports all 5 plugin types via LoadedPlugin abstraction.
 */
import type { AppDefinition, SnapZone } from './types';
import { Window, detectSnapZone, getSnapZoneBounds } from './window.svelte';
import { eventBus } from '$lib/core/event-bus';
import { mobile } from '$lib/core/mobile.svelte';

// Re-export for convenience
export { detectSnapZone, getSnapZoneBounds };

class WindowManager {
  // === STATE (Svelte 5 reactive) ===
  apps = $state<AppDefinition[]>([]);
  windows = $state<Window[]>([]);
  private nextZIndex = $state(100);
  private idCounter = 0;

  // Snap preview state
  snapPreview = $state<{
    zone: SnapZone;
    bounds: { x: number; y: number; width: number; height: number } | null;
  }>({
    zone: null,
    bounds: null
  });

  // === DERIVED ===
  visibleWindows = $derived(
    this.windows
      .filter(w => !w.isMinimized)
      .sort((a, b) => a.zIndex - b.zIndex)
  );

  // === HANDSHAKE: Register app (plugin joins) ===
  registerApp(app: AppDefinition): void {
    if (!this.apps.find(a => a.id === app.id)) {
      // Set defaults for min dimensions
      const appWithDefaults: AppDefinition = {
        ...app,
        minWidth: app.minWidth ?? 300,
        minHeight: app.minHeight ?? 200,
        resizable: app.resizable ?? true,
      };
      this.apps.push(appWithDefaults);
    }
  }

  unregisterApp(appId: string): void {
    const idx = this.apps.findIndex(a => a.id === appId);
    if (idx !== -1) {
      this.apps.splice(idx, 1);

      // Close all windows for this app
      const windowsToClose = this.windows.filter(w => w.appId === appId);
      windowsToClose.forEach(w => this.closeWindow(w.id));
    }
  }

  getApp(appId: string): AppDefinition | undefined {
    return this.apps.find(a => a.id === appId);
  }

  // === RUN: Open window (host uses plugin) ===
  openWindow(appId: string): string | null {
    const app = this.apps.find(a => a.id === appId);
    if (!app) return null;

    // SINGLETON: If app is singleton and already open, just focus it
    if (app.singleton) {
      const existing = this.windows.find(w => w.appId === appId);
      if (existing) {
        existing.focus();
        this.bringToFront(existing);
        return existing.id;
      }
    }

    const id = `${appId}-${Date.now()}-${this.idCounter++}`;
    const offset = (this.windows.length % 8) * 30;

    // On mobile, windows open fullscreen
    const isMobileView = mobile.isMobile;

    // Create new Window instance
    const win = new Window({
      id,
      appId,
      title: app.title,
      x: isMobileView ? 0 : 80 + offset,
      y: isMobileView ? 0 : 60 + offset,
      width: isMobileView ? mobile.viewportWidth : (app.defaultWidth ?? 800),
      height: isMobileView ? mobile.viewportHeight : (app.defaultHeight ?? 600),
      minWidth: app.minWidth ?? 300,
      minHeight: app.minHeight ?? 200,
      zIndex: this.nextZIndex++,
      isMinimized: false,
      isMaximized: isMobileView,
      isFocused: true,
      isResizing: false,
      isRinging: false,
    });

    // Unfocus others
    this.windows.forEach(w => w.blur());

    // Add to state
    this.windows.push(win);

    // Call lifecycle hook if present
    if (app.onInit) {
      Promise.resolve(app.onInit()).catch(console.error);
    }

    // Emit window and app events
    eventBus.emit('window:opened', { windowId: id, appId, title: app.title });
    eventBus.emit('app:launched', { appId, title: app.title });

    return id;
  }

  closeWindow(windowId: string): void {
    const idx = this.windows.findIndex(w => w.id === windowId);
    if (idx !== -1) {
      const win = this.windows[idx];
      const app = this.getApp(win.appId);

      // Call lifecycle hook if present
      if (app?.onDestroy) {
        Promise.resolve(app.onDestroy()).catch(console.error);
      }

      // Emit events before removing
      eventBus.emit('window:closed', { windowId, appId: win.appId, title: win.title });
      eventBus.emit('app:closed', { appId: win.appId, title: win.title });

      this.windows.splice(idx, 1);
    }
  }

  focusWindow(windowId: string): void {
    const win = this.windows.find(w => w.id === windowId);
    if (!win) return;

    this.windows.forEach(w => w.blur());
    win.focus();
    this.bringToFront(win);

    // Emit focus event
    eventBus.emit('window:focused', { windowId, appId: win.appId, title: win.title });
  }

  private bringToFront(win: Window) {
    win.setZIndex(this.nextZIndex++);
  }

  // Delegate methods to Window instance
  minimizeWindow(windowId: string): void {
    const win = this.windows.find(w => w.id === windowId);
    if (win) {
      win.minimize();
      eventBus.emit('window:minimized', { windowId, appId: win.appId, title: win.title });
    }
  }

  maximizeWindow(windowId: string): void {
    const win = this.windows.find(w => w.id === windowId);
    if (win) {
      win.maximize();
      eventBus.emit('window:maximized', { windowId, appId: win.appId, title: win.title });
    }
  }

  moveWindow(windowId: string, x: number, y: number): void {
    const win = this.windows.find(w => w.id === windowId);
    win?.move(x, y);
  }

  resizeWindow(windowId: string, width: number, height: number): void {
    const win = this.windows.find(w => w.id === windowId);
    win?.resize(width, height);
  }

  setResizing(windowId: string, isResizing: boolean): void {
    const win = this.windows.find(w => w.id === windowId);
    if (win) {
      win.isResizing = isResizing;
    }
  }

  // === SNAPPING METHODS ===

  /**
   * Show snap preview at a specific zone
   */
  showSnapPreview(zone: SnapZone): void {
    if (zone) {
      this.snapPreview = {
        zone,
        bounds: getSnapZoneBounds(zone)
      };
    } else {
      this.hideSnapPreview();
    }
  }

  /**
   * Hide the snap preview
   */
  hideSnapPreview(): void {
    this.snapPreview = { zone: null, bounds: null };
  }

  /**
   * Snap window to a specific zone
   */
  snapWindow(windowId: string, zone: SnapZone): void {
    const win = this.windows.find(w => w.id === windowId);
    if (!win) return;

    win.snap(zone);
    this.hideSnapPreview();

    if (zone) {
      eventBus.emit('window:snapped', { windowId, appId: win.appId, zone });
    }
  }

  /**
   * Unsnap window and restore to previous size
   */
  unsnapWindow(windowId: string): void {
    const win = this.windows.find(w => w.id === windowId);
    if (!win) return;

    win.unsnap();
    eventBus.emit('window:unsnapped', { windowId, appId: win.appId });
  }

  /**
   * Snap window to left half of screen
   */
  snapLeft(windowId: string): void {
    this.snapWindow(windowId, 'left');
  }

  /**
   * Snap window to right half of screen
   */
  snapRight(windowId: string): void {
    this.snapWindow(windowId, 'right');
  }

  /**
   * Get the currently focused window
   */
  getFocusedWindow(): Window | undefined {
    return this.windows.find(w => w.isFocused);
  }

  /**
   * Get all windows sorted by z-index (for Alt+Tab ordering)
   */
  getWindowsByZIndex(): Window[] {
    return [...this.windows].sort((a, b) => b.zIndex - a.zIndex);
  }

  /**
   * Minimize all windows (show desktop)
   */
  minimizeAll(): void {
    this.windows.forEach(w => w.minimize());
  }

  /**
   * Restore all minimized windows
   */
  restoreAll(): void {
    this.windows.forEach(w => {
      if (w.isMinimized) {
        w.isMinimized = false;
      }
    });
  }

  /**
   * Toggle show desktop (minimize all / restore all)
   */
  private allMinimizedBeforeShowDesktop: boolean = false;

  toggleShowDesktop(): void {
    const allMinimized = this.windows.every(w => w.isMinimized);

    if (allMinimized) {
      // All are minimized, restore them
      this.restoreAll();
    } else {
      // Some are visible, minimize all
      this.allMinimizedBeforeShowDesktop = this.windows.every(w => w.isMinimized);
      this.minimizeAll();
    }
  }
}

// Singleton export
export const wm = new WindowManager();

