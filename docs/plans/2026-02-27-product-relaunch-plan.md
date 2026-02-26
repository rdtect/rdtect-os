# rdtect OS Product Relaunch — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform rdtect OS from a 24-app demo into a 36-app web OS ecosystem with updated profile, multi-format stories, 3D experience, app store, and games.

**Architecture:** 4-phase rollout. Phase 1 updates foundation (types, categories, profile data). Phase 2 builds hero apps in parallel (Stories engine, 3D/Creative, About Me rewrite). Phase 3 adds ecosystem (App Store, games, studio polish). Phase 4 integrates everything (Welcome wizard, design audit, deployment).

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Threlte (Three.js), Tailwind CSS 3, Bun monorepo, PocketBase

---

## Phase 1: Foundation

> Sequential — must complete before Phase 2. All tasks modify shared types/config.

### Task 1.1: Expand AppCategory to 6 groups

**Files:**
- Modify: `apps/desktop/src/lib/core/types.ts:12`
- Modify: `apps/desktop/src/lib/core/categories.ts:11-16`

**Step 1: Update the AppCategory union type**

In `apps/desktop/src/lib/core/types.ts`, change line 12:
```typescript
// FROM:
export type AppCategory = 'showcase' | 'studio' | 'desktop' | 'admin';

// TO:
export type AppCategory = 'showcase' | 'studio' | 'creative' | 'games' | 'desktop' | 'admin';
```

**Step 2: Add new categories to categoryConfig**

In `apps/desktop/src/lib/core/categories.ts`, add `creative` and `games`:
```typescript
export const categoryConfig: Record<AppCategory, CategoryConfig> = {
  showcase: { icon: '💼', label: 'Showcase', order: 0, description: 'Work & portfolio' },
  studio:   { icon: '🛠', label: 'Studio',   order: 1, description: 'Build & create' },
  creative: { icon: '🎨', label: 'Creative', order: 2, description: 'Art & experiments' },
  games:    { icon: '🎮', label: 'Games',    order: 3, description: 'Play & explore' },
  desktop:  { icon: '🖥', label: 'Desktop',  order: 4, description: 'Everyday tools' },
  admin:    { icon: '🔐', label: 'Admin',    order: 5, description: 'System management', requiresAuth: true },
};
```

**Step 3: Run type check to verify**

Run: `bun run check`
Expected: 0 errors (existing manifests still use valid categories)

**Step 4: Commit**

```bash
git add apps/desktop/src/lib/core/types.ts apps/desktop/src/lib/core/categories.ts
git commit -m "feat: expand categories — add creative + games groups"
```

---

### Task 1.2: Update existing manifests for new categories

**Files:**
- Modify: `apps/desktop/plugins/image-filter/manifest.ts` (desktop → creative)
- Modify: `apps/desktop/plugins/flappy-bird/manifest.ts` (desktop → games)
- Modify: `apps/desktop/plugins/github-globe/manifest.ts` (will be replaced, but update for now)

**Step 1: Move Image Filter to creative**

In `apps/desktop/plugins/image-filter/manifest.ts`, change:
```typescript
category: 'creative',
```

**Step 2: Move Flappy Bird to games**

In `apps/desktop/plugins/flappy-bird/manifest.ts`, change:
```typescript
category: 'games',
```

**Step 3: Run type check**

Run: `bun run check`
Expected: 0 errors

**Step 4: Commit**

```bash
git add apps/desktop/plugins/image-filter/manifest.ts apps/desktop/plugins/flappy-bird/manifest.ts
git commit -m "refactor: move image-filter to creative, flappy-bird to games"
```

---

### Task 1.3: Update profile data — add Omnicom + Zyeta career

**Files:**
- Modify: `apps/desktop/plugins/about-me/src/data.ts:103-386`

**Step 1: Update basic info (title, tagline, bio)**

In `data.ts`, update the `profileData` object:
```typescript
export const profileData: ProfileData = {
  name: 'Rick Dé',
  title: 'Associate Director, Digital Experience Design',
  tagline: 'Designing at the edge of what\'s next — from built environments to AI-powered digital experience',
  avatar: '',
  location: 'Bengaluru, India',
  email: 'rdtect@outlook.com',
  phone: '+91 98309 14213',
  website: 'https://rdtect.com',

  shortBio: 'Associate Director of Digital Experience Design at Zyeta with 13+ years blending architecture, creative technology, and strategy. Leading a vertical for digital experience and the future of work.',

  bio: `Associate Director of Digital Experience Design with 13+ years of expertise blending architecture, creative technology, and strategy. From designing physical spaces to building metaverses to leading AI-powered digital transformation at global scale.

Career highlights: pioneered the world's first NFT crowd-funded Bollywood movie (Ilm, Disney+ Hotstar). Designed Versez, a customizable metaverse platform. Led digital experience for BBDO across three regions and New York at Omnicom. First mover on AI-based filmmaking and advertising at Omnicom Global Solutions. Built AI websites for Columbia Journalism Review.

Currently at Zyeta — a globally ranked workplace design firm — leading the Digital Experience vertical. Strategizing the future of work through adaptive workplace solutions, design thinking, AI tools, and emerging technology.

