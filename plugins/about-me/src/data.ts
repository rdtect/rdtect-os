// ============================================
// About Me Plugin - Data Configuration
// ============================================
// This file contains all the personal data for the About Me plugin.
// Edit the values below to customize your portfolio.
// ============================================

export interface Skill {
  name: string;
  level: number; // 0-100
  category: 'frontend' | 'backend' | 'devops' | 'tools' | 'soft';
  color?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  companyUrl?: string;
  location: string;
  startDate: string;
  endDate: string | 'Present';
  description: string;
  highlights: string[];
  technologies: string[];
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  institutionUrl?: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string[];
}

export interface SocialLink {
  platform: string;
  url: string;
  username: string;
  icon: string; // SVG path or icon name
}

export interface Project {
  id: string;
  name: string;
  description: string;
  image?: string;
  url?: string;
  github?: string;
  technologies: string[];
  featured: boolean;
}

export interface ProfileData {
  // Basic Info
  name: string;
  title: string;
  tagline: string;
  avatar: string;
  location: string;
  email: string;
  phone?: string;
  website?: string;

  // Bio
  bio: string;
  shortBio: string;

  // Resume
  resumeUrl?: string;

  // Skills
  skills: Skill[];

  // Experience
  experience: Experience[];

  // Education
  education: Education[];

  // Social Links
  socials: SocialLink[];

  // Featured Projects
  projects: Project[];

  // Additional Info
  availability: 'available' | 'busy' | 'not-looking';
  availabilityMessage?: string;
  languages: { name: string; level: string }[];
  interests: string[];
}

// ============================================
// SAMPLE DATA - Customize this for your portfolio
// ============================================

