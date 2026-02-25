import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'pocketbase-admin',
  name: 'Database Admin',
  version: '1.0.0',
  type: 'native',
  icon: '🗄️',
  description: 'PocketBase Admin Dashboard',
  access: 'protected',
  entry: './src/PocketBaseAdmin.svelte',
  defaultWidth: 1200,
  defaultHeight: 800,
  minWidth: 800,
  minHeight: 600,
  singleton: true,
  resizable: true
};

export default manifest;
