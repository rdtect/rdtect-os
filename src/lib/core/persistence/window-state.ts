/**
 * Window State Persistence
 *
 * Handles saving and restoring window positions, sizes, and state
 * (minimized/maximized) to localStorage with debouncing and validation.
 */

import type { WindowState } from '$lib/shell/types';
import { getItem, setItem } from './storage';

const WINDOWS_STORAGE_KEY = 'windows';
const DEBOUNCE_DELAY = 300;

/**
 * Persisted window state - subset of WindowState that should be saved
 */
export interface PersistedWindowState {
  id: string;
  appId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  preMaximize?: { x: number; y: number; width: number; height: number };
}

/**
 * Storage format for window states
 */
interface WindowStateStorage {
  version: number;
  timestamp: number;
  windows: PersistedWindowState[];
}

// Debounce timer handle
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Extract persistable properties from a WindowState
 */
function extractPersistableState(window: WindowState): PersistedWindowState {
  return {
    id: window.id,
    appId: window.appId,
    x: window.x,
    y: window.y,
    width: window.width,
    height: window.height,
    isMinimized: window.isMinimized,
    isMaximized: window.isMaximized,
    preMaximize: window.preMaximize,
  };
}

/**
 * Validate a single persisted window state object
 */
function isValidPersistedState(state: unknown): state is PersistedWindowState {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  const s = state as Record<string, unknown>;

  return (
    typeof s.id === 'string' &&
    typeof s.appId === 'string' &&
    typeof s.x === 'number' &&
    typeof s.y === 'number' &&
    typeof s.width === 'number' &&
    typeof s.height === 'number' &&
    typeof s.isMinimized === 'boolean' &&
    typeof s.isMaximized === 'boolean' &&
    (s.preMaximize === undefined || isValidPreMaximize(s.preMaximize))
  );
}

/**
 * Validate preMaximize object
 */
function isValidPreMaximize(obj: unknown): obj is { x: number; y: number; width: number; height: number } {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const o = obj as Record<string, unknown>;

  return (
    typeof o.x === 'number' &&
    typeof o.y === 'number' &&
    typeof o.width === 'number' &&
    typeof o.height === 'number'
  );
}

/**
 * Validate the entire storage object
 */
function isValidStorage(data: unknown): data is WindowStateStorage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as Record<string, unknown>;

  return (
    typeof d.version === 'number' &&
    typeof d.timestamp === 'number' &&
    Array.isArray(d.windows)
  );
}

/**
 * Clamp a window position to be within screen bounds
 */
function clampToScreen(state: PersistedWindowState): PersistedWindowState {
  // Get viewport dimensions (fallback to reasonable defaults for SSR)
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Ensure at least part of the window is visible
  const minVisibleSize = 100;

  // Clamp position to keep window partially visible
  const clampedX = Math.max(
    -state.width + minVisibleSize,
    Math.min(state.x, viewportWidth - minVisibleSize)
  );
  const clampedY = Math.max(
    0, // Don't allow negative Y (behind top of screen)
    Math.min(state.y, viewportHeight - minVisibleSize)
  );

  // Ensure minimum dimensions
  const minWidth = 300;
  const minHeight = 200;
  const clampedWidth = Math.max(minWidth, Math.min(state.width, viewportWidth));
  const clampedHeight = Math.max(minHeight, Math.min(state.height, viewportHeight));

  return {
    ...state,
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  };
}

/**
 * Save window states to localStorage (debounced)
 * @param windows - Array of current window states
 */
export function saveWindowStates(windows: WindowState[]): void {
  // Clear any pending save
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }

  // Debounce the save operation
  saveTimer = setTimeout(() => {
    const persistedStates = windows.map(extractPersistableState);

    const storage: WindowStateStorage = {
      version: 1,
      timestamp: Date.now(),
      windows: persistedStates,
    };

    const success = setItem(WINDOWS_STORAGE_KEY, storage);

    if (!success) {
      console.warn('[WindowState] Failed to save window states');
    }

    saveTimer = null;
  }, DEBOUNCE_DELAY);
}