Building rdtect OS as a showcase of what's possible when architecture meets code.`,
  // ...rest unchanged
};
```

**Step 2: Add Zyeta and Omnicom experience entries**

Insert two new experience entries at the TOP of the `experience` array (before `exp-quant`):
```typescript
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
        'Moved to Omnicom Global Solutions (production house) — first movers for AI-based filmmaking',
        'Built AI websites for Columbia Journalism Review',
        'Pioneered AI-powered advertising workflows'
      ],
      technologies: ['AI Filmmaking', 'Solution Architecture', 'React', 'SvelteKit', 'Python', 'GenAI', 'Figma']
    },
    // existing exp-quant entry (update endDate to '2023')
    {
      id: 'exp-quant',
      title: 'Product Designer & Metaverse Architect',
      company: 'QuantLabs',
      location: 'Remote',
      startDate: '2022',
      endDate: '2023',
      // ...rest unchanged
    },
    // ...rest of existing experience entries
  ],
```

**Step 3: Update skills array**

Add new skills and update categories:
```typescript
// Add to skills array:
{ name: 'AI Solutions & Strategy', level: 90, category: 'backend', color: '#10a37f' },
{ name: 'Team Leadership (Global)', level: 88, category: 'soft', color: '#f59e0b' },
{ name: 'Solution Architecture', level: 85, category: 'backend', color: '#3b82f6' },
{ name: 'Future of Work Strategy', level: 85, category: 'soft', color: '#06b6d4' },
{ name: 'Python', level: 78, category: 'backend', color: '#3776ab' },
{ name: 'Three.js / Threlte', level: 75, category: 'frontend', color: '#049ef4' },
```

**Step 4: Add Omnicom + Zyeta projects**

Add to the `projects` array:
```typescript
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
```

**Step 5: Update interests and availability**

```typescript
interests: [
  'AI Solutions & Strategy',
  'Future of Work',
  'Emergent Technology',
  '3D Design & Visualization',
  'Creative Coding',
  'Architectural Design',
  'Digital Product Design'
],

availability: 'busy',
availabilityMessage: 'Leading Digital Experience at Zyeta — open to collaborations in AI and emergent tech',
```

**Step 6: Run type check**

Run: `bun run check`
Expected: 0 errors

**Step 7: Commit**

```bash
git add apps/desktop/plugins/about-me/src/data.ts
git commit -m "feat: update profile — add Zyeta + Omnicom career, AI skills, updated bio"
```

---

### Task 1.4: Update Project Gallery data with Omnicom + Zyeta projects

**Files:**
- Modify: `apps/desktop/plugins/project-gallery/src/data.ts`
- Modify: `apps/desktop/plugins/project-gallery/src/local-projects.ts`

**Step 1: Add Omnicom projects to data.ts portfolio section**

Add after existing portfolio entries in the `projects` array:
```typescript
{
  id: 'omnicom-ai-filmmaking',
  title: 'AI Filmmaking — Omnicom Global Solutions',
  description: 'First movers on AI-based filmmaking and advertising',
  longDescription: 'Led the AI-powered filmmaking initiative at Omnicom Global Solutions, the production house of Omnicom Group. Pioneered AI-based advertising workflows and built AI websites for Columbia Journalism Review. Solution architecture across legacy and emergent technology stacks.',
  thumbnail: '',
  icon: '🎬',
  gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 40%, #7f1d1d 100%)',
  screenshots: [],
  techStack: ['AI/GenAI', 'Solution Architecture', 'Filmmaking', 'Web Development', 'Python'],
  category: 'professional',
  source: 'portfolio',
  featured: true,
  dateAdded: '2024-01-01'
},
{
  id: 'bbdo-global-dx',
  title: 'BBDO Global Digital Experience',
  description: 'UI/UX and digital experience across 3 regions + New York',
  longDescription: 'Led UI/UX and digital experience for BBDO creative technology teams across three regions and New York at Analect (Omnicom Group). Solution architect for legacy website modernization with emergent technology layers. Led teams for BBDO Canada and ANZ for global multi-region delivery.',
  thumbnail: '',
  icon: '🌍',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 40%, #1e3a5f 100%)',
  screenshots: [],
  techStack: ['Solution Architecture', 'UI/UX', 'React', 'Creative Technology', 'Global Teams'],
  category: 'professional',
  source: 'portfolio',
  featured: true,
  dateAdded: '2023-06-01'
},
{
  id: 'columbia-journalism-ai',
  title: 'Columbia Journalism Review — AI Website',
  description: 'AI-powered website for prestigious journalism publication',
  longDescription: 'Built AI-powered websites for the Columbia Journalism Review as part of Omnicom Global Solutions\' AI-first initiative. One of the first applications of AI in media website development.',
  thumbnail: '',
  icon: '📰',
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 40%, #4c1d95 100%)',
  screenshots: [],
  techStack: ['AI/GenAI', 'Web Development', 'Content Platform', 'Python'],
  category: 'ai',
  source: 'portfolio',
  featured: false,
  dateAdded: '2024-06-01'
},
```

**Step 2: Verify Zyeta projects in local-projects.ts are complete**

Read `local-projects.ts` and ensure all 7 Zyeta projects are represented:
- aero-window, workspace-studio, ai-pm-assessor, meddicc-research, dx-platform, 2gethr-jingle-hunt, dualsync

If any are missing, add them with accurate descriptions from the discovered CLAUDE.md files.

**Step 3: Run type check**

Run: `bun run check`
Expected: 0 errors

**Step 4: Commit**

```bash
git add apps/desktop/plugins/project-gallery/src/data.ts apps/desktop/plugins/project-gallery/src/local-projects.ts
git commit -m "feat: add Omnicom + Zyeta projects to gallery — BBDO, AI filmmaking, CJR"
```

---

### Task 1.5: Merge Contact into About Me

**Files:**
- Modify: `apps/desktop/plugins/about-me/src/AboutMe.svelte`
- Delete: `apps/desktop/plugins/contact/` (entire directory)

**Step 1: Read current Contact component**

Read `apps/desktop/plugins/contact/src/Contact.svelte` to understand what UI elements need migrating.

**Step 2: Add Contact tab/section to About Me**

The AboutMe component likely has tabs/sections. Add a "Contact" section with:
- Email (rdtect@outlook.com)
- Phone (+91 98309 14213)
- Location (Bengaluru, India)
- Social links (GitHub, LinkedIn)
- Contact form (if one exists in Contact.svelte)

Implementation depends on current AboutMe structure — read it first, then add as a new tab or footer section.

**Step 3: Remove Contact plugin directory**

```bash
rm -rf apps/desktop/plugins/contact/
```

**Step 4: Update any references to 'contact' app ID**

Search for `contact` references:
```bash
grep -r "'contact'" apps/desktop/plugins/welcome/ apps/desktop/src/
```

Update Welcome.svelte's `featuredApps` array to replace `{ appId: 'contact', ... }` with `{ appId: 'about-me', ... }` (or another appropriate app).

**Step 5: Run type check + dev server**

Run: `bun run check`
Expected: 0 errors (contact manifest is simply gone — no import errors since it was glob-discovered)

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: merge Contact into About Me, remove standalone contact plugin"
```

