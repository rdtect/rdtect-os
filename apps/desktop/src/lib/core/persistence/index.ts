/**
 * Persistence Module
 *
 * Provides storage abstraction with multiple backends:
 * - storage: Default persistence store (localStorage-backed)
 * - createLargeStorage: For large data (IndexedDB-backed)
 * - usePersisted: Svelte 5 hook for persisted reactive state
 * - Legacy helpers: getItem, setItem, removeItem, clearAll
 */

// Types
export type {
  StorageAdapter,
  Collection,
  PersistenceStore,
} from './storage';

// Singleton instance and factories
export {
  storage,
  createStorage,
  createLargeStorage,
  LocalStorageAdapter,
  IndexedDBAdapter,
  // Legacy helpers for backwards compatibility
  getItem,
  setItem,
  removeItem,
  clearAll,
  getStoragePrefix,
} from './storage';

// Hooks
export { usePersisted, createPersistedState } from './hooks';
