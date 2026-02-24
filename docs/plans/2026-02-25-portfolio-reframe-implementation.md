# rdtect OS Portfolio Reframe — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform rdtect OS into a creative coding portfolio webapp at rdtect.com with progressive access tiers, plugin registry, GitHub integration, Obsidian-like knowledge base, design polish, and Coolify deployment.

**Architecture:** A+C Hybrid — desktop boots immediately, all apps visible, protected apps show lock badges that dissolve on auth. Four parallel teams: Core System (access tiers + auth gate), Design System (52 audit fixes), New Plugins (registry + knowledge base + globe + github sync), Deploy (Dockerfile + Coolify).

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Tailwind CSS 3, PocketBase, Bun monorepo, Docker, Coolify, GitHub API, D3.js (graph view)

---

## Team 1: Core System (2 agents)

Implements the plugin access tier system, auth gate modal, and taskbar lock badges.

### Task 1.1: Add `access` field to PluginManifest

**Files:**
- Modify: `src/lib/core/types.ts:22-58` — add `access?: 'free' | 'protected'` to PluginManifest
- Modify: ALL `plugins/*/manifest.ts` (21 files) — add `access` field

**Steps:**
1. Add `access?: 'free' | 'protected'` field to `PluginManifest` interface in `src/lib/core/types.ts` after `description` (line ~28). Default behavior: if omitted, treat as `'free'`
2. Update each plugin manifest with the correct tier:
   - **Free**: about-me, blog, calculator, clock, contact, excalidraw, flappy-bird, image-filter, project-gallery, weather, welcome
   - **Protected**: ai-chat, agent-manager, code-editor, file-browser, markdown-editor, notes, pocketbase-admin, prompt-manager, system-monitor, terminal
3. Commit: `feat: add access tier field to plugin manifests`

### Task 1.2: Create AuthGate component

**Files:**
- Create: `src/lib/shell/AuthGate.svelte` — glass-morphism login modal
- Modify: `src/lib/core/pocketbase/index.ts` — ensure `getAuthState` is reactive

**Steps:**
1. Create `AuthGate.svelte` — a glass-morphism modal that:
   - Overlays on top of everything with `backdrop-blur-xl`
   - Shows login form (email + password) with PocketBase auth
   - Has OAuth2 buttons (GitHub at minimum)
   - On success: dispatches 'auth:success' event, closes modal, stores auth state
   - On dismiss: closes without auth
   - Animated entrance (scale + fade)
   - Uses desktop-os design tokens (desktop-surface, desktop-border, desktop-accent)
2. Export from `src/lib/shell/index.ts`
3. Commit: `feat: add AuthGate glass-morphism login modal`

### Task 1.3: Integrate auth gate into window launch

**Files:**
- Modify: `src/lib/shell/Desktop.svelte` — intercept protected app launches
- Modify: `src/lib/shell/Taskbar.svelte` — add lock badge to protected app icons

**Steps:**
1. In `Desktop.svelte`, wrap the app launch logic: before opening a window for a protected plugin, check `getAuthState().isValid`. If not authenticated, show AuthGate. On auth success, proceed with launch.
2. In `Taskbar.svelte`, for each app icon in the dock:
   - Check if the plugin's manifest has `access: 'protected'`
   - If so AND user is not authenticated, render a small lock SVG badge (8x8px) at bottom-right of the icon
   - When user authenticates, lock badges fade out with a CSS transition
3. Commit: `feat: integrate auth gate into window launch + taskbar lock badges`

### Task 1.4: Auth-aware boot sequence

**Files:**
- Modify: `src/lib/shell/Desktop.svelte` — boot screen adjustments

**Steps:**
1. During boot sequence, check for existing PocketBase auth token (auto-refresh via `refreshAuth()`)
2. If valid session exists, skip showing lock badges entirely
3. Add a subtle "Guest" or user avatar indicator in the system tray area of Taskbar
4. If authenticated, show user name/avatar in system tray; if not, show "Sign In" button
5. Commit: `feat: auth-aware boot sequence with system tray indicator`

---

## Team 2: Design System (2 agents)

Applies design audit fixes from DESIGN_AUDIT.md. Split into two parallel tracks.

### Task 2.1: CSS Cleanup + Design Tokens (Agent A)