---

### Task 1.6: Install Threlte dependencies

**Files:**
- Modify: `apps/desktop/package.json`

**Step 1: Install Threlte + Three.js**

```bash
cd apps/desktop && bun add @threlte/core @threlte/extras three && bun add -d @types/three
```

Note: Check Threlte Svelte 5 compatibility first:
```bash
bun info @threlte/core 2>/dev/null || npm view @threlte/core version
```

If Threlte v8+ is available (Svelte 5 support), use it. If not, use `@threlte/core@next`.

**Step 2: Verify build**

Run: `bun run check`
Expected: 0 errors

**Step 3: Commit**

```bash
git add apps/desktop/package.json bun.lock
git commit -m "chore: add Threlte + Three.js dependencies for 3D experience"
```

---

## Phase 2: Hero Apps

> 3 parallel workstreams. Each can be assigned to a separate agent team.
> All workstreams depend on Phase 1 completion.

### Workstream A: Stories Engine (replaces Blog)

#### Task 2A.1: Create Stories plugin scaffold + types

**Files:**
- Create: `apps/desktop/plugins/stories/manifest.ts`
- Create: `apps/desktop/plugins/stories/src/types.ts`

**Step 1: Create manifest**

```typescript
// apps/desktop/plugins/stories/manifest.ts
import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'stories',
  name: 'Stories',
  version: '1.0.0',
  type: 'native',
  icon: '📖',
  description: 'Thought leadership — articles, slide decks, and scroll stories',
  entry: './src/Stories.svelte',
  defaultWidth: 900,
  defaultHeight: 650,
  category: 'showcase',
  priority: 15,
  showOnDesktop: true,
  pinnedToTaskbar: false,
  tags: ['blog', 'articles', 'stories', 'MRAX', 'thought-leadership'],
};
export default manifest;
```

**Step 2: Create types**

```typescript
// apps/desktop/plugins/stories/src/types.ts
export type StoryFormat = 'slides' | 'scroll' | 'article';

export interface StoryPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  format: StoryFormat;
  content: string;           // Markdown for articles, JSON for slides/scroll
  coverImage?: string;
  coverGradient?: string;
  author: { name: string; avatar?: string };
  publishedAt: string;
  readTime: number;
  tags: string[];
  featured?: boolean;
}

export interface Slide {
  title?: string;
  content: string;           // Markdown
  notes?: string;            // Presenter notes
  background?: string;       // CSS background
  layout?: 'center' | 'left' | 'right' | 'split' | 'code';
}

export interface ScrollSection {
  id: string;
  content: string;           // Markdown
  animation?: 'fade-in' | 'slide-up' | 'parallax' | 'reveal';
  background?: string;
  sticky?: boolean;
}
```

**Step 3: Commit**

```bash
git add apps/desktop/plugins/stories/
git commit -m "feat: stories plugin scaffold — manifest + types for multi-format content"
```

---

#### Task 2A.2: Build Stories main component + article renderer

**Files:**
- Create: `apps/desktop/plugins/stories/src/Stories.svelte`
- Create: `apps/desktop/plugins/stories/src/ArticleRenderer.svelte`
- Create: `apps/desktop/plugins/stories/src/StoryList.svelte`
- Create: `apps/desktop/plugins/stories/src/StoryCard.svelte`

**Step 1: Build the main Stories.svelte**

