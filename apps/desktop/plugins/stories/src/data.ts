import type { StoryPost } from './types';

export const stories: StoryPost[] = [
  {
    id: 'mrax-framework',
    title: 'The MRAX Framework',
    slug: 'the-mrax-framework',
    excerpt: 'A cognitive architecture for organizing knowledge, decisions, and work — from personal productivity to enterprise systems.',
    format: 'slides',
    content: '',
    slides: [
      {
        title: 'The MRAX Framework',
        content: 'A Cognitive Architecture for\nKnowledge, Decisions & Work',
        layout: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
      },
      {
        title: 'The Problem',
        content: 'We drown in information but starve for structure.\n\nEvery tool promises organization. None address the fundamental question:\n\n**How does knowledge become action?**',
        layout: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      },
      {
        title: 'Four Layers of Cognition',
        content: '**Model** — What you know (permanent truth)\n\n**Rules** — How you decide (validation, constraints)\n\n**Actions** — What you build (mutation, execution)\n\n**Logs** — What happened (reflection, learning)',
        layout: 'left',
        background: 'linear-gradient(135deg, #0c4a6e 0%, #164e63 100%)'
      },
      {
        title: 'Model Layer — TRUTH',
        content: 'The Model is your ontology — the stable facts, definitions, and relationships that define your domain.\n\n- Universal knowledge that rarely changes\n- Data structures and type definitions\n- Domain entities and their relationships\n- The "nouns" of your system',
        layout: 'left'
      },
      {
        title: 'Rules Layer — VALIDATION',
        content: 'Rules encode how you decide. They sit between knowledge and action, acting as gatekeepers.\n\n- Business logic and constraints\n- Procedures and standards\n- Validation schemas\n- The "adjectives" — what makes something valid',
        layout: 'left'
      },
      {
        title: 'Actions Layer — MUTATION',
        content: 'Actions are where transformation happens. Knowledge filtered through rules becomes change.\n\n- Active projects and execution\n- API endpoints and handlers\n- State mutations and side effects\n- The "verbs" of your system',
        layout: 'left'
      },
      {
        title: 'Logs Layer — REFLECTION',
        content: 'Logs capture what happened — the temporal record that feeds back into the Model.\n\n- Decision records and ADRs\n- Session notes and retrospectives\n- Metrics and observations\n- The feedback loop that improves everything',
        layout: 'left'
      },
      {
        title: 'The Seven Beliefs',
        content: '1. Architecture without code is fantasy; code without architecture is chaos\n2. Patterns are forces to feel, not shapes to copy\n3. The best abstraction is deletable\n4. Complexity belongs in Rules, not data\n5. The Fractal Game is always playing\n6. Notice. Engage. Mull. Exchange — the MRAX rhythm\n7. There are no solutions, only improvements',
        layout: 'left',
        background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)'
      },
      {
        title: 'The Fractal Pattern',
        content: 'MRAX repeats at every scale:\n\n**Personal** — Obsidian vault: 1_Model/, 2_Rules/, 3_Actions/, 4_Logs/\n\n**Codebase** — types.ts, rules.ts, actions.ts, logs/\n\n**Organization** — Knowledge base, SOPs, Projects, Retrospectives\n\n**Product** — Data model, Business logic, Features, Analytics',
        layout: 'left'
      },
      {
        title: 'Start Today',
        content: 'Create four folders. Sort everything you have.\n\nIs it permanent knowledge? → **Model**\nIs it a procedure or standard? → **Rules**\nIs it active work? → **Actions**\nIs it a record of what happened? → **Logs**\n\nThe rest is inbox. Triage it later.',
        layout: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    author: { name: 'Rick de Tect', avatar: 'https://github.com/rdtect.png' },
    publishedAt: '2026-02-20T10:00:00Z',
    readTime: 8,
    tags: ['MRAX', 'architecture', 'productivity', 'philosophy'],
    featured: true
  },
  {
    id: 'architecture-to-ai',
    title: 'From Architecture to AI',
    slug: 'from-architecture-to-ai',
    excerpt: 'A journey through built environments, digital worlds, and intelligent systems — how spatial thinking shapes everything I build.',
    format: 'scroll',
    content: '',
    sections: [
      {
        id: 'origins',
        content: `# The Foundation: Architecture\n\nEvery career has a throughline. Mine is **spatial thinking** — the ability to see systems as spaces that people move through.\n\nI started with literal spaces. A Bachelor of Architecture taught me that buildings are not objects — they are experiences that unfold over time. A corridor is a narrative. A threshold is a decision point. Light is information.\n\nThis training rewired how I see everything: code, products, organizations. They are all architectures. They all have circulation, structure, and experience.`,
        animation: 'fade-in',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
      },
      {
        id: 'studio-arcx',
        content: `# Studio ArcX & The Digital Turn\n\nAt Studio ArcX, I pushed architecture into computational design — parametric facades, algorithmic floor plans, generative urban layouts.\n\nThen came NFTs and Web3. I co-created **Ilm**, an NFT movie project that blended architectural visualization with blockchain storytelling. It was my first experience building digital worlds that existed purely as experiences — no physical materials, no gravity, no building codes.\n\nThe lesson: **constraints are creative fuel.** Physical architecture has too many constraints. Digital architecture has too few. The art is choosing which constraints to impose.`,
        animation: 'slide-up'
      },
      {
        id: 'metaverses',
        content: `# QuantLabs: Building Metaverses\n\nAt QuantLabs, I designed and built metaverse environments — 3D spaces for collaboration, commerce, and culture.\n\nThe work was technically ambitious: real-time 3D in browsers, avatar systems, spatial audio, virtual economies. But the deeper challenge was **spatial UX** — how do you make a 3D space intuitive for people who've never used anything beyond 2D screens?\n\nI learned that the best digital spaces borrow from physical ones, not literally, but structurally. Wayfinding, proximity, sight lines — these principles translate directly from architecture to interface design.`,
        animation: 'parallax',
        background: 'linear-gradient(180deg, #1e293b 0%, #0c4a6e 100%)'
      },
      {
        id: 'omnicom',
        content: `# Omnicom & BBDO: AI Filmmaking at Scale\n\nThe leap to Omnicom/BBDO took me from building spaces to building narratives. As AI practice lead across three regions, I pioneered AI-driven filmmaking workflows for global brands.\n\nComfyUI pipelines for visual production. Runway and Kling for motion. ElevenLabs for voice. Custom workflows that turned brand briefs into production-ready assets in hours instead of weeks.\n\nThe pattern was familiar: **architecture is about orchestrating systems.** Whether those systems are structural beams or AI models, the design challenge is the same — compose the right elements in the right sequence to create the right experience.`,
        animation: 'reveal'
      },
      {
        id: 'zyeta',
        content: `# Zyeta: The Future of Work\n\nNow at Zyeta, I'm applying everything — spatial thinking, computational design, AI systems — to the **future of workplace experience.**\n\nZyeta sits at the intersection of physical space and digital intelligence. How should offices work when AI handles half the tasks? How do you design spaces that adapt to the people in them? What does "workplace" even mean when work is distributed, asynchronous, and AI-augmented?\n\nThese questions require someone who thinks in both atoms and bits. Someone who can architect physical spaces AND digital systems. That's the throughline — every role prepared me for this convergence.`,
        animation: 'slide-up',
        background: 'linear-gradient(180deg, #1e293b 0%, #4c1d95 100%)'
      },
      {
        id: 'future',
        content: `# The Constant: Systems Thinking\n\nArchitecture taught me to see systems.\nWeb3 taught me to question ownership.\nMetaverses taught me spatial UX.\nAI filmmaking taught me orchestration at scale.\nWorkplace design taught me human-centered AI.\n\nThe tools change. The medium changes. But the core skill is always the same: **understand the forces, design the structure, craft the experience.**\n\nEvery era needs its architect. I just keep finding new materials to build with.`,
        animation: 'fade-in',
        background: 'linear-gradient(180deg, #4c1d95 0%, #1e1b4b 100%)',
        sticky: true
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=400&fit=crop',
    author: { name: 'Rick de Tect', avatar: 'https://github.com/rdtect.png' },
    publishedAt: '2026-02-18T14:00:00Z',
    readTime: 10,
    tags: ['career', 'architecture', 'AI', 'web3', 'workplace']
  },
  {
    id: 'desktop-os-browser',
    title: 'Building a Desktop OS in the Browser',
    slug: 'building-desktop-os-browser',
    excerpt: 'Plugin architecture, window management, a virtual file system, and Svelte 5 runes — the engineering behind a web-based desktop environment.',
    format: 'article',
    content: `# Building a Desktop OS in the Browser

What if your entire computing environment ran in a browser tab? Not a simplified web app pretending to be a desktop, but a genuine multi-window operating system with a file system, plugin architecture, and inter-process communication.

That's what I built. Here's how.

## The Architecture: Three Layers

The system follows a strict three-layer dependency rule:

\`\`\`
Layer 3: Plugins     — User-facing applications (24 and counting)
Layer 2: Shell       — Window manager, desktop UI, taskbar
Layer 1: Core        — VFS, agents, messaging, plugin loading, theme
         Browser APIs — IndexedDB, localStorage, DOM, WebSocket
\`\`\`

**The rule is simple:** each layer can only import from layers below it. Plugins use Shell and Core. Shell uses Core. Core never imports from Shell or Plugins. This constraint keeps the system modular and each layer independently testable.

## Plugin System: Five Types, One Interface

Every application is a plugin. The system supports five integration patterns through a single manifest interface:

\`\`\`typescript
interface PluginManifest {
  id: string;
  name: string;
  type: 'native' | 'iframe' | 'webcomponent' | 'federation' | 'wasm';
  entry: string;
  defaultWidth: number;
  defaultHeight: number;
}
\`\`\`

**Native plugins** are Svelte 5 components with full desktop API access — the fastest, most capable option. **iframe plugins** provide security isolation for untrusted content. **WebComponents** enable framework-agnostic widgets. **Module Federation** allows loading plugins from remote servers at runtime. **WASM** plugins bring near-native computation.

New plugins are auto-discovered. Drop a folder with a \`manifest.ts\` into the plugins directory, and it appears on the next dev server start. No registration, no configuration file to edit.

\`\`\`typescript
// Auto-discovery via Vite glob
const manifests = import.meta.glob('/plugins/*/manifest.ts');
\`\`\`

## Window Management: The Hard Part

Window management sounds simple until you implement it. Every window needs:

- **Positioning** — draggable with boundary constraints
- **Resizing** — eight handles (corners + edges), minimum sizes
- **Z-indexing** — click to focus, proper stacking order
- **Snapping** — edge snap, half-screen, quarter-screen zones
- **State** — minimize, maximize, restore, close
- **Transitions** — smooth animations between states

The WindowManager is a reactive singleton using Svelte 5 runes:

\`\`\`typescript
class WindowManager {
  apps = $state<AppDefinition[]>([]);
  windows = $state<Window[]>([]);
  visibleWindows = $derived(
    this.windows.filter(w => !w.isMinimized)
  );
}
export const wm = new WindowManager();
\`\`\`

Every window state change triggers reactive updates across the entire UI — taskbar buttons, window decorations, snap zone previews — all without manual subscriptions.

## Virtual File System: Unix in IndexedDB

The VFS implements a Unix-like file hierarchy backed by IndexedDB:

\`\`\`
/home/user/          — User files and configurations
/proc/               — Read-only system state (windows, uptime, meminfo)
/dev/                — Virtual devices (null, random, clipboard, console)
/home/user/.config/  — XDG-style per-app configuration
\`\`\`

Reading from \`/proc/windows\` returns the current window list. Writing to \`/dev/clipboard\` sets the clipboard contents. The file system is the universal interface — every subsystem exposes itself as files.

## IPC: Events and Messages

Two communication systems serve different needs:

**EventBus** handles lightweight system events — \`window:opened\`, \`theme:changed\`, \`file:open\`. It's synchronous, typed, and fast. Think of it as kernel signals.

**MessageBus** provides full pub/sub for plugin-to-plugin communication with request/response patterns. Think of it as D-Bus — plugins can discover, subscribe, and exchange structured data without coupling.

\`\`\`typescript
// Plugin A publishes
messageBus.publish('notes:updated', { id: '123', content: '...' });

// Plugin B subscribes
messageBus.subscribe('notes:updated', (data) => {
  refreshView(data.id);
});
\`\`\`

## Svelte 5 Runes: The Right Abstraction

The entire reactive layer uses Svelte 5 runes — no legacy stores, no writable/readable/derived. Runes made the codebase dramatically simpler:

- **\`$state\`** for all mutable state
- **\`$derived\`** for computed values
- **\`$effect\`** for side effects
- **\`.svelte.ts\`** files for reactive logic outside components

The biggest win: reactive classes. Instead of stores that require manual subscription management, services are plain classes with \`$state\` fields. Import the singleton, read its properties, and reactivity just works.

## What I Learned

1. **The file system metaphor endures** — Unix got it right. Everything-is-a-file scales from kernel APIs to web apps.
2. **Constraints breed creativity** — Browser limitations forced elegant solutions. No threads? Use Web Workers. No native windows? Build a window manager in CSS.
3. **Plugin architecture > monolith** — 24 plugins share zero code with each other. Any one can be deleted without affecting the rest.
4. **Runes are the future** — Svelte 5's reactivity model is the cleanest I've used in 15 years of frontend development.

The source code is open. The desktop is live. And I'm still adding plugins.

---

*Built with SvelteKit 2, Svelte 5, Tailwind CSS, PocketBase, and an unreasonable amount of CSS.*`,
    coverImage: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=400&fit=crop',
    author: { name: 'Rick de Tect', avatar: 'https://github.com/rdtect.png' },
    publishedAt: '2026-02-15T10:00:00Z',
    readTime: 8,
    tags: ['architecture', 'svelte', 'typescript', 'web-development', 'open-source']
  },
  {
    id: 'future-digital-experience',
    title: 'The Future of Digital Experience',
    slug: 'future-digital-experience',
    excerpt: 'How AI, spatial computing, and adaptive environments will reshape the way we work, create, and collaborate.',
    format: 'slides',
    content: '',
    slides: [
      {
        title: 'The Future of Digital Experience',
        content: 'Where AI, Space & Work Converge',
        layout: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4338ca 100%)'
      },
      {
        title: 'The Workplace is Dissolving',
        content: 'The office is no longer a place. It is a **protocol.**\n\nRemote work proved that presence is optional. AI is proving that tasks are automatable. What remains is the irreducible human core: creativity, judgment, and connection.\n\nThe future workplace must be designed for these three things — and nothing else.',
        layout: 'left'
      },
      {
        title: 'Three Forces of Change',
        content: '**AI Agents** — Systems that do work, not just process information. Your next coworker will not have a body.\n\n**Spatial Computing** — AR/VR/MR blurring digital and physical. Screens are becoming spaces.\n\n**Adaptive Environments** — Buildings that sense, learn, and respond. The room knows who is in it and what they need.',
        layout: 'left',
        background: 'linear-gradient(135deg, #0c4a6e 0%, #164e63 100%)'
      },
      {
        title: 'AI as Creative Partner',
        content: 'The first wave of AI was about **automation** — do the same thing, faster.\n\nThe second wave is about **augmentation** — do things that were previously impossible.\n\nAI filmmaking, generative design, code synthesis, real-time translation — these are not replacements for human work. They are amplifiers of human capability.',
        layout: 'left'
      },
      {
        title: 'The Interface Paradox',
        content: 'As systems get more powerful, interfaces must get simpler.\n\nA command line is powerful but exclusionary.\nA GUI is accessible but constraining.\nA conversational interface is natural but ambiguous.\n\n**The next interface combines all three** — structured when you need control, conversational when you need flexibility, invisible when you need flow.',
        layout: 'center'
      },
      {
        title: 'Designing for Emergence',
        content: 'Traditional design: Define requirements → Build solution → Ship\n\nEmergent design: **Create conditions → Observe behavior → Amplify what works**\n\nThe best digital experiences are not designed top-down. They are cultivated. You design the soil, not the flower.\n\nPlugin architectures. Modular systems. Composable tools. These are gardens, not buildings.',
        layout: 'left',
        background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)'
      },
      {
        title: 'Zyeta\'s Vision',
        content: 'At Zyeta, we are building the convergence layer:\n\n- **Physical spaces** that adapt to digital workflows\n- **Digital tools** that understand physical context\n- **AI systems** that orchestrate both\n\nThe workplace of tomorrow is not remote or in-office.\nIt is **intelligent.** It knows what you need before you ask.',
        layout: 'left'
      },
      {
        title: 'The Invitation',
        content: 'Every era gets the interface it deserves.\n\nThe industrial era got factories.\nThe information era got screens.\nThe intelligence era gets **environments that think.**\n\nThe question is not whether this future is coming.\nIt is who gets to design it.\n\n**Let\'s build it together.**',
        layout: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    author: { name: 'Rick de Tect', avatar: 'https://github.com/rdtect.png' },
    publishedAt: '2026-02-22T16:00:00Z',
    readTime: 6,
    tags: ['future-of-work', 'AI', 'workplace', 'Zyeta', 'thought-leadership']
  },
  {
    id: 'every-era-interface',
    title: 'Why Every Era Needs Its Own Interface',
    slug: 'every-era-needs-its-own-interface',
    excerpt: 'From command lines to conversational AI — how each technology paradigm demands a fundamentally new interaction model.',
    format: 'article',
    content: `# Why Every Era Needs Its Own Interface

The desktop metaphor is 51 years old. Xerox PARC invented it in 1973. Apple shipped it in 1984. Microsoft made it ubiquitous in 1995. And we are still using it in 2026.

Why? Not because it is the best interface. Because it is the most *durable* one. And understanding why it endures reveals something profound about what comes next.

## The Pattern: Paradigm Demands Interface

Every major technology paradigm has produced its own interface model:

| Era | Technology | Interface | Metaphor |
|-----|-----------|-----------|----------|
| Mainframe | Batch processing | Punch cards | Manufacturing |
| Minicomputer | Time-sharing | Terminal / CLI | Conversation |
| Personal computer | Local compute | Desktop / GUI | Office |
| Web | Networked documents | Browser / Pages | Library |
| Mobile | Touch + sensors | Apps / Gestures | Tools |
| Cloud/SaaS | Distributed services | Dashboards | Control room |
| AI | Language models | Chat / Agents | Assistant |

Each transition follows the same arc: the new technology arrives, people squeeze it into the old interface, then someone invents the native interface, and everything changes.

## Why the Desktop Endures

The desktop metaphor survives because it maps to something fundamental: **spatial organization.**

Humans think spatially. We remember where we put things. We organize by grouping related items. We use visual hierarchy to prioritize. The desktop gives us all of this — files in folders, windows we can arrange, a taskbar for quick access.

No subsequent paradigm has fully replaced this. Web apps live in browser tabs (windows by another name). Mobile apps are icons on a home screen (a desktop by another name). Even VR environments use spatial arrangement.

**The desktop is not a metaphor for computers. It is a metaphor for how humans organize thought.**

## The Web3 Interregnum

Web3 tried to invent a new interface paradigm. Wallets, DAOs, NFT galleries — these were genuinely new interaction patterns built around ownership and decentralization.

But Web3 made a critical error: it optimized for the technology's values (decentralization, trustlessness) instead of the user's needs (simplicity, utility). The interfaces were powerful but hostile. They required understanding gas fees, private keys, and blockchain confirmations.

The lesson: **a paradigm's interface must serve the user, not the technology.** The CLI served programmers. The GUI served knowledge workers. Web3's interface served... cryptographers.

## The AI Paradigm Shift

AI is the first paradigm that genuinely threatens the desktop metaphor. Why? Because language is a more natural interface than spatial arrangement.

When you talk to an AI assistant, you do not need to know where a feature lives in a menu hierarchy. You do not need to remember keyboard shortcuts. You do not need to manage windows or files. You just say what you want.

But conversational interfaces have their own problems:

- **Ambiguity** — "Make it better" means different things in different contexts
- **Discoverability** — You cannot browse capabilities; you must know to ask
- **Precision** — "Move that element 3 pixels left" is easier to do directly than to describe
- **State** — Conversations are linear; complex work is spatial

## The Hybrid Future

The next great interface will not be pure desktop or pure chat. It will be a hybrid that uses the right modality for each task:

**Spatial** for organization and overview — seeing all your projects, arranging windows, managing files.

**Conversational** for intent and execution — "create a presentation from this research" is better than clicking through 47 dialog boxes.

**Direct manipulation** for precision — dragging, resizing, drawing, editing. Some things must be touched.

**Ambient** for monitoring and awareness — system status, notifications, background processes. Information that should be visible but not demanding.

This is exactly what I am building with the Desktop OS project. A desktop environment where windows and files coexist with AI agents. Where you can arrange your workspace spatially AND ask an agent to help. Where the interface adapts to the task.

## The Desktop OS as Proof of Concept

The browser-based desktop environment is not nostalgia. It is a laboratory for the hybrid interface.

It has windows and a taskbar (spatial). It has an AI agent system (conversational). It has direct manipulation (drag, resize, snap). It has system events and notifications (ambient).

Every plugin is an experiment in which modality works best for which task. The code editor is spatial. The AI chat is conversational. The file browser is direct manipulation. The system monitor is ambient.

## What Comes After

The paradigm after AI will likely be **autonomous systems** — AI agents that do not just respond to requests but proactively manage entire workflows. The interface for that paradigm does not exist yet.

But I suspect it will still have elements of spatial organization. Because humans will always need to see, arrange, and understand. The desktop metaphor will outlive us all — not as a rectangle on a screen, but as the fundamental human need to organize thought in space.

---

*The best interface is the one you forget you are using. Every era gets closer to that ideal, and every era falls short in its own way.*`,
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
    author: { name: 'Rick de Tect', avatar: 'https://github.com/rdtect.png' },
    publishedAt: '2026-02-10T09:00:00Z',
    readTime: 9,
    tags: ['interfaces', 'design', 'AI', 'web3', 'history', 'thought-leadership']
  }
];

export function getAllTags(posts: StoryPost[]): string[] {
  const tagSet = new Set<string>();
  posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export function filterByTag(posts: StoryPost[], tag: string): StoryPost[] {
  return posts.filter(post => post.tags.includes(tag));
}

export function searchStories(posts: StoryPost[], query: string): StoryPost[] {
  const q = query.toLowerCase().trim();
  if (!q) return posts;
  return posts.filter(post =>
    post.title.toLowerCase().includes(q) ||
    post.excerpt.toLowerCase().includes(q) ||
    post.content.toLowerCase().includes(q) ||
    post.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
