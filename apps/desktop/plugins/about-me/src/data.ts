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
// PORTFOLIO DATA — Rick Dé (rdtect)
// ============================================

export const profileData: ProfileData = {
  // Basic Info
  name: 'Rick Dé',
  title: 'Associate Director, Digital Experience Design',
  tagline: 'Designing at the edge of what\'s next — from built environments to AI-powered digital experience',
  avatar: '',
  location: 'Bengaluru, India',
  email: 'rdtect@outlook.com',
  phone: '+91 98309 14213',
  website: 'https://rdtect.com',

  // Bio
  shortBio: 'Associate Director of Digital Experience Design at Zyeta with 13+ years blending architecture, creative technology, and strategy. Leading a vertical for digital experience and the future of work.',
  bio: `Associate Director of Digital Experience Design with 13+ years of expertise blending architecture, creative technology, and strategy. From designing physical spaces to building metaverses to leading AI-powered digital transformation at global scale.

Career highlights: pioneered the world's first NFT crowd-funded Bollywood movie (Ilm, Disney+ Hotstar). Designed Versez, a customizable metaverse platform. Led digital experience for BBDO across three regions and New York at Omnicom. First mover on AI-based filmmaking and advertising at Omnicom Global Solutions. Built AI websites for Columbia Journalism Review.

Currently at Zyeta — a globally ranked workplace design firm — leading the Digital Experience vertical. Strategizing the future of work through adaptive workplace solutions, design thinking, AI tools, and emerging technology.

Building rdtect OS as a showcase of what's possible when architecture meets code.`,

  // Resume URL
  resumeUrl: '/resume.pdf',

  // Skills
  skills: [
    // Frontend / Design
    { name: 'UX/UI Design', level: 95, category: 'frontend', color: '#f24e1e' },
    { name: 'Product Design & Launch', level: 92, category: 'frontend', color: '#6366f1' },
    { name: 'Wireframing & Prototyping', level: 92, category: 'frontend', color: '#a855f7' },
    { name: 'Svelte / SvelteKit', level: 88, category: 'frontend', color: '#ff3e00' },
    { name: 'HTML / CSS / JavaScript', level: 85, category: 'frontend', color: '#e34c26' },
    { name: 'Tailwind CSS', level: 82, category: 'frontend', color: '#06b6d4' },

    // Backend / Web3
    { name: 'Web3 & Smart Contracts', level: 80, category: 'backend', color: '#8b5cf6' },
    { name: 'Metaverse Architecture', level: 88, category: 'backend', color: '#7c3aed' },
    { name: 'NFT Creation & Platforms', level: 82, category: 'backend', color: '#a855f7' },

    // Tools & Creative
    { name: 'Figma', level: 95, category: 'tools', color: '#f24e1e' },
    { name: 'Blender & Spline (3D)', level: 88, category: 'tools', color: '#ea7600' },
    { name: 'Adobe Creative Suite', level: 85, category: 'tools', color: '#ff0000' },
    { name: 'Affinity Suite', level: 80, category: 'tools', color: '#1e6fcc' },
    { name: 'AI / Prompt Engineering', level: 82, category: 'tools', color: '#10a37f' },

    // Backend / Tech
    { name: 'AI Solutions & Strategy', level: 90, category: 'backend', color: '#10a37f' },
    { name: 'Solution Architecture', level: 85, category: 'backend', color: '#3b82f6' },
    { name: 'Python', level: 78, category: 'backend', color: '#3776ab' },
    { name: 'Three.js / Threlte', level: 75, category: 'frontend', color: '#049ef4' },

    // Soft Skills
    { name: 'Architectural Design & Planning', level: 95, category: 'soft', color: '#10b981' },
    { name: 'Design Thinking & Strategy', level: 92, category: 'soft', color: '#0ea5e9' },
    { name: 'Team Leadership (Global)', level: 88, category: 'soft', color: '#f59e0b' },
    { name: 'Visual Communication & Storytelling', level: 90, category: 'soft', color: '#22c55e' },
    { name: 'Future of Work Strategy', level: 85, category: 'soft', color: '#06b6d4' },
    { name: 'Cross-functional Collaboration', level: 90, category: 'soft', color: '#f59e0b' },
  ],

  // Experience
  experience: [
    {
      id: 'exp-zyeta',
      title: 'Associate Director, Digital Experience Design',
      company: 'Zyeta',
      companyUrl: 'https://zyeta.com',
      location: 'Bengaluru, India',
      startDate: '2025',
      endDate: 'Present',
      description: 'Leading the Digital Experience vertical at a globally ranked workplace design firm. Strategizing the future of work through design thinking, AI solutions, and emerging technology.',
      highlights: [
        'Leading the Digital Experience vertical — strategy, technology, and design',
        'Strategizing the future of work through adaptive workplace solutions',
        'AI-powered solutions for smart office platforms and behavioral analysis',
        'Experimenting with AI tools, creative coding, and speculative design',
        'Clients include LinkedIn, MUFG, Digi-Key, and multinational firms'
      ],
      technologies: ['AI Solutions', 'Design Thinking', 'SvelteKit', 'Python', 'IoT', 'VR/AR', 'Figma']
    },
    {
      id: 'exp-omnicom',
      title: 'Solution Architect / Digital Experience Lead',
      company: 'Analect (Omnicom Group)',
      companyUrl: 'https://omnicomgroup.com',
      location: 'Atlanta, GA / New York / Global',
      startDate: '2023',
      endDate: '2025',
      description: 'Led UI/UX and digital experience across creative technology teams at BBDO for three regions and New York. Solution architect for legacy websites with emergent technology layers. First mover on AI-based filmmaking and advertising at Omnicom Global Solutions.',
      highlights: [
        'Led digital experience and creative technology teams for BBDO across 3 regions + New York',
        'Solution architect for legacy websites and tech solutions with emergent technology layers',
        'Led teams for BBDO Canada and ANZ — global multi-region delivery',
        'Moved to Omnicom Global Solutions — first movers for AI-based filmmaking and advertising',
        'Built AI websites for Columbia Journalism Review',
        'Pioneered AI-powered advertising workflows'
      ],
      technologies: ['AI/GenAI', 'Solution Architecture', 'React', 'SvelteKit', 'Python', 'Figma']
    },
    {
      id: 'exp-quant',
      title: 'Product Designer & Metaverse Architect',
      company: 'QuantLabs',
      location: 'Remote',
      startDate: '2022',
      endDate: '2023',
      description: 'Led product design for a web3 and metaverse services company, delivering B2B products and platforms across immersive digital experiences.',
      highlights: [
        'Designed Versez — a customizable metaverse platform for virtual worlds, offered as a PAAS product to B2B clients',
        'Designed and rendered 3D models of virtual spaces and objects for immersive metaverse environments',
        'Designed UI/UX for diverse client web apps, resulting in a 10% increase in user engagement',
        'Designed a virtual meta theater for GSP offering realistic and engaging live performances',
        'Crafted a metaverse product for the first Durga Puja cultural showcase on the metaverse'
      ],
      technologies: ['Blender', 'Figma', 'Svelte', 'Web3', 'NFT', '3D Design', 'UX/UI']
    },
    {
      id: 'exp-arcx',
      title: 'Principal Architect and Designer',
      company: 'Studio ArcX',
      location: 'Dehradun, India',
      startDate: '2014-08',
      endDate: '2021-08',
      description: 'Designed and created spatial environments for architecture, interior, and landscape projects, with a focus on 3D visualisation and brand identity.',
      highlights: [
        'Designed spatial environments for multiple Architecture, Interior, and Landscape projects',
        'Specialized in 3D Visualisation, Visual Design, Identity & Experience building',
        'Created the website for the firm and established its web presence',
        'Developed social media presence and brand identity systems'
      ],
      technologies: ['AutoCAD', 'Revit', '3D Visualisation', 'Graphic Design', 'Web Design']
    },
    {
      id: 'exp-foad',
      title: 'Assistant Professor — Architecture & UI/UX Design',
      company: 'FOAD, DIT University',
      location: 'Dehradun, India',
      startDate: '2018-08',
      endDate: '2021-08',
      description: 'Taught architecture and UI/UX design while leading design initiatives for university publications and digital presence.',
      highlights: [
        'Taught architecture and UI/UX design to undergraduate students',
        'Designed the annual magazine for the Faculty of Architecture and Design',
        'Led the website design team for the faculty'
      ],
      technologies: ['Architecture', 'UX/UI Design', 'Adobe Suite', 'Web Design']
    },
    {
      id: 'exp-fpa',
      title: 'Assistant Professor — Architecture & Design',
      company: 'FPA, Manav Rachna University',
      location: 'Faridabad, India',
      startDate: '2016-08',
      endDate: '2018-08',
      description: 'Taught architecture and design, contributing to innovation initiatives and event/space design projects.',
      highlights: [
        'Taught architecture and UI/UX design courses',
        'Designed the faculty prospectus and promotional materials',
        'Part of the innovation department — designed events and spaces',
        '3D design and visualization projects'
      ],
      technologies: ['Architecture', 'Graphic Design', '3D Design', 'Event Design']
    },
    {
      id: 'exp-rmc',
      title: 'Architect & Designer',
      company: 'RMC Pvt. Ltd',
      location: 'India',
      startDate: '2013-08',
      endDate: '2016-08',
      description: 'Designed built environments for residential and industrial projects, with responsibilities spanning architecture, graphics, and data visualization.',
      highlights: [
        'Designed bungalows, apartments, factories, and other built environments',
        'Created graphic design, diagramming, and concept diagrams',
        'Produced presentation and branding design materials',
        'Developed data visualization assets for project communication'
      ],
      technologies: ['AutoCAD', 'Revit', 'Graphic Design', 'Data Visualization']
    },
    {
      id: 'exp-rba',
      title: 'Intern Architect',
      company: 'Ravindra Bhan & Associates',
      location: 'India',
      startDate: '2011-08',
      endDate: '2013-08',
      description: 'Worked with the pioneer of landscape architecture in India, contributing to architecture, landscape, and the firm\'s digital presence.',
      highlights: [
        'Designed architecture and landscape projects under the guidance of a pioneer in landscape architecture',
        'Created the first website of the firm and established its web presence',
        'Contributed to spatial design and landscape architecture projects'
      ],
      technologies: ['Landscape Architecture', 'AutoCAD', 'Web Design']
    }
  ],

  // Education
  education: [
    {
      id: 'edu-barch',
      degree: 'Bachelor of Architecture',
      field: 'Architecture & Spatial Design',
      institution: 'School of Architecture and Landscape Design, SMVDU',
      location: 'Katra, Jammu & Kashmir, India',
      startDate: '2008',
      endDate: '2013',
    },
    {
      id: 'edu-mitid',
      degree: 'PGPEx — In Progress',
      field: 'Design Leadership & Management',
      institution: 'MITID (MIT Institute of Design)',
      location: 'Pune, India',
      startDate: '2023',
      endDate: 'In Progress',
    },
    {
      id: 'edu-uiux',
      degree: 'Certified UI/UX Designer',
      field: 'UX/UI Design',
      institution: 'Karavan Academy',
      location: 'Online',
      startDate: '2020',
      endDate: '2021',
    },
    {
      id: 'edu-nft',
      degree: 'NFT Course',
      field: 'Blockchain Art & NFT Creation',
      institution: 'Growth School (with artist kkraghava)',
      location: 'Online',
      startDate: '2021',
      endDate: '2021',
    },
    {
      id: 'edu-google-ux',
      degree: 'Google UX Certificate — In Progress',
      field: 'User Experience Design',
      institution: 'Google / Coursera',
      location: 'Online',
      startDate: '2023',
      endDate: 'In Progress',
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
    }
  ],

  // Featured Projects
  projects: [
    {
      id: 'proj-rdtect-os',
      name: 'rdtect OS',
      description: 'Web-based desktop environment with plugin architecture, virtual filesystems, and AI integration. The project you\'re viewing right now.',
      github: 'https://github.com/rdtect/desktop-os',
      technologies: ['SvelteKit 5', 'Svelte 5', 'TypeScript', 'Tailwind CSS', 'Bun'],
      featured: true
    },
    {
      id: 'proj-ilm',
      name: 'Ilm — the web3 Movie',
      description: 'Designed letscollect.io, a NFT crowdfunding platform for movies, creating the world\'s first NFT crowd-funded Bollywood movie. Now streaming on Disney+ Hotstar.',
      technologies: ['Product Design', 'Web3', 'NFT', 'Crowdfunding Platform', 'UI/UX'],
      featured: true
    },
    {
      id: 'proj-versez',
      name: 'Versez — Metaverse Platform',
      description: 'Designed a customizable metaverse platform for virtual worlds, offered as a PAAS product to B2B clients at QuantLabs.',
      technologies: ['Metaverse Design', 'Blender', '3D Environments', 'Product Design', 'Web3'],
      featured: true
    },
    {
      id: 'proj-fikka',
      name: 'Fikka.io',
      description: 'Product design and management of an NFT marketplace and Web3 social media platform.',
      technologies: ['Product Design', 'NFT Marketplace', 'Web3', 'Social Platform', 'UI/UX'],
      featured: true
    },
    {
      id: 'proj-maple',
      name: 'Maple Org Tech',
      description: 'Solved supply chain challenges by designing an app for an organic fertilizer manufacturing industry, improving manufacturer and consumer interaction systems.',
      technologies: ['Product Design', 'UX Research', 'Supply Chain', 'Mobile App', 'Figma'],
      featured: true
    },
    {
      id: 'proj-omnicom-ai',
      name: 'AI Filmmaking & Advertising — Omnicom',
      description: 'First movers on AI-based filmmaking and advertising at Omnicom Global Solutions. Built AI websites for Columbia Journalism Review.',
      technologies: ['AI/GenAI', 'Filmmaking', 'Solution Architecture', 'Web Development'],
      featured: true
    },
    {
      id: 'proj-zyeta-dx',
      name: 'Digital Experience Platform — Zyeta',
      description: 'Leading the digital experience vertical at a top-10 globally ranked workplace design firm. AI-powered smart office solutions.',
      url: 'https://zyeta.com',
      technologies: ['AI Solutions', 'IoT', 'Design Thinking', 'SvelteKit', 'Python'],
      featured: true
    },
    {
      id: 'proj-roledin',
      name: 'RoledIn',
      description: 'Designed an innovative LMS, ERP, and CRM platform for schools and educational institutes.',
      technologies: ['Product Design', 'Svelte', 'LMS', 'ERP', 'UI/UX Design'],
      featured: false
    }
  ],

  // Availability
  availability: 'busy',
  availabilityMessage: 'Leading Digital Experience at Zyeta — open to collaborations in AI and emergent tech',

  // Languages
  languages: [
    { name: 'English', level: 'Professional' },
    { name: 'Hindi', level: 'Native' }
  ],

  // Interests
  interests: [
    'AI Solutions & Strategy',
    'Future of Work',
    'Emergent Technology',
    '3D Design & Visualization',
    'Creative Coding',
    'Architectural Design',
    'Digital Product Design'
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