Port the existing Blog.svelte structure but add format switching. The main view shows a story list. Clicking a story opens it in the appropriate renderer based on `format`.

Key structure:
```svelte
<script lang="ts">
  import type { StoryPost } from './types';
  import { stories } from './data';
  import StoryList from './StoryList.svelte';
  import ArticleRenderer from './ArticleRenderer.svelte';
  import SlideRenderer from './SlideRenderer.svelte';
  import ScrollRenderer from './ScrollRenderer.svelte';

  let selectedStory = $state<StoryPost | null>(null);

  function openStory(story: StoryPost) { selectedStory = story; }
  function back() { selectedStory = null; }
</script>

{#if selectedStory}
  {#if selectedStory.format === 'article'}
    <ArticleRenderer story={selectedStory} onBack={back} />
  {:else if selectedStory.format === 'slides'}
    <SlideRenderer story={selectedStory} onBack={back} />
  {:else if selectedStory.format === 'scroll'}
    <ScrollRenderer story={selectedStory} onBack={back} />
  {/if}
{:else}
  <StoryList {stories} onSelect={openStory} />
{/if}
```

**Step 2: Build ArticleRenderer** (port from existing PostView.svelte)

Read `apps/desktop/plugins/blog/src/PostView.svelte` and adapt. Uses markdown rendering with code highlighting.

**Step 3: Build StoryList and StoryCard** (port from existing PostList/PostCard)

Read existing blog components and adapt. Add format badges (📊 slides, 📜 scroll, 📝 article).

**Step 4: Run type check**

Run: `bun run check`
Expected: 0 errors

**Step 5: Commit**

```bash
git add apps/desktop/plugins/stories/
git commit -m "feat: stories — main component + article renderer + story list"
```

---

#### Task 2A.3: Build slide renderer

**Files:**
- Create: `apps/desktop/plugins/stories/src/SlideRenderer.svelte`

**Step 1: Build SlideRenderer**

A Svelte-native slide deck renderer:
- Full-screen slides within the window
- Keyboard navigation (← → arrows, Space, Escape to exit)
- Touch gestures (swipe left/right)
- Slide counter (3 / 12)
- Code syntax highlighting (re-use existing markdown rendering)
- Layouts: center, left, right, split, code
- Transition between slides (fade or slide)
- Uses design tokens for glass morphism backgrounds

```svelte
<script lang="ts">
  import type { StoryPost, Slide } from './types';

  interface Props {
    story: StoryPost;
    onBack: () => void;
  }
  let { story, onBack }: Props = $props();

  const slides: Slide[] = JSON.parse(story.content);
  let currentIndex = $state(0);
  const total = slides.length;
  const current = $derived(slides[currentIndex]);

  function next() { if (currentIndex < total - 1) currentIndex++; }
  function prev() { if (currentIndex > 0) currentIndex--; }
  function handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Escape') onBack();
  }
</script>

<svelte:window onkeydown={handleKey} />
```

**Step 2: Run type check**

Run: `bun run check`

**Step 3: Commit**

```bash
git add apps/desktop/plugins/stories/src/SlideRenderer.svelte
git commit -m "feat: stories — slide renderer with keyboard/touch navigation"
```

---

#### Task 2A.4: Build scroll renderer

**Files:**
- Create: `apps/desktop/plugins/stories/src/ScrollRenderer.svelte`

**Step 1: Build ScrollRenderer**

Immersive scroll-driven storytelling:
- IntersectionObserver triggers section animations
- Parallax backgrounds
- Sticky sections with scroll-driven reveals
- Progress bar at top
- Smooth section transitions

Each `ScrollSection` becomes a `<section>` with scroll-triggered class changes.

**Step 2: Run type check + commit**

```bash
git add apps/desktop/plugins/stories/src/ScrollRenderer.svelte
git commit -m "feat: stories — scroll renderer with intersection observer animations"
```

---

#### Task 2A.5: Write 5 launch stories (content)

**Files:**
- Create: `apps/desktop/plugins/stories/src/data.ts`

**Step 1: Write the stories data file**

Contains 5 `StoryPost` objects with real content:

1. **"The MRAX Framework"** (slides) — 10-12 slides covering Model/Rules/Actions/Logs, the Seven Beliefs, fractal patterns in code. Each slide has `title`, `content` (markdown), `layout`.

2. **"From Architecture to AI"** (scroll) — 6-8 scroll sections following career timeline. Each section has content + animation trigger. Visual timeline from buildings → NFTs → metaverse → BBDO → AI → Zyeta.

3. **"Building a Desktop OS in the Browser"** (article) — Enhanced version of existing blog post. Add sections on plugin architecture, window management, VFS. Include code examples.

4. **"The Future of Digital Experience"** (slides) — 8-10 slides on Zyeta's vertical, future of work, emergent tech + AI in workplace design. Thought leadership positioning.

5. **"Why Every Era Needs Its Own Interface"** (article) — Thesis on how paradigm shifts (web → mobile → web3 → AI) demand new interaction models. Why the desktop metaphor endures.

**Step 2: Remove old blog plugin**

```bash
rm -rf apps/desktop/plugins/blog/
```

**Step 3: Run type check + commit**

```bash
git add -A
git commit -m "feat: stories — 5 launch posts (MRAX slides, career scroll, articles) + remove old blog"
```

