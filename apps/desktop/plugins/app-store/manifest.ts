import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'app-store',
  name: 'App Store',
  version: '1.0.0',
  type: 'native',
  icon: '🏪',
  description: 'Browse, discover and launch all available apps',
  category: 'desktop',
  priority: 40,
  showOnDesktop: true,
  tags: ['apps', 'store', 'install', 'discover'],
  access: 'free',
  entry: './src/AppStore.svelte',
  defaultWidth: 750,
  defaultHeight: 550,
  minWidth: 600,
  minHeight: 500,
  singleton: true,
  resizable: true,
};

export default manifest;
