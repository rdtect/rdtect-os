/**
 * Project data for the Gallery
 * Each project can be opened as an iframe app within rdtect OS
 */

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  screenshots: string[];
  techStack: string[];
  category: 'game' | 'productivity' | 'tool' | 'creative' | 'meta';
  demoUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  dateAdded: string;
}

export const projects: Project[] = [
  {
    id: 'solitaire',
    title: 'Solitaire',
    description: 'Classic Klondike solitaire card game',
    longDescription: 'A beautifully designed implementation of the classic Klondike solitaire card game. Features smooth card animations, drag-and-drop gameplay, undo functionality, and win detection. Perfect for a quick break or relaxation.',
    thumbnail: 'https://images.unsplash.com/photo-1529480780361-b0d4e1aa6ce0?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1529480780361-b0d4e1aa6ce0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1612031233405-ce6e7a1d2c20?w=800&h=600&fit=crop'
    ],
    techStack: ['HTML5', 'CSS3', 'JavaScript', 'Canvas'],
    category: 'game',
    demoUrl: 'https://solitaire.io/',
    featured: true,
    dateAdded: '2024-01-15'
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Classic X and O game with AI opponent',
    longDescription: 'Challenge yourself against an unbeatable AI or play with a friend in this classic game of Tic-Tac-Toe. Features multiple difficulty levels, score tracking, and a clean minimal interface.',
    thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&h=600&fit=crop'
    ],
    techStack: ['React', 'TypeScript', 'CSS'],
    category: 'game',
    demoUrl: 'https://playtictactoe.org/',
    featured: false,
    dateAdded: '2024-02-10'
  },
  {
    id: 'todo-app',
    title: 'Todo App',
    description: 'Simple and elegant task management',
    longDescription: 'A minimalist yet powerful task management application. Features include task creation, completion tracking, due dates, priority levels, and local storage persistence. Stay organized and boost your productivity.',
    thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?w=800&h=600&fit=crop'
    ],
    techStack: ['Vue.js', 'Vuex', 'LocalStorage', 'CSS3'],
    category: 'productivity',
    demoUrl: 'https://todomvc.com/examples/vue/',
    githubUrl: 'https://github.com/tastejs/todomvc',
    featured: true,
    dateAdded: '2024-01-20'
  },
  {
    id: 'kanban',
    title: 'Kanban Board',
    description: 'Visual project management with drag-and-drop',
    longDescription: 'Organize your projects and workflows with this intuitive Kanban board. Create custom columns, drag cards between stages, add labels and due dates, and collaborate with your team. Perfect for agile project management.',
    thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=800&h=600&fit=crop'
    ],
    techStack: ['React', 'DnD Kit', 'Zustand', 'Tailwind CSS'],
    category: 'productivity',
    demoUrl: 'https://kanboard.org/demo/',
    githubUrl: 'https://github.com/kanboard/kanboard',
    featured: true,
    dateAdded: '2024-02-05'
  },
  {
    id: 'excalidraw',
    title: 'Excalidraw',
    description: 'Virtual whiteboard for sketching diagrams',
    longDescription: 'Excalidraw is a virtual collaborative whiteboard tool that lets you easily sketch hand-drawn like diagrams. Perfect for brainstorming, wireframing, and explaining complex ideas visually. Supports real-time collaboration and exports to various formats.',
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596638787647-904d822d751e?w=800&h=600&fit=crop'
    ],
    techStack: ['React', 'TypeScript', 'Canvas API', 'WebSocket'],
    category: 'creative',
    demoUrl: 'https://excalidraw.com/',
    githubUrl: 'https://github.com/excalidraw/excalidraw',
    liveUrl: 'https://excalidraw.com/',
    featured: true,
    dateAdded: '2024-01-01'
  },
  {
    id: 'desktop-os',
    title: 'rdtect Desktop OS',
    description: 'This very desktop environment you are using!',
    longDescription: 'A fully-featured web-based desktop environment built with SvelteKit 5. Features a modular plugin system, window management, widget support, AI chat integration, and much more. This is the meta experience - viewing the gallery of a project that includes itself!',
    thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    ],
    techStack: ['SvelteKit 5', 'TypeScript', 'Tailwind CSS', 'Bun', 'WebSocket'],
    category: 'meta',
    githubUrl: 'https://github.com/rdtect/desktop-os',
    featured: true,
    dateAdded: '2024-03-01'
  },
  {
    id: '2048',
    title: '2048',
    description: 'Addictive number puzzle game',
    longDescription: 'Slide numbered tiles on a grid to combine them and create a tile with the number 2048. Simple to learn, challenging to master. Features smooth animations, score tracking, and best score persistence.',
    thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&h=600&fit=crop'
    ],
    techStack: ['JavaScript', 'CSS Grid', 'Touch Events'],
    category: 'game',
    demoUrl: 'https://play2048.co/',
    githubUrl: 'https://github.com/gabrielecirulli/2048',
    featured: false,
    dateAdded: '2024-02-20'
  },
  {
    id: 'markdown-preview',
    title: 'Markdown Preview',
    description: 'Live markdown editor with preview',
    longDescription: 'Write markdown on the left, see the formatted output on the right in real-time. Supports GitHub Flavored Markdown, syntax highlighting for code blocks, and export to HTML or PDF.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop'
    ],
    techStack: ['TypeScript', 'Marked.js', 'Highlight.js', 'CSS'],
    category: 'tool',
    demoUrl: 'https://markdownlivepreview.com/',
    featured: false,
    dateAdded: '2024-01-25'
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Timer',
    description: 'Focus timer using the Pomodoro Technique',
    longDescription: 'Boost your productivity with the Pomodoro Technique. Work in focused 25-minute intervals separated by short breaks. Features customizable durations, session tracking, notifications, and ambient sounds.',
    thumbnail: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&h=600&fit=crop'
    ],
    techStack: ['React', 'Web Audio API', 'Notifications API'],
    category: 'productivity',
    demoUrl: 'https://pomofocus.io/',
    featured: false,
    dateAdded: '2024-02-15'
  },
  {
    id: 'pixel-art',
    title: 'Pixel Art Editor',
    description: 'Create pixel art with ease',
    longDescription: 'A simple yet powerful pixel art editor. Features include a customizable canvas size, color palette, various brushes, layers, and export to PNG or GIF. Perfect for creating game sprites or retro-style artwork.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop'
    ],
    techStack: ['Canvas API', 'JavaScript', 'IndexedDB'],
    category: 'creative',
    demoUrl: 'https://www.pixilart.com/draw',
    featured: false,
    dateAdded: '2024-03-10'
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
  return ['game', 'productivity', 'tool', 'creative', 'meta'];
}

/**
 * Category display names and icons
 */
export const categoryInfo: Record<Project['category'], { name: string; icon: string }> = {
  game: { name: 'Games', icon: '🎮' },
  productivity: { name: 'Productivity', icon: '📊' },
  tool: { name: 'Tools', icon: '🔧' },
  creative: { name: 'Creative', icon: '🎨' },
  meta: { name: 'Meta', icon: '🔄' }
};