---

### Workstream B: 3D & Creative Apps

#### Task 2B.1: Create 3D Experience plugin with Threlte

**Files:**
- Create: `apps/desktop/plugins/3d-experience/manifest.ts`
- Create: `apps/desktop/plugins/3d-experience/src/Experience.svelte`
- Create: `apps/desktop/plugins/3d-experience/src/Scene.svelte`

**Step 1: Create manifest**

```typescript
const manifest: PluginManifest = {
  id: '3d-experience',
  name: '3D Experience',
  version: '1.0.0',
  type: 'native',
  icon: '🌌',
  description: 'Interactive 3D space — architecture meets metaverse meets data',
  entry: './src/Experience.svelte',
  defaultWidth: 800,
  defaultHeight: 600,
  category: 'creative',
  priority: 10,
  showOnDesktop: true,
  pinnedToTaskbar: true,
  tags: ['3d', 'three.js', 'threlte', 'metaverse', 'architecture', 'webgl'],
};
export default manifest;
```

**Step 2: Build the Threlte scene**

```svelte
<!-- apps/desktop/plugins/3d-experience/src/Experience.svelte -->
<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';

  interface Props { windowId?: string; }
  let { windowId }: Props = $props();
</script>

<div class="experience-container">
  <Canvas>
    <Scene />
  </Canvas>
</div>

<style>
  .experience-container {
    width: 100%;
    height: 100%;
    background: #0a0a1a;
  }
</style>
```

**Step 3: Build the Scene component**

```svelte
<!-- apps/desktop/plugins/3d-experience/src/Scene.svelte -->
<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls, Grid, Float } from '@threlte/extras';
  // Build:
  // 1. Architectural wireframe structure (BoxGeometry edges)
  // 2. Orbiting project spheres with labels
  // 3. Particle field background
  // 4. Ambient lighting + point lights
  // 5. OrbitControls for navigation
</script>

<T.PerspectiveCamera makeDefault position={[5, 3, 8]} fov={60}>
  <OrbitControls enableDamping autoRotate autoRotateSpeed={0.5} />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.3} />
<T.PointLight position={[5, 5, 5]} intensity={1} color="#6366f1" />

<!-- Central architectural structure -->
<!-- Project nodes -->
<!-- Particle field -->
<!-- Grid floor -->
<Grid cellColor="#6366f1" sectionColor="#4f46e5" fadeDistance={25} />
```

**Step 4: Run type check + verify Threlte renders**

Run: `bun run check` then `bun run dev` — open 3D Experience app

**Step 5: Commit**

```bash
git add apps/desktop/plugins/3d-experience/
git commit -m "feat: 3D experience — Threlte scene with architecture + particles + orbit controls"
```

---

#### Task 2B.2: Remove old GitHub Globe, replace with 3D Experience references

**Files:**
- Delete: `apps/desktop/plugins/github-globe/`
- Modify: any files referencing `github-globe` app ID

**Step 1: Remove GitHub Globe plugin**

```bash
rm -rf apps/desktop/plugins/github-globe/
```

**Step 2: Update Welcome.svelte if it references github-globe**

Search and replace any `github-globe` references with `3d-experience`.

**Step 3: Run type check + commit**

```bash
git add -A
git commit -m "refactor: replace github-globe (183 lines) with 3D experience"
```

---

#### Task 2B.3: Create Blob Lab plugin

**Files:**
- Create: `apps/desktop/plugins/blob-lab/manifest.ts`
- Create: `apps/desktop/plugins/blob-lab/src/BlobLab.svelte`

**Step 1: Create manifest + component**

Port or re-create from the `blobAnim` / `blob-animation` GitHub repos. Core: animated blob shapes using canvas or WebGL shaders. Interactive — mouse position affects blob deformation.

```typescript
const manifest: PluginManifest = {
  id: 'blob-lab',
  name: 'Blob Lab',
  version: '1.0.0',
  type: 'native',
  icon: '🫧',
  description: 'Creative coding — interactive blob animations and shaders',
  entry: './src/BlobLab.svelte',
  defaultWidth: 600,
  defaultHeight: 500,
  category: 'creative',
  priority: 20,
  tags: ['creative-coding', 'animation', 'blob', 'canvas', 'generative'],
};
```

The component: Canvas-based blob animation with controls for:
- Number of blobs
- Speed / amplitude
- Color palette
- Export as image

**Step 2: Run type check + commit**

```bash
git add apps/desktop/plugins/blob-lab/
git commit -m "feat: blob lab — interactive blob animations with canvas"
```

---

#### Task 2B.4: Create Generative Art plugin

**Files:**
- Create: `apps/desktop/plugins/generative-art/manifest.ts`
- Create: `apps/desktop/plugins/generative-art/src/GenerativeArt.svelte`

**Step 1: Create manifest + component**

Generative art patterns using canvas:
- Multiple algorithms: flow fields, circles packing, recursive subdivision, L-systems
- Controls panel: algorithm, seed, colors, density
- Animate toggle
- Export as PNG
- Uses design tokens for UI chrome

