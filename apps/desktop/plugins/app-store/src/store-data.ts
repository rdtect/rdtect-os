export interface StoreApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  source: 'zyeta' | 'personal' | 'mrax';
  githubUrl: string;
  techStack: string[];
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
};