export const profileData: ProfileData = {
  // Basic Info
  name: 'Rick de Tect',
  title: 'Full Stack Developer & Systems Architect',
  tagline: 'Architecture without code is fantasy; code without architecture is chaos',
  avatar: '',
  location: 'United States',
  email: 'rick@rdtect.com',
  website: 'https://rdtect.com',

  // Bio
  shortBio: 'Full stack developer building AI-powered applications and composable web platforms with modern TypeScript ecosystems.',
  bio: `I build web platforms and AI-powered applications with a focus on clean architecture,
composability, and developer experience. My approach combines Domain-Driven Design with
Unix Philosophy to create systems that are modular, testable, and deletable.

I work across the full stack with TypeScript, Svelte, React, Python, and Rust.
Currently building rdtect OS -- a web-based desktop environment that demonstrates
plugin architecture, virtual filesystems, and real-time AI chat via WebSocket streaming.

My development practice follows TDD, immutability-first patterns, and the MRAX framework
(Model, Rules, Actions, Logs) for organizing complexity. I believe the best abstractions
are the ones you can delete without breaking unrelated code.`,

  // Resume URL (direct download link)
  resumeUrl: '/resume.pdf',

  // Skills
  skills: [
    // Frontend
    { name: 'TypeScript', level: 95, category: 'frontend', color: '#3178c6' },
    { name: 'Svelte / SvelteKit', level: 90, category: 'frontend', color: '#ff3e00' },
    { name: 'React / Next.js', level: 85, category: 'frontend', color: '#61dafb' },
    { name: 'Tailwind CSS', level: 90, category: 'frontend', color: '#06b6d4' },
    { name: 'HTML5 / CSS3', level: 95, category: 'frontend', color: '#e34c26' },

    // Backend
    { name: 'Node.js / Bun', level: 90, category: 'backend', color: '#339933' },
    { name: 'Python / FastAPI', level: 85, category: 'backend', color: '#3776ab' },
    { name: 'Rust', level: 65, category: 'backend', color: '#dea584' },
    { name: 'PostgreSQL', level: 85, category: 'backend', color: '#336791' },
    { name: 'REST / WebSocket APIs', level: 95, category: 'backend', color: '#6366f1' },
    { name: 'OpenAI / LLM Integration', level: 80, category: 'backend', color: '#10a37f' },

    // DevOps
    { name: 'Docker', level: 85, category: 'devops', color: '#2496ed' },
    { name: 'Linux / WSL2', level: 90, category: 'devops', color: '#fcc624' },
    { name: 'CI/CD Pipelines', level: 80, category: 'devops', color: '#4caf50' },
    { name: 'Nginx / VPS', level: 75, category: 'devops', color: '#009639' },

    // Tools
    { name: 'Git / GitHub', level: 95, category: 'tools', color: '#f05032' },
    { name: 'Claude Code / AI Agents', level: 90, category: 'tools', color: '#d4a574' },
    { name: 'VS Code / Cursor', level: 90, category: 'tools', color: '#007acc' },
    { name: 'Figma', level: 70, category: 'tools', color: '#f24e1e' },
  ],

  // Experience
  experience: [
    {
      id: 'exp-1',
      title: 'Full Stack Developer & Architect',
      company: 'Independent',
      location: 'Remote',
      startDate: '2023-01',
      endDate: 'Present',
      description: 'Building web platforms, AI-integrated applications, and developer tools as an independent engineer.',
      highlights: [
        'Designed and built rdtect OS -- a web-based desktop environment with plugin architecture supporting 5 plugin types',
        'Implemented real-time AI chat with WebSocket streaming and OpenAI API integration',
        'Created a modular monorepo architecture with SvelteKit 5, FastAPI, and shared TypeScript types',
        'Built virtual filesystem layer (Unix-style /proc, /dev, .config) for web environment state management'
      ],
      technologies: ['SvelteKit 5', 'TypeScript', 'Python', 'FastAPI', 'Bun', 'Docker', 'Tailwind CSS']
    },
    {
      id: 'exp-2',
      title: 'Senior Full Stack Developer',
      company: 'Enterprise Software',
      location: 'Remote',
      startDate: '2020-06',
      endDate: '2022-12',
      description: 'Led development of cloud-native applications and internal tooling for enterprise teams.',
      highlights: [
        'Architected microservices backend serving high-traffic production workloads',
        'Reduced page load times by 60% through code splitting, caching strategies, and performance profiling',
        'Implemented CI/CD pipelines cutting deployment time from hours to minutes',
        'Mentored junior developers on clean architecture and testing practices'
      ],
      technologies: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker']
    },
    {
      id: 'exp-3',
      title: 'Full Stack Developer',
      company: 'Web Agency',
      location: 'Hybrid',
      startDate: '2018-03',
      endDate: '2020-05',
      description: 'Built responsive web applications and APIs for diverse client projects.',
      highlights: [
        'Delivered 15+ production web applications across healthcare, fintech, and e-commerce',
        'Integrated third-party payment systems and real-time notification services',
        'Introduced automated testing workflows increasing code coverage to 85%+',
        'Led migration from legacy jQuery codebases to modern React component architecture'
      ],
      technologies: ['React', 'Vue.js', 'Python', 'FastAPI', 'MongoDB', 'Redis']
    }
  ],

  // Education
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      institution: 'University',
      location: 'United States',
      startDate: '2014',
      endDate: '2018',
      honors: ['Dean\'s List']
    }
  ],

  // Social Links
  socials: [
    {
      platform: 'GitHub',
      url: 'https://github.com/rdtect',
      username: '@rdtect',
      icon: 'github'
    },
    {
      platform: 'LinkedIn',
      url: 'https://linkedin.com/in/rdtect',
      username: 'rdtect',
      icon: 'linkedin'
    },
    {
      platform: 'Twitter',
      url: 'https://twitter.com/rdtect',
      username: '@rdtect',
      icon: 'twitter'
    }
  ],

  // Featured Projects
  projects: [
    {
      id: 'proj-1',
      name: 'rdtect OS',
      description: 'Web-based desktop environment with plugin architecture, virtual filesystems, and AI integration',
      github: 'https://github.com/rdtect/desktop-os',
      technologies: ['SvelteKit 5', 'TypeScript', 'Tailwind CSS', 'Bun'],
      featured: true
    },
    {
      id: 'proj-2',
      name: 'AI Chat Backend',
      description: 'Real-time AI chat service with WebSocket streaming and OpenAI API integration',
      github: 'https://github.com/rdtect/desktop-os',
      technologies: ['Python', 'FastAPI', 'WebSocket', 'OpenAI'],
      featured: true
    },
    {
      id: 'proj-3',
      name: 'Plugin System',
      description: 'Extensible plugin architecture supporting native, iframe, federation, web component, and WASM types',
      github: 'https://github.com/rdtect/desktop-os',
      technologies: ['TypeScript', 'Svelte 5', 'Module Federation', 'Vite'],
      featured: true
    }
  ],

  // Availability
  availability: 'available',
  availabilityMessage: 'Open to new opportunities and collaborations',

  // Languages
  languages: [
    { name: 'English', level: 'Native' }
  ],

  // Interests
  interests: [
    'AI / LLM Agents',
    'System Architecture',
    'Open Source',
    'Developer Tools',
    'Web Platforms',
    'Rust'
  ]
};

// ============================================
// PocketBase Integration (Optional)
// ============================================

export interface PocketBaseConfig {
  url: string;
  collectionId: string;
  recordId: string;
}

/**
 * Fetch profile data from PocketBase
 * @param config PocketBase configuration
 * @returns ProfileData or null if fetch fails
 */
export async function fetchFromPocketBase(config: PocketBaseConfig): Promise<ProfileData | null> {
  try {
    const response = await fetch(
      `${config.url}/api/collections/${config.collectionId}/records/${config.recordId}`
    );

    if (!response.ok) {
      console.error('Failed to fetch from PocketBase:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data as ProfileData;
  } catch (error) {
    console.error('Error fetching from PocketBase:', error);
    return null;
  }
}

// Export default data
export default profileData;
