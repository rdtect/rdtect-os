import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'file-browser',
  name: 'Files',
  version: '2.0.0',
  type: 'native',
  icon: '📁',
  description: 'Full-featured file manager with grid/list views, breadcrumb navigation, and file operations',
  category: 'desktop',
  priority: 20,
  pinnedToTaskbar: true,
  access: 'protected',
  entry: './src/FileBrowser.svelte',
  defaultWidth: 900,
  defaultHeight: 600,
  minWidth: 600,
  minHeight: 400,
  singleton: false,
  resizable: true
};

export default manifest;
