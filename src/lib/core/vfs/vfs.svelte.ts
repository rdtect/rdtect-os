/**
 * Virtual File System Implementation
 *
 * Unix-like file system backed by IndexedDB (client) and SQLite (server).
 * Follows the "everything is a file" philosophy.
 *
 * Supports virtual filesystems:
 * - /proc - Dynamic system state (read-only)
 * - /dev - Virtual devices
 */

import { browser } from '$app/environment';
import type {
  VirtualFileSystem,
  FileEntry,
  FileStat,
  FileType,
  FSEvent,
  FSEventType,
  FSWatcher,
  FileAssociation
} from './types';
import { procFS } from './proc';
import { devFS } from './dev';

const DB_NAME = 'rdtect-os-vfs';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Default file associations
const DEFAULT_ASSOCIATIONS: FileAssociation[] = [
  { extension: '.md', mimeType: 'text/markdown', appId: 'markdown-editor', icon: '📝', name: 'Markdown Document' },
  { extension: '.txt', mimeType: 'text/plain', appId: 'notepad', icon: '📄', name: 'Text Document' },
  { extension: '.excalidraw', mimeType: 'application/vnd.excalidraw+json', appId: 'excalidraw', icon: '🎨', name: 'Excalidraw Drawing' },
  { extension: '.json', mimeType: 'application/json', appId: 'json-viewer', icon: '📋', name: 'JSON File' },
  { extension: '.png', mimeType: 'image/png', appId: 'image-viewer', icon: '🖼️', name: 'PNG Image' },
  { extension: '.jpg', mimeType: 'image/jpeg', appId: 'image-viewer', icon: '🖼️', name: 'JPEG Image' },
  { extension: '.pdf', mimeType: 'application/pdf', appId: 'pdf-viewer', icon: '📕', name: 'PDF Document' },
];

// Default directory structure (like Linux FHS)
const DEFAULT_STRUCTURE: Partial<FileEntry>[] = [
  { path: '/', type: 'directory', name: '' },
  { path: '/home', type: 'directory', name: 'home' },
  { path: '/home/user', type: 'directory', name: 'user' },
  { path: '/home/user/Documents', type: 'directory', name: 'Documents' },
  { path: '/home/user/Downloads', type: 'directory', name: 'Downloads' },
  { path: '/home/user/Pictures', type: 'directory', name: 'Pictures' },
  { path: '/home/user/Desktop', type: 'directory', name: 'Desktop' },
  { path: '/tmp', type: 'directory', name: 'tmp' },
  { path: '/etc', type: 'directory', name: 'etc' },
  { path: '/var', type: 'directory', name: 'var' },
  { path: '/var/log', type: 'directory', name: 'log' },
  { path: '/proc', type: 'directory', name: 'proc' },
  { path: '/dev', type: 'directory', name: 'dev' },
  { path: '/app', type: 'directory', name: 'app' },
];

class VFS implements VirtualFileSystem {
  private db: IDBDatabase | null = null;
  private currentDir = '/home/user';
  private watchers: Map<string, Set<FSWatcher>> = new Map();
  private associations: Map<string, FileAssociation> = new Map();
  private initialized = false;

  constructor() {
    // Register default associations
    DEFAULT_ASSOCIATIONS.forEach(a => this.associations.set(a.extension, a));
  }

