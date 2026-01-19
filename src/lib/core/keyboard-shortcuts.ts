/**
 * Global Keyboard Shortcuts System
 *
 * Provides a centralized registry for keyboard shortcuts across the desktop OS.
 * Supports modifier keys (Ctrl, Alt, Shift, Meta/Super) and handles conflicts.
 */

export interface Shortcut {
  /** The key code or key name (e.g., 'Tab', 'F4', 'KeyD', 'ArrowLeft') */
  key: string;
  /** Ctrl/Command key modifier */
  ctrl?: boolean;
  /** Alt/Option key modifier */
  alt?: boolean;
  /** Shift key modifier */
  shift?: boolean;
  /** Meta/Super/Windows key modifier */
  meta?: boolean;
  /** Action to execute when shortcut is triggered */
  action: () => void;
  /** Human-readable description of what the shortcut does */
  description: string;
  /** Optional: Category for grouping in help menus */
  category?: string;
  /** Optional: Whether the shortcut should work when inputs are focused */
  allowInInput?: boolean;
}

export interface ShortcutModifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/**
 * Generates a unique key for a shortcut based on key and modifiers
 */
function getShortcutKey(key: string, modifiers: ShortcutModifiers = {}): string {
  const parts: string[] = [];
  if (modifiers.ctrl) parts.push('ctrl');
  if (modifiers.alt) parts.push('alt');
  if (modifiers.shift) parts.push('shift');
  if (modifiers.meta) parts.push('meta');
  parts.push(key.toLowerCase());
  return parts.join('+');
}

/**
 * Checks if an event matches a shortcut's key combination
 */
function eventMatchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const keyMatches =
    event.key.toLowerCase() === shortcut.key.toLowerCase() ||
    event.code.toLowerCase() === shortcut.key.toLowerCase();

  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
  const altMatches = !!shortcut.alt === event.altKey;
  const shiftMatches = !!shortcut.shift === event.shiftKey;
  const metaMatches = !!shortcut.meta === event.metaKey;

  return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
}

/**
 * Checks if the current focus is on an input element
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return false;
}

class KeyboardShortcuts {
  private shortcuts: Map<string, Shortcut> = new Map();
  private enabled: boolean = true;
  private boundHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    // Auto-initialize when instantiated
    this.init();
  }

  /**
   * Initialize the keyboard shortcuts system by attaching global listeners
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Remove any existing handler
    if (this.boundHandler) {
      window.removeEventListener('keydown', this.boundHandler);
    }

    this.boundHandler = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.boundHandler, { capture: true });
  }

  /**
   * Cleanup the keyboard shortcuts system
   */
  destroy(): void {
    if (this.boundHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundHandler, { capture: true });
      this.boundHandler = null;
    }
    this.shortcuts.clear();
  }

  /**
   * Enable or disable all keyboard shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Register a keyboard shortcut
   * @returns A cleanup function to unregister the shortcut
   */
  register(shortcut: Shortcut): () => void {
    const key = getShortcutKey(shortcut.key, {
      ctrl: shortcut.ctrl,
      alt: shortcut.alt,
      shift: shortcut.shift,
      meta: shortcut.meta,
    });

    this.shortcuts.set(key, shortcut);

    // Return cleanup function
    return () => this.unregister(shortcut.key, {
      ctrl: shortcut.ctrl,
      alt: shortcut.alt,
      shift: shortcut.shift,
      meta: shortcut.meta,
    });
  }

  /**
   * Register multiple shortcuts at once
   * @returns A cleanup function to unregister all shortcuts
   */
  registerMany(shortcuts: Shortcut[]): () => void {
    const cleanups = shortcuts.map((s) => this.register(s));
    return () => cleanups.forEach((cleanup) => cleanup());
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string, modifiers?: ShortcutModifiers): void {
    const shortcutKey = getShortcutKey(key, modifiers);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Get all registered shortcuts
   */
  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts grouped by category
   */
  getByCategory(): Map<string, Shortcut[]> {
    const categories = new Map<string, Shortcut[]>();

    for (const shortcut of this.shortcuts.values()) {
      const category = shortcut.category || 'General';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(shortcut);
    }

    return categories;
  }

  /**
   * Format a shortcut for display (e.g., "Alt + Tab")
   */
  formatShortcut(shortcut: Shortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('Super');

    // Format the key nicely
    let keyDisplay = shortcut.key;
    if (keyDisplay.startsWith('Key')) {
      keyDisplay = keyDisplay.slice(3);
    } else if (keyDisplay.startsWith('Arrow')) {
      keyDisplay = keyDisplay.slice(5);
    } else if (keyDisplay === 'Escape') {
      keyDisplay = 'Esc';
    }

    parts.push(keyDisplay.charAt(0).toUpperCase() + keyDisplay.slice(1).toLowerCase());

    return parts.join(' + ');
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    // Find matching shortcut
    for (const shortcut of this.shortcuts.values()) {
      if (eventMatchesShortcut(event, shortcut)) {
        // Skip if input is focused and shortcut doesn't allow it
        if (isInputFocused() && !shortcut.allowInInput) {
          continue;
        }

        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }
}

// Singleton instance
export const keyboardShortcuts = new KeyboardShortcuts();

// Export class for testing/extending
export { KeyboardShortcuts };
