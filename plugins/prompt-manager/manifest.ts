const manifest = {
  id: 'prompt-manager',
  name: 'Prompt Manager',
  version: '2.0.0',
  type: 'native',
  icon: '📝',
  description: 'Manage and organize AI prompts',
  access: 'protected',
  entry: './src/PromptManager.svelte',
  defaultWidth: 600,
  defaultHeight: 550,
  minWidth: 450,
  minHeight: 400,
  singleton: true,
  resizable: true
};

export default manifest;
