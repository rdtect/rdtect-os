const manifest = {
  id: 'markdown-editor-native',
  name: 'Markdown Editor',
  version: '1.0.0',
  type: 'native',
  icon: '📝',
  description: 'A full-featured Markdown editor with live preview, syntax highlighting, and keyboard shortcuts',
  access: 'protected',
  entry: './src/MarkdownEditor.svelte',
  defaultWidth: 900,
  defaultHeight: 600,
  minWidth: 600,
  minHeight: 400,
  singleton: false,
  resizable: true,
  permissions: []
};

export default manifest;
