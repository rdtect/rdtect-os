/**
 * File Handler - Handles file:open events
 *
 * This module listens for file:open events and opens the appropriate
 * application for the file type, then sends the file path to the app.
 */

import { eventBus } from '../event-bus';
import { fileAssociations } from './associations.svelte';
import { wm } from '$lib/shell';

/**
 * Initialize the file handler
 * Sets up event listeners for file:open events
 */
export function initFileHandler(): () => void {
  // Listen for file:open events
  const unsubscribe = eventBus.on('file:open', async (data) => {
    if (!data?.path) {
      console.warn('[FileHandler] file:open event missing path');
      return;
    }

    const { path, appId: preferredAppId } = data;

    // Determine which app to use
    let appId = preferredAppId;
    if (!appId) {
      appId = fileAssociations.getAppForFile(path);
    }

    if (!appId) {
      console.warn(`[FileHandler] No app found for file: ${path}`);
      // TODO: Show a dialog to let user choose an app
      return;
    }

    // Check if the app is registered
    const app = wm.getApp(appId);
    if (!app) {
      console.warn(`[FileHandler] App not found: ${appId}`);
      return;
    }

    // Open a new window for the app
    const windowId = wm.openWindow(appId);
    if (!windowId) {
      console.error(`[FileHandler] Failed to open window for app: ${appId}`);
      return;
    }

    // Send the file path to the app
    // Use a small delay to ensure the window is fully initialized
    setTimeout(() => {
      eventBus.emit('app:load-file', { windowId, path });
    }, 100);

    if (import.meta.env.DEV) console.log(`[FileHandler] Opened ${path} with ${appId} (window: ${windowId})`);
  });

  return unsubscribe;
}

/**
 * File Handler singleton state
 */
let initialized = false;
let cleanup: (() => void) | null = null;

/**
 * Start the file handler (call once on app mount)
 */
export function startFileHandler(): void {
  if (initialized) return;

  cleanup = initFileHandler();
  initialized = true;
  if (import.meta.env.DEV) console.log('[FileHandler] Started');
}

/**
 * Stop the file handler (call on app unmount)
 */
export function stopFileHandler(): void {
  if (!initialized || !cleanup) return;

  cleanup();
  cleanup = null;
  initialized = false;
  if (import.meta.env.DEV) console.log('[FileHandler] Stopped');
}
