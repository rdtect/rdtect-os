export type AppSource = 'zyeta' | 'personal' | 'mrax' | 'vps' | 'opensource';

export interface StoreApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  source: AppSource;
  githubUrl: string;
  techStack: string[];
  installUrl?: string;
}

export const availableApps: StoreApp[] = [
  {
    id: 'aero-window',
    name: 'Aero Window',
    description: 'Circadian airplane window — Cesium 3D + GenAI + weather',
    icon: '✈️',
    category: 'creative',
    source: 'zyeta',
    githubUrl: 'https://github.com/zyeta',
    techStack: ['Cesium', 'GenAI', 'Three.js'],
  },
  {
    id: 'workspace-studio',
    name: 'Workspace Studio',
    description: 'AI-powered workspace design for interactive seminars',
    icon: '🏗️',
    category: 'studio',
    source: 'zyeta',
    githubUrl: 'https://github.com/zyeta',
    techStack: ['SvelteKit', 'AI', 'WebSocket'],
  },
  {
    id: 'ai-pm-assessor',
    name: 'AI PM Assessor',
    description: 'Gamified PM training with AI quiz generation',
    icon: '📊',
    category: 'studio',
    source: 'zyeta',
    githubUrl: 'https://github.com/zyeta',
    techStack: ['React', 'OpenAI', 'Gamification'],
  },
  {
    id: 'meddicc-research',
    name: 'MEDDICC Research',
    description: 'AI sales intelligence with node diagrams',
    icon: '🔬',
    category: 'studio',
    source: 'zyeta',
    githubUrl: 'https://github.com/zyeta',
    techStack: ['D3.js', 'AI', 'Graph'],
  },
  {
    id: 'dx-platform',
    name: 'DX Platform',
    description: 'Zyeta Digital Experience Platform',
    icon: '🌐',
    category: 'showcase',
    source: 'zyeta',
    githubUrl: 'https://github.com/zyeta',
    techStack: ['Next.js', 'CMS', 'Analytics'],
  },
  {
    id: '2gethr-jingle-hunt',
    name: '2gethr Jingle Hunt',
    description: 'Holiday gamification app with QR codes',
    icon: '🎄',
    category: 'games',
    source: 'zyeta',
    githubUrl: 'https://github.com/zyeta',
    techStack: ['React', 'QR', 'Gamification'],
  },
  {
    id: 'strategy-bot',
    name: 'Strategy Bot',
    description: 'AI strategy analyzer',
    icon: '🤖',
    category: 'studio',
    source: 'personal',
    githubUrl: 'https://github.com/rdtect',
    techStack: ['Python', 'AI', 'Analysis'],
  },
  {
    id: 'adcraft',
    name: 'AdCraft',
    description: 'Ad crafting tool',
    icon: '📺',
    category: 'creative',
    source: 'personal',
    githubUrl: 'https://github.com/rdtect',
    techStack: ['Svelte', 'Canvas', 'Design'],
  },
  {
    id: 'todo-mrax',
    name: 'Todo',
    description: 'Vanilla JS todo microapp',
    icon: '✅',
    category: 'studio',
    source: 'mrax',
    githubUrl: 'https://github.com/rdtect/mrax',
    techStack: ['Vanilla JS', 'LocalStorage'],
  },
  // VPS services
  {
    id: 'svc-open-webui',
    name: 'Open WebUI',
    description: 'Multi-model AI chat — Ollama, OpenAI, Claude',
    icon: '🧠',
    category: 'ai',
    source: 'vps',
    githubUrl: 'https://github.com/open-webui/open-webui',
    techStack: ['Python', 'Svelte', 'Ollama'],
    installUrl: 'https://ai.rdtect.com',
  },
  {
    id: 'svc-n8n',
    name: 'n8n',
    description: 'Workflow automation — 400+ integrations',
    icon: '🔄',
    category: 'automation',
    source: 'vps',
    githubUrl: 'https://github.com/n8n-io/n8n',
    techStack: ['TypeScript', 'Vue', 'Node.js'],
    installUrl: 'https://n8n.rdtect.com',
  },
  {
    id: 'svc-uptime-kuma',
    name: 'Uptime Kuma',
    description: 'Service monitoring with alerts and status pages',
    icon: '📡',
    category: 'monitoring',
    source: 'vps',
    githubUrl: 'https://github.com/louislam/uptime-kuma',
    techStack: ['Vue', 'Node.js', 'SQLite'],
    installUrl: 'https://status.rdtect.com',
  },
  // Open-source embeddable tools
  {
    id: 'oss-drawio',
    name: 'draw.io',
    description: 'Diagrams and flowcharts — UML, network, mind maps',
    icon: '📐',
    category: 'creative',
    source: 'opensource',
    githubUrl: 'https://github.com/jgraph/drawio',
    techStack: ['JavaScript', 'mxGraph'],
    installUrl: 'https://embed.diagrams.net/',
  },
  {
    id: 'oss-jsoncrack',
    name: 'JSON Crack',
    description: 'Visualize JSON data as interactive graphs',
    icon: '🔍',
    category: 'studio',
    source: 'opensource',
    githubUrl: 'https://github.com/AykutSarac/jsoncrack.com',
    techStack: ['React', 'D3', 'TypeScript'],
    installUrl: 'https://jsoncrack.com/editor',
  },
  {
    id: 'oss-excalidraw-web',
    name: 'Excalidraw (Web)',
    description: 'Virtual whiteboard for hand-drawn diagrams',
    icon: '✏️',
    category: 'creative',
    source: 'opensource',
    githubUrl: 'https://github.com/excalidraw/excalidraw',
    techStack: ['React', 'TypeScript', 'Canvas'],
    installUrl: 'https://excalidraw.com',
  },
  {
    id: 'oss-svgomg',
    name: 'SVGOMG',
    description: 'SVG optimizer — clean and minify SVG files',
    icon: '🎯',
    category: 'creative',
    source: 'opensource',
    githubUrl: 'https://github.com/nicolo-ribaudo/svgomg',
    techStack: ['JavaScript', 'SVGO'],
    installUrl: 'https://svgomg.net/',
  },
];

export const sourceColors: Record<string, { bg: string; text: string; border: string }> = {
  zyeta: {
    bg: 'rgba(99, 102, 241, 0.12)',
    text: '#a5b4fc',
    border: 'rgba(99, 102, 241, 0.25)',
  },
  personal: {
    bg: 'rgba(34, 197, 94, 0.12)',
    text: '#4ade80',
    border: 'rgba(34, 197, 94, 0.25)',
  },
  mrax: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  vps: {
    bg: 'rgba(20, 184, 166, 0.12)',
    text: '#2dd4bf',
    border: 'rgba(20, 184, 166, 0.25)',
  },
  opensource: {
    bg: 'rgba(168, 85, 247, 0.12)',
    text: '#c084fc',
    border: 'rgba(168, 85, 247, 0.25)',
  },
};
