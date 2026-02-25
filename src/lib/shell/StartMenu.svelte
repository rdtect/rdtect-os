<script lang="ts">
  import { wm } from './registry.svelte';
  import type { AppDefinition } from './types';
  import { mobile } from '$lib/core/mobile.svelte';
  import { pluginBadges } from './constants';
  import { getAuthState } from '$lib/core/pocketbase';

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
  let showAllApps = $state(false);

  // Pinned apps (first 8-12 apps for quick access)
  const pinnedApps = $derived(() => {
    return wm.apps.slice(0, 12);
  });

  // All apps sorted alphabetically
  const allApps = $derived(() => {
    return [...wm.apps].sort((a, b) => a.title.localeCompare(b.title));
  });

  // Filtered apps based on search
  const filteredApps = $derived(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return wm.apps.filter(app =>
      app.title.toLowerCase().includes(query) ||
      app.id.toLowerCase().includes(query)
    );
  });

  // Check if searching
  const isSearching = $derived(searchQuery.trim().length > 0);

  // Auth state
  let isAuthenticated = $derived(getAuthState().isValid);
  let authModel = $derived(getAuthState().model);
  let userInitial = $derived(authModel?.name?.[0]?.toUpperCase() || (isAuthenticated ? '?' : 'G'));
  let userName = $derived(isAuthenticated ? (authModel?.name || authModel?.email || 'User') : 'Guest');

  // Recent apps (last opened - mock for now)
  const recentApps = $derived(() => {
    // Get apps that have open windows, or fallback to first 4
    const runningAppIds = new Set(wm.windows.map(w => w.appId));
    const recent = wm.apps.filter(app => runningAppIds.has(app.id));
    return recent.length > 0 ? recent.slice(0, 4) : wm.apps.slice(0, 4);
  });

  // Close the menu
  function closeMenu() {
    open = false;
    searchQuery = '';
    showAllApps = false;
    onClose?.();
  }

  // Handle app click
  function openApp(appId: string) {
    wm.openWindow(appId);
    closeMenu();
  }

  // Handle keyboard events
  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      closeMenu();
    }
  }

  // Handle overlay click
  function handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('start-menu-overlay')) {
      closeMenu();
    }
  }

  // Focus search input when opened
  $effect(() => {
    if (open && searchInput) {
      setTimeout(() => searchInput?.focus(), 100);
    }
  });

  // Reset state when closed
  $effect(() => {
    if (!open) {
      searchQuery = '';
      showAllApps = false;
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Overlay to catch clicks outside -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="start-menu-overlay fixed inset-0 z-[9998]" onclick={handleOverlayClick}></div>

  <!-- Start Menu Panel -->
  <div class="start-menu fixed z-[9999]
    {mobile.isMobile ? 'inset-0' : 'bottom-[70px] left-1/2 -translate-x-1/2 w-[600px] max-h-[620px]'}">
    <div class="menu-container overflow-hidden flex flex-col {mobile.isMobile ? 'rounded-none h-full' : 'rounded-xl'}">

      <!-- Search Bar -->
      <div class="search-section px-5 pt-5 pb-3">
        <div class="search-box relative">
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            bind:this={searchInput}
            bind:value={searchQuery}
            type="text"
            placeholder="Type to search apps..."
            class="search-input w-full h-10 pl-10 pr-4 rounded-lg text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          {#if searchQuery}
            <button
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-600 text-slate-300 text-xs flex items-center justify-center hover:bg-slate-500 transition-colors"
              onclick={() => searchQuery = ''}
            >
              x
            </button>
          {/if}
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="content-area flex-1 overflow-y-auto px-5 pb-4">
        {#if isSearching}
          <!-- Search Results -->
          <div class="search-results">
            <h3 class="section-title text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Search Results ({filteredApps().length})
            </h3>
            {#if filteredApps().length === 0}
              <div class="text-center py-8 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm">No apps found</p>
              </div>
            {:else}
              <div class="space-y-1">
                {#each filteredApps() as app (app.id)}
                  {@const badge = pluginBadges[app.pluginType]}
                  <button
                    class="app-list-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    onclick={() => openApp(app.id)}
                  >
                    <span class="text-2xl">{app.icon}</span>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-white truncate">{app.title}</div>
                      <div class="text-xs text-slate-400 truncate">{app.id}</div>
                    </div>
                    <span class="px-1.5 py-0.5 text-[9px] font-medium rounded {badge?.color} text-white">
                      {badge?.label}
                    </span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {:else if showAllApps}
          <!-- All Apps List -->
          <div class="all-apps">
            <div class="flex items-center justify-between mb-3">
              <h3 class="section-title text-xs font-semibold uppercase tracking-wider text-slate-400">
                All Apps
              </h3>
              <button
                class="text-xs text-desktop-accent hover:text-desktop-accent/80 transition-colors"
                onclick={() => showAllApps = false}
              >
                Back to Pinned
              </button>
            </div>
            <div class="space-y-0.5 max-h-[400px] overflow-y-auto">
              {#each allApps() as app (app.id)}
                {@const badge = pluginBadges[app.pluginType]}
                <button
                  class="app-list-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                  onclick={() => openApp(app.id)}
                >
                  <span class="text-xl">{app.icon}</span>
                  <span class="text-sm text-white flex-1 truncate">{app.title}</span>
                  <span class="px-1.5 py-0.5 text-[9px] font-medium rounded {badge?.color} text-white opacity-70">
                    {badge?.label}
                  </span>
                </button>
              {/each}
            </div>
          </div>
        {:else}
          <!-- Pinned Apps Section -->
          <div class="pinned-section mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="section-title text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pinned
              </h3>
              <button
                class="text-xs text-desktop-accent hover:text-desktop-accent/80 transition-colors flex items-center gap-1"
                onclick={() => showAllApps = true}
              >
                All apps
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
            <div class="pinned-grid grid grid-cols-4 sm:grid-cols-6 gap-2">
              {#each pinnedApps() as app, index (app.id)}
                {@const badge = pluginBadges[app.pluginType]}
                <button
                  class="pinned-app group flex flex-col items-center p-3 rounded-lg transition-all"
                  style="--app-index: {index}"
                  onclick={() => openApp(app.id)}
                  title="{app.title} ({badge?.label})"
                >
                  <div class="relative mb-2">
                    <span class="text-3xl group-hover:scale-110 transition-transform duration-150 inline-block">{app.icon}</span>
                    <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full {badge?.color} opacity-80"></span>
                  </div>
                  <span class="text-[11px] text-slate-300 text-center leading-tight truncate w-full group-hover:text-white transition-colors">
                    {app.title}
                  </span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Recommended / Recent Section -->
          <div class="recommended-section">
            <h3 class="section-title text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Recommended
            </h3>
            <div class="space-y-1">
              {#each recentApps() as app (app.id)}
                {@const badge = pluginBadges[app.pluginType]}
                <button
                  class="app-list-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                  onclick={() => openApp(app.id)}
                >
                  <span class="text-xl">{app.icon}</span>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-white truncate">{app.title}</div>
                    <div class="text-[11px] text-slate-500">Recently used</div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer with Power Options -->
      <div class="footer-section border-t border-white/5 px-5 py-3 flex items-center justify-between">
        <!-- User Profile -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-desktop-accent to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {userInitial}
          </div>
          <span class="text-sm text-slate-300">{userName}</span>
        </div>

        <!-- Power Options -->
        <div class="flex items-center gap-1">
          <button class="power-btn w-8 h-8 flex items-center justify-center rounded-lg" title="Settings">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
          <button class="power-btn w-8 h-8 flex items-center justify-center rounded-lg" title="Sleep">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.43-8.32-14.96z"/>
            </svg>
          </button>
          <button class="power-btn w-8 h-8 flex items-center justify-center rounded-lg" title="Shut down">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Overlay - transparent */
  .start-menu-overlay {
    background: transparent;
  }

  /* Start Menu Container */
  .start-menu {
    animation: menu-appear 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes menu-appear {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(12px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }

  /* Menu Container Glass Effect */
  .menu-container {
    background: linear-gradient(180deg,
      rgba(30, 41, 59, 0.95) 0%,
      rgba(15, 23, 42, 0.98) 100%
    );
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 24px 48px rgba(0, 0, 0, 0.5),
      0 8px 24px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Search Input */
  .search-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }

  .search-input:focus {
    border-color: rgba(var(--desktop-accent-rgb), 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  /* Content Area Custom Scrollbar */
  .content-area::-webkit-scrollbar {
    width: 6px;
  }

  .content-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .content-area::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .content-area::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Pinned App Tile */
  .pinned-app {
    background: transparent;
    animation: pinned-appear 0.2s ease forwards;
    animation-delay: calc(var(--app-index, 0) * 0.02s);
    opacity: 0;
  }

  @keyframes pinned-appear {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .pinned-app:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .pinned-app:active {
    background: rgba(255, 255, 255, 0.05);
    transform: scale(0.95);
  }

  /* App List Item */
  .app-list-item {
    background: transparent;
  }

  .app-list-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .app-list-item:active {
    background: rgba(255, 255, 255, 0.05);
  }

  /* Power Button */
  .power-btn {
    transition: background-color 0.15s ease;
  }

  .power-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .power-btn:hover svg {
    color: white;
  }

  /* Section Title */
  .section-title {
    position: relative;
    padding-left: 8px;
  }

  .section-title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 10px;
    background: linear-gradient(180deg, rgb(var(--desktop-accent-rgb)), rgb(139, 92, 246));
    border-radius: 1px;
    opacity: 0.8;
  }
</style>
