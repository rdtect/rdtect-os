<script lang="ts">
  import { onMount } from 'svelte';
  import type { PluginManifest } from '$lib/core/types';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Category mapping
  const categoryMap: Record<string, string> = {
    'about-me': 'Showcase',
    'project-gallery': 'Showcase',
    'blog': 'Showcase',
    'contact': 'Showcase',
    'ai-chat': 'AI Tools',
    'agent-manager': 'AI Tools',
    'prompt-manager': 'AI Tools',
    'terminal': 'Productivity',
    'code-editor': 'Productivity',
    'markdown-editor': 'Productivity',
    'notes': 'Productivity',
    'file-browser': 'Productivity',
    'knowledge-base': 'Productivity',
    'excalidraw': 'Creative',
    'image-filter': 'Creative',
    'github-globe': 'Creative',
    'calculator': 'System',
    'clock': 'System',
    'weather': 'System',
    'system-monitor': 'System',
    'pocketbase-admin': 'System',
    'flappy-bird': 'Games',
    'welcome': 'System',
    'plugin-registry': 'System'
  };

  const allCategories = ['All', 'Showcase', 'AI Tools', 'Productivity', 'Creative', 'System', 'Games'];

  // Load all plugin manifests
  const manifestModules = import.meta.glob<{ default: PluginManifest }>(
    '/plugins/*/manifest.ts',
    { eager: true }
  );

  // Extract manifests
  const allPlugins: PluginManifest[] = Object.values(manifestModules).map(m => m.default);

  // State
  let searchQuery = $state('');
  let selectedCategory = $state('All');
  let isVisible = $state(false);

  // Filtered plugins
  const filteredPlugins = $derived(() => {
    return allPlugins.filter(plugin => {
      const matchesSearch = !searchQuery ||
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plugin.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());

      const pluginCategory = categoryMap[plugin.id] ?? 'System';
      const matchesCategory = selectedCategory === 'All' || pluginCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  });

  function getCategory(pluginId: string): string {
    return categoryMap[pluginId] ?? 'System';
  }

  function launchApp(pluginId: string) {
    window.dispatchEvent(new CustomEvent('plugin:launch', { detail: { pluginId } }));
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'All': '📱',
      'Showcase': '🌟',
      'AI Tools': '🤖',
      'Productivity': '📊',
      'Creative': '🎨',
      'System': '⚙️',
      'Games': '🎮'
    };
    return icons[category] ?? '📦';
  }

  onMount(() => {
    setTimeout(() => {
      isVisible = true;
    }, 50);
  });
</script>

<div class="app-store" class:visible={isVisible}>
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="title">App Store</h1>
        <p class="subtitle">Browse and launch all available apps</p>
      </div>
      <div class="stats">
        <span class="stat-value">{allPlugins.length}</span>
        <span class="stat-label">Apps Available</span>
      </div>
    </div>

    <!-- Search -->
    <div class="search-container">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="Search apps..."
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="search-clear" onclick={() => searchQuery = ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      {/if}
    </div>
  </header>

  <!-- Category Tabs -->
  <div class="category-tabs">
    {#each allCategories as category}
      <button
        class="category-tab"
        class:active={selectedCategory === category}
        onclick={() => selectedCategory = category}
      >
        <span class="tab-icon">{getCategoryIcon(category)}</span>
        <span class="tab-label">{category}</span>
      </button>
    {/each}
  </div>

  <!-- Plugin Grid -->
  <div class="grid-container">
    {#if filteredPlugins().length === 0}
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <h3 class="empty-title">No apps found</h3>
        <p class="empty-text">Try adjusting your search or category filter</p>
      </div>
    {:else}
      <div class="plugin-grid">
        {#each filteredPlugins() as plugin, i}
          <button
            class="plugin-card"
            style="--index: {i}"
            onclick={() => launchApp(plugin.id)}
          >
            <div class="card-header">
              <span class="plugin-icon">{plugin.icon}</span>
              <span class="access-badge" class:free={plugin.access !== 'protected'} class:pro={plugin.access === 'protected'}>
                {plugin.access === 'protected' ? 'Pro' : 'Free'}
              </span>
            </div>
            <div class="card-body">
              <h3 class="plugin-name">{plugin.name}</h3>
              <p class="plugin-description">{plugin.description ?? ''}</p>
            </div>
            <div class="card-footer">
              <span class="plugin-category">{getCategory(plugin.id)}</span>
              <span class="launch-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .app-store {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    opacity: 0;
    transform: translateY(10px);
    transition: all var(--transition-slow) var(--transition-easing);
  }

  .app-store.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .header {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    padding: 20px 24px 16px;
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .title-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #f1f5f9;
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }

  .stats {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #6366f1;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Search */
  .search-container {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 10px 36px 10px 42px;
    background: var(--glass-bg-strong);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-lg);
    color: #f1f5f9;
    font-size: var(--text-base);
    outline: none;
    transition: all var(--transition-normal) var(--transition-easing);
    box-sizing: border-box;
  }

  .search-input::placeholder {
    color: #64748b;
  }

  .search-input:focus {
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .search-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.2);
    border: none;
    border-radius: 50%;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
  }

  .search-clear:hover {
    background: rgba(99, 102, 241, 0.3);
    color: #f1f5f9;
  }

  /* Category Tabs */
  .category-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 24px;
    overflow-x: auto;
    flex-shrink: 0;
    background: rgba(15, 23, 42, 0.5);
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  }

  .category-tabs::-webkit-scrollbar {
    height: 0;
  }

  .category-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--glass-bg-default);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-full);
    color: #94a3b8;
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    white-space: nowrap;
    flex-shrink: 0;
    min-height: 44px;
  }

  .category-tab:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #e2e8f0;
  }

  .category-tab.active {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.5);
    color: #a5b4fc;
  }

  .tab-icon {
    font-size: 0.9rem;
  }

  .tab-label {
    font-size: 0.8rem;
  }

  /* Grid Container */
  .grid-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  .grid-container::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  .grid-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .grid-container::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);
  }

  .grid-container::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  .plugin-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 700px) {
    .plugin-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Plugin Card */
  .plugin-card {
    display: flex;
    flex-direction: column;
    padding: 20px;
    background: var(--glass-bg-default);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: var(--radius-xl);
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    text-align: left;
    animation: fadeInUp 0.35s var(--transition-easing) backwards;
    animation-delay: calc(var(--index) * 0.04s);
  }

  .plugin-card:hover {
    transform: translateY(-3px);
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow:
      0 8px 30px rgba(0, 0, 0, 0.3),
      0 0 15px rgba(99, 102, 241, 0.1);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .plugin-icon {
    font-size: 2.2rem;
    line-height: 1;
  }

  .access-badge {
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .access-badge.free {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .access-badge.pro {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  .card-body {
    flex: 1;
    margin-bottom: 14px;
  }

  .plugin-name {
    margin: 0 0 6px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .plugin-description {
    margin: 0;
    font-size: 0.78rem;
    color: #94a3b8;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid rgba(51, 65, 85, 0.5);
  }

  .plugin-category {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .launch-hint {
    display: flex;
    align-items: center;
    color: #64748b;
    transition: all 0.2s;
  }

  .plugin-card:hover .launch-hint {
    color: #6366f1;
    transform: translateX(3px);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .empty-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #94a3b8;
  }

  .empty-text {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }
</style>
