import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'kanban',
  name: 'Kanban Board',
  version: '1.0.0',
  type: 'native',
  icon: '📋',
  description: 'Drag-and-drop kanban board for task management',
  category: 'studio',
  priority: 35,
  tags: ['kanban', 'tasks', 'productivity', 'board', 'project'],
  access: 'free',
  entry: './src/Kanban.svelte',
  defaultWidth: 800,
  defaultHeight: 500,
  minWidth: 600,
  minHeight: 400,
  singleton: true,
  resizable: true,
};

export default manifest;
