# rdtect OS — Product Relaunch Design

**Date:** 2026-02-27
**Author:** Rick Dé + Claude
**Status:** Approved
**Approach:** Blend A+B — Portfolio depth with working-tools authenticity

---

## 1. Vision

rdtect OS is a web-based desktop environment that serves as both a **professional showcase** and a **working product**. It demonstrates Rick Dé's career arc: leveraging emergent technology to transform human experience — from built environments to metaverses to AI-powered digital experience.

### Audiences (3 paths from Welcome)

1. **Hiring managers / recruiters** — "Rick is a senior technical leader who architects and ships complex products"
2. **Potential clients / partners** — "Zyeta's digital experience capabilities are world-class"
3. **Developer community / peers** — "The MRAX framework and plugin architecture are worth studying"

### Narrative Arc

**Tagline:** "Designing at the edge of what's next — from built environments to AI-powered digital experience"

**Title:** Associate Director, Digital Experience Design
**Subtitle:** Emergent Technology · AI Solutions · Future of Work

**Thread:** Architecture → Web3/NFT → Metaverse → AI Filmmaking (Omnicom/BBDO) → Digital Experience (Zyeta)

---

## 2. Profile Update

### Career Timeline (to add to data.ts)

| Period | Company | Role | Key Work |
|--------|---------|------|----------|
| 2011-2013 | Ravindra Bhan & Associates | Intern Architect | Landscape architecture pioneer |
| 2013-2016 | RMC Pvt. Ltd | Architect & Designer | Built environments |
| 2014-2021 | Studio ArcX | Principal Architect | Architecture + branding + emergent tech |
| 2016-2018 | FPA, Manav Rachna University | Assistant Professor | Architecture & design |
| 2018-2021 | FOAD, DIT University | Assistant Professor | Architecture & UI/UX |
| ~2021-2022 | LetsCollect / NFT era | Web3 Architect | Ilm NFT movie platform (Disney+ Hotstar) |
| 2022-~2023 | QuantLabs | Product Designer & Metaverse Architect | Versez metaverse platform |
| ~2023-~2025 | Analect/Omnicom | Solution Architect / DX Lead | BBDO (3 regions + NY), AI filmmaking, Columbia Journalism Review AI website, Omnicom Global Solutions |
| ~2025-Present | Zyeta | Associate Director, Digital Experience Design | Leading DX vertical, future of work, emergent tech + AI solutions |

### Skills Update

- Add: AI Solutions, Team Leadership (global), Solution Architecture, AI-powered Filmmaking, Future of Work Strategy
- Update: "10+ years" → "13+ years of expertise blending architecture, creative tech, and strategy"
- Add Omnicom/BBDO projects to portfolio
- Add Zyeta projects (from local-projects.ts)

---

## 3. App Ecosystem

### Categories (6 groups)

| Category | Icon | Purpose |
|----------|------|---------|
| Showcase | 💼 | Portfolio, identity, thought leadership |
| Studio | 🛠 | Real working tools that prove depth |
| Creative | 🎨 | Creative coding, 3D, generative art |
| Games | 🎮 | Fun, personality, skill demos |
| Desktop | 🖥 | Ambient utility apps |
| Admin | 🔐 | System tools (owner-only) |

### Pre-installed Apps (28)

**Showcase (5):**
- About Me — REWRITE (full career timeline, interactive resume, merged Contact)
- Stories (was Blog) — REIMAGINE (multi-format: slides, scroll stories, articles)
- Project Gallery — ENHANCE (add Omnicom + Zyeta projects, case study format)
- 3D Experience — NEW (Threlte — declarative Three.js for Svelte 5)
- Welcome — ENHANCE (three-path wizard, animated, clickable launchers)

