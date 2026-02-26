export interface VpsService {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  group: 'platform' | 'ai' | 'automation' | 'monitoring' | 'data';
  tags: string[];
}

export const services: VpsService[] = [
  {
    id: 'coolify',
    name: 'Coolify',
    description: 'Self-hosted deployment platform — push to deploy',
    url: 'https://coolify.rdtect.com',
    icon: '🚀',
    group: 'platform',
    tags: ['deploy', 'hosting', 'docker']
  },
  {
    id: 'homepage',
    name: 'Homepage',
    description: 'Server dashboard with service monitoring',
    url: 'https://home.rdtect.com',
    icon: '🏠',
    group: 'monitoring',
    tags: ['dashboard', 'home', 'overview']
  },
  {
    id: 'open-webui',
    name: 'Open WebUI',
    description: 'Multi-model AI chat — Ollama, OpenAI, Claude',
    url: 'https://ai.rdtect.com',
    icon: '🧠',
    group: 'ai',
    tags: ['ai', 'chat', 'llm', 'ollama']
  },
  {
    id: 'rapidai-api',
    name: 'RapidAI API',
    description: 'AI API gateway — unified endpoint for multiple models',
    url: 'https://rapidapi.rdtect.com',
    icon: '⚡',
    group: 'ai',
    tags: ['api', 'ai', 'gateway']
  },
  {
    id: 'rapidai-dash',
    name: 'RapidAI Dashboard',
    description: 'AI usage analytics and model management',
    url: 'https://rapiddash.rdtect.com',
    icon: '📊',
    group: 'ai',
    tags: ['analytics', 'ai', 'dashboard']
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow automation — 400+ integrations',
    url: 'https://n8n.rdtect.com',
    icon: '🔄',
    group: 'automation',
    tags: ['automation', 'workflow', 'integration']
  },
  {
    id: 'uptime-kuma',
    name: 'Uptime Kuma',
    description: 'Service monitoring with alerts and status pages',
    url: 'https://status.rdtect.com',
    icon: '📡',
    group: 'monitoring',
    tags: ['monitoring', 'uptime', 'alerts']
  },
  {
    id: 'chromadb',
    name: 'ChromaDB',
    description: 'Vector database for embeddings and semantic search',
    url: 'https://chroma.rdtect.com',
    icon: '🔮',
    group: 'data',
    tags: ['database', 'vectors', 'embeddings', 'search']
  }
];

export const groupConfig: Record<string, { label: string; icon: string; color: string }> = {
  platform: { label: 'Platform', icon: '🏗️', color: '#6366f1' },
  ai: { label: 'AI & ML', icon: '🧠', color: '#8b5cf6' },
  automation: { label: 'Automation', icon: '⚙️', color: '#14b8a6' },
  monitoring: { label: 'Monitoring', icon: '📡', color: '#f59e0b' },
  data: { label: 'Data', icon: '💾', color: '#06b6d4' }
};
