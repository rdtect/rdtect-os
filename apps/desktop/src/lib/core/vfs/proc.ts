/**
 * /proc Virtual Filesystem
 *
 * Provides dynamic, read-only virtual files that expose system state.
 * Inspired by Linux's /proc filesystem.
 *
 * Virtual files:
 * - /proc/agents - JSON list of all agents and their status
 * - /proc/windows - JSON list of all open windows
 * - /proc/apps - JSON list of registered apps
 * - /proc/uptime - System uptime in seconds
 * - /proc/meminfo - Browser memory info (if available)
 * - /proc/self/cwd - Current working directory
 */

import { browser } from '$app/environment';
import type { FileStat, FileEntry } from './types';

// System boot time (when this module is loaded)
const BOOT_TIME = Date.now();

/**
 * ProcFS handler for /proc virtual filesystem
 */
class ProcFS {
  private getters: Map<string, () => string | object> = new Map();

  // Reactive state providers (set by external modules)
  private agentsProvider: (() => unknown[]) | null = null;
  private windowsProvider: (() => unknown[]) | null = null;
  private appsProvider: (() => unknown[]) | null = null;
  private cwdProvider: (() => string) | null = null;

  constructor() {
    this.registerDefaultGetters();
  }

  /**
   * Register the agents state provider for reactive /proc/agents
   */
  setAgentsProvider(provider: () => unknown[]): void {
    this.agentsProvider = provider;
  }

  /**
   * Register the windows state provider for reactive /proc/windows
   */
  setWindowsProvider(provider: () => unknown[]): void {
    this.windowsProvider = provider;
  }

  /**
   * Register the apps state provider for reactive /proc/apps
   */
  setAppsProvider(provider: () => unknown[]): void {
    this.appsProvider = provider;
  }

  /**
   * Register the cwd provider for /proc/self/cwd
   */
  setCwdProvider(provider: () => string): void {
    this.cwdProvider = provider;
  }

