<script lang="ts">
  import { wm } from './registry.svelte';
  import type { AppDefinition } from './types';
  import { mobile } from '$lib/core/mobile.svelte';
  import { pluginBadges } from './constants';
  import { getAuthState } from '$lib/core/pocketbase';
  import { categoryConfig } from '$lib/core/categories';

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
  let searchInput = $state<HTMLInputElement | null>(null);

  // Group apps by category, sorted by priority, hiding auth-gated categories for guests
  const groupedApps = $derived.by(() => {
    const groups = new Map<string, AppDefinition[]>();
    for (const app of wm.apps) {
      const cat = app.category ?? 'desktop';
      // Hide auth-required categories for unauthenticated users
      const catConfig = categoryConfig[cat as keyof typeof categoryConfig];
      if (catConfig?.requiresAuth && !isAuthenticated) continue;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(app);
    }
    // Sort apps within each group by priority, then sort groups by configured order
    return [...groups.entries()]
      .map(([cat, apps]) => [cat, [...apps].sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50))] as [string, AppDefinition[]])
      .sort(([a], [b]) => (categoryConfig[a as keyof typeof categoryConfig]?.order ?? 99) - (categoryConfig[b as keyof typeof categoryConfig]?.order ?? 99));
  });

  // Filtered apps based on search (includes tags)
  const filteredApps = $derived.by(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return wm.apps.filter(app =>
      app.title.toLowerCase().includes(query) ||
      app.id.toLowerCase().includes(query) ||
      app.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Check if searching
  const isSearching = $derived(searchQuery.trim().length > 0);

  // Auth state
  let isAuthenticated = $derived(getAuthState().isValid);
  let authModel = $derived(getAuthState().model);
  let userInitial = $derived(authModel?.name?.[0]?.toUpperCase() || (isAuthenticated ? '?' : 'G'));
  let userName = $derived(isAuthenticated ? (authModel?.name || authModel?.email || 'User') : 'Guest');

  // Close the menu
  function closeMenu() {
    open = false;
    searchQuery = '';
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
    {mobile.isMobile ? 'inset-0' : 'bottom-[70px] left-1/2 -translate-x-1/2 w-[min(600px,calc(100vw-2rem))] max-h-[min(620px,calc(100vh-100px))]'}">
    <div class="menu-container overflow-hidden flex flex-col {mobile.isMobile ? 'rounded-none h-full' : ''}"
         style="border-radius: {mobile.isMobile ? '0' : 'var(--radius-xl)'}">

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
            class="search-input w-full pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none"
            style="height: 44px; border-radius: var(--radius-lg); font-size: var(--text-sm); font-family: var(--desktop-font-sans);"
          />
          {#if searchQuery}
            <button
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-600 text-slate-300 text-xs flex items-center justify-center hover:bg-slate-500"
              style="transition: background-color var(--transition-fast) var(--transition-easing);"
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
            <h3 class="section-title" style="font-size: var(--text-xs); font-family: var(--desktop-font-sans);">
              Search Results ({filteredApps.length})
            </h3>
            {#if filteredApps.length === 0}
              <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">No apps found</div>
                <div class="empty-state-body">Try a different search term</div>
              </div>
            {:else}
              <div class="space-y-1">
                {#each filteredApps as app (app.id)}
                  {@const badge = pluginBadges[app.pluginType]}
                  <button
                    class="app-list-item w-full flex items-center gap-3 px-3 text-left"
                    style="min-height: 44px; border-radius: var(--radius-md); transition: background-color var(--transition-fast) var(--transition-easing);"
                    onclick={() => openApp(app.id)}
                  >
                    <span class="text-2xl">{app.icon}</span>
                    <div class="flex-1 min-w-0">
                      <div style="font-size: var(--text-sm); font-family: var(--desktop-font-sans);" class="font-medium text-white truncate">{app.title}</div>
                      <div style="font-size: var(--text-xs);" class="text-slate-400 truncate">{app.id}</div>
                    </div>
                    <span class="px-1.5 py-0.5 font-medium rounded {badge?.color} text-white" style="font-size: 9px;">
                      {badge?.label}
                    </span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Grouped Apps by Category -->
          {#each groupedApps as [category, apps] (category)}
            {@const config = categoryConfig[category as keyof typeof categoryConfig]}
            <div class="category-section mb-4">
              <div class="category-header flex items-center gap-2 mb-2 px-1">
                <span class="category-icon" style="font-size: var(--text-sm);">{config?.icon ?? '📦'}</span>
                <h3 class="category-label" style="font-size: var(--text-xs); font-family: var(--desktop-font-sans);">
                  {config?.label ?? category}
                </h3>
                <div class="category-line flex-1 h-px"></div>
                <span class="category-description" style="font-size: var(--text-xs);">{config?.description ?? ''}</span>
              </div>
              <div class="category-grid grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {#each apps as app, index (app.id)}
                  <button
                    class="pinned-app group flex flex-col items-center p-2.5 transition-all"
                    style="border-radius: var(--radius-md); --app-index: {index};"
                    onclick={() => openApp(app.id)}
                    title={app.title}
                  >
                    <div class="relative mb-1.5">
                      <span class="text-2xl group-hover:scale-110 inline-block" style="transition: transform var(--transition-fast) var(--transition-easing);">{app.icon}</span>
                      {#if app.plugin?.manifest?.access === 'protected' && !isAuthenticated}
                        <span class="absolute -bottom-0.5 -right-1 text-[8px] opacity-60">🔒</span>
                      {/if}
                    </div>
                    <span class="text-slate-300 text-center leading-tight truncate w-full group-hover:text-white" style="font-size: 10px; font-family: var(--desktop-font-sans); transition: color var(--transition-fast) var(--transition-easing);">
                      {app.title}
                    </span>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer with Power Options -->
      <div class="footer-section border-t border-white/5 px-5 py-3 flex items-center justify-between">
        <!-- User Profile -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-desktop-accent to-purple-500 flex items-center justify-center text-white font-medium"
               style="font-size: var(--text-sm);">
            {userInitial}
          </div>
          <span style="font-size: var(--text-sm); font-family: var(--desktop-font-sans);" class="text-slate-300">{userName}</span>
        </div>

        <!-- Power Options -->
        <div class="flex items-center gap-1">
          <button class="power-btn w-8 h-8 flex items-center justify-center" style="border-radius: var(--radius-md);" title="Settings">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
          <button class="power-btn w-8 h-8 flex items-center justify-center" style="border-radius: var(--radius-md);" title="Sleep">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.43-8.32-14.96z"/>
            </svg>
          </button>
          <button class="power-btn w-8 h-8 flex items-center justify-center" style="border-radius: var(--radius-md);" title="Shut down">
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
    animation: menu-appear var(--transition-slow) cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
    backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: var(--glass-shadow-lg);
  }

  /* Search Input */
  .search-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: border-color var(--transition-normal) var(--transition-easing),
                background-color var(--transition-normal) var(--transition-easing);
  }

  .search-input:focus {
    border-color: rgba(var(--desktop-accent-rgb), 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  /* Content Area Custom Scrollbar */
  .content-area::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  .content-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .content-area::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);
  }

  .content-area::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  /* Category Header */
  .category-header {
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .category-label {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
  }

  .category-line {
    background: linear-gradient(90deg,
      rgba(148, 163, 184, 0.2) 0%,
      transparent 100%
    );
  }

  .category-description {
    color: #64748b;
    font-weight: 400;
    font-style: italic;
  }

  /* Pinned App Tile */
  .pinned-app {
    background: transparent;
    animation: pinned-appear var(--transition-normal) ease forwards;
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
    transition: background-color var(--transition-fast) var(--transition-easing);
  }

  .power-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .power-btn:hover svg {
    color: white;
  }

  /* Section Title (search results) */
  .section-title {
    position: relative;
    padding-left: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-bottom: 12px;
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

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .start-menu,
    .pinned-app {
      animation: none !important;
      opacity: 1;
    }
  }
</style>
