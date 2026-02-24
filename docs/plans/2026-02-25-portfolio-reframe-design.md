# Design: rdtect OS — Creative Coding Portfolio at rdtect.com

**Date**: 2026-02-25
**Status**: Approved
**Approach**: A+C Hybrid ("Living Portfolio" + "Progressive Desktop")

---

## Vision

rdtect.com boots directly into a web-based desktop OS. The OS itself IS the portfolio. Visitors interact with the work, not a page describing it. All apps are visible; protected apps show lock badges. Auth feels like an upgrade, not a gate.

---

## Architecture

### Plugin Access Tiers

Every `PluginManifest` gains an `access` field:

```typescript
interface PluginManifest {
  // ...existing fields...
  access: 'free' | 'protected';
}
```

**Free (Showcase)**: About Me, Project Gallery, Blog, Contact, Calculator, Clock, Weather, Flappy Bird, Image Filter, Welcome, Excalidraw, GitHub Globe, Plugin Registry

**Protected (Power Tools)**: AI Chat, Prompt Manager, Agent Manager, Terminal, Code Editor, Knowledge Base (Obsidian), File Browser, System Monitor, PocketBase Admin, Markdown Editor, Notes

### Auth Gate

When a guest clicks a protected app, instead of blocking:
1. App icon shows a subtle lock badge (CSS overlay on taskbar icon)
2. Click opens a glass-morphism login modal (not a redirect, not a new page)
3. After auth, locks dissolve with animation, app launches immediately
4. Session persists via PocketBase auth token

### Plugin Registry

New plugin: `plugin-registry` (native, free tier)
- Lists all available plugins with icons, descriptions, screenshots
- Shows installed vs available
- Categories: Showcase, AI Tools, Productivity, Creative, System, Games
- Future: community-submitted plugins via PocketBase collection

### GitHub Projects Auto-Sync

Enhancement to `project-gallery` plugin:
- Fetches repos from GitHub API (`/users/rdtect/repos`)
- Maps repo metadata to Project Gallery cards (name, description, language, stars, URL)
- Caches in PocketBase `projects` collection with `source: 'github'` field
- Manual override: PocketBase projects take priority over GitHub-synced ones
- Refresh button + auto-sync on app open

### Knowledge Base (Obsidian-like)

New plugin: `knowledge-base` (native, protected tier)
- Markdown editor with live preview (reuse markdown-editor foundation)
- Backlinks: `[[page-name]]` syntax, auto-detected
- Graph view: D3.js force-directed graph of note connections
- Tags, search, daily notes
- Storage: PocketBase `files_metadata` collection or IndexedDB VFS
- Future: sync with Obsidian vault

### GitHub Globe

New plugin: `github-globe` (iframe, free tier)
- Embeds the github-globe repo (ThreeJS)
- Shows activity/visitors on a 3D globe
- Lightweight iframe embed

---

## Design Audit Integration

All 52 design audit fixes from DESIGN_AUDIT.md are included in implementation:

**Phase 1 (Critical)**: Dead CSS removal, animation reduction (45 -> 15), touch targets, accessibility
**Phase 2 (Refinement)**: Spacing rhythm, typography scale, color token consistency across plugins
**Phase 3 (Polish)**: Micro-interactions, empty states, loading states, reduced-motion support

These are executed IN PARALLEL with feature work by dedicated design team members.

---

## Monorepo Structure (Updated)

```
desktop-os/
├── apps/
│   ├── python-backend/          # FastAPI AI backend
│   ├── excalidraw-remote/       # React Module Federation remote
│   ├── prompt-manager-remote/   # React Module Federation remote
│   └── ai-chat-remote/         # React Module Federation remote
├── packages/
│   ├── plugin-sdk/              # Plugin development SDK
│   └── shared-types/            # Shared TypeScript types (NEW)
├── plugins/
│   ├── about-me/                # Free
│   ├── ai-chat/                 # Protected
│   ├── agent-manager/           # Protected
│   ├── blog/                    # Free
│   ├── calculator/              # Free
│   ├── clock/                   # Free
│   ├── code-editor/             # Protected
│   ├── contact/                 # Free
│   ├── excalidraw/              # Free
│   ├── file-browser/            # Protected
│   ├── flappy-bird/             # Free
│   ├── github-globe/            # Free (NEW)
│   ├── image-filter/            # Free
│   ├── knowledge-base/          # Protected (NEW - Obsidian-like)
│   ├── markdown-editor/         # Protected
│   ├── notes/                   # Protected
│   ├── plugin-registry/         # Free (NEW)
│   ├── pocketbase-admin/        # Protected
│   ├── project-gallery/         # Free (enhanced with GitHub sync)
│   ├── prompt-manager/          # Protected
│   ├── system-monitor/          # Protected
│   ├── terminal/                # Protected
│   ├── weather/                 # Free
│   └── welcome/                 # Free
├── src/
│   ├── lib/core/                # VFS, agents, messaging, pocketbase, plugin-loader
│   └── lib/shell/               # Desktop, Window, Taskbar, panels
├── docker-compose.yml           # Updated with production profile
├── Dockerfile                   # Multi-stage SvelteKit + static build
├── coolify.json                 # Coolify deployment config (NEW)
└── docs/
    └── plans/                   # Design docs
```

---

## Deployment: Docker + Coolify

### Dockerfile (multi-stage)
1. **Stage 1**: `bun install` + `bun run build` (SvelteKit adapter-node)
2. **Stage 2**: Slim Node.js runtime with built output
3. Environment variables: `POCKETBASE_URL`, `OPENAI_API_KEY`, `ORIGIN`

### docker-compose.production.yml
- `frontend`: SvelteKit app (port 3000)
- `pocketbase`: PocketBase (port 8090, persistent volume)
- `python-backend`: FastAPI (port 8000)

### Coolify
- Push to GitHub `main` branch
- Coolify watches repo, auto-deploys via docker-compose
- Domain: rdtect.com
- SSL: auto via Coolify/Traefik

---

## Team Structure for Implementation

### Team 1: Design System (2 agents)
- Apply all 52 design audit fixes
- CSS cleanup, token system, accessibility
- Touch targets, reduced-motion, responsive fixes

### Team 2: Core Features (2 agents)
- Plugin access tier system (manifest + auth gate + taskbar badges)
- Plugin Registry app
- GitHub Projects auto-sync in Project Gallery

### Team 3: New Plugins (2 agents)
- Knowledge Base (Obsidian-like) plugin
- GitHub Globe plugin
- Blog enhancements

### Team 4: Deploy Pipeline (1 agent)
- Dockerfile (multi-stage)
- docker-compose.production.yml
- Coolify config
- Git commit + push

---

## Success Criteria

1. rdtect.com boots into desktop OS in < 3 seconds
2. Guest users can use all free apps without auth
3. Protected apps show lock badge, clicking triggers auth modal
4. Project Gallery auto-populates from GitHub repos
5. Knowledge Base has markdown editing + graph view
6. Plugin Registry lists all apps with categories
7. All 52 design audit fixes applied
8. Docker build succeeds, deploys to Coolify
