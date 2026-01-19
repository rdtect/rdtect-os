/**
 * Config Manager - XDG-style configuration system
 *
 * Stores app settings in /home/user/.config/appId/ directories
 * following the XDG Base Directory Specification pattern.
 *
 * Example: /home/user/.config/excalidraw/settings.json
 */

import { vfs } from '../vfs/vfs.svelte';
import type { FSEvent } from '../vfs/types';

// Base config directory (XDG_CONFIG_HOME equivalent)
const CONFIG_BASE = '/home/user/.config';

/**
 * Listener callback for config changes
 */
type ConfigWatcher = (config: Record<string, unknown>) => void;

/**
 * Config Manager Interface
 */
export interface ConfigManager {
  /**
   * Get a config value for an app
   * @param appId - Application identifier
   * @param key - Config key (dot notation supported, e.g., 'window.width')
   * @param defaultValue - Default value if key not found
   */
  get<T>(appId: string, key: string, defaultValue?: T): Promise<T | undefined>;

  /**
   * Set a config value for an app
   * @param appId - Application identifier
   * @param key - Config key (dot notation supported)
   * @param value - Value to set
   */
  set(appId: string, key: string, value: unknown): Promise<void>;

  /**
   * Get all config for an app
   * @param appId - Application identifier
   */
  getAll(appId: string): Promise<Record<string, unknown>>;

  /**
   * Set multiple config values at once
   * @param appId - Application identifier
   * @param config - Config object to merge
   */
  setAll(appId: string, config: Record<string, unknown>): Promise<void>;

  /**
   * Watch for config changes
   * @param appId - Application identifier
   * @param callback - Callback when config changes
   * @returns Unsubscribe function
   */
  watch(appId: string, callback: ConfigWatcher): () => void;

  /**
   * Delete a config key
   * @param appId - Application identifier
   * @param key - Config key to delete
   */
  delete(appId: string, key: string): Promise<void>;

  /**
   * Reset all config for an app
   * @param appId - Application identifier
   */
  reset(appId: string): Promise<void>;

  /**
   * Check if config exists for an app
   * @param appId - Application identifier
   */
  exists(appId: string): Promise<boolean>;

  /**
   * Get the config directory path for an app
   * @param appId - Application identifier
   */
  getConfigPath(appId: string): string;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Delete nested value from object using dot notation
 */
function deleteNestedValue(obj: Record<string, unknown>, path: string): boolean {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      return false;
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  return false;
}

/**
 * Config Manager implementation
 */
class ConfigManagerImpl implements ConfigManager {
  private watchers: Map<string, Set<ConfigWatcher>> = new Map();
  private vfsWatchers: Map<string, () => void> = new Map();
  private configCache: Map<string, Record<string, unknown>> = new Map();
  private initialized = false;

  /**
   * Initialize the config manager and ensure base directory exists
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Ensure the base .config directory exists
    const configExists = await vfs.exists(CONFIG_BASE);
    if (!configExists) {
      await vfs.mkdir(CONFIG_BASE, true);
    }

    this.initialized = true;
  }

  /**
   * Get the config directory path for an app
   */
  getConfigPath(appId: string): string {
    return `${CONFIG_BASE}/${appId}`;
  }

  /**
   * Get the settings.json path for an app
   */
  private getSettingsPath(appId: string): string {
    return `${this.getConfigPath(appId)}/settings.json`;
  }

  /**
   * Ensure app config directory exists
   */
  private async ensureAppConfigDir(appId: string): Promise<void> {
    await this.init();
    const appConfigPath = this.getConfigPath(appId);
    const exists = await vfs.exists(appConfigPath);
    if (!exists) {
      await vfs.mkdir(appConfigPath, true);
    }
  }

  /**
   * Load config from VFS
   */
  private async loadConfig(appId: string): Promise<Record<string, unknown>> {
    // Check cache first
    if (this.configCache.has(appId)) {
      return this.configCache.get(appId)!;
    }

    await this.ensureAppConfigDir(appId);
    const settingsPath = this.getSettingsPath(appId);

    try {
      const exists = await vfs.exists(settingsPath);
      if (exists) {
        const config = await vfs.readJsonFile<Record<string, unknown>>(settingsPath);
        this.configCache.set(appId, config);
        return config;
      }
    } catch (error) {
      console.warn(`[ConfigManager] Failed to load config for ${appId}:`, error);
    }

    // Return empty config if file doesn't exist or failed to load
    const emptyConfig: Record<string, unknown> = {};
    this.configCache.set(appId, emptyConfig);
    return emptyConfig;
  }

