import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'tictactoe',
  name: 'Tic Tac Toe',
  version: '1.0.0',
  type: 'native',
  icon: '⭕',
  description: 'Classic Tic Tac Toe with AI opponent',
  category: 'games',
  priority: 20,
  tags: ['game', 'tictactoe', 'puzzle', 'ai', 'classic'],
  access: 'free',
  entry: './src/TicTacToe.svelte',
  defaultWidth: 400,
  defaultHeight: 450,
  minWidth: 350,
  minHeight: 400,
  singleton: true,
  resizable: true,
};

export default manifest;
