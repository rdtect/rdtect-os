const manifest = {
  id: 'ai-chat',
  name: 'AI Chat',
  version: '2.0.0',
  type: 'native',
  icon: '🤖',
  description: 'AI-powered chat assistant using SvelteKit remote functions',
  access: 'protected',
  entry: './src/AIChat.svelte',
  defaultWidth: 500,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 450,
  singleton: true,
  resizable: true
};

export default manifest;
