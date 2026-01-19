/**
 * Persistence Hooks for Svelte 5
 *
 * Provides reactive state that automatically persists to storage.
 */

import { storage, type PersistenceStore } from './storage';

/**
 * Creates a persisted state value that syncs with storage.
 *
 * @example
 * ```svelte
 * <script>
 *   import { usePersisted } from '$lib/core/persistence';
 *
 *   // Creates reactive state that persists to localStorage
 *   const theme = usePersisted('settings.theme', 'dark');
 *
 *   // Use like any other state
 *   function toggleTheme() {
 *     theme.value = theme.value === 'dark' ? 'light' : 'dark';
 *   }
 * </script>
 * ```
 */
export function usePersisted<T>(
  key: string,
  defaultValue: T,
  store: PersistenceStore = storage
): { value: T } {
  // Load initial value from storage
  let value = $state<T>(defaultValue);
  let initialized = false;

  // Initialize from storage
  store.get<T>(key).then((stored) => {
    if (stored !== null) {
      value = stored;
    }
    initialized = true;
  });

  // Create a proxy that persists on write
  return {
    get value() {
      return value;
    },
    set value(newValue: T) {
      value = newValue;
      if (initialized) {
        store.set(key, newValue);
      }
    },
  };
}

/**
 * Creates a factory for persisted state in a specific namespace.
 *
 * @example
 * ```typescript
 * const settingsStore = createPersistedState('settings');
 *
 * // All keys will be prefixed with 'settings.'
 * const theme = settingsStore('theme', 'dark');
 * const fontSize = settingsStore('fontSize', 14);
 * ```
 */
export function createPersistedState(namespace: string, store: PersistenceStore = storage) {
  return function <T>(key: string, defaultValue: T) {
    return usePersisted<T>(`\${namespace}.\${key}`, defaultValue, store);
  };
}

/**
 * Batch persist multiple values at once.
 *
 * @example
 * ```typescript
 * await batchPersist({
 *   'settings.theme': 'dark',
 *   'settings.fontSize': 14,
 *   'window.positions': { ... }
 * });
 * ```
 */
export async function batchPersist(
  data: Record<string, unknown>,
  store: PersistenceStore = storage
): Promise<void> {
  await Promise.all(
    Object.entries(data).map(([key, value]) => store.set(key, value))
  );
}

/**
 * Load multiple persisted values at once.
 *
 * @example
 * ```typescript
 * const values = await batchLoad(['settings.theme', 'settings.fontSize']);
 * // { 'settings.theme': 'dark', 'settings.fontSize': 14 }
 * ```
 */
export async function batchLoad<T extends string>(
  keys: T[],
  store: PersistenceStore = storage
): Promise<Partial<Record<T, unknown>>> {
  const entries = await Promise.all(
    keys.map(async (key) => [key, await store.get(key)] as const)
  );
  return Object.fromEntries(entries.filter(([, v]) => v !== null)) as Partial<Record<T, unknown>>;
}
