const manifest = {
  id: 'agent-manager',
  name: 'Agent Manager',
  version: '1.0.0',
  type: 'native',
  icon: '🤖',
  description: 'Monitor and manage AI agents - like a Task Manager for AI',
  access: 'protected',
  entry: './src/AgentManager.svelte',
  defaultWidth: 720,
  defaultHeight: 600,
  minWidth: 600,
  minHeight: 500,
  singleton: true,
  resizable: true
};

export default manifest;