  private registerDefaultGetters(): void {
    // /proc/uptime - System uptime in seconds
    this.getters.set('/proc/uptime', () => {
      const uptimeMs = Date.now() - BOOT_TIME;
      const uptimeSeconds = Math.floor(uptimeMs / 1000);
      return `${uptimeSeconds}`;
    });

    // /proc/meminfo - Browser memory info
    this.getters.set('/proc/meminfo', () => {
      if (!browser) return 'MemTotal: 0 kB\nMemFree: 0 kB\n';

      // Use Performance API if available
      const memory = (performance as Performance & { memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;

      if (memory) {
        const used = Math.floor(memory.usedJSHeapSize / 1024);
        const total = Math.floor(memory.totalJSHeapSize / 1024);
        const limit = Math.floor(memory.jsHeapSizeLimit / 1024);
        const free = total - used;

        return [
          `MemTotal:       ${total} kB`,
          `MemFree:        ${free} kB`,
          `MemUsed:        ${used} kB`,
          `HeapLimit:      ${limit} kB`,
        ].join('\n');
      }

      return 'MemInfo: unavailable (performance.memory not supported)\n';
    });

    // /proc/agents - List of all agents (uses reactive provider)
    this.getters.set('/proc/agents', () => {
      if (this.agentsProvider) {
        const agents = this.agentsProvider();
        return JSON.stringify(agents, null, 2);
      }
      return '[]';
    });

    // /proc/windows - List of all open windows (uses reactive provider)
    this.getters.set('/proc/windows', () => {
      if (this.windowsProvider) {
        const windows = this.windowsProvider();
        return JSON.stringify(windows, null, 2);
      }
      return '[]';
    });

    // /proc/apps - List of registered apps (uses reactive provider)
    this.getters.set('/proc/apps', () => {
      if (this.appsProvider) {
        const apps = this.appsProvider();
        return JSON.stringify(apps, null, 2);
      }
      return '[]';
    });

    // /proc/self/cwd - Current working directory
    this.getters.set('/proc/self/cwd', () => {
      if (this.cwdProvider) {
        return this.cwdProvider();
      }
      return '/home/user';
    });

    // /proc/version - System version info
    this.getters.set('/proc/version', () => {
      return 'rdtect-os version 1.0.0 (web)\n' +
             `Platform: ${browser ? navigator.platform : 'server'}\n` +
             `UserAgent: ${browser ? navigator.userAgent : 'N/A'}\n`;
    });

    // /proc/loadavg - Simulated load average (based on windows count)
    this.getters.set('/proc/loadavg', () => {
      const windowCount = this.windowsProvider ? this.windowsProvider().length : 0;
      const load = (windowCount * 0.1).toFixed(2);
      return `${load} ${load} ${load} ${windowCount}/100 1`;
    });

    // /proc/stat - Basic system stats
    this.getters.set('/proc/stat', () => {
      const bootTimeSec = Math.floor(BOOT_TIME / 1000);
      return [
        `cpu  0 0 0 0 0 0 0 0 0 0`,
        `btime ${bootTimeSec}`,
        `processes ${this.windowsProvider ? this.windowsProvider().length : 0}`,
        `procs_running 1`,
        `procs_blocked 0`,
      ].join('\n');
    });
  }

  /**
   * Check if a path is handled by procfs
   */
  handles(path: string): boolean {
    return path.startsWith('/proc');
  }

  /**
   * Check if a proc file/directory exists
   */
  exists(path: string): boolean {
    if (path === '/proc') return true;
    if (path === '/proc/self') return true;
    return this.getters.has(path);
  }

  /**
   * Read a proc file
   */
  async read(path: string): Promise<ArrayBuffer> {
    const getter = this.getters.get(path);
    if (!getter) {
      throw new Error(`ENOENT: ${path}`);
    }

    const content = getter();
    const text = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    return new TextEncoder().encode(text).buffer;
  }

  /**
   * Get file stat for a proc entry
   */
  stat(path: string): FileStat {
    const now = new Date();

    // Root /proc directory
    if (path === '/proc') {
      return {
        name: 'proc',
        path: '/proc',
        type: 'proc',
        size: 0,
        mode: 0o555, // r-xr-xr-x (read-only)
        uid: 'root',
        gid: 'root',
        createdAt: new Date(BOOT_TIME),
        modifiedAt: now,
        accessedAt: now,
      };
    }

    // /proc/self directory
    if (path === '/proc/self') {
      return {
        name: 'self',
        path: '/proc/self',
        type: 'directory',
        size: 0,
        mode: 0o555,
        uid: 'user',
        gid: 'users',
        createdAt: new Date(BOOT_TIME),
        modifiedAt: now,
        accessedAt: now,
      };
    }

    // Virtual files
    const name = path.split('/').pop() || '';
    const getter = this.getters.get(path);

    if (!getter) {
      throw new Error(`ENOENT: ${path}`);
    }

    // Calculate size dynamically
    const content = getter();
    const text = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    const size = new TextEncoder().encode(text).length;

    return {
      name,
      path,
      type: 'proc',
      size,
      mode: 0o444, // r--r--r-- (read-only)
      uid: 'root',
      gid: 'root',
      createdAt: new Date(BOOT_TIME),
      modifiedAt: now,
      accessedAt: now,
    };
  }

  /**
   * List directory contents
   */
  readdir(path: string): FileStat[] {
    const now = new Date();

    if (path === '/proc') {
      // List all top-level proc entries
      const entries: FileStat[] = [];
      const seen = new Set<string>();

      for (const key of this.getters.keys()) {
        // Extract first component after /proc/
        const parts = key.substring(6).split('/'); // Remove '/proc/'
        const name = parts[0];

        if (!seen.has(name)) {
          seen.add(name);

          // Check if this is a directory (has subentries)
          const isDir = Array.from(this.getters.keys()).some(
            k => k.startsWith(`/proc/${name}/`)
          );

          entries.push({
            name,
            path: `/proc/${name}`,
            type: isDir ? 'directory' : 'proc',
            size: 0,
            mode: isDir ? 0o555 : 0o444,
            uid: 'root',
            gid: 'root',
            createdAt: new Date(BOOT_TIME),
            modifiedAt: now,
            accessedAt: now,
          });
        }
      }

      return entries;
    }

    if (path === '/proc/self') {
      // List /proc/self entries
      return Array.from(this.getters.keys())
        .filter(k => k.startsWith('/proc/self/'))
        .map(k => {
          const name = k.split('/').pop() || '';
          return {
            name,
            path: k,
            type: 'proc' as const,
            size: 0,
            mode: 0o444,
            uid: 'user',
            gid: 'users',
            createdAt: new Date(BOOT_TIME),
            modifiedAt: now,
            accessedAt: now,
          };
        });
    }

    throw new Error(`ENOTDIR: ${path}`);
  }

  /**
   * Write is not supported for /proc (read-only)
   */
  async write(_path: string, _content: ArrayBuffer): Promise<void> {
    throw new Error('EROFS: /proc is read-only');
  }
}

// Singleton export
export const procFS = new ProcFS();
