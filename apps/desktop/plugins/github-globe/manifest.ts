import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'github-globe',
  name: 'GitHub Activity',
  version: '1.0.0',
  type: 'native',
  icon: '🌍',
  description: 'Interactive 3D globe visualization',
  category: 'showcase',
  priority: 50,
  showOnDesktop: true,
  access: 'free',
  entry: './src/GithubGlobe.svelte',
  defaultWidth: 600,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 400,
  singleton: true,
  resizable: true
};

export default manifest;
