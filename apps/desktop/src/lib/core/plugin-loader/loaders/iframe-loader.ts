/**
 * Iframe Loader - Loads external apps in sandboxed iframes
 *
 * Iframe plugins are completely isolated and communicate via postMessage.
 * They're ideal for third-party apps or existing web applications.
 */
import type { PluginManifest, LoadedPlugin, PluginTypeLoader } from '$lib/core/types';

export class IframeLoader implements PluginTypeLoader {
  canLoad(manifest: PluginManifest): boolean {
    return manifest.type === 'iframe';
  }

  async load(manifest: PluginManifest, _basePath?: string): Promise<LoadedPlugin> {
    if (!manifest.url) {
      throw new Error(`Iframe plugin ${manifest.id} must have a URL`);
    }

    // Iframe plugins don't need actual loading - the browser handles it
    // We just validate and return the configuration
    return {
      manifest,
      type: 'iframe',
      render: {
        kind: 'iframe',
        url: manifest.url,
        sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals',
      },
    };
  }

  async unload(plugin: LoadedPlugin): Promise<void> {
    // Iframe cleanup is handled by the DOM when the iframe is removed
  }
}
