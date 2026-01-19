/**
 * /dev Virtual Filesystem
 *
 * Provides virtual device files for the desktop OS.
 * Inspired by Linux's /dev filesystem.
 *
 * Virtual devices:
 * - /dev/null - Discards all writes, reads return empty
 * - /dev/random - Returns random bytes
 * - /dev/urandom - Same as /dev/random (alias)
 * - /dev/zero - Returns zero bytes
 * - /dev/clipboard - Read/write to system clipboard
 * - /dev/console - Write goes to console.log
 * - /dev/stdin - Placeholder for standard input
 * - /dev/stdout - Write goes to console.log
 * - /dev/stderr - Write goes to console.error
 */

import { browser } from '$app/environment';
import type { FileStat } from './types';

/**
 * DevFS handler for /dev virtual filesystem
 */
class DevFS {
  // Known device files
  private devices = new Set([
    '/dev/null',
    '/dev/random',
    '/dev/urandom',
    '/dev/zero',
    '/dev/clipboard',
    '/dev/console',
    '/dev/stdin',
    '/dev/stdout',
    '/dev/stderr',
  ]);

  /**
   * Check if a path is handled by devfs
   */
  handles(path: string): boolean {
    return path.startsWith('/dev');
  }

  /**
   * Check if a device file exists
   */
  exists(path: string): boolean {
    if (path === '/dev') return true;
    return this.devices.has(path);
  }

  /**
   * Read from a device file
   */
  async read(path: string, size: number = 4096): Promise<ArrayBuffer> {
    switch (path) {
      case '/dev/null':
        // Returns empty
        return new ArrayBuffer(0);

      case '/dev/random':
      case '/dev/urandom':
        // Returns random bytes
        const randomBuffer = new Uint8Array(size);
        if (browser && crypto?.getRandomValues) {
          crypto.getRandomValues(randomBuffer);
        } else {
          // Fallback for non-browser/no crypto
          for (let i = 0; i < size; i++) {
            randomBuffer[i] = Math.floor(Math.random() * 256);
          }
        }
        return randomBuffer.buffer;

      case '/dev/zero':
        // Returns zero bytes
        return new ArrayBuffer(size);

      case '/dev/clipboard':
        // Read from system clipboard
        if (browser && navigator.clipboard) {
          try {
            const text = await navigator.clipboard.readText();
            return new TextEncoder().encode(text).buffer;
          } catch (err) {
            // Clipboard access denied or empty
            console.warn('[devFS] Clipboard read failed:', err);
            return new ArrayBuffer(0);
          }
        }
        return new ArrayBuffer(0);

      case '/dev/console':
      case '/dev/stdout':
      case '/dev/stderr':
        // These are write-only devices, reading returns empty
        return new ArrayBuffer(0);

      case '/dev/stdin':
        // In a web context, stdin isn't really applicable
        // Return empty for now
        return new ArrayBuffer(0);

      default:
        throw new Error(`ENOENT: ${path}`);
    }
  }

  /**
   * Write to a device file
   */
  async write(path: string, content: ArrayBuffer | string): Promise<void> {
    const text = typeof content === 'string'
      ? content
      : new TextDecoder().decode(content);

    switch (path) {
      case '/dev/null':
        // Discard all writes - do nothing
        return;

      case '/dev/random':
      case '/dev/urandom':
      case '/dev/zero':
        // These are read-only devices
        throw new Error(`EROFS: ${path} is read-only`);

      case '/dev/clipboard':
        // Write to system clipboard
        if (browser && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(text);
          } catch (err) {
            console.warn('[devFS] Clipboard write failed:', err);
            throw new Error(`EIO: clipboard write failed`);
          }
        }
        return;

      case '/dev/console':
      case '/dev/stdout':
        // Write to console.log
        console.log(text);
        return;

      case '/dev/stderr':
        // Write to console.error
        console.error(text);
        return;

      case '/dev/stdin':
        // stdin is read-only
        throw new Error(`EROFS: ${path} is read-only`);

      default:
        throw new Error(`ENOENT: ${path}`);
    }
  }

  /**
   * Get file stat for a device
   */
  stat(path: string): FileStat {
    const now = new Date();

    // Root /dev directory
    if (path === '/dev') {
      return {
        name: 'dev',
        path: '/dev',
        type: 'directory',
        size: 0,
        mode: 0o755,
        uid: 'root',
        gid: 'root',
        createdAt: now,
        modifiedAt: now,
        accessedAt: now,
      };
    }

    if (!this.devices.has(path)) {
      throw new Error(`ENOENT: ${path}`);
    }

    const name = path.split('/').pop() || '';

    // Determine mode based on device type
    let mode: number;
    switch (path) {
      case '/dev/null':
        mode = 0o666; // rw-rw-rw-
        break;
      case '/dev/random':
      case '/dev/urandom':
      case '/dev/zero':
        mode = 0o444; // r--r--r-- (read-only)
        break;
      case '/dev/clipboard':
        mode = 0o666; // rw-rw-rw-
        break;
      case '/dev/console':
      case '/dev/stdout':
      case '/dev/stderr':
        mode = 0o222; // -w--w--w- (write-only)
        break;
      case '/dev/stdin':
        mode = 0o444; // r--r--r--
        break;
      default:
        mode = 0o666;
    }

    return {
      name,
      path,
      type: 'device',
      size: 0,
      mode,
      uid: 'root',
      gid: 'root',
      createdAt: now,
      modifiedAt: now,
      accessedAt: now,
    };
  }

  /**
   * List directory contents
   */
  readdir(path: string): FileStat[] {
    if (path !== '/dev') {
      throw new Error(`ENOTDIR: ${path}`);
    }

    const now = new Date();

    return Array.from(this.devices).map(devicePath => {
      const name = devicePath.split('/').pop() || '';

      let mode: number;
      switch (devicePath) {
        case '/dev/null':
        case '/dev/clipboard':
          mode = 0o666;
          break;
        case '/dev/random':
        case '/dev/urandom':
        case '/dev/zero':
        case '/dev/stdin':
          mode = 0o444;
          break;
        case '/dev/console':
        case '/dev/stdout':
        case '/dev/stderr':
          mode = 0o222;
          break;
        default:
          mode = 0o666;
      }

      return {
        name,
        path: devicePath,
        type: 'device' as const,
        size: 0,
        mode,
        uid: 'root',
        gid: 'root',
        createdAt: now,
        modifiedAt: now,
        accessedAt: now,
      };
    });
  }
}

// Singleton export
export const devFS = new DevFS();