**Studio (7):**
- AI Chat — ENHANCE (conversation persistence, better UI)
- Terminal — ENHANCE (fuller commands, custom theme)
- Code Editor — ENHANCE (syntax highlighting, file tree)
- Knowledge Base — ENHANCE (RAG-powered search)
- Excalidraw — KEEP (federation plugin)
- Markdown Editor — KEEP
- Kanban Board — NEW (port from mrax-kanban to Svelte 5 native)

**Creative (4):**
- 3D Experience — NEW (Threlte navigable scene: architecture + metaverse + data viz)
- Blob Lab — NEW (from blobAnim GitHub repos, creative coding)
- Generative Art — NEW (canvas/WebGL generative patterns)
- Image Filter — MOVE from Desktop

**Games (3):**
- Solitaire — NEW (port from mrax-solitaire to Svelte 5 native)
- Tic Tac Toe — NEW (port from mrax-tictactoe Svelte version)
- Flappy Bird — ENHANCE (polish, scoring, theming)

**Desktop (5):**
- Weather — KEEP
- Clock — KEEP
- Calculator — KEEP
- File Browser — KEEP
- Notes — KEEP (just rewritten)

**Admin (3):**
- System Monitor — KEEP
- Agent Manager — KEEP
- PocketBase Admin — KEEP (hidden)

### Installable Apps (App Store — 12+)

**Zyeta Professional (showcases real client work):**

| App | Description | Stack | Load |
|-----|-------------|-------|------|
| Aero Window | Circadian airplane window — Cesium 3D terrain + Google GenAI + weather effects | SvelteKit + Cesium + GenAI | iframe |
| Workspace Studio | AI-powered workspace design platform for interactive seminars (v2: Quest/Forge/World) | SvelteKit + Cloudflare Workers | iframe |
| AI PM Assessor | Gamified PM training platform with AI quiz generation (5 versions!) | SvelteKit + OpenAI | iframe |
| MEDDICC Research | AI sales intelligence with node-based diagrams (XYFlow) | SvelteKit + XYFlow + Drizzle | iframe |
| DX Platform | Zyeta Digital Experience Platform website | SvelteKit | iframe |
| 2gethr Jingle Hunt | Holiday gamification app with QR codes | SvelteKit + SQLite | iframe |
| DualSync | Dual browser view sync tool | Electron | info-only |

**Personal / Open Source:**

| App | Description | Stack | Load |
|-----|-------------|-------|------|
| Strategy Bot | AI strategy analyzer | Svelte | iframe |
| AdCraft | Ad crafting tool | Svelte | iframe |
| LLM Chat Template | LLM chat app template | JavaScript | iframe |
| Todo (MRAX) | Vanilla JS todo microapp | JavaScript | iframe/native |
| AI Strategy Analyser | AI-powered strategy analysis | TypeScript | iframe |

---

## 4. Stories Engine (replaces Blog)

### Multi-Format Content System

Each post declares its format in frontmatter:

```typescript
interface StoryPost {
  id: string;
  title: string;
  format: 'slides' | 'scroll' | 'article';
  // ... standard blog fields
}
```

**Renderers:**
- `slides` — Svelte-native slide deck. Full-screen slides, keyboard/touch navigation, code highlighting, embedded demos. No reveal.js dependency.
- `scroll` — Immersive scroll-driven storytelling. Scroll position triggers animations, data reveals, parallax. Think NYT Snowfall.
- `article` — Traditional rich markdown with code blocks, images, embeds.

### Launch Content (5 posts)

1. **"The MRAX Framework"** (slides) — Organizational philosophy, code architecture, cognitive functions
2. **"From Architecture to AI"** (scroll) — Career narrative with visual timeline, project highlights
3. **"Building a Desktop OS in the Browser"** (article) — Enhanced existing post
4. **"The Future of Digital Experience"** (slides) — Zyeta vertical, future of work, emergent tech + AI
5. **"Why Every Era Needs Its Own Interface"** (article) — Web3→AI paradigm shift, desktop metaphors

---

## 5. 3D Experience (Threlte)

