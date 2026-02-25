import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'calculator-native',
  name: 'Calculator',
  version: '1.0.0',
  type: 'native',
  icon: '🧮',
  description: 'A full-featured calculator with memory functions and keyboard support',
  category: 'utilities',
  access: 'free',
  entry: './src/Calculator.svelte',
  defaultWidth: 320,
  defaultHeight: 480,
  minWidth: 280,
  minHeight: 400,
  singleton: true,
  resizable: true
};

export default manifest;
