/**
 * Native Loader - Loads Svelte 5 component plugins
 *
 * Native plugins are Svelte components bundled as ES modules.
 * They have full access to the host environment and shared state.
 *
 * Supports two entry path formats:
 * 1. Absolute paths starting with '$lib/' - resolved by Vite/SvelteKit
 * 2. Relative paths starting with './' - resolved against basePath (e.g., "./src/Clock.svelte")
 */
import type { PluginManifest, LoadedPlugin, PluginTypeLoader } from '$lib/core/types';

// Pre-build a glob of all plugin components for Vite to statically analyze
// This enables dynamic imports of plugin components at runtime
const pluginModules = import.meta.glob('/plugins/*/src/**/*.svelte');

export class NativeLoader implements PluginTypeLoader {
  canLoad(manifest: PluginManifest): boolean {
    return manifest.type === 'native';
  }

  /**
   * Resolve the full module path from manifest entry and base path
   */
  private resolveModulePath(entry: string, basePath?: string): string {
    // Handle relative paths (new plugin structure: "./src/Component.svelte")
    if (entry.startsWith('./')) {
      if (!basePath) {
        throw new Error(`Relative entry path "${entry}" requires a basePath`);
      }
      // Remove leading "./" and combine with basePath
      // basePath: "/plugins/calculator", entry: "./src/Calculator.svelte"
      // Result: "/plugins/calculator/src/Calculator.svelte"
      return `${basePath}/${entry.slice(2)}`;
    }

    // Handle $lib paths (legacy format) - return as-is for Vite to resolve
    if (entry.startsWith('$lib/')) {
      return entry;
    }

    // Handle absolute paths starting with /
    if (entry.startsWith('/')) {
      return entry;
    }

    // Unknown format - treat as absolute path
    return entry;
  }

  async load(manifest: PluginManifest, basePath?: string): Promise<LoadedPlugin> {
    if (!manifest.entry) {
      throw new Error(`Native plugin ${manifest.id} must have an entry point`);
    }

    const modulePath = this.resolveModulePath(manifest.entry, basePath);
    let component;

    try {
      // Check if this is a $lib path (legacy format)
      if (modulePath.startsWith('$lib/')) {
        // Dynamic import with @vite-ignore for $lib paths
        const module = await import(/* @vite-ignore */ modulePath);
        component = module.default;
      } else {
        // For /plugins/... paths, use the pre-built glob
        const loader = pluginModules[modulePath];
        if (loader) {
          const module = await loader();
          component = (module as { default: unknown }).default;
        } else {
          // Fallback to dynamic import with @vite-ignore
          const module = await import(/* @vite-ignore */ modulePath);
          component = module.default;
        }
      }
    } catch (error) {
      throw new Error(`Failed to load native plugin ${manifest.id} from "${modulePath}": ${error}`);
    }

    if (!component) {
      throw new Error(`Native plugin ${manifest.id} did not export a default component`);
    }

    return {
      manifest,
      type: 'native',
      render: {
        kind: 'component',
        component,
      },
    };
  }

  async unload(plugin: LoadedPlugin): Promise<void> {
    // Native plugins don't need special cleanup
    // Component lifecycle is handled by Svelte
  }
}
