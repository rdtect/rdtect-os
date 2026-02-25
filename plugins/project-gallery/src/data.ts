/**
 * Project data for the Gallery
 * Each project can be opened as an iframe app within rdtect OS
 *
 * Thumbnails use CSS gradient backgrounds instead of external image URLs
 * to avoid broken images and ensure reliable rendering.
 */

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  icon: string;
  gradient: string;
  screenshots: string[];
  techStack: string[];
  category: 'platform' | 'ai' | 'tool' | 'fullstack' | 'oss' | 'web3' | 'design';
  demoUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  dateAdded: string;
}

export const projects: Project[] = [
  // ── Real Portfolio Projects ──────────────────────────────────────
  {
    id: 'ilm-web3-movie',
    title: 'Ilm — the web3 Movie',
    description: 'World\'s first NFT crowd-funded Bollywood movie',
    longDescription: 'Designed letscollect.io, a NFT crowdfunding platform for movies, which resulted in creating the World\'s First NFT crowd-funded Bollywood Movie. The film Ilm is now streaming on Disney+ Hotstar. Product Designer and WEB3 Architect — responsible for the end-to-end platform design, user flows, and Web3 architecture.',
    thumbnail: '',
    icon: '🎬',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #92400e 100%)',
    screenshots: [],
    techStack: ['Product Design', 'Web3', 'NFT Platform', 'UI/UX', 'Crowdfunding'],
    category: 'web3',
    featured: true,
    dateAdded: '2022-01-01'
  },
  {
    id: 'versez-metaverse',
    title: 'Versez — Metaverse Platform',
    description: 'Customizable metaverse platform for virtual worlds (PAAS)',
    longDescription: 'Designed Versez, a customizable metaverse platform for virtual worlds offered as a PAAS product to B2B clients at QuantLabs. Designed immersive 3D environments, virtual spaces, and the product interface — enabling clients to deploy branded metaverse experiences. Includes a virtual meta theater for GSP and the first Durga Puja cultural showcase on the metaverse.',
    thumbnail: '',
    icon: '🌐',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #4c1d95 100%)',
    screenshots: [],
    techStack: ['Metaverse Design', 'Blender', '3D Environments', 'Product Design', 'Web3', 'PAAS'],
    category: 'web3',
    featured: true,
    dateAdded: '2022-06-01'
  },
  {
    id: 'fikka-io',
    title: 'Fikka.io',
    description: 'NFT marketplace and Web3 social media platform',
    longDescription: 'Product Design and Management of an NFT marketplace and WEB3 social media platform. Responsible for the complete product design including user flows, marketplace UI, social features, and NFT creation tools. Built to enable creators to mint, sell, and showcase NFT art in a social context.',
    thumbnail: '',
    icon: '🖼️',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 40%, #9d174d 100%)',
    screenshots: [],
    techStack: ['Product Design', 'NFT Marketplace', 'Web3', 'Social Platform', 'UI/UX', 'Figma'],
    category: 'web3',
    featured: true,
    dateAdded: '2022-03-01'
  },
  {
    id: 'maple-org-tech',
    title: 'Maple Org Tech',
    description: 'Supply chain app for organic fertilizer manufacturing',
    longDescription: 'Solved supply chain challenges by designing an app for an organic fertilizer manufacturing industry. Improved manufacturer and consumer interaction systems — streamlining logistics, inventory tracking, and B2B order management. Full product design from user research to high-fidelity Figma prototypes.',
    thumbnail: '',
    icon: '🌱',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 40%, #065f46 100%)',
    screenshots: [],
    techStack: ['Product Design', 'UX Research', 'Supply Chain', 'Mobile App', 'Figma', 'UI/UX'],
    category: 'design',
    featured: true,
    dateAdded: '2022-05-01'
  },
  {
    id: 'roledin',
    title: 'RoledIn — Education Platform',
    description: 'Innovative LMS, ERP, and CRM for schools',
    longDescription: 'Designing an innovative LMS, ERP, and CRM for schools and educational institutes. Combined learning management with enterprise resource planning and CRM in a unified platform. Designed in Svelte with a focus on intuitive teacher and student dashboards.',
    thumbnail: '',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
    screenshots: [],
    techStack: ['Product Design', 'Svelte', 'LMS', 'ERP', 'CRM', 'UI/UX Design', 'Figma'],
    category: 'fullstack',
    featured: false,
    dateAdded: '2021-06-01'
  },

  // ── rdtect OS Platform ──────────────────────────────────────────
  {
    id: 'desktop-os',
    title: 'rdtect OS',
    description: 'Web-based desktop environment with plugin architecture',
    longDescription: 'A fully-featured web-based desktop environment built with SvelteKit 5 and Svelte 5 runes. Implements Unix Philosophy ("everything is a file") with virtual filesystems, a modular plugin system supporting 5 plugin types, window management, widget support, and AI chat integration via WebSocket streaming. The project you are viewing right now.',
    thumbnail: '',
    icon: '🖥️',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #7c3aed 100%)',
    screenshots: [],
    techStack: ['SvelteKit 5', 'TypeScript', 'Tailwind CSS', 'Bun', 'WebSocket', 'FastAPI'],
    category: 'platform',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: true,
    dateAdded: '2024-03-01'
  },
  {
    id: 'ai-chat',
    title: 'AI Chat Interface',
    description: 'Real-time streaming AI chat with multi-model support',
    longDescription: 'An AI-powered chat application with streaming responses via WebSocket. Built on FastAPI with OpenAI API integration, supporting real-time token-by-token streaming, conversation history, and a polished responsive UI. Part of the rdtect OS ecosystem as a native plugin.',
    thumbnail: '',
    icon: '🤖',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #15803d 100%)',
    screenshots: [],
    techStack: ['Python', 'FastAPI', 'WebSocket', 'OpenAI', 'Svelte 5'],
    category: 'ai',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: true,
    dateAdded: '2024-02-15'
  },
  {
    id: 'plugin-system',
    title: 'Plugin Architecture',
    description: 'Extensible plugin system supporting 5 integration types',
    longDescription: 'A modular plugin architecture supporting native Svelte, web components, iframes, module federation, and WASM plugin types. Each plugin is defined by a manifest with metadata, entry points, and window defaults. Enables a composable desktop experience where applications are independently developed and loaded.',
    thumbnail: '',
    icon: '🧩',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 100%)',
    screenshots: [],
    techStack: ['TypeScript', 'Svelte 5', 'Module Federation', 'WASM'],
    category: 'platform',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: true,
    dateAdded: '2024-02-01'
  },
  {
    id: 'prompt-manager',
    title: 'Prompt Manager',
    description: 'AI prompt template library with variable injection',
    longDescription: 'A prompt management tool for organizing, categorizing, and reusing AI prompt templates. Features variable interpolation, category-based organization, search and filtering, and clipboard integration. Built as a native rdtect OS plugin with Svelte 5 runes.',
    thumbnail: '',
    icon: '📝',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 40%, #be185d 100%)',
    screenshots: [],
    techStack: ['Svelte 5', 'TypeScript', 'LocalStorage'],
    category: 'tool',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: false,
    dateAdded: '2024-02-20'
  },
  {
    id: 'virtual-fs',
    title: 'Virtual Filesystem',
    description: 'Unix-style /proc, /dev, and .config virtual filesystems',
    longDescription: 'Implementation of Unix-inspired virtual filesystems for the web desktop environment. Exposes system processes via /proc, device interfaces via /dev, and user configuration through .config directories. Enables CLI-like interaction patterns and uniform data access across the desktop.',
    thumbnail: '',
    icon: '📂',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #0e7490 100%)',
    screenshots: [],
    techStack: ['TypeScript', 'Svelte 5', 'IndexedDB'],
    category: 'platform',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: true,
    dateAdded: '2024-01-15'
  },
  {
    id: 'window-manager',
    title: 'Window Manager',
    description: 'Desktop-class window management with z-index stacking',
    longDescription: 'A full-featured window manager handling window lifecycle, positioning, resizing, minimize/maximize state, z-index stacking order, and snapping. Supports multiple concurrent windows with drag-and-drop positioning and responsive layout adaptation.',
    thumbnail: '',
    icon: '🪟',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 40%, #6d28d9 100%)',
    screenshots: [],
    techStack: ['Svelte 5', 'TypeScript', 'CSS Grid'],
    category: 'platform',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: false,
    dateAdded: '2024-01-10'
  },
  {
    id: 'excalidraw-integration',
    title: 'Excalidraw Integration',
    description: 'Whiteboard drawing tool as a remote module plugin',
    longDescription: 'Integration of Excalidraw as a module federation plugin within rdtect OS. Demonstrates the iframe/federation plugin architecture by embedding a full-featured collaborative whiteboard directly into the desktop environment.',
    thumbnail: '',
    icon: '🎨',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 40%, #be123c 100%)',
    screenshots: [],
    techStack: ['React', 'Module Federation', 'Vite', 'TypeScript'],
    category: 'oss',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: false,
    dateAdded: '2024-03-10'
  },
  {
    id: 'message-bus',
    title: 'Message Bus',
    description: 'Inter-plugin communication via typed message passing',
    longDescription: 'A typed message bus system enabling communication between plugins in the rdtect OS environment. Supports source/target plugin routing, event subscription patterns, and structured message payloads. Ensures loose coupling between independently developed plugins.',
    thumbnail: '',
    icon: '📡',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 40%, #0f766e 100%)',
    screenshots: [],
    techStack: ['TypeScript', 'Custom Events', 'Svelte Stores'],
    category: 'platform',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: false,
    dateAdded: '2024-01-20'
  }
];

/**
 * Get all unique tech stack items from projects
 */
export function getAllTechnologies(): string[] {
  const techSet = new Set<string>();
  projects.forEach(project => {
    project.techStack.forEach(tech => techSet.add(tech));
  });
  return Array.from(techSet).sort();
}

/**
 * Get all unique categories from projects
 */
export function getAllCategories(): Project['category'][] {
  return ['web3', 'design', 'platform', 'ai', 'tool', 'fullstack', 'oss'];
}

/**
 * Category display names and icons
 */
export const categoryInfo: Record<Project['category'], { name: string; icon: string }> = {
  web3: { name: 'Web3 / Metaverse', icon: '🌐' },
  design: { name: 'Product Design', icon: '🎨' },
  platform: { name: 'Platform', icon: '🖥️' },
  ai: { name: 'AI / ML', icon: '🤖' },
  tool: { name: 'Tools', icon: '🔧' },
  fullstack: { name: 'Full Stack', icon: '📱' },
  oss: { name: 'Open Source', icon: '📦' }
};
