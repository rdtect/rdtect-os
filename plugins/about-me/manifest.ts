const manifest = {
  id: 'about-me',
  name: 'About Me',
  version: '1.0.0',
  type: 'native' as const,
  icon: '👤',
  description: 'Personal portfolio and about me showcase',
  access: 'free',
  entry: './src/AboutMe.svelte',
  defaultWidth: 800,
  defaultHeight: 700,
  minWidth: 600,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
