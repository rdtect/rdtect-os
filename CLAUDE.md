# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Start full development environment (frontend + Python backend via Docker)
bun run dev

# Start only the SvelteKit frontend
bun run dev:host

# Start only Python backend
bun run dev:python

# Build for production
bun run build

# Type-check the SvelteKit app
bun run --filter @desktop-os/host check
```

The dev server runs at http://localhost:5173 and the Python backend at http://localhost:8000.

## Architecture Overview

Desktop OS is a web-based desktop environment built as a Bun monorepo implementing Unix Philosophy principles and hybrid Domain-Driven + Layered architecture.

### Design Principles

**Unix Philosophy**: "Everything is a file"
- Virtual filesystems (`/proc`, `/dev`, `.config`) expose system state and configuration as files
- Enables familiar CLI-like interaction patterns within the web-based desktop environment
- Promotes composability and uniform data access patterns

**Architecture Pattern**: Hybrid Domain-Driven + Layered
- Domain-Driven Design for business logic organization (plugins, window management)
- Layered architecture for clear separation of concerns (core services, shell, UI)
- Enables independent scaling and testing of components

### Directory Structure

- **src/lib/core/**: System services layer
  - Core OS abstractions and services
  - Virtual filesystem implementations
  - System state management

- **src/lib/shell/**: Window manager and desktop UI
  - Desktop environment implementation
  - Window state and lifecycle management
  - Shell UI components

- **plugins/**: 14 application plugins
  - Supports 5 plugin types: `native` (Svelte 5), `webcomponent`, `iframe`, `federation`, `wasm`
  - Each plugin has `PluginManifest` with metadata, entry points, and window defaults
  - Plugin architecture enables extensibility and modularity

### Monorepo Structure

- **apps/desktop-host**: Main SvelteKit 2 + Svelte 5 frontend with Tailwind CSS
- **apps/python-backend**: FastAPI backend for AI chat (OpenAI streaming via WebSocket)
- **packages/shared-types**: TypeScript type definitions shared across packages

### Core Systems (in packages/shared-types)

**Plugin System** (`plugin.ts`):
- Supports five plugin types: `native`, `webcomponent`, `iframe`, `federation`, `wasm`
- Each plugin has a `PluginManifest` with metadata, entry points, and window defaults

**Window Manager** (`window.ts`):
- Defines `WindowState` (position, size, z-index, minimize/maximize state)
- Manages `AppDefinition` (registered plugin instances)

**Message Bus** (`message.ts`):
- Inter-plugin communication via typed messages with source/target plugin IDs

### Svelte 5 Patterns

- **Runes**: Reactive primitives (`$state`, `$derived`, `$effect`) for state management
- **.svelte.ts files**: TypeScript component logic files enabling type-safe UI composition
- Universal component patterns across native and web components

### Virtual Filesystems

- **/proc**: Exposes system processes and runtime information
- **/dev**: Device and interface abstractions
- **.config**: User configuration storage and settings

### Backend Architecture

- FastAPI with WebSocket endpoint at `/api/chat/ws`
- Streaming AI responses using OpenAI API
- Requires `OPENAI_API_KEY` environment variable
- Runs in Docker container (Python 3.12)

### Multi-Agent System

- Integrated AI capabilities through OpenAI API
- WebSocket-based real-time communication
- Supports streaming responses for interactive user experience
- Foundation for future autonomous agent integration

### Frontend Styling

Tailwind with custom `desktop` color palette:
- `desktop-bg`: #0f172a (background)
- `desktop-surface`: #1e293b
- `desktop-border`: #334155
- `desktop-accent`: #6366f1 (indigo accent)
