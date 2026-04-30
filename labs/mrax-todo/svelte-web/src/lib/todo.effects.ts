/**
 * MRAX EFFECTS — IndexedDB boundary
 * ==================================
 * Side-effect functions. Pure boundary: takes a value in, writes to storage,
 * returns a Promise. No reactive state, no UI.
 *
 * Pattern 3 (subsystem owner) from pattern-libraries-at-the-boundary:
 * IndexedDB is owned entirely inside this file. The rest of the app talks to
 * it only through this thin API.
 */

import type { Todo } from './todo.types';

const DB_NAME = 'TodoAppDB';
const DB_VERSION = 1;
const STORE = 'todos';

// ─── Connection (lazy, cached) ─────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
}

// ─── Pure boundary API ─────────────────────────────────────────────────────

export async function loadAll(): Promise<Todo[]> {
  const db = await openDB();
  return new Promise<Todo[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as Todo[]);
    req.onerror = () => reject(req.error);
  });
}

export async function save(todo: Todo): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(todo);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function remove(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeMany(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const id of ids) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
