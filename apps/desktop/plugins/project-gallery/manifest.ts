import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'project-gallery',
  name: 'Project Gallery',
  version: '1.0.0',
  type: 'native',
  icon: '🖼️',
  description: 'A stunning portfolio gallery showcasing projects with live demos',
  category: 'showcase',
  priority: 20,
  showOnDesktop: true,
  pinnedToTaskbar: true,
  access: 'free',
  entry: './src/ProjectGallery.svelte',
  defaultWidth: 900,
  defaultHeight: 650,
  minWidth: 700,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
