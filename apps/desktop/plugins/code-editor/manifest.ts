import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'code-editor-native',
  name: 'Code Editor',
  version: '1.0.0',
  type: 'native',
  icon: '💻',
  description: 'A code editor with Python execution support via Pyodide (WebAssembly)',
  category: 'studio',
  priority: 20,
  pinnedToTaskbar: true,
  access: 'protected',
  entry: './src/CodeEditor.svelte',
  defaultWidth: 900,
  defaultHeight: 650,
  minWidth: 600,
  minHeight: 450,
  singleton: false,
  resizable: true,
  permissions: []
};

export default manifest;
