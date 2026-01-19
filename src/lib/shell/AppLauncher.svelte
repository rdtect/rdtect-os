<script lang="ts">
  import { wm } from './registry.svelte';
  import type { AppDefinition } from './types';

  // Props
  let {
    open = $bindable(false),
    onClose,
  }: {
    open: boolean;
    onClose?: () => void;
  } = $props();

  // Search state
  let searchQuery = $state('');
  let searchInput: HTMLInputElement;

  // Category definitions
  const categories: Record<string, { label: string; apps: string[] }> = {
    productivity: {
      label: 'Productivity',
      apps: ['calculator', 'notes', 'markdown-editor', 'kanban-board', 'todo-app'],
    },
    utilities: {
      label: 'Utilities',
      apps: ['terminal', 'file-browser', 'weather', 'clock', 'alarm-clock', 'settings'],
    },
    games: {
      label: 'Games',
      apps: ['flappy-bird', 'solitaire', 'tic-tac-toe'],
    },
    media: {
      label: 'Media',
      apps: ['image-filter'],
    },
    ai: {
      label: 'AI / Cloud',
      apps: ['ai-chat', 'prompt-manager', 'system-monitor'],
    },
  };

  // Plugin type badge colors and labels
  const pluginTypeBadges: Record<string, { color: string; label: string }> = {
    native: { color: 'bg-emerald-500/80', label: 'Native' },
    webcomponent: { color: 'bg-blue-500/80', label: 'WebComp' },
    iframe: { color: 'bg-amber-500/80', label: 'iFrame' },
    federation: { color: 'bg-purple-500/80', label: 'Remote' },
    wasm: { color: 'bg-rose-500/80', label: 'WASM' },
  };

  // Get apps grouped by category, filtered by search
  const filteredCategories = $derived.by(() => {
    const query = searchQuery.toLowerCase().trim();
    const result: { label: string; apps: AppDefinition[] }[] = [];

    for (const [, category] of Object.entries(categories)) {
      const categoryApps: AppDefinition[] = [];

      for (const appId of category.apps) {
        const app = wm.apps.find(a => a.id === appId);
        if (app) {
          // Apply search filter
          if (query === '' ||
              app.title.toLowerCase().includes(query) ||
              app.id.toLowerCase().includes(query)) {
            categoryApps.push(app);
          }
        }
      }

      if (categoryApps.length > 0) {
        result.push({ label: category.label, apps: categoryApps });
      }
    }

    // Also include any apps not in predefined categories (as "Other")
    const allCategorizedIds = Object.values(categories).flatMap(c => c.apps);
    const uncategorizedApps = wm.apps.filter(app => {
      const inCategory = allCategorizedIds.includes(app.id);
      const matchesSearch = query === '' ||
        app.title.toLowerCase().includes(query) ||
        app.id.toLowerCase().includes(query);
      return !inCategory && matchesSearch;
    });

    if (uncategorizedApps.length > 0) {
      result.push({ label: 'Other', apps: uncategorizedApps });
    }

    return result;
  });

  // Total number of filtered apps
  const totalFilteredApps = $derived(
    filteredCategories.reduce((sum, cat) => sum + cat.apps.length, 0)
  );

  // Close the launcher
  function closeLauncher() {
    open = false;
    searchQuery = '';
    onClose?.();
  }

  // Handle app click
  function openApp(appId: string) {
    wm.openWindow(appId);
    closeLauncher();
  }

  // Handle keyboard events
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeLauncher();
    }
  }

  // Handle overlay click (close if clicking backdrop)
  function handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('launcher-overlay')) {
      closeLauncher();
    }
  }

  // Focus search input when opened
  $effect(() => {
    if (open && searchInput) {
      // Small delay to allow animation
      setTimeout(() => searchInput?.focus(), 100);
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="launcher-overlay fixed inset-0 z-[9999] flex flex-col items-center"
    onclick={handleOverlayClick}
  >
    <!-- Search Container -->
    <div class="search-container w-full max-w-2xl px-6 pt-16 pb-8">
      <div class="search-box relative">
        <div class="search-icon absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          bind:this={searchInput}
          bind:value={searchQuery}
          type="text"
          placeholder="Search applications..."
          class="search-input w-full h-14 pl-12 pr-6 rounded-2xl text-lg text-slate-100 placeholder-slate-500 outline-none"
        />
        {#if searchQuery}
          <button
            class="clear-button absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-600 text-slate-300 text-xs flex items-center justify-center"
            onclick={() => searchQuery = ''}
          >
            x
          </button>
        {/if}
      </div>

      <!-- Search results count -->
      {#if searchQuery}
        <p class="results-count mt-3 text-sm text-slate-400 text-center">
          {totalFilteredApps} {totalFilteredApps === 1 ? 'app' : 'apps'} found
        </p>
      {/if}
    </div>

    <!-- Apps Grid Container -->
    <div class="apps-container flex-1 w-full max-w-5xl overflow-y-auto px-8 pb-16">
      {#if filteredCategories.length === 0}
        <div class="empty-state flex flex-col items-center justify-center h-64 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg">No applications found</p>
          <p class="text-sm mt-1">Try a different search term</p>
        </div>
      {:else}
        {#each filteredCategories as category, categoryIndex}
          <div class="category-section mb-8" style="--category-index: {categoryIndex}">
            <!-- Category Header -->
            <h2 class="category-header text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 px-2">
              {category.label}
            </h2>

            <!-- Apps Grid -->
            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
              {#each category.apps as app, appIndex (app.id)}
                <button
                  class="app-tile group flex flex-col items-center p-4 rounded-2xl cursor-pointer border border-transparent"
                  style="--app-index: {appIndex}"
                  onclick={() => openApp(app.id)}
                  title={app.title}
                >
                  <!-- Icon Container -->
                  <div class="app-icon-container relative w-16 h-16 flex items-center justify-center rounded-2xl mb-3">
                    <span class="app-icon text-4xl">{app.icon}</span>

                    <!-- Plugin Type Badge -->
                    {#if app.pluginType}
                      {@const badge = pluginTypeBadges[app.pluginType]}
                      <span class="app-badge absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-medium rounded-md {badge?.color || 'bg-slate-500/80'} text-white">
                        {badge?.label || app.pluginType}
                      </span>
                    {/if}
                  </div>

                  <!-- App Name -->
                  <span class="app-name text-xs text-slate-300 text-center leading-tight max-w-full truncate">
                    {app.title}
                  </span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Close hint -->
    <div class="close-hint absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 text-xs flex items-center gap-2">
      <kbd class="kbd-key px-2 py-1 rounded text-slate-400">Esc</kbd>
      <span>to close</span>
    </div>
  </div>
{/if}

<style>
  /* Launcher Overlay - Enhanced Glass Background */
  .launcher-overlay {
    background: linear-gradient(180deg,
      rgba(0, 0, 0, 0.65) 0%,
      rgba(0, 0, 0, 0.55) 50%,
      rgba(0, 0, 0, 0.7) 100%
    );
    backdrop-filter: blur(32px) saturate(150%);
    -webkit-backdrop-filter: blur(32px) saturate(150%);
    animation: overlay-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes overlay-fade-in {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(32px) saturate(150%);
    }
  }

  /* Search Container Animation */
  .search-container {
    animation: slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Search Box Glass Styling */
  .search-box {
    position: relative;
  }

  .search-input {
    background: linear-gradient(180deg,
      rgba(30, 41, 59, 0.92) 0%,
      rgba(15, 23, 42, 0.88) 100%
    );
    border: 1px solid rgba(99, 102, 241, 0.3);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.05);
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.2s ease;
  }

  .search-input:focus {
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 0 3px rgba(99, 102, 241, 0.15),
      0 0 30px rgba(99, 102, 241, 0.1),
      inset 0 1px 1px rgba(255, 255, 255, 0.05);
    transform: scale(1.01);
  }

  .search-icon {
    transition: color 0.2s ease;
  }

  .search-input:focus + .search-icon,
  .search-box:focus-within .search-icon {
    color: rgb(99, 102, 241);
  }

  /* Clear Button */
  .clear-button {
    transition:
      background-color 0.15s ease,
      transform 0.15s ease;
  }

  .clear-button:hover {
    background-color: rgb(71, 85, 105);
    transform: translateY(-50%) scale(1.1);
  }

  .clear-button:active {
    transform: translateY(-50%) scale(0.95);
  }

  /* Results Count Animation */
  .results-count {
    animation: fade-in 0.2s ease forwards;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Apps Container Animation */
  .apps-container {
    animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.1s;
    opacity: 0;
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Custom Scrollbar */
  .apps-container::-webkit-scrollbar {
    width: 8px;
  }

  .apps-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .apps-container::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.2);
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  .apps-container::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.35);
  }

  /* Category Section Stagger Animation */
  .category-section {
    animation: category-appear 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: calc(0.15s + var(--category-index, 0) * 0.08s);
    opacity: 0;
  }

  @keyframes category-appear {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Category Header */
  .category-header {
    transition: color 0.2s ease;
    position: relative;
    padding-left: 12px;
  }

  .category-header::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 12px;
    background: linear-gradient(180deg, rgb(99, 102, 241), rgb(139, 92, 246));
    border-radius: 2px;
    opacity: 0.7;
  }

  /* App Tile - Enhanced */
  .app-tile {
    background-color: transparent;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.25s ease;
    animation: tile-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: calc(0.2s + var(--app-index, 0) * 0.03s);
    opacity: 0;
    will-change: transform;
  }

  @keyframes tile-appear {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .app-tile:hover {
    background-color: rgba(30, 41, 59, 0.8);
    border-color: rgba(99, 102, 241, 0.25);
    transform: scale(1.08) translateY(-4px);
    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(99, 102, 241, 0.15);
  }

  .app-tile:active {
    transform: scale(0.98);
    transition-duration: 0.1s;
  }

  .app-tile:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  /* App Icon Container */
  .app-icon-container {
    background: linear-gradient(135deg,
      rgba(51, 65, 85, 0.6) 0%,
      rgba(30, 41, 59, 0.8) 100%
    );
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.08);
    transition:
      background 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.2s ease;
  }

  .app-tile:hover .app-icon-container {
    background: linear-gradient(135deg,
      rgba(99, 102, 241, 0.35) 0%,
      rgba(139, 92, 246, 0.25) 100%
    );
    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(99, 102, 241, 0.2),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }

  /* App Icon */
  .app-icon {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    transition: transform 0.2s ease;
  }

  .app-tile:hover .app-icon {
    transform: scale(1.1);
  }

  /* App Badge */
  .app-badge {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s ease;
  }

  .app-tile:hover .app-badge {
    transform: scale(1.05);
  }

  /* App Name */
  .app-name {
    transition: color 0.2s ease;
  }

  .app-tile:hover .app-name {
    color: rgb(241, 245, 249);
  }

  /* Empty State */
  .empty-state {
    animation: fade-in 0.3s ease forwards;
    animation-delay: 0.2s;
    opacity: 0;
  }

  /* Close Hint */
  .close-hint {
    animation: hint-appear 0.4s ease forwards;
    animation-delay: 0.5s;
    opacity: 0;
  }

  @keyframes hint-appear {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  /* Keyboard Key Styling */
  .kbd-key {
    background: linear-gradient(180deg,
      rgba(51, 65, 85, 0.6) 0%,
      rgba(30, 41, 59, 0.8) 100%
    );
    border: 1px solid rgba(71, 85, 105, 0.5);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    font-family: ui-monospace, monospace;
    transition: transform 0.15s ease;
  }

  .close-hint:hover .kbd-key {
    transform: scale(1.05);
  }
</style>