```typescript
const manifest: PluginManifest = {
  id: 'generative-art',
  name: 'Generative Art',
  version: '1.0.0',
  type: 'native',
  icon: '🎨',
  description: 'Algorithmic art — flow fields, packing, recursion',
  entry: './src/GenerativeArt.svelte',
  defaultWidth: 700,
  defaultHeight: 550,
  category: 'creative',
  priority: 30,
  tags: ['generative', 'art', 'canvas', 'algorithms', 'creative-coding'],
};
```

**Step 2: Run type check + commit**

```bash
git add apps/desktop/plugins/generative-art/
git commit -m "feat: generative art — flow fields, circle packing, recursive subdivision"
```

---

### Workstream C: About Me Rewrite

#### Task 2C.1: Rewrite About Me — interactive resume with timeline

**Files:**
- Modify: `apps/desktop/plugins/about-me/src/AboutMe.svelte` (major rewrite)

**Step 1: Read current AboutMe.svelte**

Read the full file to understand current tab structure and layout.

**Step 2: Redesign with these sections/tabs:**

1. **Overview** — Hero section with name, title, tagline, quick stats (13+ years, 6 companies, 3 continents), avatar
2. **Journey** — Interactive timeline visualization (vertical, animated on scroll). Each career entry is a card with expand/collapse.
3. **Skills** — Radar chart or bar visualization grouped by category. Animated bars.
4. **Projects** — Top 6 featured projects as cards (links to Project Gallery for more)
5. **Contact** — Merged from Contact plugin. Email, phone, socials, location.

**Step 3: Add Contact section (from old Contact plugin)**

Read `Contact.svelte` content and incorporate as the final tab/section.

**Step 4: Run type check + commit**

```bash
git add apps/desktop/plugins/about-me/
git commit -m "feat: about me rewrite — interactive timeline, skills viz, merged contact"
```

---

## Phase 3: Ecosystem

> 2 parallel workstreams. Depends on Phase 1 + Phase 2 foundation.

### Workstream D: App Store & Games

#### Task 3D.1: Transform Plugin Registry into App Store

**Files:**
- Modify: `apps/desktop/plugins/plugin-registry/manifest.ts`
- Rewrite: `apps/desktop/plugins/plugin-registry/src/PluginRegistry.svelte`
- Create: `apps/desktop/plugins/plugin-registry/src/store-data.ts`

**Step 1: Update manifest**

```typescript
const manifest: PluginManifest = {
  id: 'app-store',
  name: 'App Store',
  version: '2.0.0',
  type: 'native',
  icon: '🏪',
  description: 'Browse, discover, and install apps',
  entry: './src/AppStore.svelte',
  defaultWidth: 750,
  defaultHeight: 550,
  category: 'desktop',
  priority: 40,
  showOnDesktop: true,
  tags: ['apps', 'store', 'install', 'discover'],
};
```

**Step 2: Create store data**

```typescript
// store-data.ts
export interface StoreApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  source: 'zyeta' | 'personal' | 'mrax';
  deployUrl?: string;
  githubUrl: string;
  techStack: string[];
  screenshots?: string[];
  installed: boolean;
}

export const storeApps: StoreApp[] = [
  {
    id: 'aero-window',
    name: 'Aero Window',
    description: 'Circadian airplane window — Cesium 3D terrain + Google GenAI + weather',
    icon: '✈️',
    category: 'creative',
    source: 'zyeta',
    githubUrl: 'https://github.com/rdtect/aero-window',
    techStack: ['SvelteKit', 'Cesium', 'Google GenAI'],
    installed: false,
  },
  // ... all 12 store apps from design doc
];
```

**Step 3: Build AppStore.svelte**

Tabs: Pre-installed / Available / Categories
Cards with Install/Open buttons
Category filter sidebar
Search

**Step 4: Rename plugin directory**

```bash
mv apps/desktop/plugins/plugin-registry apps/desktop/plugins/app-store
```

Update the manifest entry path, rename main component file.

**Step 5: Run type check + commit**

```bash
git add -A
git commit -m "feat: app store — browse, discover, install apps from GitHub repos"
```

---

#### Task 3D.2: Port Solitaire from MRAX

**Files:**
- Create: `apps/desktop/plugins/solitaire/manifest.ts`
- Create: `apps/desktop/plugins/solitaire/src/Solitaire.svelte`

**Step 1: Read the MRAX solitaire source**

Read `/home/rdtect/Projects/personal/mrax/solitaire/src/` to understand the vanilla JS implementation.

**Step 2: Port to Svelte 5 native plugin**

Convert vanilla JS to Svelte 5 with $state runes. Keep game logic, replace DOM manipulation with Svelte reactivity. Apply design tokens.

