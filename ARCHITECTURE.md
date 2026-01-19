# Desktop OS Architecture

> A Unix-on-the-Web desktop environment built with Svelte 5, TypeScript, and a multi-agent plugin architecture.

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Architecture Pattern](#2-architecture-pattern)
3. [Directory Structure](#3-directory-structure)
4. [Svelte 5 Patterns](#4-svelte-5-patterns)
5. [Plugin System](#5-plugin-system)
6. [Virtual Filesystem](#6-virtual-filesystem)
7. [Agent System](#7-agent-system)
8. [Naming Conventions](#8-naming-conventions)

---

## 1. Philosophy

Desktop OS follows Unix design principles adapted for the web environment.

### "Everything is a File"

The Virtual File System (VFS) treats all system resources as files:

```
/                         # Root directory
/home/user/               # User home directory (like ~)
/home/user/.config/       # XDG-style app configuration
/home/user/Documents/     # User documents
/home/user/Desktop/       # Desktop icons/files
/proc/                    # Dynamic system state (read-only)
/proc/agents              # JSON list of all agents
/proc/windows             # JSON list of open windows
/proc/apps                # JSON list of registered apps
/proc/uptime              # System uptime in seconds
/proc/meminfo             # Browser memory info
/proc/self/cwd            # Current working directory
/dev/                     # Virtual devices
/dev/null                 # Discards writes, returns empty
/dev/random               # Random bytes
/dev/clipboard            # Read/write system clipboard
/dev/console              # Console output
/dev/stdout               # Standard output
/dev/stderr               # Standard error
/tmp/                     # Temporary files
/etc/                     # System configuration
/var/log/                 # System logs
/app/                     # Application data
```

### Unix-like Directory Structure

The VFS follows the Filesystem Hierarchy Standard (FHS) pattern:

| Path | Purpose |
|------|---------|
| `/home/user` | User home directory |
| `/home/user/.config/<appId>/` | XDG-style per-app configuration |
| `/home/user/.config/<appId>/settings.json` | App settings file |
| `/home/user/Documents` | User documents |
| `/home/user/Downloads` | Downloaded files |
| `/home/user/Pictures` | Image files |
| `/home/user/Desktop` | Desktop items |
| `/proc` | Process/system information (read-only) |
| `/dev` | Virtual device files |
| `/tmp` | Temporary storage |
| `/etc` | System-wide configuration |
| `/var/log` | Log files |

### Message-Passing IPC

Two complementary systems handle inter-process communication:

#### EventBus - System Events

Lightweight typed event system for internal system events:

```typescript
// Event types are strongly typed
eventBus.emit('window:opened', { windowId, appId, title });
eventBus.emit('file:open', { path, appId, mimeType });
eventBus.emit('theme:changed', { themeId, previousThemeId });

// Subscribe with type safety
const unsubscribe = eventBus.on('window:focused', (data) => {
  console.log(data.windowId, data.appId);
});
```

Standard event categories:
- `window:*` - Window lifecycle (opened, closed, focused, minimized, maximized, snapped)
- `app:*` - App lifecycle (launched, closed)
- `file:*` - File operations (open, operation)
- `theme:*` - Theme changes
- `notification:*` - Notifications
- `desktop:*` - Desktop events (contextmenu, refresh)

#### MessageBus - Inter-Plugin Communication

Full pub/sub messaging for plugin-to-plugin communication:

```typescript
// Subscribe to messages
const unsubscribe = messageBus.subscribe('myPlugin', (message) => {
  console.log(message.type, message.payload);
}, 'optional:filter');

// Send to specific target or broadcast
messageBus.send('chat:message', { text: 'Hello' }, 'chatPlugin', 'targetPlugin');
messageBus.send('broadcast:event', { data: 'value' }, 'myPlugin', '*');

// Request/response pattern
const result = await messageBus.request<UserData>(
  'user:get',
  { userId: '123' },
  'requester',
  'userService',
  5000 // timeout
);
```

### Multi-Agent System

AI agents are first-class citizens, treated like users:

```
Agents can:
- Read and write files in the VFS
- Open and control application windows
- Send messages to apps and other agents
- Execute tools with capability-based permissions
- Maintain context and memory
```

---

## 2. Architecture Pattern

Desktop OS uses a **Hybrid Domain-Driven + Layered Architecture** with three distinct layers.

### Layer Overview

```
+------------------------------------------------------------------+
|                        Layer 3: Plugins                           |
|                     (plugins/*, apps/*)                           |
|  Excalidraw | Calculator | AI Chat | Terminal | File Browser     |
+------------------------------------------------------------------+
|                        Layer 2: Shell/Domain                      |
|                      (src/lib/shell/)                             |
|  Window | Desktop | Taskbar | AppLauncher | ContextMenu          |
+------------------------------------------------------------------+
|                        Layer 1: Core Services                     |
|                      (src/lib/core/)                              |
|  VFS | Agents | MessageBus | EventBus | PluginLoader | Theme     |
+------------------------------------------------------------------+
|                        Browser APIs                               |
|  IndexedDB | localStorage | DOM | WebSocket | Clipboard          |
+------------------------------------------------------------------+
```

### Layer 1: Core Services (`src/lib/core/`)

Foundational services that provide OS-like capabilities:

| Module | Responsibility |
|--------|---------------|
| `vfs/` | Virtual File System with /proc and /dev |
| `agents/` | Multi-agent runtime, tools, and capabilities |
| `message-bus/` | Inter-plugin pub/sub messaging |
| `event-bus.ts` | Typed system event dispatcher |
| `plugin-loader/` | 5-type plugin loading system |
| `plugin-discovery/` | Manifest scanning and validation |
| `config/` | XDG-style configuration management |
| `file-associations/` | MIME types and default app handlers |
| `theme/` | Theme management with system preference detection |
| `persistence/` | localStorage-based state persistence |
| `keyboard-shortcuts.ts` | Global keyboard shortcut handling |
| `widget-registry.svelte.ts` | Desktop widget management |
| `attachments.ts` | Svelte 5 attachments (drag, resize, etc.) |

### Layer 2: Shell/Domain (`src/lib/shell/`)

Desktop environment UI and window management:

| Component | Responsibility |
|-----------|---------------|
| `registry.svelte.ts` | WindowManager singleton (apps, windows state) |
| `window.svelte.ts` | Window class with reactive state |
| `types.ts` | AppDefinition, WindowState, SnapZone types |
| `Desktop.svelte` | Main desktop surface |
| `Window.svelte` | Window chrome and content rendering |
| `Taskbar.svelte` | macOS-style dock with running apps |
| `DesktopIcons.svelte` | Draggable desktop icons |
| `DesktopWidgets.svelte` | Desktop widget layer |
| `AppLauncher.svelte` | Spotlight-like app launcher |
| `StartMenu.svelte` | Traditional start menu |
| `ContextMenu.svelte` | Right-click context menus |
| `WindowSwitcher.svelte` | Alt+Tab window switcher |
| `AppInfoModal.svelte` | App information display |
| `FederationOffline.svelte` | Fallback for offline federation apps |

### Layer 3: Plugins (`plugins/`)

User-facing applications built on top of core services:

```
plugins/
  agent-manager/    # AI agent management UI
  ai-chat/          # AI chat interface
  calculator/       # Calculator (native)
  clock/            # Clock widget
  excalidraw/       # Drawing whiteboard (federation)
  file-browser/     # VFS file browser
  flappy-bird/      # Game (potentially WASM)
  image-filter/     # Image processing
  markdown-editor/  # Markdown editor
  notes/            # Note-taking app
  prompt-manager/   # AI prompt management
  system-monitor/   # System monitoring
  terminal/         # Terminal emulator
  weather/          # Weather widget
```

### Dependency Flow

```
Plugins (Layer 3)
    |
    | imports
    v
Shell (Layer 2)
    |
    | imports
    v
Core (Layer 1)
    |
    | uses
    v
Browser APIs
```

Rules:
- Plugins may import from Shell and Core
- Shell may import from Core only
- Core may not import from Shell or Plugins
- All layers access Browser APIs directly when needed

---

## 3. Directory Structure

```
desktop-os/
├── apps/                          # Monorepo applications
│   ├── desktop-host/              # Main SvelteKit frontend (unused, merged to root)
│   └── python-backend/            # FastAPI backend for AI
│       └── src/
│           └── main.py
│
├── packages/                      # Shared packages
│   └── shared-types/              # TypeScript type definitions
│       └── src/
│           ├── plugin.ts          # PluginManifest, LoadedPlugin
│           ├── message.ts         # Message types
│           └── window.ts          # WindowState types
│
├── plugins/                       # Plugin applications
│   ├── calculator/
│   │   ├── manifest.ts            # Plugin manifest
│   │   └── src/
│   │       └── Calculator.svelte  # Main component
│   ├── excalidraw/
│   │   ├── manifest.ts
│   │   └── src/
│   │       └── ExcalidrawApp.svelte
│   └── ...                        # Other plugins
│
├── src/                           # Main application source
│   ├── app.d.ts                   # SvelteKit type definitions
│   ├── lib/                       # Library code
│   │   ├── index.ts               # Main exports
│   │   │
│   │   ├── core/                  # Layer 1: Core Services
│   │   │   ├── index.ts           # Core exports
│   │   │   ├── types.ts           # Core type definitions
│   │   │   │
│   │   │   ├── vfs/               # Virtual File System
│   │   │   │   ├── index.ts
│   │   │   │   ├── types.ts       # FileEntry, FileStat, FSEvent
│   │   │   │   ├── vfs.svelte.ts  # VFS implementation (IndexedDB)
│   │   │   │   ├── proc.ts        # /proc filesystem
│   │   │   │   ├── dev.ts         # /dev filesystem
│   │   │   │   └── init.ts        # VFS initialization
│   │   │   │
│   │   │   ├── agents/            # Multi-Agent System
│   │   │   │   ├── index.ts
│   │   │   │   ├── types.ts       # Agent, AgentTool, AgentCapability
│   │   │   │   ├── runtime.svelte.ts  # AgentRuntime singleton
│   │   │   │   └── tools.ts       # Built-in agent tools
│   │   │   │
│   │   │   ├── message-bus/       # Inter-Plugin Communication
│   │   │   │   ├── index.ts
│   │   │   │   ├── types.ts       # Message, Subscription
│   │   │   │   ├── bus.ts         # MessageBus implementation
│   │   │   │   └── adapters/
│   │   │   │       └── iframe-adapter.ts  # postMessage bridge
│   │   │   │
│   │   │   ├── plugin-loader/     # Plugin Loading System
│   │   │   │   ├── index.ts
│   │   │   │   ├── loader.ts      # Main PluginLoader
│   │   │   │   └── loaders/       # Type-specific loaders
│   │   │   │       ├── native-loader.ts
│   │   │   │       ├── iframe-loader.ts
│   │   │   │       ├── webcomponent-loader.ts
│   │   │   │       ├── federation-loader.ts
│   │   │   │       └── wasm-loader.ts
│   │   │   │
│   │   │   ├── plugin-discovery/  # Plugin Scanning
│   │   │   │   ├── index.ts
│   │   │   │   ├── scanner.ts     # Vite glob-based discovery
│   │   │   │   └── validator.ts   # Manifest validation
│   │   │   │
│   │   │   ├── config/            # Configuration Management
│   │   │   │   ├── index.ts
│   │   │   │   └── config.svelte.ts  # ConfigManager (XDG-style)
│   │   │   │
│   │   │   ├── file-associations/ # File Type Handling
│   │   │   │   ├── index.ts
│   │   │   │   ├── associations.svelte.ts
│   │   │   │   └── file-handler.svelte.ts
│   │   │   │
│   │   │   ├── theme/             # Theme System
│   │   │   │   ├── index.ts
│   │   │   │   ├── themes.ts      # Theme definitions
│   │   │   │   ├── theme.svelte.ts   # ThemeStore
│   │   │   │   └── ThemeProvider.svelte
│   │   │   │
│   │   │   ├── persistence/       # State Persistence
│   │   │   │   ├── index.ts
│   │   │   │   ├── storage.ts     # localStorage wrapper
│   │   │   │   ├── window-state.ts
│   │   │   │   └── hooks.ts
│   │   │   │
│   │   │   ├── event-bus.ts       # Typed event system
│   │   │   ├── keyboard-shortcuts.ts
│   │   │   ├── widget-registry.svelte.ts
│   │   │   ├── attachments.ts     # Svelte 5 attachments
│   │   │   └── cleanup.ts         # Resource cleanup
│   │   │
│   │   ├── shell/                 # Layer 2: Shell/Domain
│   │   │   ├── index.ts           # Shell exports
│   │   │   ├── types.ts           # AppDefinition, WindowState, SnapZone
│   │   │   ├── registry.svelte.ts # WindowManager singleton
│   │   │   ├── window.svelte.ts   # Window class
│   │   │   ├── Desktop.svelte
│   │   │   ├── Window.svelte
│   │   │   ├── Taskbar.svelte
│   │   │   ├── DesktopIcons.svelte
│   │   │   ├── DesktopWidgets.svelte
│   │   │   ├── AppLauncher.svelte
│   │   │   ├── StartMenu.svelte
│   │   │   ├── ContextMenu.svelte
│   │   │   ├── WindowSwitcher.svelte
│   │   │   ├── AppInfoModal.svelte
│   │   │   └── FederationOffline.svelte
│   │   │
│   │   ├── ai/                    # AI Integration
│   │   │   └── chat.remote.ts     # Remote AI chat client
│   │   │
│   │   ├── server/                # Server-side utilities
│   │   │   ├── index.ts
│   │   │   ├── db.ts
│   │   │   ├── notes.ts
│   │   │   └── markdown.ts
│   │   │
│   │   ├── types/                 # Additional type definitions
│   │   │   └── federation.d.ts
│   │   │
│   │   └── assets/                # Static assets
│   │
│   └── routes/                    # SvelteKit routes
│       ├── +layout.svelte
│       ├── +page.svelte
│       └── api/
│           ├── notes/
│           │   ├── +server.ts
│           │   └── [id]/+server.ts
│           └── ai/
│               └── stream/+server.ts
│
├── static/                        # Static files
├── data/                          # Data files
├── scripts/                       # Build/dev scripts
│
├── package.json                   # Bun workspace root
├── bun.lock
├── bunfig.toml
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── docker-compose.yml
├── .env.example
├── CLAUDE.md                      # Claude Code guidance
└── ARCHITECTURE.md                # This file
```

---

## 4. Svelte 5 Patterns

Desktop OS uses Svelte 5 with runes exclusively. **No legacy stores are used.**

### Runes Usage

#### `$state` - Reactive State

```typescript
// In .svelte.ts files or <script> blocks
class WindowManager {
  apps = $state<AppDefinition[]>([]);
  windows = $state<Window[]>([]);
  private nextZIndex = $state(100);
}

// In components
let count = $state(0);
let items = $state<string[]>([]);
```

#### `$derived` - Computed Values

```typescript
class WindowManager {
  apps = $state<AppDefinition[]>([]);
  windows = $state<Window[]>([]);

  // Derived state updates automatically when dependencies change
  visibleWindows = $derived(
    this.windows
      .filter(w => !w.isMinimized)
      .sort((a, b) => a.zIndex - b.zIndex)
  );
}
```

#### `$effect` - Side Effects

```typescript
// Runs when dependencies change
$effect(() => {
  console.log(`Window count: ${windows.length}`);
});

// With cleanup
$effect(() => {
  const handler = (e: KeyboardEvent) => { /* ... */ };
  window.addEventListener('keydown', handler);

  return () => {
    window.removeEventListener('keydown', handler);
  };
});
```

#### `$props` - Component Properties

```typescript
// In components
interface Props {
  windowId: string;
  title: string;
  onClose?: () => void;
}

let { windowId, title, onClose }: Props = $props();
```

### `.svelte.ts` for Reactive Modules

Files ending in `.svelte.ts` can use runes outside of components:

```typescript
// window.svelte.ts
export class Window {
  id: string;
  title = $state('');
  x = $state(0);
  y = $state(0);
  width = $state(800);
  height = $state(600);
  isMinimized = $state(false);
  isMaximized = $state(false);
  isFocused = $state(false);
  isSnapped = $state(false);
  snapZone = $state<SnapZone>(null);

  constructor(initialState: WindowState) {
    this.id = initialState.id;
    this.title = initialState.title;
    // ...
  }

  focus() {
    this.isFocused = true;
    this.isMinimized = false;
  }

  minimize() {
    this.isMinimized = true;
    this.isFocused = false;
  }
}
```

### Class-Based Singletons with Runes

All core services use class-based singletons with runes:

```typescript
// registry.svelte.ts
class WindowManager {
  // Reactive state using runes
  apps = $state<AppDefinition[]>([]);
  windows = $state<Window[]>([]);

  // Derived state
  visibleWindows = $derived(
    this.windows.filter(w => !w.isMinimized)
  );

  // Methods mutate state directly
  openWindow(appId: string): string | null {
    const app = this.apps.find(a => a.id === appId);
    if (!app) return null;

    const win = new Window({ /* ... */ });
    this.windows.push(win);
    return win.id;
  }

  closeWindow(windowId: string): void {
    const idx = this.windows.findIndex(w => w.id === windowId);
    if (idx !== -1) {
      this.windows.splice(idx, 1);
    }
  }
}

// Singleton export
export const wm = new WindowManager();
```

Usage in components:

```svelte
<script lang="ts">
import { wm } from '$lib/shell';

// Reactive - updates when windows change
const windows = $derived(wm.visibleWindows);
</script>

{#each windows as win}
  <Window {win} />
{/each}
```

### No Legacy Stores

**IMPORTANT:** Do not use Svelte stores (`writable`, `readable`, `derived` from `svelte/store`). Use runes instead:

```typescript
// DON'T DO THIS
import { writable } from 'svelte/store';
const count = writable(0);

// DO THIS
let count = $state(0);
```

---

## 5. Plugin System

Desktop OS supports **5 plugin types** to accommodate different isolation and integration needs.

### Plugin Types Overview

| Type | Isolation | Shared State | Performance | Use Case |
|------|-----------|--------------|-------------|----------|
| `native` | None | Full access | Best | Core apps, system tools |
| `webcomponent` | Shadow DOM | Via attributes | Good | Reusable widgets |
| `iframe` | Full process | postMessage | Moderate | Third-party apps |
| `federation` | None | Shared deps | Good | Micro-frontends |
| `wasm` | Memory sandbox | Via wrapper | Variable | Compute-intensive |

### manifest.ts Structure

Each plugin must have a `manifest.ts` file:

```typescript
// plugins/my-plugin/manifest.ts
const manifest = {
  // Required fields
  id: 'my-plugin',           // Unique identifier
  name: 'My Plugin',         // Display name
  version: '1.0.0',          // Semantic version
  type: 'native',            // Plugin type
  icon: '🔧',                // Emoji or icon path

  // Optional metadata
  description: 'A helpful plugin',

  // Type-specific entry points
  entry: './src/MyPlugin.svelte',  // For native/webcomponent/wasm

  // For iframe type
  url: 'https://example.com/app',

  // For federation type
  remote: {
    name: 'myRemote',
    entry: '/federation/my-plugin/assets/remoteEntry.js',
    exposedModule: './MyComponent'
  },

  // For wasm type
  wasmModule: './my-module.wasm',

  // Window defaults
  defaultWidth: 800,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 300,
  singleton: false,          // Only one instance allowed?
  resizable: true,

  // Desktop widget (optional)
  widget: './src/Widget.svelte',
  widgetWidth: 200,
  widgetHeight: 150,

  // Future: permissions
  permissions: ['file:read', 'network'],
  dependencies: ['other-plugin']
};

export default manifest;
```

### Plugin Type Details

#### 1. Native (`native`)

Svelte 5 components with full host access:

```typescript
// manifest.ts
{
  type: 'native',
  entry: './src/Calculator.svelte'
}

// LoadedPlugin.render
{
  kind: 'component',
  component: CalculatorComponent,
  props: { windowId: '...' }
}
```

#### 2. Web Component (`webcomponent`)

Custom Elements with Shadow DOM:

```typescript
// manifest.ts
{
  type: 'webcomponent',
  entry: './src/my-widget.ts'  // Registers custom element
}

// LoadedPlugin.render
{
  kind: 'webcomponent',
  tagName: 'my-widget'
}
```

#### 3. Iframe (`iframe`)

Sandboxed external applications:

```typescript
// manifest.ts
{
  type: 'iframe',
  url: 'https://example.com/app'
}

// LoadedPlugin.render
{
  kind: 'iframe',
  url: 'https://example.com/app',
  sandbox: 'allow-same-origin allow-scripts allow-forms'
}
```

#### 4. Federation (`federation`)

Module Federation remotes:

```typescript
// manifest.ts
{
  type: 'federation',
  entry: './src/FallbackComponent.svelte',  // Fallback when remote unavailable
  remote: {
    name: 'excalidrawRemote',
    entry: '/federation/excalidraw/assets/remoteEntry.js',
    exposedModule: './Excalidraw'
  }
}

// LoadedPlugin.render (success)
{
  kind: 'federation',
  component: FederatedComponent
}

// LoadedPlugin.render (failure)
{
  kind: 'federation-offline',
  remoteUrl: '...',
  error: 'Failed to load remote'
}
```

#### 5. WebAssembly (`wasm`)

WASM modules with Svelte wrapper:

```typescript
// manifest.ts
{
  type: 'wasm',
  entry: './src/WasmWrapper.svelte',
  wasmModule: './game.wasm'
}

// LoadedPlugin.render
{
  kind: 'wasm',
  wrapper: WasmWrapperComponent
}
```

### Plugin Discovery via import.meta.glob

Plugins are discovered at build time using Vite's glob imports:

```typescript
// In initialization code
import { pluginScanner, discoverPlugins } from '$lib/core/plugin-discovery';

// Initialize with glob imports
const manifests = import.meta.glob('/plugins/*/manifest.ts');
const { plugins } = await discoverPlugins(manifests);

// Register discovered plugins
plugins.forEach(manifest => {
  await pluginLoader.load(manifest);
  wm.registerApp({
    id: manifest.id,
    title: manifest.name,
    icon: manifest.icon,
    // ...
  });
});
```

### Plugin Lifecycle

```
Discovery -> Validation -> Load -> Mount -> Runtime -> Unmount -> Cleanup

1. Discovery:    import.meta.glob finds manifest.ts files
2. Validation:   validateManifest() checks required fields
3. Load:         Type-specific loader handles loading
4. Mount:        WindowManager creates window, renders plugin
5. Runtime:      Plugin runs, communicates via MessageBus
6. Unmount:      Window closes, onDestroy called
7. Cleanup:      Resources released
```

---

## 6. Virtual Filesystem

The VFS provides Unix-like file operations backed by IndexedDB.

### Architecture

```
+------------------------------------------------------------------+
|                    VFS Implementation                             |
+------------------------------------------------------------------+
|                                                                   |
|  Real Files (IndexedDB)    Virtual Filesystems                   |
|  /home/user/*              /proc/* (ProcFS - read-only)          |
|  /tmp/*                    /dev/*  (DevFS - devices)             |
|  /etc/*                                                          |
|  /var/*                                                          |
|  /app/*                                                          |
|                                                                   |
+------------------------------------------------------------------+
|                    VFS API                                        |
|  pwd() cd() stat() exists() readFile() writeFile()               |
|  mkdir() readdir() rmdir() rm() cp() mv() ln()                   |
|  chmod() chown() watch() find() grep()                           |
|  getAssociation() registerAssociation()                          |
+------------------------------------------------------------------+
```

### /proc - Process Information (Read-Only)

Dynamic virtual files that expose system state:

| Path | Content |
|------|---------|
| `/proc/uptime` | System uptime in seconds |
| `/proc/meminfo` | Browser memory info (if available) |
| `/proc/agents` | JSON array of all agents |
| `/proc/windows` | JSON array of open windows |
| `/proc/apps` | JSON array of registered apps |
| `/proc/version` | OS version and platform info |
| `/proc/loadavg` | Simulated load (based on window count) |
| `/proc/stat` | Basic system stats |
| `/proc/self/cwd` | Current working directory |

Usage:

```typescript
import { vfs } from '$lib/core/vfs';

// Read system uptime
const uptime = await vfs.readTextFile('/proc/uptime');
console.log(`System uptime: ${uptime} seconds`);

// Get all agents
const agents = await vfs.readJsonFile('/proc/agents');

// Writing to /proc throws EROFS error
await vfs.writeFile('/proc/uptime', '0'); // Error: EROFS: /proc is read-only
```

### /dev - Virtual Devices

Device files for I/O operations:

| Device | Read | Write |
|--------|------|-------|
| `/dev/null` | Empty | Discard |
| `/dev/random` | Random bytes | Error |
| `/dev/urandom` | Random bytes | Error |
| `/dev/zero` | Zero bytes | Error |
| `/dev/clipboard` | Clipboard text | Set clipboard |
| `/dev/console` | Empty | console.log |
| `/dev/stdout` | Empty | console.log |
| `/dev/stderr` | Empty | console.error |
| `/dev/stdin` | Empty | Error |

Usage:

```typescript
// Write to clipboard
await vfs.writeFile('/dev/clipboard', 'Copied text!');

// Read from clipboard
const clipboardContent = await vfs.readTextFile('/dev/clipboard');

// Generate random bytes
const randomBytes = await vfs.readFile('/dev/random');

// Discard output
await vfs.writeFile('/dev/null', 'This goes nowhere');

// Write to console
await vfs.writeFile('/dev/console', 'Hello, World!'); // Logs to console
```

### .config for App Settings (XDG-style)

Apps store configuration in `/home/user/.config/<appId>/`:

```typescript
import { configManager } from '$lib/core/config';

// Get a config value
const theme = await configManager.get('my-app', 'theme', 'dark');

// Set a config value (supports dot notation)
await configManager.set('my-app', 'window.width', 800);
await configManager.set('my-app', 'window.height', 600);

// Get all config
const config = await configManager.getAll('my-app');
// { theme: 'dark', window: { width: 800, height: 600 } }

// Watch for config changes
const unwatch = configManager.watch('my-app', (newConfig) => {
  console.log('Config changed:', newConfig);
});

// Reset config
await configManager.reset('my-app');
```

File structure:

```
/home/user/.config/
  excalidraw/
    settings.json       # { "theme": "dark", "gridSize": 20 }
  markdown-editor/
    settings.json       # { "fontSize": 14, "lineNumbers": true }
  calculator/
    settings.json       # { "precision": 10 }
```

### File Associations

Register and query default apps for file types:

```typescript
import { vfs } from '$lib/core/vfs';

// Register a file association
vfs.registerAssociation({
  extension: '.md',
  mimeType: 'text/markdown',
  appId: 'markdown-editor',
  icon: '📝',
  name: 'Markdown Document'
});

// Get association for a file
const assoc = vfs.getAssociation('/home/user/Documents/notes.md');
// { extension: '.md', mimeType: 'text/markdown', appId: 'markdown-editor', ... }
```

Default associations:

| Extension | MIME Type | App ID |
|-----------|-----------|--------|
| `.md` | text/markdown | markdown-editor |
| `.txt` | text/plain | notepad |
| `.excalidraw` | application/vnd.excalidraw+json | excalidraw |
| `.json` | application/json | json-viewer |
| `.png` | image/png | image-viewer |
| `.jpg` | image/jpeg | image-viewer |
| `.pdf` | application/pdf | pdf-viewer |

---

## 7. Agent System

AI agents are autonomous entities that can interact with the desktop OS.

### Agent Architecture

```
+------------------------------------------------------------------+
|                    Agent Runtime                                  |
+------------------------------------------------------------------+
|                                                                   |
|  agents: Agent[]           tools: Map<string, AgentTool>         |
|  messages: AgentMessage[]  eventListeners: Map<event, Set<cb>>   |
|                                                                   |
+------------------------------------------------------------------+
|                    Agent API                                      |
|  createAgent() getAgent() listAgents() deleteAgent()             |
|  execute() start() stop() sendMessage()                          |
|  registerTool() unregisterTool()                                 |
+------------------------------------------------------------------+
```

### Capabilities

Agents have capability-based permissions:

```typescript
const CAPABILITIES = {
  FILE_READ: {
    name: 'file:read',
    description: 'Read files from the virtual file system',
    tools: ['vfs.readFile', 'vfs.readdir', 'vfs.stat', 'vfs.find', 'vfs.grep']
  },
  FILE_WRITE: {
    name: 'file:write',
    description: 'Write files to the virtual file system',
    tools: ['vfs.writeFile', 'vfs.mkdir', 'vfs.rm', 'vfs.mv', 'vfs.cp']
  },
  APP_OPEN: {
    name: 'app:open',
    description: 'Open applications',
    tools: ['wm.openWindow', 'wm.closeWindow', 'wm.focusWindow']
  },
  APP_CONTROL: {
    name: 'app:control',
    description: 'Control running applications',
    tools: ['wm.minimizeWindow', 'wm.maximizeWindow', 'wm.moveWindow', 'wm.resizeWindow']
  },
  MESSAGE: {
    name: 'message',
    description: 'Send messages to apps and other agents',
    tools: ['bus.emit', 'bus.send']
  },
  NETWORK: {
    name: 'network',
    description: 'Make HTTP requests',
    tools: ['http.get', 'http.post', 'http.put', 'http.delete']
  },
  SYSTEM: {
    name: 'system',
    description: 'Access system information',
    tools: ['system.info', 'system.time', 'system.env']
  }
};
```

### Tools

Tools are functions that agents can call:

```typescript
interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
  execute: (params: Record<string, unknown>, agent: Agent) => Promise<unknown>;
}

// Built-in tools
const DEFAULT_TOOLS: AgentTool[] = [
  // File system
  readFileTool,        // Read file contents
  writeFileTool,       // Write file
  listDirectoryTool,   // List directory
  createDirectoryTool, // Create directory
  deleteFileTool,      // Delete file
  findFilesTool,       // Find files by pattern
  searchInFilesTool,   // Grep in files

  // Window manager
  openAppTool,         // Open an app
  closeAppTool,        // Close a window
  listAppsTool,        // List available apps
  listWindowsTool,     // List open windows
  focusWindowTool,     // Focus a window

  // Events/Messages
  emitEventTool,       // Emit event
  sendToAppTool,       // Send message to app

  // System
  getCurrentTimeTool,  // Get current time
  waitTool,            // Wait/sleep
];
```

### Multi-Agent Communication

Agents can communicate with each other:

```typescript
import { agentRuntime } from '$lib/core/agents';

// Create an agent
const agent = await agentRuntime.createAgent({
  name: 'Assistant',
  description: 'Helpful AI assistant',
  model: 'claude-3-sonnet',
  capabilities: [
    CAPABILITIES.FILE_READ.name,
    CAPABILITIES.FILE_WRITE.name,
    CAPABILITIES.APP_OPEN.name,
    CAPABILITIES.MESSAGE.name,
  ],
  systemPrompt: 'You are a helpful assistant...'
});

// Execute an action
const result = await agentRuntime.execute(agent.id, {
  type: 'read_file',
  params: { path: '/home/user/Documents/notes.md' }
});

// Send message between agents
await agentRuntime.sendMessage({
  from: 'assistant',
  to: 'other-agent',
  content: 'Hello from assistant!',
  type: 'text'
});

// Start autonomous mode with a goal
await agentRuntime.start(agent.id, 'Organize my Documents folder');

// Listen for agent events
agentRuntime.on('agent:action', (event) => {
  console.log(`Agent ${event.agentId} performed action:`, event.data);
});
```

### Agent State

```typescript
interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  model: AgentModel;
  status: AgentStatus;  // 'idle' | 'thinking' | 'acting' | 'waiting' | 'error'
  capabilities: string[];
  systemPrompt?: string;
  context?: {
    currentDirectory: string;
    openWindows: string[];
    lastAction?: AgentAction;
    memory: AgentMemory[];
  };
  createdAt: Date;
  lastActiveAt: Date;
}
```

---

## 8. Naming Conventions

Consistent naming ensures code readability and discoverability.

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Svelte components | PascalCase.svelte | `Window.svelte`, `AppLauncher.svelte` |
| TypeScript modules | kebab-case.ts | `event-bus.ts`, `keyboard-shortcuts.ts` |
| Svelte reactive modules | kebab-case.svelte.ts | `registry.svelte.ts`, `theme.svelte.ts` |
| Type definitions | kebab-case.ts or types.ts | `types.ts`, `federation.d.ts` |
| Index exports | index.ts | `index.ts` |

### Export Naming

| Type | Convention | Example |
|------|------------|---------|
| Singleton instances | camelCase | `wm`, `vfs`, `eventBus`, `messageBus` |
| Classes | PascalCase | `WindowManager`, `MessageBus`, `VFS` |
| Types/Interfaces | PascalCase | `WindowState`, `AppDefinition`, `PluginManifest` |
| Type aliases | PascalCase | `PluginType`, `SnapZone`, `AgentStatus` |
| Constants | SCREAMING_SNAKE_CASE | `CAPABILITIES`, `DEFAULT_TOOLS` |
| Functions | camelCase | `detectSnapZone`, `validateManifest` |

### Directory Naming

| Type | Convention | Example |
|------|------------|---------|
| Feature directories | kebab-case | `message-bus/`, `plugin-loader/` |
| Component directories | kebab-case | `file-associations/`, `plugin-discovery/` |

### Component Props

Use TypeScript interfaces with explicit types:

```typescript
interface Props {
  windowId: string;
  title: string;
  isMinimized?: boolean;
  onClose?: () => void;
}

let { windowId, title, isMinimized = false, onClose }: Props = $props();
```

### Event Names

Use colon-separated namespaces:

```typescript
// Format: namespace:action[:subtype]
'window:opened'
'window:closed'
'window:focused'
'app:launched'
'app:closed'
'file:open'
'file:operation'
'theme:changed'
'notification:show'
'desktop:contextmenu'
```

### CSS Class Names

Use Tailwind utility classes with custom desktop palette:

```html
<div class="bg-desktop-bg text-white border-desktop-border">
  <button class="bg-desktop-accent hover:bg-desktop-accent/80">
    Click me
  </button>
</div>
```

Custom colors:
- `desktop-bg`: #0f172a (dark background)
- `desktop-surface`: #1e293b (elevated surface)
- `desktop-border`: #334155 (borders)
- `desktop-accent`: #6366f1 (indigo accent)

---

## Summary

Desktop OS implements a Unix-on-the-Web philosophy with:

1. **Virtual Filesystem**: Everything is a file, including /proc and /dev
2. **Layered Architecture**: Core Services -> Shell -> Plugins
3. **Svelte 5 Runes**: Modern reactive patterns without legacy stores
4. **5 Plugin Types**: Flexibility from full trust to complete isolation
5. **Multi-Agent System**: AI agents as first-class OS citizens
6. **Message-Passing IPC**: EventBus for system events, MessageBus for plugins

The architecture prioritizes:
- Unix-like familiarity for developers
- Clean separation of concerns
- Type safety throughout
- Extensibility via plugins
- AI-native design with agents