**Files:**
- Modify: `src/app.css` — remove dead CSS, reduce animations from 45 to ~15
- Modify: `tailwind.config.js` — extend with full token system

**Steps:**
1. In `tailwind.config.js`, extend the theme:
   ```js
   colors: {
     desktop: {
       bg: '#0f172a',
       surface: '#1e293b',
       border: '#334155',
       accent: '#6366f1',
       'accent-hover': '#818cf8',
       muted: '#94a3b8',
       subtle: '#475569',
       text: '#f8fafc',
       'text-secondary': '#cbd5e1'
     }
   },
   fontSize: {
     'desktop-xs': ['0.75rem', { lineHeight: '1rem' }],
     'desktop-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
     'desktop-base': ['0.875rem', { lineHeight: '1.375rem' }],
     'desktop-lg': ['1rem', { lineHeight: '1.5rem' }],
     'desktop-xl': ['1.125rem', { lineHeight: '1.75rem' }],
     'desktop-2xl': ['1.25rem', { lineHeight: '1.75rem' }]
   },
   borderRadius: {
     'desktop-sm': '0.375rem',
     'desktop-md': '0.5rem',
     'desktop-lg': '0.75rem',
     'desktop-xl': '1rem'
   }
   ```
2. Add `'./plugins/**/*.{svelte,ts}'` to `content` array in tailwind.config.js
3. In `src/app.css`:
   - Remove duplicate @keyframes (keep only: fadeIn, slideUp, slideDown, pulse, spin, aurora, float, orbit)
   - Remove unused classes identified in audit (~180 lines)
   - Add `@media (prefers-reduced-motion: reduce)` block that disables all animations
   - Consolidate glass-panel styles
4. Commit: `refactor: clean CSS + extend design token system`

### Task 2.2: Shell Component Polish (Agent A)

**Files:**
- Modify: `src/lib/shell/Desktop.svelte` — background simplification, boot speed
- Modify: `src/lib/shell/Window.svelte` — touch targets, accessibility
- Modify: `src/lib/shell/Taskbar.svelte` — spacing, focus states

**Steps:**
1. Desktop.svelte:
   - Reduce background layers from 8 to 3 (gradient + subtle aurora + noise)
   - Reduce boot animation from 3.5s to 2s
   - Remove tech badges and social links from boot screen (these belong in About Me app)
2. Window.svelte:
   - Increase traffic light buttons from 12px to 14px, with 44px touch target (padding)
   - Add `aria-label` to close/minimize/maximize buttons
   - Add `focus-visible` ring styles (2px desktop-accent outline)
3. Taskbar.svelte:
   - Increase dock icon gap from `gap-0.5` (2px) to `gap-1.5` (6px)
   - Add `focus-visible` styles for keyboard navigation
   - Ensure clock/tray items have proper touch targets (44px min)
4. Commit: `fix: shell component polish — accessibility, touch targets, spacing`

### Task 2.3: Plugin Color Token Consistency (Agent B)

**Files:**
- Modify: `plugins/terminal/src/Terminal.svelte` — replace GitHub Dark colors with desktop tokens
- Modify: `plugins/code-editor/src/CodeEditor.svelte` — replace VS Code colors with desktop tokens
- Modify: `plugins/notes/src/Notes.svelte` — replace amber accent with desktop-accent

