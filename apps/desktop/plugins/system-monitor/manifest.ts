import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'system-monitor-native',
  name: 'System Monitor',
  version: '2.0.0',
  type: 'native',
  icon: '📊',
  description: 'Comprehensive system monitor with FPS tracking, memory usage, network activity, app usage statistics, and plugin analytics in a tabbed interface',
  category: 'utilities',
  access: 'protected',
  entry: './src/SystemMonitor.svelte',
  defaultWidth: 480,
  defaultHeight: 650,
  minWidth: 400,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
