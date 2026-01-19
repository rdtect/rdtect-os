const manifest = {
  id: 'file-browser',
  name: 'Files',
  version: '2.0.0',
  type: 'native',
  icon: '📁',
  description: 'Full-featured file manager with grid/list views, breadcrumb navigation, and file operations',
  entry: './src/FileBrowser.svelte',
  defaultWidth: 900,
  defaultHeight: 600,
  minWidth: 600,
  minHeight: 400,
  singleton: false,
  resizable: true
};

export default manifest;