/**
 * Force an immediate save without debouncing
 * Useful for beforeunload events
 * @param windows - Array of current window states
 */
export function saveWindowStatesImmediate(windows: WindowState[]): void {
  // Clear any pending debounced save
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  const persistedStates = windows.map(extractPersistableState);

  const storage: WindowStateStorage = {
    version: 1,
    timestamp: Date.now(),
    windows: persistedStates,
  };

  setItem(WINDOWS_STORAGE_KEY, storage);
}

/**
 * Load and validate persisted window states from localStorage
 * @returns Array of validated and screen-clamped window states, or null if none found
 */
export function loadWindowStates(): PersistedWindowState[] | null {
  const data = getItem<unknown>(WINDOWS_STORAGE_KEY);

  if (data === null) {
    return null;
  }

  if (!isValidStorage(data)) {
    console.warn('[WindowState] Invalid storage format, ignoring persisted state');
    return null;
  }

  // Filter and validate individual window states
  const validWindows = data.windows
    .filter((w): w is PersistedWindowState => {
      if (!isValidPersistedState(w)) {
        console.warn('[WindowState] Skipping invalid window state:', w);
        return false;
      }
      return true;
    })
    .map(clampToScreen);

  if (validWindows.length === 0) {
    return null;
  }

  return validWindows;
}

/**
 * Get the persisted state for a specific window by ID
 * @param windowId - The window ID to look up
 * @returns The persisted state or null if not found
 */
export function getPersistedWindowState(windowId: string): PersistedWindowState | null {
  const states = loadWindowStates();

  if (states === null) {
    return null;
  }

  const state = states.find(s => s.id === windowId);
  return state ?? null;
}

/**
 * Get persisted states for windows belonging to a specific app
 * @param appId - The app ID to look up
 * @returns Array of persisted states for that app
 */
export function getPersistedWindowsByApp(appId: string): PersistedWindowState[] {
  const states = loadWindowStates();

  if (states === null) {
    return [];
  }

  return states.filter(s => s.appId === appId);
}

/**
 * Clear all persisted window states
 */
export function clearWindowStates(): void {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  setItem(WINDOWS_STORAGE_KEY, {
    version: 1,
    timestamp: Date.now(),
    windows: [],
  });
}

/**
 * Restore windows from persisted state
 *
 * This function returns the persisted window states that can be used
 * by the WindowManager to recreate windows on page reload.
 *
 * @param registeredAppIds - Array of app IDs that are currently registered
 * @returns Array of persisted states for windows whose apps are registered
 */
export function restoreWindows(registeredAppIds: string[]): PersistedWindowState[] {
  const states = loadWindowStates();

  if (states === null) {
    return [];
  }

  // Only restore windows for apps that are currently registered
  const registeredSet = new Set(registeredAppIds);
  const restorableWindows = states.filter(s => registeredSet.has(s.appId));

  if (restorableWindows.length < states.length) {
    const skipped = states.length - restorableWindows.length;
    console.info(`[WindowState] Skipped ${skipped} windows for unregistered apps`);
  }

  return restorableWindows;
}

/**
 * Apply persisted state to a window state object
 *
 * Merges persisted properties onto a WindowState while preserving
 * runtime-only properties like zIndex and isFocused.
 *
 * @param window - The window state to modify
 * @param persisted - The persisted state to apply
 * @returns The modified window state
 */
export function applyPersistedState(
  window: WindowState,
  persisted: PersistedWindowState
): WindowState {
  return {
    ...window,
    x: persisted.x,
    y: persisted.y,
    width: persisted.width,
    height: persisted.height,
    isMinimized: persisted.isMinimized,
    isMaximized: persisted.isMaximized,
    preMaximize: persisted.preMaximize,
  };
}
