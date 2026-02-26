import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'blog',
  name: 'Blog',
  version: '1.0.0',
  type: 'native',
  icon: '📰',
  description: 'Technical blog with articles and thoughts',
  category: 'showcase',
  priority: 30,
  showOnDesktop: true,
  access: 'free',
  entry: './src/Blog.svelte',
  defaultWidth: 900,
  defaultHeight: 700,
  minWidth: 600,
  minHeight: 500,
  singleton: false,
  resizable: true
};

export default manifest;
