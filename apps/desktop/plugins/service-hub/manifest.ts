import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'service-hub',
  name: 'Service Hub',
  version: '1.0.0',
  type: 'native',
  icon: '🖧',
  description: 'Dashboard for self-hosted VPS services — launch, monitor, manage',
  category: 'admin',
  priority: 10,
  showOnDesktop: true,
  tags: ['services', 'vps', 'infrastructure', 'dashboard', 'admin'],
  access: 'free',
  entry: './src/ServiceHub.svelte',
  defaultWidth: 800,
  defaultHeight: 600,
  minWidth: 600,
  minHeight: 450,
  singleton: true,
  resizable: true
};

export default manifest;
