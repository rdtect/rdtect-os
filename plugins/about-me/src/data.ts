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
  name: 'John Developer',
  title: 'Full Stack Developer',
  tagline: 'Building elegant solutions to complex problems',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rdtect&backgroundColor=6366f1',
  location: 'San Francisco, CA',
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
  website: 'https://johndeveloper.com',

  // Bio
  shortBio: 'Passionate developer with 5+ years of experience building web applications and distributed systems.',
  bio: `I'm a full-stack developer with a passion for creating beautiful, performant web applications.
I specialize in modern JavaScript/TypeScript ecosystems, with deep expertise in React, Svelte, and Node.js.

When I'm not coding, you can find me contributing to open source, writing technical blog posts,
or exploring new technologies. I believe in writing clean, maintainable code and building products
that make a real difference in people's lives.

Currently focused on building AI-powered applications and exploring the intersection of
machine learning and web development.`,

  // Resume URL (direct download link)
  resumeUrl: '/resume.pdf',

  // Skills
  skills: [
    // Frontend
    { name: 'TypeScript', level: 95, category: 'frontend', color: '#3178c6' },
    { name: 'React', level: 90, category: 'frontend', color: '#61dafb' },
    { name: 'Svelte', level: 85, category: 'frontend', color: '#ff3e00' },
    { name: 'Vue.js', level: 75, category: 'frontend', color: '#4fc08d' },
    { name: 'Tailwind CSS', level: 90, category: 'frontend', color: '#06b6d4' },
    { name: 'Next.js', level: 85, category: 'frontend', color: '#000000' },

    // Backend
    { name: 'Node.js', level: 90, category: 'backend', color: '#339933' },
    { name: 'Python', level: 80, category: 'backend', color: '#3776ab' },
    { name: 'PostgreSQL', level: 85, category: 'backend', color: '#336791' },
    { name: 'MongoDB', level: 75, category: 'backend', color: '#47a248' },
    { name: 'GraphQL', level: 80, category: 'backend', color: '#e10098' },
    { name: 'REST APIs', level: 95, category: 'backend', color: '#6366f1' },

    // DevOps
    { name: 'Docker', level: 85, category: 'devops', color: '#2496ed' },
    { name: 'AWS', level: 75, category: 'devops', color: '#ff9900' },
    { name: 'CI/CD', level: 80, category: 'devops', color: '#4caf50' },
    { name: 'Linux', level: 85, category: 'devops', color: '#fcc624' },

    // Tools
    { name: 'Git', level: 95, category: 'tools', color: '#f05032' },
    { name: 'VS Code', level: 90, category: 'tools', color: '#007acc' },
    { name: 'Figma', level: 70, category: 'tools', color: '#f24e1e' },
  ],

  // Experience
  experience: [
    {
      id: 'exp-1',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp Inc.',
      companyUrl: 'https://techcorp.example.com',
      location: 'San Francisco, CA',
      startDate: '2022-01',
      endDate: 'Present',
      description: 'Leading development of cloud-native applications and mentoring junior developers.',
      highlights: [
        'Led a team of 5 developers to deliver a microservices architecture serving 1M+ daily users',
        'Reduced application load time by 60% through performance optimization',
        'Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes',
        'Mentored 3 junior developers, helping them grow into mid-level positions'
      ],
      technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker']
    },
    {
      id: 'exp-2',
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      companyUrl: 'https://startupxyz.example.com',
      location: 'Remote',
      startDate: '2020-03',
      endDate: '2021-12',
      description: 'Built and maintained full-stack web applications for enterprise clients.',
      highlights: [
        'Developed a real-time collaboration platform used by 50,000+ users',
        'Integrated payment systems processing $2M+ in monthly transactions',
        'Built RESTful APIs serving mobile and web clients',
        'Implemented automated testing increasing code coverage to 85%'
      ],
      technologies: ['Vue.js', 'Python', 'FastAPI', 'MongoDB', 'Redis', 'GCP']
    },
    {
      id: 'exp-3',
      title: 'Junior Developer',
      company: 'WebAgency Co.',
      companyUrl: 'https://webagency.example.com',
      location: 'New York, NY',
      startDate: '2018-06',
      endDate: '2020-02',
      description: 'Developed responsive websites and web applications for various clients.',
      highlights: [
        'Built 20+ responsive websites for small to medium businesses',
        'Collaborated with designers to implement pixel-perfect UI designs',
        'Optimized existing codebases for better performance and SEO',
        'Introduced modern CSS practices and component-based architecture'
      ],
      technologies: ['JavaScript', 'React', 'HTML/CSS', 'WordPress', 'PHP', 'MySQL']
    }
  ],

  // Education
  education: [
    {
      id: 'edu-1',
      degree: 'Master of Science',
      field: 'Computer Science',
      institution: 'Stanford University',
      institutionUrl: 'https://stanford.edu',
      location: 'Stanford, CA',
      startDate: '2016',
      endDate: '2018',
      gpa: '3.9/4.0',
      honors: ['Dean\'s List', 'Graduate Research Fellowship']
    },
    {
      id: 'edu-2',
      degree: 'Bachelor of Science',
      field: 'Software Engineering',
      institution: 'UC Berkeley',
      institutionUrl: 'https://berkeley.edu',
      location: 'Berkeley, CA',
      startDate: '2012',
      endDate: '2016',
      gpa: '3.7/4.0',
      honors: ['Summa Cum Laude', 'ACM Programming Competition Winner']
    }
  ],

  // Social Links
  socials: [
    {
      platform: 'GitHub',
      url: 'https://github.com/johndeveloper',
      username: '@johndeveloper',
      icon: 'github'
    },
    {
      platform: 'LinkedIn',
      url: 'https://linkedin.com/in/johndeveloper',
      username: 'John Developer',
      icon: 'linkedin'
    },
    {
      platform: 'Twitter',
      url: 'https://twitter.com/johndeveloper',
      username: '@johndeveloper',
      icon: 'twitter'
    },
    {
      platform: 'Dev.to',
      url: 'https://dev.to/johndeveloper',
      username: '@johndeveloper',
      icon: 'devto'
    }
  ],

  // Featured Projects
  projects: [
    {
      id: 'proj-1',
      name: 'rdtect OS',
      description: 'A web-based desktop environment with plugin architecture',
      url: 'https://rdtect-os.example.com',
      github: 'https://github.com/johndeveloper/rdtect-os',
      technologies: ['Svelte', 'TypeScript', 'Tailwind CSS'],
      featured: true
    },
    {
      id: 'proj-2',
      name: 'AI Chat Assistant',
      description: 'Real-time AI-powered chat application with streaming responses',
      github: 'https://github.com/johndeveloper/ai-chat',
      technologies: ['React', 'OpenAI', 'WebSocket'],
      featured: true
    },
    {
      id: 'proj-3',
      name: 'DevOps Dashboard',
      description: 'Monitoring and deployment dashboard for microservices',
      github: 'https://github.com/johndeveloper/devops-dashboard',
      technologies: ['Vue.js', 'Node.js', 'Docker', 'Kubernetes'],
      featured: true
    }
  ],

  // Availability
  availability: 'available',
  availabilityMessage: 'Open to freelance projects and full-time opportunities',

  // Languages
  languages: [
    { name: 'English', level: 'Native' },
    { name: 'Spanish', level: 'Conversational' },
    { name: 'Japanese', level: 'Basic' }
  ],

  // Interests
  interests: [
    'Open Source',
    'AI/ML',
    'System Design',
    'Technical Writing',
    'Mentoring',
    'Gaming'
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
