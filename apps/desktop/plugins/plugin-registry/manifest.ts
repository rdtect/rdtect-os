import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'plugin-registry',
  name: 'App Store',
  version: '1.0.0',
  type: 'native',
  icon: '🏪',
  description: 'Browse and launch all available apps',
  access: 'free',
  entry: './src/PluginRegistry.svelte',
  defaultWidth: 780,
  defaultHeight: 600,
  minWidth: 600,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
