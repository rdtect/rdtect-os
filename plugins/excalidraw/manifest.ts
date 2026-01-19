const manifest = {
  id: 'excalidraw',
  name: 'Excalidraw',
  version: '1.0.0',
  type: 'federation',
  icon: '🎨',
  description: 'Virtual whiteboard for sketching hand-drawn like diagrams',
  entry: './src/ExcalidrawApp.svelte',
  remote: {
    name: 'excalidrawRemote',
    entry: '/federation/excalidraw/assets/remoteEntry.js',
    exposedModule: './Excalidraw'
  },
  defaultWidth: 900,
  defaultHeight: 650,
  minWidth: 600,
  minHeight: 450,
  singleton: false,
  resizable: true
};

export default manifest;