```typescript
const manifest: PluginManifest = {
  id: 'solitaire',
  name: 'Solitaire',
  version: '1.0.0',
  type: 'native',
  icon: '🃏',
  entry: './src/Solitaire.svelte',
  defaultWidth: 700,
  defaultHeight: 500,
  category: 'games',
  priority: 10,
  tags: ['game', 'cards', 'solitaire', 'classic'],
};
```

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/solitaire/
git commit -m "feat: solitaire — classic card game ported from MRAX to Svelte 5"
```

---

#### Task 3D.3: Port Tic Tac Toe from MRAX

**Files:**
- Create: `apps/desktop/plugins/tictactoe/manifest.ts`
- Create: `apps/desktop/plugins/tictactoe/src/TicTacToe.svelte`

**Step 1: Read the MRAX tictactoe Svelte source**

Read `/home/rdtect/Projects/personal/mrax/tictactoe/svelte-web/` — this already has a Svelte version.

**Step 2: Port to Svelte 5 plugin**

Update from Svelte 4 to Svelte 5 runes. Add AI opponent option. Apply design tokens.

```typescript
const manifest: PluginManifest = {
  id: 'tictactoe',
  name: 'Tic Tac Toe',
  version: '1.0.0',
  type: 'native',
  icon: '⭕',
  entry: './src/TicTacToe.svelte',
  defaultWidth: 400,
  defaultHeight: 450,
  category: 'games',
  priority: 20,
  tags: ['game', 'tictactoe', 'strategy', 'classic'],
};
```

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/tictactoe/
git commit -m "feat: tic tac toe — MRAX port to Svelte 5 with AI opponent"
```

---

#### Task 3D.4: Port Kanban from MRAX

**Files:**
- Create: `apps/desktop/plugins/kanban/manifest.ts`
- Create: `apps/desktop/plugins/kanban/src/Kanban.svelte`

**Step 1: Read the MRAX kanban source**

Read `/home/rdtect/Projects/personal/mrax/kanban/src/` to understand the vanilla JS implementation.

**Step 2: Port to Svelte 5 plugin**

Kanban board with drag-and-drop columns (Todo, In Progress, Done). LocalStorage persistence. Apply design tokens.

```typescript
const manifest: PluginManifest = {
  id: 'kanban',
  name: 'Kanban Board',
  version: '1.0.0',
  type: 'native',
  icon: '📋',
  entry: './src/Kanban.svelte',
  defaultWidth: 800,
  defaultHeight: 500,
  category: 'studio',
  priority: 35,
  tags: ['productivity', 'kanban', 'tasks', 'project-management'],
};
```

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/kanban/
git commit -m "feat: kanban board — drag-and-drop task management from MRAX"
```

---

#### Task 3D.5: Enhance Flappy Bird

**Files:**
- Modify: `apps/desktop/plugins/flappy-bird/manifest.ts`
- Modify: `apps/desktop/plugins/flappy-bird/src/FlappyBird.svelte`

**Step 1: Read current Flappy Bird**

Read the 336-line component. Identify what needs enhancement.

**Step 2: Enhance**

- Add high score persistence (localStorage)
- Add difficulty levels
- Theme with design tokens (glass pipes, desktop-accent bird)
- Add start screen with instructions
- Add game over screen with score + restart

**Step 3: Update manifest**

Update category to `games`, add tags.

**Step 4: Run type check + commit**

```bash
git add apps/desktop/plugins/flappy-bird/
git commit -m "feat: flappy bird — scoring, difficulty, themed graphics"
```

---

### Workstream E: Studio Polish

#### Task 3E.1: Enhance AI Chat

**Files:**
- Modify: `apps/desktop/plugins/ai-chat/src/AiChat.svelte`

**Step 1: Read current AI Chat**

Read the 581-line component. Identify enhancement opportunities.

**Step 2: Enhance**

- Conversation persistence (localStorage)
- Conversation list sidebar (multiple chats)
- Better message rendering (markdown support)
- Streaming indicator
- System prompt configuration
- Clear chat button
- Export conversation

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/ai-chat/
git commit -m "feat: ai chat — conversation persistence, sidebar, markdown rendering"
```

---

#### Task 3E.2: Enhance Terminal

**Files:**
- Modify: `apps/desktop/plugins/terminal/src/Terminal.svelte`

**Step 1: Read current Terminal (424 lines)**

**Step 2: Enhance**

- More commands: `cat` (read VFS files), `ls -la` (detailed listing), `echo`, `date`, `whoami`, `history`, `man`
- Tab completion for commands and file paths
- Command history (up/down arrows)
- Colored output (ANSI-style)
- Custom prompt: `rdtect@desktop-os:~$ `

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/terminal/
git commit -m "feat: terminal — more commands, tab completion, history, colored output"
```

---

#### Task 3E.3: Enhance Code Editor

**Files:**
- Modify: `apps/desktop/plugins/code-editor/src/CodeEditor.svelte`

**Step 1: Read current Code Editor (1512 lines)**

**Step 2: Enhance**

- File tree sidebar (from VFS)
- Language detection from file extension
- Line numbers
- Find/replace (Ctrl+F, Ctrl+H)
- Improved syntax highlighting
- Tab size configuration
- Save to VFS (Ctrl+S)

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/code-editor/
git commit -m "feat: code editor — file tree, find/replace, improved syntax highlighting"
```

---

#### Task 3E.4: Enhance Knowledge Base

**Files:**
- Modify: `apps/desktop/plugins/knowledge-base/src/KnowledgeBase.svelte`

**Step 1: Read current Knowledge Base (1495 lines)**

**Step 2: Enhance**

