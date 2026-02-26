import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'stories',
  name: 'Stories',
  version: '1.0.0',
  type: 'native',
  icon: '\u{1F4D6}',
  description: 'Multi-format content engine — articles, slide decks, and immersive scrolls',
  category: 'showcase',
  priority: 15,
  showOnDesktop: true,
  access: 'free',
  entry: './src/Stories.svelte',
  defaultWidth: 900,
  defaultHeight: 650,
  minWidth: 600,
  minHeight: 500,
  singleton: false,
  resizable: true,
  tags: ['blog', 'articles', 'stories', 'MRAX', 'thought-leadership']
};

export default manifest;
