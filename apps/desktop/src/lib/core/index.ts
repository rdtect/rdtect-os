/**
 * Core Module - Main Entry Point
 *
 * Exports all core systems for the Desktop OS:
 * - Plugin system (discovery and loading)
 * - Messaging (inter-plugin communication and event bus)
 * - Storage (persistence and configuration)
 * - Theme system
 * - Virtual file system
 * - UI utilities (keyboard shortcuts, attachments, widgets)
 */

// === Plugin System ===
export * from './plugin-discovery';
export * from './plugin-loader';

// === Messaging & Events ===
export * from './message-bus';
export * from './event-bus';

// === Storage & Configuration ===
export * from './persistence';
export * from './config';
export * from './file-associations';

// === Theming ===
export * from './theme';

// === Virtual File System ===
export * from './vfs';

// === PocketBase Integration ===
export * from './pocketbase';

// === UI Utilities ===
export * from './keyboard-shortcuts';
export * from './attachments';
export * from './widget-registry.svelte';

// === API Status ===
export { apiStatus } from './api-status.svelte';

// === Categories ===
export * from './categories';

// === Core Types ===
export * from './types';
