/**
 * Persistence Layer - Abstract Storage Interface
 *
 * Provides a unified API for different storage backends:
 * - localStorage (default, sync, ~5-10MB limit)
 * - IndexedDB (for large data, async)
 *
 * Why not MySQL/PostgreSQL?
 * - rdtect OS is a client-side web application
 * - No server required for basic persistence
 * - Data stays on user's device (privacy)
 * - Works offline
 *
 * When to use MySQL:
 * - Multi-user sync across devices
 * - Server-side data processing
 * - Large datasets (>50MB)
 * - Complex queries
 *
 * For those cases, use the Python backend's API endpoints.
 */

// ============================================================================
// Types
// ============================================================================

export interface StorageAdapter {
  name: string;
  isAsync: boolean;

  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  getQuota(): Promise<number>;
}

export interface Collection<T = unknown> {
  name: string;
  get(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  set(id: string, value: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
  find(predicate: (item: T) => boolean): Promise<T[]>;
  findOne(predicate: (item: T) => boolean): Promise<T | null>;
}

export interface PersistenceStore {
  readonly adapter: StorageAdapter;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  collection<T>(name: string): Collection<T>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  export(): Promise<Record<string, unknown>>;
  import(data: Record<string, unknown>): Promise<void>;
}

// ============================================================================
// localStorage Adapter
// ============================================================================

export class LocalStorageAdapter implements StorageAdapter {
  name = 'localStorage';
  isAsync = false;
  private prefix: string;

  constructor(prefix: string = 'rdtect-os') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `\${this.prefix}:\${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  async keys(): Promise<string[]> {
    const prefixLen = this.prefix.length + 1;
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix + ':'))
      .map(k => k.slice(prefixLen));
  }

  async clear(): Promise<void> {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix + ':'))
      .forEach(k => localStorage.removeItem(k));
  }

  async getSize(): Promise<number> {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(this.prefix + ':')) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total * 2;
  }

  async getQuota(): Promise<number> {
    return 5 * 1024 * 1024;
  }
}

// ============================================================================
// IndexedDB Adapter
// ============================================================================

export class IndexedDBAdapter implements StorageAdapter {
  name = 'IndexedDB';
  isAsync = true;
  private dbName: string;
  private storeName = 'keyvalue';
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'rdtect-os') {
    this.dbName = dbName;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSize(): Promise<number> {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  async getQuota(): Promise<number> {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return estimate.quota || 0;
    }
    return 50 * 1024 * 1024;
  }
}

// ============================================================================
// Collection Implementation
// ============================================================================

class StorageCollection<T> implements Collection<T> {
  name: string;
  private adapter: StorageAdapter;
  private collectionKey: string;

  constructor(adapter: StorageAdapter, name: string) {
    this.adapter = adapter;
    this.name = name;
    this.collectionKey = `collection:\${name}`;
  }

  private async getData(): Promise<Record<string, T>> {
    const data = await this.adapter.get<Record<string, T>>(this.collectionKey);
    return data || {};
  }

  private async setData(data: Record<string, T>): Promise<void> {
    await this.adapter.set(this.collectionKey, data);
  }

  async get(id: string): Promise<T | null> {
    const data = await this.getData();
    return data[id] ?? null;
  }

  async getAll(): Promise<T[]> {
    const data = await this.getData();
    return Object.values(data);
  }

  async set(id: string, value: T): Promise<void> {
    const data = await this.getData();
    data[id] = value;
    await this.setData(data);
  }

  async delete(id: string): Promise<void> {
    const data = await this.getData();
    delete data[id];
    await this.setData(data);
  }

  async clear(): Promise<void> {
    await this.adapter.delete(this.collectionKey);
  }

  async find(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.getAll();
    return items.filter(predicate);
  }

  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    const items = await this.getAll();
    return items.find(predicate) ?? null;
  }
}

// ============================================================================
// Main Persistence Store
// ============================================================================

class PersistenceStoreImpl implements PersistenceStore {
  readonly adapter: StorageAdapter;
  private collections: Map<string, Collection<unknown>> = new Map();

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    return this.adapter.set(key, value);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.adapter.has(key);
  }

  collection<T>(name: string): Collection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new StorageCollection<T>(this.adapter, name));
    }
    return this.collections.get(name) as Collection<T>;
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  async keys(): Promise<string[]> {
    return this.adapter.keys();
  }

  async export(): Promise<Record<string, unknown>> {
    const keys = await this.keys();
    const data: Record<string, unknown> = {};
    for (const key of keys) {
      data[key] = await this.get(key);
    }
    return data;
  }

  async import(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }
}

// ============================================================================
// Noop Adapter (SSR / no-storage environments)
// ============================================================================

class NoopStorageAdapter implements StorageAdapter {
  name = 'noop';
  isAsync = true;
  async get<T>(_key: string): Promise<T | null> { return null; }
  async set<T>(_key: string, _value: T): Promise<void> {}
  async delete(_key: string): Promise<void> {}
  async has(_key: string): Promise<boolean> { return false; }
  async keys(): Promise<string[]> { return []; }
  async clear(): Promise<void> {}
  async getSize(): Promise<number> { return 0; }
  async getQuota(): Promise<number> { return 0; }
}

// ============================================================================
// Factory & Singleton
// ============================================================================

function selectAdapter(): StorageAdapter {
  if (typeof localStorage !== 'undefined') {
    return new LocalStorageAdapter();
  }
  if (typeof indexedDB !== 'undefined') {
    return new IndexedDBAdapter();
  }
  return new NoopStorageAdapter();
}

export const storage = new PersistenceStoreImpl(selectAdapter());

export function createStorage(adapter: StorageAdapter): PersistenceStore {
  return new PersistenceStoreImpl(adapter);
}

export function createLargeStorage(dbName?: string): PersistenceStore {
  return new PersistenceStoreImpl(new IndexedDBAdapter(dbName));
}

// ============================================================================
// Legacy Helper Functions (for backwards compatibility)
// ============================================================================

const STORAGE_PREFIX = 'rdtect-os';

/**
 * Get an item from localStorage with JSON parsing
 */
export function getItem<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${key}`);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set an item in localStorage with JSON serialization
 */
export function setItem<T>(key: string, value: T): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove an item from localStorage
 */
export function removeItem(key: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
}

/**
 * Clear all items with our prefix from localStorage
 */
export function clearAll(): void {
  if (typeof localStorage === 'undefined') return;
  Object.keys(localStorage)
    .filter(k => k.startsWith(`${STORAGE_PREFIX}:`))
    .forEach(k => localStorage.removeItem(k));
}

/**
 * Get the storage prefix
 */
export function getStoragePrefix(): string {
  return STORAGE_PREFIX;
}
