# Desktop OS - Project Overview

## Purpose
rdtect OS is a web-based desktop environment / portfolio project. It simulates a desktop OS in the browser.

## Tech Stack
- SvelteKit 2 + Svelte 5 (runes only: $state, $derived, $effect, $props)
- Tailwind CSS 3 with custom `desktop` palette
- PocketBase for auth/data
- Bun monorepo
- 21 plugins loaded via import.meta.glob from /plugins/*/manifest.ts
- Plugin types: native, webcomponent, iframe, federation, wasm

## Key Directories
- `src/lib/core/` - Core services (types, pocketbase, event-bus, plugin-loader, etc.)
- `src/lib/shell/` - Desktop shell (Desktop, Window, Taskbar, etc.)
- `plugins/` - 21 application plugins
- `apps/` - SvelteKit app + python backend
- `packages/` - shared types

## Commands
- `bun run dev` - Start dev server
- `bun run build` - Production build
- `bun run check` - Type checking

## Style
- Svelte 5 runes ONLY (NO legacy stores)
- Immutability (spread, not mutation)
- Tailwind desktop token system