  /**
   * Save config to VFS
   */
  private async saveConfig(appId: string, config: Record<string, unknown>): Promise<void> {
    await this.ensureAppConfigDir(appId);
    const settingsPath = this.getSettingsPath(appId);

    // Update cache
    this.configCache.set(appId, config);

    // Write to VFS
    await vfs.writeFile(settingsPath, JSON.stringify(config, null, 2));

    // Notify watchers
    this.notifyWatchers(appId, config);
  }

  /**
   * Notify all watchers for an app
   */
  private notifyWatchers(appId: string, config: Record<string, unknown>): void {
    const watchers = this.watchers.get(appId);
    if (watchers) {
      watchers.forEach(callback => {
        try {
          callback(config);
        } catch (error) {
          console.error(`[ConfigManager] Error in config watcher for ${appId}:`, error);
        }
      });
    }
  }

  async get<T>(appId: string, key: string, defaultValue?: T): Promise<T | undefined> {
    const config = await this.loadConfig(appId);
    const value = getNestedValue(config, key);
    return (value !== undefined ? value : defaultValue) as T | undefined;
  }

  async set(appId: string, key: string, value: unknown): Promise<void> {
    const config = await this.loadConfig(appId);
    setNestedValue(config, key, value);
    await this.saveConfig(appId, config);
  }

  async getAll(appId: string): Promise<Record<string, unknown>> {
    return this.loadConfig(appId);
  }

  async setAll(appId: string, newConfig: Record<string, unknown>): Promise<void> {
    const config = await this.loadConfig(appId);
    const merged = { ...config, ...newConfig };
    await this.saveConfig(appId, merged);
  }

  watch(appId: string, callback: ConfigWatcher): () => void {
    // Initialize watcher set for this app
    if (!this.watchers.has(appId)) {
      this.watchers.set(appId, new Set());
    }

    this.watchers.get(appId)!.add(callback);

    // Set up VFS watcher if not already watching
    if (!this.vfsWatchers.has(appId)) {
      const settingsPath = this.getSettingsPath(appId);
      const unsubscribe = vfs.watch(settingsPath, async (event: FSEvent) => {
        if (event.type === 'modify' || event.type === 'create') {
          // Invalidate cache and reload
          this.configCache.delete(appId);
          const config = await this.loadConfig(appId);
          this.notifyWatchers(appId, config);
        } else if (event.type === 'delete') {
          this.configCache.delete(appId);
          this.notifyWatchers(appId, {});
        }
      });
      this.vfsWatchers.set(appId, unsubscribe);
    }

    // Return unsubscribe function
    return () => {
      const watchers = this.watchers.get(appId);
      if (watchers) {
        watchers.delete(callback);
        // Clean up VFS watcher if no more watchers
        if (watchers.size === 0) {
          this.watchers.delete(appId);
          const vfsUnsubscribe = this.vfsWatchers.get(appId);
          if (vfsUnsubscribe) {
            vfsUnsubscribe();
            this.vfsWatchers.delete(appId);
          }
        }
      }
    };
  }

  async delete(appId: string, key: string): Promise<void> {
    const config = await this.loadConfig(appId);
    if (deleteNestedValue(config, key)) {
      await this.saveConfig(appId, config);
    }
  }

  async reset(appId: string): Promise<void> {
    const settingsPath = this.getSettingsPath(appId);

    try {
      const exists = await vfs.exists(settingsPath);
      if (exists) {
        await vfs.rm(settingsPath);
      }
    } catch (error) {
      console.warn(`[ConfigManager] Failed to reset config for ${appId}:`, error);
    }

    // Clear cache
    this.configCache.delete(appId);

    // Notify watchers with empty config
    this.notifyWatchers(appId, {});
  }

  async exists(appId: string): Promise<boolean> {
    const settingsPath = this.getSettingsPath(appId);
    return vfs.exists(settingsPath);
  }
}

// Singleton export
export const configManager = new ConfigManagerImpl();

// Initialize on import (will be lazy, only when first used)
if (typeof window !== 'undefined') {
  configManager.init().catch(console.error);
}
