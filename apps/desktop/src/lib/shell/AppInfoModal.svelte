<script lang="ts">
  import { onMount } from 'svelte';
  import type { AppDefinition } from './types';
  import type { PluginType } from '$lib/core/types';

  interface Props {
    app: AppDefinition;
    view: 'source' | 'architecture' | 'docs';
    onClose: () => void;
  }

  let { app, view, onClose }: Props = $props();

  let modalEl: HTMLDivElement | undefined = $state();

  // Source file mappings - now uses plugins directory
  const sourceFileMappings: Record<string, { path: string; relativePath: string }> = {
    'clock': {
      path: 'plugins/clock/src/ClockApp.svelte',
      relativePath: '/plugins/clock/src/ClockApp.svelte'
    },
    'calculator': {
      path: 'plugins/calculator/src/Calculator.svelte',
      relativePath: '/plugins/calculator/src/Calculator.svelte'
    },
    'terminal': {
      path: 'plugins/terminal/src/Terminal.svelte',
      relativePath: '/plugins/terminal/src/Terminal.svelte'
    },
    'weather': {
      path: 'plugins/weather/src/Weather.svelte',
      relativePath: '/plugins/weather/src/Weather.svelte'
    },
    'markdown-editor': {
      path: 'plugins/markdown-editor/src/MarkdownEditor.svelte',
      relativePath: '/plugins/markdown-editor/src/MarkdownEditor.svelte'
    },
    'analytics': {
      path: 'plugins/analytics/src/Analytics.svelte',
      relativePath: '/plugins/analytics/src/Analytics.svelte'
    },
    'system-monitor': {
      path: 'plugins/system-monitor/src/SystemMonitor.svelte',
      relativePath: '/plugins/system-monitor/src/SystemMonitor.svelte'
    },
    'file-browser': {
      path: 'plugins/file-browser/src/FileBrowser.svelte',
      relativePath: '/plugins/file-browser/src/FileBrowser.svelte'
    },
    'notes': {
      path: 'plugins/notes/src/Notes.svelte',
      relativePath: '/plugins/notes/src/Notes.svelte'
    },
    'flappy-bird': {
      path: 'plugins/flappy-bird/src/FlappyBird.svelte',
      relativePath: '/plugins/flappy-bird/src/FlappyBird.svelte'
    },
    'image-filter': {
      path: 'plugins/image-filter/src/ImageFilter.svelte',
      relativePath: '/plugins/image-filter/src/ImageFilter.svelte'
    },
    'ai-chat': {
      path: 'plugins/ai-chat/src/AIChat.svelte',
      relativePath: '/plugins/ai-chat/src/AIChat.svelte'
    },
    'prompt-manager': {
      path: 'plugins/prompt-manager/src/PromptManager.svelte',
      relativePath: '/plugins/prompt-manager/src/PromptManager.svelte'
    },
    'solitaire': {
      path: 'plugins/solitaire/app/',
      relativePath: '/apps/solitaire/index.html'
    },
    'tic-tac-toe': {
      path: 'plugins/tic-tac-toe/app/',
      relativePath: '/apps/tic-tac-toe/index.html'
    },
    'todo-app': {
      path: 'plugins/todo-app/app/',
      relativePath: '/apps/todo-app/index.html'
    },
    'kanban-board': {
      path: 'plugins/kanban-board/app/',
      relativePath: '/apps/kanban-board/index.html'
    },
  };

  // Plugin type details
  const pluginTypeInfo: Record<PluginType, {
    label: string;
    color: string;
    bgColor: string;
    description: string;
    loadingMethod: string;
    dependencies: string[];
  }> = {
    native: {
      label: 'Native',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20 border-emerald-500/40',
      description: 'Svelte 5 component compiled directly into the application bundle',
      loadingMethod: 'Direct import - Component is bundled with the main app at build time',
      dependencies: ['Svelte 5', 'SvelteKit', 'Tailwind CSS']
    },
    webcomponent: {
      label: 'WebComponent',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20 border-blue-500/40',
      description: 'Custom Element using the Web Components standard',
      loadingMethod: 'Custom Element registration - Uses browser native custom elements API',
      dependencies: ['Custom Elements API', 'Shadow DOM', 'Svelte wrapper']
    },
    wasm: {
      label: 'WASM',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20 border-amber-500/40',
      description: 'WebAssembly module for high-performance computation',
      loadingMethod: 'WebAssembly instantiation - Binary compiled from Rust/C/Go runs in browser',
      dependencies: ['WebAssembly', 'JavaScript wrapper', 'Canvas/WebGL (for games)']
    },
    iframe: {
      label: 'Iframe',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20 border-purple-500/40',
      description: 'External application loaded in an isolated sandbox',
      loadingMethod: 'Iframe sandbox - Isolated browsing context with controlled permissions',
      dependencies: ['Sandboxed iframe', 'PostMessage API (for communication)']
    },
    federation: {
      label: 'Federation',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20 border-rose-500/40',
      description: 'Module Federation remote loaded from external server',
      loadingMethod: 'Module Federation - Dynamic import from remote container at runtime',
      dependencies: ['Webpack Module Federation', 'Remote container', 'Shared dependencies']
    }
  };

  // App-specific documentation
  const appDocs: Record<string, {
    description: string;
    usage: string[];
    features: string[];
    notes?: string;
  }> = {
    'clock': {
      description: 'A beautiful analog clock with smooth animations and a modern design.',
      usage: ['View current time in analog format', 'Watch real-time second hand movement'],
      features: ['Smooth CSS animations', 'Responsive sizing', 'Dark theme optimized']
    },
    'alarm-clock': {
      description: 'Set alarms with custom times and get notified when they trigger.',
      usage: ['Click the + button to add a new alarm', 'Toggle alarms on/off', 'Delete alarms you no longer need'],
      features: ['Multiple alarms', 'Persistent storage', 'Audio notifications', 'Visual ring animation'],
      notes: 'Alarms are stored in localStorage and persist across sessions.'
    },
    'calculator': {
      description: 'A fully functional calculator with a beautiful macOS-inspired design.',
      usage: ['Click buttons or use keyboard for input', 'Use operators (+, -, x, /) for operations', 'Press = or Enter to calculate'],
      features: ['Keyboard support', 'Clear and AC functions', 'Percentage calculations', 'Sign toggle']
    },
    'terminal': {
      description: 'A terminal emulator with basic command support.',
      usage: ['Type commands and press Enter', 'Use arrow keys for history', 'Type "help" for available commands'],
      features: ['Command history', 'Tab completion', 'Colored output', 'Custom prompt']
    },
    'weather': {
      description: 'Check weather conditions for any location.',
      usage: ['Enter a city name in the search box', 'View current conditions and forecast', 'Toggle units between Celsius and Fahrenheit'],
      features: ['5-day forecast', 'Weather icons', 'Temperature, humidity, wind data', 'Location search']
    },
    'markdown-editor': {
      description: 'Write and preview Markdown in real-time with a split-pane editor.',
      usage: ['Type Markdown in the left pane', 'See rendered preview on the right', 'Use the toolbar for common formatting'],
      features: ['Live preview', 'Syntax highlighting', 'Export to HTML', 'Auto-save']
    },
    'file-browser': {
      description: 'Browse and manage files in a virtual filesystem.',
      usage: ['Navigate folders by clicking', 'Create new files and folders', 'Rename and delete items'],
      features: ['Virtual filesystem', 'Drag and drop', 'Context menu actions', 'Grid and list views']
    },
    'notes': {
      description: 'Quick notes with a simple, distraction-free interface.',
      usage: ['Click to start writing', 'Notes auto-save as you type', 'Create multiple notes'],
      features: ['Auto-save', 'Local storage persistence', 'Clean minimal UI']
    },
    'flappy-bird': {
      description: 'The classic Flappy Bird game running in WebAssembly.',
      usage: ['Click or press Space to flap', 'Navigate through pipes', 'Try to get the highest score'],
      features: ['WASM performance', 'Score tracking', 'Smooth 60fps gameplay'],
      notes: 'Built with Canvas 2D API for rendering.'
    },
    'image-filter': {
      description: 'Apply various filters to images using WebAssembly for fast processing.',
      usage: ['Load an image from your device', 'Select a filter from the list', 'Adjust filter intensity'],
      features: ['Real-time preview', 'Multiple filters', 'WASM-powered processing', 'Export filtered image']
    },
    'solitaire': {
      description: 'Classic Klondike Solitaire card game.',
      usage: ['Drag cards to build foundation piles', 'Click deck to draw cards', 'Double-click to auto-move to foundation'],
      features: ['Standard Klondike rules', 'Undo support', 'Win detection']
    },
    'tic-tac-toe': {
      description: 'Play Tic-Tac-Toe against another player or AI.',
      usage: ['Click a cell to place your mark', 'Alternate turns with opponent', 'Get three in a row to win'],
      features: ['Two-player mode', 'Win detection', 'Game reset']
    },
    'todo-app': {
      description: 'Manage your tasks with this simple todo list application.',
      usage: ['Add new tasks using the input field', 'Click to mark tasks complete', 'Delete tasks when done'],
      features: ['Task persistence', 'Filter by status', 'Clear completed tasks']
    },
    'kanban-board': {
      description: 'Organize tasks visually with a Kanban-style board.',
      usage: ['Create cards in columns', 'Drag cards between columns', 'Edit card details by clicking'],
      features: ['Drag and drop', 'Multiple columns', 'Card editing', 'Task persistence']
    }
  };

  // Get source info for the app
  const sourceInfo = $derived(sourceFileMappings[app.id] ?? {
    path: app.plugin?.manifest?.entry ?? 'Unknown',
    relativePath: app.url ?? app.plugin?.manifest?.url ?? 'Not available'
  });

  // Get plugin type info
  const typeInfo = $derived(pluginTypeInfo[app.pluginType as PluginType] ?? pluginTypeInfo.native);

  // Get documentation for the app
  const docs = $derived(appDocs[app.id] ?? {
    description: app.plugin?.manifest?.description ?? `${app.title} application`,
    usage: ['Launch the app from the desktop or taskbar'],
    features: ['Part of Desktop OS plugin system']
  });

  // Current tab state - initialized from prop and can be changed by user
  let currentView = $state<'source' | 'architecture' | 'docs'>('source');

  // Sync with prop when it changes
  $effect(() => {
    currentView = view;
  });

  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalEl && !modalEl.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close
    setTimeout(() => {
      window.addEventListener('keydown', handleKeydown);
      window.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('click', handleClickOutside);
    };
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
  <!-- Modal Container -->
  <div
    bind:this={modalEl}
    class="relative w-full max-w-xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-scale-in"
  >
    <!-- Glass highlight effect -->
    <div class="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>

    <!-- Header -->
    <div class="relative flex items-center gap-4 px-6 py-5 border-b border-white/10">
      <!-- App Icon -->
      <div class="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg">
        <span class="text-3xl">{app.icon}</span>
      </div>

      <!-- App Info -->
      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-semibold text-white truncate">{app.title}</h2>
        <div class="flex items-center gap-2 mt-1">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {typeInfo.bgColor} {typeInfo.color} border">
            {typeInfo.label}
          </span>
          <span class="text-xs text-slate-400">v{app.plugin?.manifest?.version ?? '1.0.0'}</span>
        </div>
      </div>

      <!-- Close Button -->
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        onclick={onClose}
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Tab Navigation -->
    <div class="flex border-b border-white/10">
      <button
        class="flex-1 px-4 py-3 text-sm font-medium transition-colors relative
          {currentView === 'source' ? 'text-desktop-accent' : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => currentView = 'source'}
      >
        Source Code
        {#if currentView === 'source'}
          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-desktop-accent"></div>
        {/if}
      </button>
      <button
        class="flex-1 px-4 py-3 text-sm font-medium transition-colors relative
          {currentView === 'architecture' ? 'text-desktop-accent' : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => currentView = 'architecture'}
      >
        Architecture
        {#if currentView === 'architecture'}
          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-desktop-accent"></div>
        {/if}
      </button>
      <button
        class="flex-1 px-4 py-3 text-sm font-medium transition-colors relative
          {currentView === 'docs' ? 'text-desktop-accent' : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => currentView = 'docs'}
      >
        Documentation
        {#if currentView === 'docs'}
          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-desktop-accent"></div>
        {/if}
      </button>
    </div>

    <!-- Content Area -->
    <div class="relative p-6 max-h-[400px] overflow-y-auto">
      {#if currentView === 'source'}
        <!-- Source Code View -->
        <div class="space-y-4">
          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Source File</h3>
            <div class="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-white/5 group">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <code class="flex-1 text-sm text-emerald-400 font-mono truncate">{sourceInfo.path}</code>
              <button
                class="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                onclick={() => copyToClipboard(sourceInfo.path)}
                title="Copy path"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Import Path</h3>
            <div class="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-white/5 group">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <code class="flex-1 text-sm text-blue-400 font-mono truncate">{sourceInfo.relativePath}</code>
              <button
                class="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                onclick={() => copyToClipboard(sourceInfo.relativePath)}
                title="Copy import path"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Plugin ID</h3>
            <div class="p-3 bg-slate-900/50 rounded-lg border border-white/5">
              <code class="text-sm text-amber-400 font-mono">{app.id}</code>
            </div>
          </div>
        </div>

      {:else if currentView === 'architecture'}
        <!-- Architecture View -->
        <div class="space-y-4">
          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Plugin Type</h3>
            <div class="p-4 bg-slate-900/50 rounded-lg border border-white/5">
              <div class="flex items-center gap-3 mb-3">
                <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium {typeInfo.bgColor} {typeInfo.color} border">
                  {typeInfo.label}
                </span>
                <span class="text-sm text-slate-400">{app.pluginType}</span>
              </div>
              <p class="text-sm text-slate-300">{typeInfo.description}</p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Loading Method</h3>
            <div class="p-4 bg-slate-900/50 rounded-lg border border-white/5">
              <p class="text-sm text-slate-300">{typeInfo.loadingMethod}</p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Dependencies</h3>
            <div class="flex flex-wrap gap-2">
              {#each typeInfo.dependencies as dep}
                <span class="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 rounded-full border border-white/10">
                  {dep}
                </span>
              {/each}
            </div>
          </div>

          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Window Configuration</h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <div class="text-xs text-slate-500 mb-1">Default Size</div>
                <div class="text-sm text-white font-mono">{app.defaultWidth ?? 600} x {app.defaultHeight ?? 400}</div>
              </div>
              <div class="p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <div class="text-xs text-slate-500 mb-1">Min Size</div>
                <div class="text-sm text-white font-mono">{app.minWidth ?? 300} x {app.minHeight ?? 200}</div>
              </div>
              <div class="p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <div class="text-xs text-slate-500 mb-1">Singleton</div>
                <div class="text-sm text-white">{app.singleton ? 'Yes' : 'No'}</div>
              </div>
              <div class="p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <div class="text-xs text-slate-500 mb-1">Resizable</div>
                <div class="text-sm text-white">{app.resizable !== false ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>

      {:else}
        <!-- Documentation View -->
        <div class="space-y-4">
          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Description</h3>
            <p class="text-sm text-slate-300 leading-relaxed">{docs.description}</p>
          </div>

          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">How to Use</h3>
            <ul class="space-y-2">
              {#each docs.usage as item}
                <li class="flex items-start gap-2 text-sm text-slate-300">
                  <span class="text-desktop-accent mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              {/each}
            </ul>
          </div>

          <div>
            <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Features</h3>
            <div class="flex flex-wrap gap-2">
              {#each docs.features as feature}
                <span class="px-2.5 py-1 text-xs font-medium text-slate-300 bg-desktop-accent/20 rounded-full border border-desktop-accent/30">
                  {feature}
                </span>
              {/each}
            </div>
          </div>

          {#if docs.notes}
            <div>
              <h3 class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
              <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p class="text-sm text-amber-200">{docs.notes}</p>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="relative px-6 py-4 border-t border-white/10 bg-slate-900/30">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">Desktop OS Plugin System</span>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-desktop-accent hover:bg-desktop-accent/80 rounded-lg transition-colors"
          onclick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out forwards;
  }

  .animate-scale-in {
    animation: scale-in 0.25s ease-out forwards;
  }
</style>
