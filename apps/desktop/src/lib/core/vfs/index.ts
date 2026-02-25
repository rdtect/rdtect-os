/**
 * Virtual File System Module
 *
 * Unix-like file system for rdtect OS.
 * "Everything is a file"
 *
 * Includes virtual filesystems:
 * - /proc - Dynamic system state (read-only)
 * - /dev - Virtual devices
 */

// Types
export * from './types';

// Singleton instances
export { vfs } from './vfs.svelte';
export { procFS } from './proc';
export { devFS } from './dev';

// Initialization helper
export { initVirtualFilesystems } from './init';
