import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'weather-native',
  name: 'Weather',
  version: '1.0.0',
  type: 'native',
  icon: '🌤️',
  description: 'A beautiful weather widget with current conditions and 5-day forecast',
  category: 'desktop',
  priority: 50,
  access: 'free',
  entry: './src/Weather.svelte',
  defaultWidth: 350,
  defaultHeight: 400,
  minWidth: 300,
  minHeight: 350,
  singleton: true,
  resizable: true
};

export default manifest;