**Steps:**
1. Terminal: Replace `#0d1117` → `desktop-bg`, `#30363d` → `desktop-border`, `#c9d1d9` → `desktop-text`
2. Code Editor: Replace `#1e1e1e` → `desktop-bg`, `#252526` → `desktop-surface`, `#007acc` → `desktop-accent`
3. Notes: Replace `#fbbf24` (amber) accent → `desktop-accent` (#6366f1)
4. Commit: `fix: unify plugin colors to desktop token system`

### Task 2.4: Empty/Loading/Error States (Agent B)

**Files:**
- Modify: `plugins/blog/src/Blog.svelte` — add loading skeleton, empty state
- Modify: `plugins/project-gallery/src/ProjectGallery.svelte` — add loading skeleton, empty state
- Modify: `plugins/ai-chat/src/AIChat.svelte` — add connection error state

**Steps:**
1. Create a consistent loading skeleton pattern (pulsing bars with desktop-surface/desktop-border)
2. Add empty states with helpful messages and CTAs ("No blog posts yet", "No projects found")
3. Add error states with retry buttons for network-dependent plugins
4. Commit: `feat: add loading, empty, and error states to key plugins`

---

## Team 3: New Plugins (2 agents)

### Task 3.1: Plugin Registry Plugin

**Files:**
- Create: `plugins/plugin-registry/manifest.ts`
- Create: `plugins/plugin-registry/src/PluginRegistry.svelte`

**Steps:**
1. Create manifest: `id: 'plugin-registry'`, `name: 'App Store'`, `type: 'native'`, `access: 'free'`, `icon: '🏪'`, default 700x600
2. Create PluginRegistry.svelte:
   - Reads all loaded plugin manifests from the plugin loader
   - Displays as a grid of cards (icon, name, description, access tier badge)
   - Filter by category: All, Showcase, AI Tools, Productivity, Creative, System, Games
   - Search bar at top
   - Click card → launches that app (or shows auth gate if protected)
   - Categories derived from a simple mapping object (plugin id → category)
   - Clean, App-Store-inspired UI with desktop tokens
3. Commit: `feat: add Plugin Registry (App Store) plugin`

### Task 3.2: GitHub Projects Auto-Sync for Project Gallery

**Files:**
- Modify: `plugins/project-gallery/src/ProjectGallery.svelte` — add GitHub tab/integration
- Create: `plugins/project-gallery/src/github.ts` — GitHub API client

**Steps:**
1. Create `github.ts`:
   - `fetchGitHubRepos(username: string)` — fetches from GitHub API `/users/{username}/repos`
   - Maps to internal project format: `{ name, description, language, stars, url, topics }`
   - Caches results in localStorage with 1-hour TTL
   - Handles rate limiting gracefully
2. Modify ProjectGallery.svelte:
   - Add a "GitHub" tab alongside existing content
   - GitHub tab shows repos as cards with: name, description, language badge, star count, link
   - Filter: All / Public only
   - Sort: Stars, Updated, Name
   - Each card has "View on GitHub" link
   - Uses desktop design tokens
3. Commit: `feat: add GitHub repos auto-sync to Project Gallery`

### Task 3.3: Knowledge Base (Obsidian-like) Plugin

**Files:**
- Create: `plugins/knowledge-base/manifest.ts`
- Create: `plugins/knowledge-base/src/KnowledgeBase.svelte`
- Create: `plugins/knowledge-base/src/types.ts`
- Create: `plugins/knowledge-base/src/store.ts`

**Steps:**
1. Create manifest: `id: 'knowledge-base'`, `name: 'Knowledge Base'`, `type: 'native'`, `access: 'protected'`, `icon: '🧠'`, default 900x700
2. Create types.ts:
   ```typescript
   interface KBNote { id: string; title: string; content: string; tags: string[]; backlinks: string[]; created: number; updated: number; }
   ```
3. Create store.ts:
   - IndexedDB-backed note storage (using VFS or direct IDB)
   - CRUD operations for notes
   - Backlink extraction (parse `[[note-name]]` patterns)
   - Search across all notes
4. Create KnowledgeBase.svelte:
   - Three-pane layout: sidebar (note list) | editor (markdown) | preview (rendered)
   - Sidebar: search bar, note list (sorted by recent), "New Note" button
   - Editor: textarea with monospace font, live `[[backlink]]` highlighting
   - Preview: rendered markdown with clickable backlinks
   - Tab system: Editor, Graph View, Daily Note
   - Graph View: Simple D3.js force-directed graph showing note connections
   - Daily Note: auto-creates a note with today's date as title
   - Tags: inline `#tag` extraction and filtering
   - Uses desktop design tokens throughout
5. Commit: `feat: add Knowledge Base (Obsidian-like) plugin`

### Task 3.4: GitHub Globe Plugin

**Files:**
- Create: `plugins/github-globe/manifest.ts`
- Create: `plugins/github-globe/src/GithubGlobe.svelte`

**Steps:**
1. Create manifest: `id: 'github-globe'`, `name: 'Globe'`, `type: 'native'`, `access: 'free'`, `icon: '🌍'`, default 600x600
2. Create GithubGlobe.svelte:
   - Embed a WebGL globe using Three.js (import from CDN via script tag or bundle)
   - Alternatively, simpler approach: CSS 3D globe with dots representing locations
   - Simplest viable approach: Canvas-based rotating globe with arc connections
   - Shows a beautiful rotating earth with connection arcs
   - Auto-rotates, draggable
   - Dark theme matching desktop-bg
3. Commit: `feat: add GitHub Globe plugin`

---

## Team 4: Deploy Pipeline (1 agent)

### Task 4.1: Fix SvelteKit Adapter for Production

**Files:**
- Modify: `svelte.config.js` — switch to adapter-node for production
- Modify: `package.json` — add adapter-node dependency

**Steps:**
1. Install adapter-node: The Dockerfile already does `bun add -d @sveltejs/adapter-node` at build time, but for local builds add it to devDependencies
2. Update svelte.config.js to conditionally use adapter-node:
   ```js
   import adapterAuto from '@sveltejs/adapter-auto';
   import adapterNode from '@sveltejs/adapter-node';
   const isProduction = process.env.NODE_ENV === 'production';
   adapter: isProduction ? adapterNode() : adapterAuto()
   ```
   OR simpler: just switch to adapter-node always (works for both dev and prod)
3. Commit: `chore: switch to adapter-node for production deployment`

### Task 4.2: Fix Dockerfile + docker-compose.prod.yml

**Files:**
- Modify: `Dockerfile` — ensure plugins/ and all workspace dirs are included in build context
- Modify: `docker-compose.prod.yml` — add DOMAIN=rdtect.com defaults, ensure volumes correct

**Steps:**
1. In Dockerfile Stage 1 (deps): also COPY `plugins/` package.json files if any, and `apps/` dirs
2. In Dockerfile Stage 2 (builder): ensure full COPY includes plugins/ directory
3. Verify docker-compose.prod.yml Traefik labels are correct for Coolify:
   - Frontend: `Host(\`rdtect.com\`)` and `Host(\`www.rdtect.com\`)`
   - PocketBase: `Host(\`pb.rdtect.com\`)`
   - Python API: `Host(\`api.rdtect.com\`)`
4. Add `.dockerignore` if not exists:
   ```
   node_modules
   .svelte-kit
   build
   .git
   *.md
   docs/
   ```
5. Commit: `chore: fix Dockerfile and production compose for deployment`

### Task 4.3: Fix vite config issues

**Files:**
- Modify: `apps/excalidraw-remote/vite.config.ts` — fix duplicate `server` property

**Steps:**
1. The file has `server` defined twice (lines 6-8 and lines 21-25). Merge into single `server` block:
   ```ts
   server: { host: true, port: 5004, strictPort: true, cors: true }
   ```
2. Commit: `fix: merge duplicate server config in excalidraw-remote vite config`

### Task 4.4: Git commit, Docker build test, push

**Steps:**
1. Run `bun run check` to verify TypeScript
2. Run `bun run build` to verify SvelteKit builds
3. Run `docker compose -f docker-compose.prod.yml build` to verify Docker build
4. Ensure `.env.example` has `DOMAIN=rdtect.com` as the production example
5. Git add all changes, commit: `feat: rdtect OS v2 — portfolio reframe with access tiers, plugin registry, knowledge base, design polish, and Coolify deployment`
6. Push to GitHub: `git push origin main`

---

## Dependency Graph

```
Task 1.1 (manifests) ──→ Task 1.2 (auth gate) ──→ Task 1.3 (integration)
                                                  ──→ Task 1.4 (boot auth)

Task 2.1 (CSS/tokens) ──→ Task 2.2 (shell polish)  [parallel with 2.3, 2.4]
Task 2.3 (plugin colors)                            [independent]
Task 2.4 (empty states)                              [independent]

Task 3.1 (registry)          [depends on 1.1 for access field]
Task 3.2 (github sync)       [independent]
Task 3.3 (knowledge base)    [independent]
Task 3.4 (globe)             [independent]

Task 4.1 (adapter)           [independent]
Task 4.2 (dockerfile)        [independent]
Task 4.3 (vite fix)          [independent]
Task 4.4 (build + push)      [depends on ALL other tasks]
```

## Execution: Multi-Agent Teams

Launch 4 teams in parallel. Team 4 waits for all others before Task 4.4.
