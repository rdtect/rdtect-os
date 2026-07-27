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

/** Status provider dependencies for /proc/self/status */
export interface StatusProviders {
  /** Returns auth state: { isValid, username } */
  getAuthState?: () => { isValid: boolean; username?: string };
  /** Returns active theme id */
  getThemeId?: () => string;
}

/** System boot time (shared with proc.ts BOOT_TIME concept) */
let sessionStart = Date.now();

let initialized = false;

/**
 * Initialize virtual filesystem providers
 *
 * This wires up the procFS to read reactive state from:
 * - Window Manager (for /proc/windows, /proc/apps)
 * - Agent Runtime (for /proc/agents)
 * - VFS (for /proc/self/cwd, /proc/self/status)
 *
 * @param wm - Window manager instance
 * @param agentRuntime - Agent runtime instance
 * @param statusProviders - Optional providers for /proc/self/status (auth, theme)
 */
export function initVirtualFilesystems(
  wm: WindowManager,
  agentRuntime: AgentRuntime,
  statusProviders?: StatusProviders
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

  // Wire up /proc/self/status - returns session/system status
  // Like Linux /proc/self/status, provides human-readable status info
  procFS.setStatusProvider(() => {
    const uptimeSec = Math.floor((Date.now() - sessionStart) / 1000);
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const status: Record<string, string | number> = {
      Name: 'rdtect-os',
      State: 'running (web)',
      Uptime: uptimeStr,
      Windows: wm.windows.length,
      Agents: agentRuntime.agents.length,
      CWD: vfs.pwd(),
    };

    // Inject auth state if provider available
    if (statusProviders?.getAuthState) {
      const auth = statusProviders.getAuthState();
      status.Auth = auth.isValid ? `authenticated (${auth.username || 'user'})` : 'guest';
    } else {
      status.Auth = 'unknown';
    }

    // Inject theme if provider available
    if (statusProviders?.getThemeId) {
      status.Theme = statusProviders.getThemeId();
    }

    // Memory info from browser (if available)
    const memory = (performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
    }).memory;
    if (memory) {
      status.MemTotal = `${Math.floor(memory.totalJSHeapSize / 1024)} kB`;
      status.MemUsed = `${Math.floor(memory.usedJSHeapSize / 1024)} kB`;
    }

    // Agent status summary
    const agentStates = agentRuntime.agents.map(a => a.status);
    const idleCount = agentStates.filter(s => s === 'idle').length;
    const activeCount = agentStates.filter(s => s !== 'idle' && s !== 'error').length;
    const errorCount = agentStates.filter(s => s === 'error').length;
    status.AgentsIdle = idleCount;
    status.AgentsActive = activeCount;
    status.AgentsError = errorCount;

    return status;
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
