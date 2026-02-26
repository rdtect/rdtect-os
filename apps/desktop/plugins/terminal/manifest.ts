import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'terminal-native',
  name: 'Terminal',
  version: '1.0.0',
  type: 'native',
  icon: '💻',
  description: 'A terminal emulator with simulated commands and fake filesystem',
  category: 'studio',
  priority: 10,
  showOnDesktop: true,
  pinnedToTaskbar: true,
  access: 'protected',
  entry: './src/Terminal.svelte',
  defaultWidth: 600,
  defaultHeight: 400,
  minWidth: 400,
  minHeight: 300,
  singleton: false,
  resizable: true
};

export default manifest;
