const manifest = {
  id: 'image-filter',
  name: 'Image Filter',
  version: '1.0.0',
  type: 'native',
  icon: '🖼️',
  description: 'Apply image filters - grayscale, brightness, contrast, blur, sharpen, and more',
  access: 'free',
  entry: './src/ImageFilter.svelte',
  defaultWidth: 600,
  defaultHeight: 700,
  minWidth: 500,
  minHeight: 600,
  singleton: false,
  resizable: true
};

export default manifest;
