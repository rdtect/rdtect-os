# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
bun install

# Start frontend dev server (runs on http://localhost:5176)
bun run dev

# Start backend services (PocketBase + Python) via Docker
docker compose up -d            # or: make dev-services

# Start full stack (frontend in Docker + services)
docker compose --profile full up   # or: make dev-full

# Start everything including federation remotes
docker compose --profile all up    # or: make dev-all

# Individual federation remotes
bun run dev:excalidraw          # Excalidraw on :5004
bun run dev:ai-chat             # AI Chat remote
bun run dev:prompt-manager      # Prompt Manager remote

# Build & check
bun run build                   # Production build
bun run check                   # Svelte type-checking (svelte-check)
bun run typecheck               # TypeScript type-checking (tsc --noEmit)
bun run clean                   # Remove .svelte-kit, build, vite cache
```

Backend services: PocketBase at `:8090` (admin UI at `/_/`), Python backend at `:8000`.

## Architecture

A web-based desktop environment ("Unix on the Web") built with SvelteKit 2 + Svelte 5 + Tailwind CSS. See `ARCHITECTURE.md` for the full reference.

### Three-Layer System

```
Layer 3: Plugins     (plugins/*)          — User-facing applications (21 plugins)
Layer 2: Shell       (src/lib/shell/)     — Window manager, desktop UI, taskbar
Layer 1: Core        (src/lib/core/)      — VFS, agents, messaging, plugin loading, theme
         Browser APIs                     — IndexedDB, localStorage, DOM, WebSocket
```

**Dependency rule**: Plugins import from Shell/Core. Shell imports from Core only. Core never imports from Shell or Plugins.

### Monorepo Layout (Bun workspaces)

The SvelteKit frontend lives at the **workspace root** (not in `apps/`). The `apps/` directory contains only separate services:

| Package | Purpose |
|---------|---------|
| Root (`/`) | SvelteKit 2 frontend — main app |
| `apps/python-backend` | FastAPI backend for AI chat (Docker) |
| `apps/excalidraw-remote` | React + Module Federation remote (:5004) |
| `apps/ai-chat-remote` | AI Chat federation remote |
| `apps/prompt-manager-remote` | Prompt Manager federation remote |
| `packages/plugin-sdk` | TypeScript SDK for building plugins |

### Key Singletons and Imports

All core services are class-based singletons exported from `$lib/core` or `$lib/shell`:

```typescript
import { wm } from '$lib/shell';               // WindowManager — apps, windows, snap zones
import { vfs } from '$lib/core/vfs';            // Virtual File System (IndexedDB-backed)
import { eventBus } from '$lib/core/event-bus'; // Typed system events (window:*, app:*, theme:*)
import { messageBus } from '$lib/core/message-bus'; // Inter-plugin pub/sub
import { pluginLoader } from '$lib/core/plugin-loader';
import { configManager } from '$lib/core/config';
import { agentRuntime } from '$lib/core/agents/runtime.svelte';
import { pb } from '$lib/core/pocketbase';      // PocketBase client
```

### Plugin System

21 plugins in `plugins/`, each with `manifest.ts` + `src/`. Five plugin types: `native` (Svelte 5), `webcomponent`, `iframe`, `federation` (Module Federation), `wasm`.

**Discovery**: `import.meta.glob('/plugins/*/manifest.ts')` in `src/routes/+page.svelte` — no manual registration needed.

**Adding a plugin**: Create `plugins/<name>/manifest.ts` (default export) + `plugins/<name>/src/<Component>.svelte`. It's auto-discovered on next dev server start.

```typescript
// plugins/my-app/manifest.ts
const manifest = {
  id: 'my-app',
  name: 'My App',
  version: '1.0.0',
  type: 'native',
  icon: '🔧',
  entry: './src/MyApp.svelte',
  defaultWidth: 600,
  defaultHeight: 400,
};
export default manifest;
```

**Federation plugins** require a separate Vite app in `apps/` that exposes a `remoteEntry.js`, plus a proxy entry in the root `vite.config.ts`.

### Svelte 5 Patterns (Critical)

**Runes only** — no legacy `writable`/`readable`/`derived` stores. All reactive state uses `$state`, `$derived`, `$effect`, `$props`.

**`.svelte.ts` files** enable runes outside components. Core services use reactive classes:

```typescript
// pattern: class with $state fields, exported as singleton
class WindowManager {
  apps = $state<AppDefinition[]>([]);
  windows = $state<Window[]>([]);
  visibleWindows = $derived(this.windows.filter(w => !w.isMinimized));
}
export const wm = new WindowManager();
```

**Component props**: Use `$props()` with TypeScript interface.

### Virtual File System

Unix FHS-style paths backed by IndexedDB. Special virtual mounts:
- `/proc/*` — Read-only system state (windows, agents, uptime, meminfo)
- `/dev/*` — Virtual devices (null, random, clipboard, console)
- `/home/user/.config/<appId>/` — XDG-style per-app configuration

### IPC: Two Systems

- **EventBus** — Lightweight typed events for system internals (`window:opened`, `theme:changed`, `file:open`)
- **MessageBus** — Full pub/sub for plugin-to-plugin communication with request/response pattern

### Styling

Tailwind CSS 3 with custom `desktop` palette: `desktop-bg` (#0f172a), `desktop-surface` (#1e293b), `desktop-border` (#334155), `desktop-accent` (#6366f1). Plugin content uses `@tailwindcss/forms`.

### SvelteKit Experimental Features

Enabled in `svelte.config.js`: `compilerOptions.experimental.async` and `kit.experimental.remoteFunctions`.

### Environment Variables

Copy `.env.example` to `.env`. Key variables: `OPENAI_API_KEY` (AI features), `PUBLIC_POCKETBASE_URL` (defaults to `http://localhost:8090`), `PUBLIC_PYTHON_API_URL` (defaults to `http://localhost:8000`).

### API Routes

SvelteKit server routes at `src/routes/api/`:
- `api/notes/` — CRUD for notes
- `api/ai/stream/` — AI streaming endpoint
