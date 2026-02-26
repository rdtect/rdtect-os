import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'image-filter',
  name: 'Image Filter',
  version: '1.0.0',
  type: 'native',
  icon: '🖼️',
  description: 'Apply image filters - grayscale, brightness, contrast, blur, sharpen, and more',
  category: 'creative',
  priority: 30,
  access: 'free',
  entry: './src/ImageFilter.svelte',
  defaultWidth: 600,
  defaultHeight: 700,
  minWidth: 500,
  minHeight: 600,
  singleton: false,
  resizable: true
};

export default manifest;
