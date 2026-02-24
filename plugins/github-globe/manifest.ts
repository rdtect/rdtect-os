const manifest = {
  id: 'github-globe',
  name: 'Globe',
  version: '1.0.0',
  type: 'native',
  icon: '🌍',
  description: 'Interactive 3D globe visualization',
  access: 'free',
  entry: './src/GithubGlobe.svelte',
  defaultWidth: 600,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 400,
  singleton: true,
  resizable: true
};

export default manifest;
