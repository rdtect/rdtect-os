import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest & { storageKey: string } = {
  id: 'welcome',
  name: 'Welcome',
  version: '1.0.0',
  type: 'native',
  icon: '👋',
  description: 'Welcome wizard for first-time visitors to rdtect OS',
  category: 'showcase',
  priority: 60,
  autoOpen: 'first-visit',
  access: 'free',
  entry: './src/Welcome.svelte',
  defaultWidth: 700,
  defaultHeight: 550,
  minWidth: 600,
  minHeight: 450,
  singleton: true,
  resizable: false,
  storageKey: 'rdtect-os-welcome-dismissed'
};

export default manifest;
