const manifest = {
  id: 'flappy-bird',
  name: 'Flappy Bird',
  version: '1.0.0',
  type: 'native',
  icon: '🐦',
  description: 'Classic Flappy Bird game using Canvas',
  entry: './src/FlappyBird.svelte',
  defaultWidth: 400,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 600,
  singleton: true,
  resizable: false
};

export default manifest;
