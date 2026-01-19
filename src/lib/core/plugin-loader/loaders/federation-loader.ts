/**
 * Federation Loader - Loads Module Federation remotes
 *
 * Federation plugins are Svelte components exposed via Webpack/Vite Module Federation.
 * They're loaded at runtime from a remote URL and can share dependencies with the host.
 *
 * Supports two loading strategies:
 * 1. Vite Plugin Federation (via dynamic import with virtual module)
 * 2. Traditional container approach (fallback for Webpack-style federation)
 */
import { browser } from '$app/environment';
import type { PluginManifest, LoadedPlugin, PluginTypeLoader } from '$lib/core/types';

// Type for traditional Module Federation container
interface FederationContainer {
  init(shareScope: unknown): Promise<void>;
  get(module: string): Promise<() => { default: unknown }>;
}

// Extended Window type for federation containers
interface WindowWithFederation extends Window {
  __federation_shared__?: Record<string, unknown>;
  [key: string]: unknown;
}

// Mapping of remote names to their Vite federation import paths
// NOTE: Vite federation imports are unreliable with SvelteKit, so we use container-based loading
// This map is kept for reference but not used - we go straight to container loading
const VITE_FEDERATION_REMOTES: Record<string, string> = {
  // Empty - use container-based loading for reliability
};

// Get typed window for federation - only access on client side
function getFederationWindow(): WindowWithFederation | null {
  if (!browser) return null;
  return window as unknown as WindowWithFederation;
}

export class FederationLoader implements PluginTypeLoader {
  private loadedContainers: Map<string, FederationContainer> = new Map();
  private loadedModules: Map<string, unknown> = new Map();

  canLoad(manifest: PluginManifest): boolean {
    return manifest.type === 'federation';
  }

  async load(manifest: PluginManifest, basePath?: string): Promise<LoadedPlugin> {
    if (!manifest.remote) {
      throw new Error(`Federation plugin ${manifest.id} must have remote configuration`);
    }

    const { entry: remoteEntry } = manifest.remote;

    // If manifest has a local entry (Svelte wrapper), load that instead
    // The Svelte wrapper will handle mounting the React/remote component
    if (manifest.entry && manifest.entry.endsWith('.svelte')) {
      try {
        // Load the local Svelte wrapper component
        const entryPath = basePath
          ? `${basePath}/${manifest.entry.replace('./', '')}`
          : manifest.entry;

        const module = await import(/* @vite-ignore */ entryPath);
        const component = module.default;

        if (component) {
          return {
            manifest,
            type: 'federation',
            render: {
              kind: 'component',  // Render as Svelte component, wrapper handles React internally
              component: component as import('svelte').Component,
            },
          };
        }
      } catch (error) {
        console.warn(`[Federation] Failed to load Svelte wrapper for ${manifest.id}:`, error);
        return this.createOfflinePlugin(manifest, remoteEntry, `Failed to load wrapper: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // No local wrapper - try to load remote directly (for pure federation plugins)
    if (!browser) {
      return this.createOfflinePlugin(manifest, remoteEntry, 'Federation plugins can only be loaded in the browser');
    }

    try {
      const { exposedModule } = manifest.remote;

      // Import the remote entry as an ES module
      const remote = await import(/* @vite-ignore */ remoteEntry) as FederationContainer;

      // Initialize shared scope
      const shareScope = (globalThis as any).__federation_shared__ || {};
      await remote.init(shareScope);

      // Get the exposed module
      const factory = await remote.get(exposedModule);
      const module = await factory();
      const component = (module as { default?: unknown }).default || module;

      if (component) {
        return {
          manifest,
          type: 'federation',
          render: {
            kind: 'federation',
            component: component as import('svelte').Component,
          },
        };
      }

      return this.createOfflinePlugin(manifest, remoteEntry, 'Module has no default export');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Federation] Failed to load ${manifest.id}: ${errorMessage}`);
      return this.createOfflinePlugin(manifest, remoteEntry, errorMessage);
    }
  }

  /**
   * Create an offline plugin state for when the remote is unavailable
   */
  private createOfflinePlugin(manifest: PluginManifest, remoteUrl: string, error: string): LoadedPlugin {
    return {
      manifest,
      type: 'federation',
      render: {
        kind: 'federation-offline',
        remoteUrl,
        error,
      },
    };
  }

  /**
   * Load a component via Vite Plugin Federation's dynamic import
   */
  private async loadViteFederation(_name: string, remotePath: string): Promise<unknown> {
    // Check if already loaded
    if (this.loadedModules.has(remotePath)) {
      return this.loadedModules.get(remotePath);
    }

    try {
      // Dynamic import using Vite's federation virtual module
      // The path format is: 'remoteName/exposedModule'
      const module = await import(/* @vite-ignore */ remotePath);
      const component = module.default || module;

      this.loadedModules.set(remotePath, component);
      return component;
    } catch (error) {
      console.warn(`Vite federation import failed for ${remotePath}, falling back to container:`, error);
      return null;
    }
  }

  async unload(_plugin: LoadedPlugin): Promise<void> {
    // Federation modules are cached by the browser
    // No special cleanup needed
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already loaded
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.type = 'module';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Load a script with a timeout - useful for detecting offline remotes
   */
  private loadScriptWithTimeout(url: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already loaded
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.type = 'module';

      // Set up timeout
      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout loading script: ${url}`));
      }, timeoutMs);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error(`Failed to load script: ${url}`));
      };

      document.head.appendChild(script);
    });
  }
}
