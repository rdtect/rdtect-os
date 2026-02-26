import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'about-me',
  name: 'About Me',
  version: '1.0.0',
  type: 'native',
  icon: '👤',
  description: 'Personal portfolio and about me showcase',
  category: 'showcase',
  priority: 10,
  showOnDesktop: true,
  pinnedToTaskbar: true,
  access: 'free',
  entry: './src/AboutMe.svelte',
  defaultWidth: 800,
  defaultHeight: 700,
  minWidth: 600,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
