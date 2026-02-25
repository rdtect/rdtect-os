/**
 * VFS Initialization
 *
 * Wires up virtual filesystem providers for reactive system state.
 * Call this once during application initialization.
 */

import { browser } from '$app/environment';
import { procFS } from './proc';
import { vfs } from './vfs.svelte';

// Type definitions for external providers
interface WindowLike {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
}

interface AgentLike {
  id: string;
  name: string;
  status: string;
  model: string;
  capabilities: string[];
  lastActiveAt: Date;
}

interface AppLike {
  id: string;
  title: string;
  icon: string;
  pluginType: string;
}

interface WindowManager {
  windows: WindowLike[];
  apps: AppLike[];
}

interface AgentRuntime {
  agents: AgentLike[];
}

let initialized = false;

/**
 * Initialize virtual filesystem providers
 *
 * This wires up the procFS to read reactive state from:
 * - Window Manager (for /proc/windows, /proc/apps)
 * - Agent Runtime (for /proc/agents)
 * - VFS (for /proc/self/cwd)
 *
 * @param wm - Window manager instance
 * @param agentRuntime - Agent runtime instance
 */
export function initVirtualFilesystems(
  wm: WindowManager,
  agentRuntime: AgentRuntime
): void {
  if (!browser) return;
  if (initialized) {
    console.warn('[VFS] Virtual filesystems already initialized');
    return;
  }

  // Wire up /proc/windows - returns serialized window state
  procFS.setWindowsProvider(() => {
    return wm.windows.map(w => ({
      id: w.id,
      appId: w.appId,
      title: w.title,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
      isMinimized: w.isMinimized,
      isMaximized: w.isMaximized,
      isFocused: w.isFocused,
    }));
  });

  // Wire up /proc/apps - returns registered apps
  procFS.setAppsProvider(() => {
    return wm.apps.map(app => ({
      id: app.id,
      title: app.title,
      icon: app.icon,
      pluginType: app.pluginType,
    }));
  });

  // Wire up /proc/agents - returns agent state
  procFS.setAgentsProvider(() => {
    return agentRuntime.agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      model: agent.model,
      capabilities: agent.capabilities,
      lastActiveAt: agent.lastActiveAt,
    }));
  });

  // Wire up /proc/self/cwd - returns current working directory
  procFS.setCwdProvider(() => {
    return vfs.pwd();
  });

  initialized = true;
  if (import.meta.env.DEV) console.log('[VFS] Virtual filesystems initialized');
}

/**
 * Check if virtual filesystems are initialized
 */
export function isVfsInitialized(): boolean {
  return initialized;
}