### Concept

A navigable 3D space that blends Rick's triple background:
- **Architectural geometry** — Abstract building forms, spatial composition
- **Metaverse aesthetics** — Glowing edges, particle fields, portal transitions
- **Data visualization** — GitHub activity, project connections, skill constellation

### Tech Stack

- **Threlte** — Declarative Three.js for Svelte 5, native runes integration
- **@threlte/extras** — Pre-built components (OrbitControls, Environment, etc.)
- **@threlte/flex** — Flexbox-style 3D layouts
- Runs as a native Svelte 5 plugin inside the desktop window

### Scene Ideas

- Central rotating structure (architectural wireframe)
- Orbiting project nodes you can click to open
- Particle field background that responds to mouse
- Smooth camera transitions between "rooms" (portfolio, skills, contact)

---

## 6. App Store Concept

### Transform Plugin Registry → App Store

The existing Plugin Registry (553 lines, thin) becomes a curated storefront:

- **Pre-installed** tab — all 28 native apps, with ratings/descriptions
- **Available** tab — GitHub-sourced apps that can be "installed" (loaded as iframe plugins)
- **Categories** — browse by Showcase/Studio/Creative/Games/Desktop
- **Search** — find apps by name, tag, or description
- **Install** — clicking "Install" adds the app to the desktop and taskbar

### Iframe App Protocol

```typescript
interface ExternalApp {
  id: string;
  name: string;
  deployUrl: string;        // Vercel/Cloudflare URL
  githubUrl: string;        // Source code
  type: 'iframe';
  sandboxFlags: string[];   // e.g., ['allow-scripts', 'allow-same-origin']
  themeSync: boolean;       // postMessage theme colors
}
```

---

## 7. Architecture Decisions

1. **Threlte for 3D** — Declarative Three.js in Svelte 5, runes-native, tree-shakeable. Better than raw Three.js for this codebase.
2. **Svelte-native slide renderer** — No reveal.js. Keeps bundle size down, full control, integrates with design tokens.
3. **MRAX game ports to Svelte 5** — Native plugins (not iframe) for full theme/WM integration. The vanilla JS originals stay on GitHub as standalone demos.
4. **App Store iframe loading** — External apps deploy independently. Sandboxed iframes with postMessage for theme sync. No build-time coupling.
5. **Contact merged into About Me** — Single "identity" app. Reduces app count, better UX.
6. **6 categories** — Showcase, Studio, Creative, Games, Desktop, Admin. Replaces the current 4 (showcase, studio, desktop, admin).

---

## 8. Implementation Phases

### Phase 1: Foundation (sequential)
- Update profile data (data.ts) — add Omnicom + Zyeta career
- Update category system to 6 groups
- Update all manifests with new categories
- Merge Contact into About Me

### Phase 2: Hero Apps (parallel teams)
- **Stories Engine team** — Multi-format renderer + 5 posts
- **3D & Creative team** — Threlte experience, Blob Lab, Generative Art
- **About Me Rewrite team** — Interactive resume, timeline, skills radar

### Phase 3: Ecosystem (parallel teams)
- **App Store & Games team** — Registry → Store, port 3 MRAX games, enhance Flappy Bird
- **Studio Polish team** — Enhance AI Chat, Terminal, Code Editor, Knowledge Base

### Phase 4: Integration (sequential)
- Welcome wizard three-path flow
- Full design audit pass
- GitHub README + deployment
- SEO + Open Graph meta

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Threlte + Svelte 5 compatibility | Check @threlte/svelte-5 support before committing |
| 36 apps = maintenance burden | Tier 4 apps (store) are iframe-loaded, zero maintenance |
| Content quality for 5 blog posts | Focus on 3 excellent posts minimum, 2 can be shorter |
| Scope creep | Phases are independent — can ship Phase 1+2 as MVP |
| External app URLs break | Store shows graceful error + GitHub link fallback |
