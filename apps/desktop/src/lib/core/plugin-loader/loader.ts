/**
 * Main Plugin Loader
 *
 * Coordinates loading of all plugin types by delegating to type-specific loaders.
 */
import type { PluginManifest, LoadedPlugin, PluginTypeLoader } from '$lib/core/types';
import { NativeLoader } from './loaders/native-loader';
import { IframeLoader } from './loaders/iframe-loader';
import { WebComponentLoader } from './loaders/webcomponent-loader';
import { FederationLoader } from './loaders/federation-loader';
import { WasmLoader } from './loaders/wasm-loader';

export class PluginLoader {
  private loaders: PluginTypeLoader[] = [];
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();

  constructor() {
    // Register all type-specific loaders
    this.loaders = [
      new NativeLoader(),
      new IframeLoader(),
      new WebComponentLoader(),
      new FederationLoader(),
      new WasmLoader(),
    ];
  }

  /**
   * Load a plugin from its manifest
   * @param manifest - The plugin manifest
   * @param basePath - Optional base path for resolving relative entry paths (e.g., "/plugins/calculator")
   */
  async load(manifest: PluginManifest, basePath?: string): Promise<LoadedPlugin> {
    // Check if already loaded
    const existing = this.loadedPlugins.get(manifest.id);
    if (existing) {
      return existing;
    }

    // Find appropriate loader
    const loader = this.loaders.find(l => l.canLoad(manifest));
    if (!loader) {
      throw new Error(`No loader found for plugin type: ${manifest.type}`);
    }

    // Load the plugin
    const plugin = await loader.load(manifest, basePath);
    this.loadedPlugins.set(manifest.id, plugin);

    // Call onInit if present
    if (plugin.onInit) {
      await plugin.onInit();
    }

    return plugin;
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) return;

    // Find appropriate loader
    const loader = this.loaders.find(l => l.canLoad(plugin.manifest));
    if (loader) {
      await loader.unload(plugin);
    }

    // Call onDestroy if present
    if (plugin.onDestroy) {
      await plugin.onDestroy();
    }

    this.loadedPlugins.delete(pluginId);
  }

  /**
   * Get a loaded plugin
   */
  get(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getAll(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Check if a plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }
}

// Singleton export
export const pluginLoader = new PluginLoader();
