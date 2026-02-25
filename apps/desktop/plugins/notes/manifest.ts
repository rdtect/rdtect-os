import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'notes',
  name: 'Notes',
  version: '1.0.0',
  type: 'native',
  icon: '📒',
  description: 'Simple notes app using Web Components',
  access: 'protected',
  entry: './src/Notes.svelte',
  defaultWidth: 400,
  defaultHeight: 500,
  minWidth: 300,
  minHeight: 300,
  singleton: false,
  resizable: true
};

export default manifest;
