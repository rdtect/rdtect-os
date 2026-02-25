import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'knowledge-base',
  name: 'Knowledge Base',
  version: '1.0.0',
  type: 'native',
  icon: '🧠',
  description: 'Obsidian-like knowledge management with backlinks and graph view',
  category: 'tools',
  access: 'protected',
  entry: './src/KnowledgeBase.svelte',
  defaultWidth: 950,
  defaultHeight: 700,
  minWidth: 700,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