- Better search UI with result highlighting
- Category/tag filtering
- Loading states for RAG queries
- Conversation-style Q&A mode
- Source attribution (show which documents matched)
- Empty state with suggested queries

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/knowledge-base/
git commit -m "feat: knowledge base — search highlighting, Q&A mode, source attribution"
```

---

## Phase 4: Integration

> Sequential. Depends on all previous phases.

### Task 4.1: Enhance Welcome wizard — three-path flow

**Files:**
- Modify: `apps/desktop/plugins/welcome/src/Welcome.svelte`
- Modify: `apps/desktop/plugins/welcome/src/WelcomeStep.svelte`

**Step 1: Redesign step 2 (or add new step) with audience paths**

After the intro animation, present three paths:
```
"What brings you here?"

💼 "I want to see your work"        → Opens About Me + Project Gallery + Stories
🏢 "I'm evaluating capabilities"    → Opens About Me (resume tab) + Project Gallery (professional)
🛠 "I'm a developer/technologist"  → Opens Terminal + Stories (MRAX) + 3D Experience
```

Clicking a path:
1. Opens the relevant apps
2. Closes the wizard
3. Sets a localStorage flag for return visits

**Step 2: Update featured apps for step 3**

Replace current featured apps with the new hero lineup:
```typescript
const featuredApps = [
  { appId: 'about-me', icon: '👤', name: 'About Me' },
  { appId: 'stories', icon: '📖', name: 'Stories' },
  { appId: 'project-gallery', icon: '🚀', name: 'Projects' },
  { appId: '3d-experience', icon: '🌌', name: '3D Experience' },
  { appId: 'app-store', icon: '🏪', name: 'App Store' },
];
```

**Step 3: Run type check + commit**

```bash
git add apps/desktop/plugins/welcome/
git commit -m "feat: welcome — three audience paths + updated featured apps"
```

---

### Task 4.2: Update all manifests — final category + priority pass

**Files:**
- All 28+ `manifest.ts` files

**Step 1: Audit all manifests**

Verify every manifest has correct:
- `category` (one of 6)
- `priority` (sort order within category)
- `showOnDesktop` (8-10 curated icons)
- `pinnedToTaskbar` (6-8 curated pins)
- `tags` (search discovery)

**Step 2: Desktop icon lineup (showOnDesktop: true)**

1. About Me (showcase, p:10)
2. Stories (showcase, p:15)
3. Project Gallery (showcase, p:20)
4. 3D Experience (creative, p:10)
5. Terminal (studio, p:30)
6. AI Chat (studio, p:10)
7. App Store (desktop, p:40)
8. Welcome (showcase, p:5)

**Step 3: Taskbar pin lineup (pinnedToTaskbar: true)**

1. About Me
2. Stories
3. Project Gallery
4. AI Chat
5. Terminal
6. Code Editor
7. File Browser
8. App Store

**Step 4: Run type check + commit**

```bash
git add apps/desktop/plugins/*/manifest.ts
git commit -m "refactor: final manifest audit — categories, priorities, desktop/taskbar curation"
```

---

### Task 4.3: Design audit pass

**Step 1: Run design-review skill**

Use `/design-review` on each app category to verify:
- Consistent use of design tokens (var(--desktop-font-sans), var(--radius-md), etc.)
- Glass morphism consistency
- Touch targets (min 44x44px)
- Empty/loading/error states
- Color contrast (WCAG AA)
- Scrollbar styling

**Step 2: Fix any issues found**

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "design: final audit pass — token consistency, contrast, touch targets"
```

---

### Task 4.4: Update GitHub README

**Files:**
- Modify: `README.md` (root)

**Step 1: Write a compelling README**

- Hero screenshot/GIF
- "What is rdtect OS?" — one paragraph
- App ecosystem overview (6 categories, 28+ apps)
- Tech stack badges
- Quick start (bun install, bun run dev)
- Architecture overview (link to ARCHITECTURE.md)
- Screenshots of key apps
- Credits / license

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: comprehensive README with app ecosystem overview"
```

---

### Task 4.5: Final type check + build verification

**Step 1: Run full check**

```bash
bun run check
bun run build
```

**Step 2: Fix any build errors**

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: build verification pass — all checks green"
```

---

## Execution Summary

| Phase | Tasks | Parallelism | Estimated Commits |
|-------|-------|-------------|-------------------|
| Phase 1: Foundation | 6 tasks | Sequential | 6 |
| Phase 2A: Stories | 5 tasks | Parallel with B,C | 5 |
| Phase 2B: 3D & Creative | 4 tasks | Parallel with A,C | 4 |
| Phase 2C: About Me | 1 task | Parallel with A,B | 1 |
| Phase 3D: Store & Games | 5 tasks | Parallel with E | 5 |
| Phase 3E: Studio Polish | 4 tasks | Parallel with D | 4 |
| Phase 4: Integration | 5 tasks | Sequential | 5 |
| **Total** | **30 tasks** | | **~30 commits** |

### Team Assignments (for Agent Teams)

| Team | Tasks | Agent Type |
|------|-------|------------|
| **foundation** | 1.1–1.6 | general-purpose (sequential) |
| **stories-engine** | 2A.1–2A.5 | general-purpose + designer review |
| **3d-creative** | 2B.1–2B.4 | general-purpose + designer review |
| **about-me** | 2C.1 | general-purpose + designer review |
| **app-store-games** | 3D.1–3D.5 | general-purpose |
| **studio-polish** | 3E.1–3E.4 | general-purpose |
| **integration** | 4.1–4.5 | general-purpose + code-reviewer |
