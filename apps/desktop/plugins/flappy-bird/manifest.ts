import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'flappy-bird',
  name: 'Flappy Bird',
  version: '1.0.0',
  type: 'native',
  icon: '🐦',
  description: 'Classic Flappy Bird game using Canvas',
  category: 'games',
  priority: 30,
  tags: ['game', 'flappy-bird', 'arcade', 'classic'],
  access: 'free',
  entry: './src/FlappyBird.svelte',
  defaultWidth: 400,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 600,
  singleton: true,
  resizable: false
};

export default manifest;
