import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest & { autoOpen: boolean; storageKey: string } = {
  id: 'welcome',
  name: 'Welcome',
  version: '1.0.0',
  type: 'native',
  icon: '👋',
  description: 'Welcome wizard for first-time visitors to rdtect OS',
  access: 'free',
  entry: './src/Welcome.svelte',
  defaultWidth: 700,
  defaultHeight: 550,
  minWidth: 600,
  minHeight: 450,
  singleton: true,
  resizable: false,
  // Custom properties for auto-open behavior
  autoOpen: true,
  storageKey: 'rdtect-os-welcome-dismissed'
};

export default manifest;
