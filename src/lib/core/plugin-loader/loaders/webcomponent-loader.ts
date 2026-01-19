/**
 * WebComponent Loader - Loads custom element plugins
 *
 * WebComponent plugins are standard Custom Elements that can be used
 * anywhere in the DOM. They use Shadow DOM for encapsulation.
 */
import type { PluginManifest, LoadedPlugin, PluginTypeLoader } from '$lib/core/types';

export class WebComponentLoader implements PluginTypeLoader {
  private registeredElements: Set<string> = new Set();

  canLoad(manifest: PluginManifest): boolean {
    return manifest.type === 'webcomponent';
  }

  async load(manifest: PluginManifest, _basePath?: string): Promise<LoadedPlugin> {
    if (!manifest.entry) {
      throw new Error(`WebComponent plugin ${manifest.id} must have an entry point`);
    }

    // Generate tag name from plugin id (e.g., 'notes-webcomponent' -> 'notes-widget')
    const tagName = `${manifest.id.replace(/-webcomponent$/, '')}-widget`;

    // Only register if not already registered
    if (!this.registeredElements.has(tagName) && !customElements.get(tagName)) {
      try {
        // Dynamic import of the custom element class
        const module = await import(/* @vite-ignore */ manifest.entry);
        const ElementClass = module.default;

        if (!ElementClass || !(ElementClass.prototype instanceof HTMLElement)) {
          throw new Error(`WebComponent plugin ${manifest.id} must export an HTMLElement class`);
        }

        customElements.define(tagName, ElementClass);
        this.registeredElements.add(tagName);
      } catch (error) {
        throw new Error(`Failed to load webcomponent plugin ${manifest.id}: ${error}`);
      }
    }

    return {
      manifest,
      type: 'webcomponent',
      render: {
        kind: 'webcomponent',
        tagName,
      },
    };
  }

  async unload(plugin: LoadedPlugin): Promise<void> {
    // Custom elements cannot be unregistered from the registry
    // But we can remove instances from DOM (handled by window manager)
  }
}