  async init(): Promise<void> {
    if (!browser || this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = async () => {
        this.db = request.result;
        await this.ensureDefaultStructure();
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create files store with path as key
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
          store.createIndex('parent', 'parent', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('mimeType', 'mimeType', { unique: false });
        }
      };
    });
  }

  private async ensureDefaultStructure(): Promise<void> {
    for (const entry of DEFAULT_STRUCTURE) {
      const exists = await this.exists(entry.path!);
      if (!exists) {
        await this.createEntry({
          ...this.createDefaultEntry(entry.path!, entry.type || 'directory'),
          name: entry.name || '',
        });
      }
    }
  }

  private createDefaultEntry(path: string, type: FileType): FileEntry {
    const name = path.split('/').pop() || '';
    const now = new Date();

    return {
      name,
      path,
      type,
      size: 0,
      mode: type === 'directory' ? 0o755 : 0o644,
      uid: 'user',
      gid: 'users',
      createdAt: now,
      modifiedAt: now,
      accessedAt: now,
    };
  }

  private getParentPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }

  private normalizePath(path: string): string {
    // Handle relative paths
    if (!path.startsWith('/')) {
      path = this.currentDir + '/' + path;
    }

    // Resolve . and ..
    const parts = path.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }

    return '/' + resolved.join('/');
  }

  private async getEntry(path: string): Promise<FileEntry | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(path);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async createEntry(entry: FileEntry): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Add parent reference for indexing
      const entryWithParent = {
        ...entry,
        parent: this.getParentPath(entry.path),
      };

      const request = store.put(entryWithParent);

      request.onsuccess = () => {
        this.emit({ type: 'create', path: entry.path, stat: entry, timestamp: new Date() });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async updateEntry(path: string, updates: Partial<FileEntry>): Promise<void> {
    const entry = await this.getEntry(path);
    if (!entry) throw new Error(`ENOENT: ${path}`);

    const updated = {
      ...entry,
      ...updates,
      modifiedAt: new Date(),
    };

    await this.createEntry(updated);
    this.emit({ type: 'modify', path, stat: updated, timestamp: new Date() });
  }

  private async deleteEntry(path: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(path);

      request.onsuccess = () => {
        this.emit({ type: 'delete', path, timestamp: new Date() });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private emit(event: FSEvent): void {
    // Notify watchers for this path
    const watchers = this.watchers.get(event.path);
    watchers?.forEach(cb => cb(event));

    // Notify watchers for parent directory
    const parentPath = this.getParentPath(event.path);
    const parentWatchers = this.watchers.get(parentPath);
    parentWatchers?.forEach(cb => cb(event));

    // Notify global watchers
    const globalWatchers = this.watchers.get('*');
    globalWatchers?.forEach(cb => cb(event));
  }

  // === Public API ===

  pwd(): string {
    return this.currentDir;
  }

  async cd(path: string): Promise<void> {
    const normalized = this.normalizePath(path);
    const entry = await this.getEntry(normalized);

    if (!entry) throw new Error(`ENOENT: ${normalized}`);
    if (entry.type !== 'directory') throw new Error(`ENOTDIR: ${normalized}`);

    this.currentDir = normalized;
  }

  async stat(path: string): Promise<FileStat> {
    const normalized = this.normalizePath(path);

    // Handle virtual filesystems
    if (procFS.handles(normalized)) {
      return procFS.stat(normalized);
    }
    if (devFS.handles(normalized)) {
      return devFS.stat(normalized);
    }

    const entry = await this.getEntry(normalized);

    if (!entry) throw new Error(`ENOENT: ${normalized}`);

    // Update access time
    entry.accessedAt = new Date();

    const { content, children, target, ...stat } = entry;
    return stat;
  }

  async exists(path: string): Promise<boolean> {
    const normalized = this.normalizePath(path);

    // Handle virtual filesystems
    if (procFS.handles(normalized)) {
      return procFS.exists(normalized);
    }
    if (devFS.handles(normalized)) {
      return devFS.exists(normalized);
    }

    const entry = await this.getEntry(normalized);
    return entry !== null;
  }

  async readFile(path: string): Promise<ArrayBuffer> {
    const normalized = this.normalizePath(path);

    // Handle virtual filesystems
    if (procFS.handles(normalized)) {
      return procFS.read(normalized);
    }
    if (devFS.handles(normalized)) {
      return devFS.read(normalized);
    }

    const entry = await this.getEntry(normalized);

    if (!entry) throw new Error(`ENOENT: ${normalized}`);
    if (entry.type === 'directory') throw new Error(`EISDIR: ${normalized}`);

    if (entry.content instanceof ArrayBuffer) {
      return entry.content;
    }

    // Convert string/object to ArrayBuffer
    const str = typeof entry.content === 'object'
      ? JSON.stringify(entry.content)
      : String(entry.content || '');

    return new TextEncoder().encode(str).buffer;
  }

  async readTextFile(path: string): Promise<string> {
    const buffer = await this.readFile(path);
    return new TextDecoder().decode(buffer);
  }

  async readJsonFile<T = unknown>(path: string): Promise<T> {
    const text = await this.readTextFile(path);
    return JSON.parse(text) as T;
  }

  async writeFile(path: string, content: ArrayBuffer | string | object): Promise<void> {
    const normalized = this.normalizePath(path);

    // Handle virtual filesystems
    if (procFS.handles(normalized)) {
      // /proc is read-only
      throw new Error('EROFS: /proc is read-only');
    }
    if (devFS.handles(normalized)) {
      const buffer = content instanceof ArrayBuffer
        ? content
        : typeof content === 'string'
          ? new TextEncoder().encode(content).buffer
          : new TextEncoder().encode(JSON.stringify(content)).buffer;
      return devFS.write(normalized, buffer);
    }

    // Ensure parent directory exists
    const parentPath = this.getParentPath(normalized);
    const parentExists = await this.exists(parentPath);
    if (!parentExists) {
      throw new Error(`ENOENT: parent directory ${parentPath} does not exist`);
    }

    const existingEntry = await this.getEntry(normalized);

    // Calculate size
    let size = 0;
    if (content instanceof ArrayBuffer) {
      size = content.byteLength;
    } else if (typeof content === 'string') {
      size = new TextEncoder().encode(content).length;
    } else {
      size = new TextEncoder().encode(JSON.stringify(content)).length;
    }

    // Determine MIME type from extension
    const ext = '.' + normalized.split('.').pop()?.toLowerCase();
    const association = this.associations.get(ext);

    const entry: FileEntry = existingEntry
      ? { ...existingEntry, content, size, modifiedAt: new Date() }
      : {
          ...this.createDefaultEntry(normalized, 'file'),
          content,
          size,
          mimeType: association?.mimeType,
        };

    await this.createEntry(entry);
  }

  async appendFile(path: string, content: ArrayBuffer | string): Promise<void> {
    let existing = '';
    try {
      existing = await this.readTextFile(path);
    } catch {
      // File doesn't exist, will be created
    }

    const newContent = typeof content === 'string'
      ? existing + content
      : existing + new TextDecoder().decode(content);

    await this.writeFile(path, newContent);
  }

  async mkdir(path: string, recursive = false): Promise<void> {
    const normalized = this.normalizePath(path);

    // Protect virtual filesystems
    if (procFS.handles(normalized)) {
      throw new Error('EROFS: /proc is read-only');
    }
    if (devFS.handles(normalized)) {
      throw new Error('EROFS: /dev is read-only');
    }

    if (recursive) {
      const parts = normalized.split('/').filter(Boolean);
      let currentPath = '';

      for (const part of parts) {
        currentPath += '/' + part;
        const exists = await this.exists(currentPath);
        if (!exists) {
          await this.createEntry(this.createDefaultEntry(currentPath, 'directory'));
        }
      }
    } else {
      const parentPath = this.getParentPath(normalized);
      const parentExists = await this.exists(parentPath);
      if (!parentExists) {
        throw new Error(`ENOENT: parent directory ${parentPath} does not exist`);
      }

      const exists = await this.exists(normalized);
      if (exists) {
        throw new Error(`EEXIST: ${normalized}`);
      }

      await this.createEntry(this.createDefaultEntry(normalized, 'directory'));
    }
  }

  async readdir(path: string): Promise<FileStat[]> {
    if (!this.db) await this.init();

    const normalized = this.normalizePath(path);

    // Handle virtual filesystems
    if (procFS.handles(normalized)) {
      return procFS.readdir(normalized);
    }
    if (devFS.handles(normalized)) {
      return devFS.readdir(normalized);
    }

    const entry = await this.getEntry(normalized);

    if (!entry) throw new Error(`ENOENT: ${normalized}`);
    if (entry.type !== 'directory') throw new Error(`ENOTDIR: ${normalized}`);

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('parent');
      const request = index.getAll(normalized);

      request.onsuccess = () => {
        const entries = request.result as FileEntry[];
        const stats: FileStat[] = entries.map(e => {
          const { content, children, target, parent, ...stat } = e as FileEntry & { parent: string };
          return stat;
        });
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async rmdir(path: string, recursive = false): Promise<void> {
    const normalized = this.normalizePath(path);

    // Protect virtual filesystems
    if (procFS.handles(normalized)) {
      throw new Error('EROFS: /proc is read-only');
    }
    if (devFS.handles(normalized)) {
      throw new Error('EROFS: /dev is read-only');
    }

    const entry = await this.getEntry(normalized);

    if (!entry) throw new Error(`ENOENT: ${normalized}`);
    if (entry.type !== 'directory') throw new Error(`ENOTDIR: ${normalized}`);

    const children = await this.readdir(normalized);

    if (children.length > 0 && !recursive) {
      throw new Error(`ENOTEMPTY: ${normalized}`);
    }

    if (recursive) {
      for (const child of children) {
        if (child.type === 'directory') {
          await this.rmdir(child.path, true);
        } else {
          await this.rm(child.path);
        }
      }
    }

    await this.deleteEntry(normalized);
  }

  async rm(path: string): Promise<void> {
    const normalized = this.normalizePath(path);

    // Protect virtual filesystems
    if (procFS.handles(normalized)) {
      throw new Error('EROFS: /proc is read-only');
    }
    if (devFS.handles(normalized)) {
      throw new Error('EROFS: /dev is read-only');
    }

    const entry = await this.getEntry(normalized);

    if (!entry) throw new Error(`ENOENT: ${normalized}`);
    if (entry.type === 'directory') throw new Error(`EISDIR: use rmdir for directories`);

    await this.deleteEntry(normalized);
  }

  async cp(src: string, dest: string): Promise<void> {
    const srcNormalized = this.normalizePath(src);
    const destNormalized = this.normalizePath(dest);

    const srcEntry = await this.getEntry(srcNormalized);
    if (!srcEntry) throw new Error(`ENOENT: ${srcNormalized}`);

    if (srcEntry.type === 'directory') {
      // Recursive copy
      await this.mkdir(destNormalized, true);
      const children = await this.readdir(srcNormalized);
      for (const child of children) {
        const childDest = destNormalized + '/' + child.name;
        await this.cp(child.path, childDest);
      }
    } else {
      const content = await this.readFile(srcNormalized);
      await this.writeFile(destNormalized, content);
    }
  }

  async mv(src: string, dest: string): Promise<void> {
    await this.cp(src, dest);
    const srcEntry = await this.getEntry(this.normalizePath(src));
    if (srcEntry?.type === 'directory') {
      await this.rmdir(src, true);
    } else {
      await this.rm(src);
    }
  }

  async ln(target: string, link: string, symbolic = true): Promise<void> {
    if (!symbolic) {
      throw new Error('Hard links not supported');
    }

    const linkNormalized = this.normalizePath(link);
    const targetNormalized = this.normalizePath(target);

    const entry: FileEntry = {
      ...this.createDefaultEntry(linkNormalized, 'symlink'),
      target: targetNormalized,
    };

    await this.createEntry(entry);
  }

  async chmod(path: string, mode: number): Promise<void> {
    await this.updateEntry(this.normalizePath(path), { mode });
  }

  async chown(path: string, uid: string, gid?: string): Promise<void> {
    const updates: Partial<FileEntry> = { uid };
    if (gid) updates.gid = gid;
    await this.updateEntry(this.normalizePath(path), updates);
  }

  watch(path: string, callback: FSWatcher): () => void {
    const normalized = path === '*' ? '*' : this.normalizePath(path);

    if (!this.watchers.has(normalized)) {
      this.watchers.set(normalized, new Set());
    }

    this.watchers.get(normalized)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.watchers.get(normalized)?.delete(callback);
    };
  }

  async find(path: string, pattern: string | RegExp): Promise<string[]> {
    const normalized = this.normalizePath(path);
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const results: string[] = [];

    const search = async (dir: string) => {
      const entries = await this.readdir(dir);
      for (const entry of entries) {
        if (regex.test(entry.name)) {
          results.push(entry.path);
        }
        if (entry.type === 'directory') {
          await search(entry.path);
        }
      }
    };

    await search(normalized);
    return results;
  }

  async grep(path: string, pattern: string | RegExp): Promise<{ path: string; line: number; content: string }[]> {
    const normalized = this.normalizePath(path);
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;
    const results: { path: string; line: number; content: string }[] = [];

    const search = async (filePath: string) => {
      const entry = await this.getEntry(filePath);
      if (!entry) return;

      if (entry.type === 'directory') {
        const children = await this.readdir(filePath);
        for (const child of children) {
          await search(child.path);
        }
      } else if (entry.type === 'file') {
        try {
          const content = await this.readTextFile(filePath);
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (regex.test(line)) {
              results.push({ path: filePath, line: index + 1, content: line });
            }
          });
        } catch {
          // Skip binary files
        }
      }
    };

    await search(normalized);
    return results;
  }

  getAssociation(path: string): FileAssociation | undefined {
    const ext = '.' + path.split('.').pop()?.toLowerCase();
    return this.associations.get(ext);
  }

  registerAssociation(association: FileAssociation): void {
    this.associations.set(association.extension, association);
  }

  async sync(): Promise<void> {
    // TODO: Sync with backend API
    if (import.meta.env.DEV) console.log('[VFS] Sync not yet implemented');
  }
}

// Singleton instance
export const vfs = new VFS();

// Initialize on module load (browser only)
if (browser) {
  vfs.init().catch(console.error);
}
