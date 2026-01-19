const manifest = {
  id: 'terminal-native',
  name: 'Terminal',
  version: '1.0.0',
  type: 'native',
  icon: '💻',
  description: 'A terminal emulator with simulated commands and fake filesystem',
  entry: './src/Terminal.svelte',
  defaultWidth: 600,
  defaultHeight: 400,
  minWidth: 400,
  minHeight: 300,
  singleton: false,
  resizable: true
};

export default manifest;
