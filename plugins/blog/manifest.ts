const manifest = {
  id: 'blog',
  name: 'Blog',
  version: '1.0.0',
  type: 'native',
  icon: 'article',
  description: 'Technical blog with articles and thoughts',
  access: 'free',
  entry: './src/Blog.svelte',
  defaultWidth: 900,
  defaultHeight: 700,
  minWidth: 600,
  minHeight: 500,
  singleton: false,
  resizable: true
};

export default manifest;
