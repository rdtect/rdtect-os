import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'solitaire',
  name: 'Solitaire',
  version: '1.0.0',
  type: 'native',
  icon: '🃏',
  description: 'Classic Klondike solitaire card game',
  category: 'games',
  priority: 10,
  tags: ['game', 'solitaire', 'cards', 'classic', 'klondike'],
  access: 'free',
  entry: './src/Solitaire.svelte',
  defaultWidth: 700,
  defaultHeight: 500,
  minWidth: 600,
  minHeight: 450,
  singleton: true,
  resizable: true,
};

export default manifest;
