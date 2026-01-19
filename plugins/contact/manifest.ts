const manifest = {
  id: 'contact',
  name: 'Contact',
  version: '1.0.0',
  type: 'native',
  icon: 'mail',
  description: 'Contact form to reach out to rdtect',
  entry: './src/Contact.svelte',
  defaultWidth: 480,
  defaultHeight: 600,
  minWidth: 380,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
