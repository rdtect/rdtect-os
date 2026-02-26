<script lang="ts">
  import { onMount } from 'svelte';
  import type { PluginManifest } from '$lib/core/types';
  import { wm } from '$lib/shell';
  import { availableApps, sourceColors, type StoreApp } from './store-data';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Load all plugin manifests for "Installed" tab
  const manifestModules = import.meta.glob<{ default: PluginManifest }>(
    '/plugins/*/manifest.ts',
    { eager: true }
  );
  const installedApps: PluginManifest[] = Object.values(manifestModules).map(m => m.default);

  type TabId = 'installed' | 'available';
  const categories = ['All', 'Showcase', 'Studio', 'Creative', 'Games', 'Desktop', 'Admin'];

  let activeTab = $state<TabId>('installed');
  let searchQuery = $state('');
  let selectedCategory = $state('All');
  let isVisible = $state(false);

  const categoryFromManifest = (cat?: string): string => {
    if (!cat) return 'Desktop';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const filteredInstalled = $derived(
    installedApps.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const cat = categoryFromManifest(p.category);
      const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
      return matchesSearch && matchesCat;
    })
  );

  const filteredAvailable = $derived(
    availableApps.filter(a => {
      const matchesSearch = !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const cat = categoryFromManifest(a.category);
      const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
      return matchesSearch && matchesCat;
    })
  );

  function openApp(pluginId: string) {
    wm.openWindow(pluginId);
  }

  function openGithub(url: string) {
    window.open(url, '_blank', 'noopener');
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      All: '📱', Showcase: '🌟', Studio: '🛠️', Creative: '🎨',
      Games: '🎮', Desktop: '⚙️', Admin: '🔒',
    };
    return icons[category] ?? '📦';
  }

  onMount(() => {
    setTimeout(() => { isVisible = true; }, 50);
  });
</script>

<div class="store" class:visible={isVisible}>
  <!-- Header -->
  <header class="header">
    <div class="header-top">
      <div class="title-area">
        <h1 class="title">App Store</h1>
        <p class="subtitle">Discover and launch applications</p>
      </div>
      <div class="stats-area">
        <span class="stat-num">{installedApps.length}</span>
        <span class="stat-lbl">Installed</span>
      </div>
    </div>

    <!-- Search -->
    <div class="search-wrap">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input type="text" class="search-input" placeholder="Search apps..." bind:value={searchQuery} />
      {#if searchQuery}
        <button class="search-clear" onclick={() => searchQuery = ''}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      {/if}
    </div>
  </header>

  <!-- Tabs -->
  <div class="tab-row">
    <div class="tabs">
      <button class="tab" class:active={activeTab === 'installed'} onclick={() => activeTab = 'installed'}>
        Installed ({installedApps.length})
      </button>
      <button class="tab" class:active={activeTab === 'available'} onclick={() => activeTab = 'available'}>
        Available ({availableApps.length})
      </button>
    </div>
    <div class="cat-chips">
      {#each categories as cat}
        <button class="chip" class:active={selectedCategory === cat} onclick={() => selectedCategory = cat}>
          <span class="chip-icon">{getCategoryIcon(cat)}</span>
          <span class="chip-label">{cat}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    {#if activeTab === 'installed'}
      {#if filteredInstalled.length === 0}
        <div class="empty">
          <span class="empty-icon">🔍</span>
          <p class="empty-text">No installed apps match your filters</p>
        </div>
      {:else}
        <div class="grid">
          {#each filteredInstalled as plugin, i}
            <button class="card" style="--i:{i}" onclick={() => openApp(plugin.id)}>
              <div class="card-top">
                <span class="card-icon">{plugin.icon}</span>
                <span class="badge free">Installed</span>
              </div>
              <div class="card-mid">
                <h3 class="card-name">{plugin.name}</h3>
                <p class="card-desc">{plugin.description ?? ''}</p>
              </div>
              <div class="card-bot">
                <span class="card-cat">{categoryFromManifest(plugin.category)}</span>
                <span class="open-hint">Open →</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      {#if filteredAvailable.length === 0}
        <div class="empty">
          <span class="empty-icon">🔍</span>
          <p class="empty-text">No available apps match your filters</p>
        </div>
      {:else}
        <div class="grid">
          {#each filteredAvailable as app, i}
            <button class="card available" style="--i:{i}" onclick={() => openGithub(app.githubUrl)}>
              <div class="card-top">
                <span class="card-icon">{app.icon}</span>
                <span
                  class="badge source"
                  style="background:{sourceColors[app.source].bg};color:{sourceColors[app.source].text};border-color:{sourceColors[app.source].border}"
                >
                  {app.source}
                </span>
              </div>
              <div class="card-mid">
                <h3 class="card-name">{app.name}</h3>
                <p class="card-desc">{app.description}</p>
                <div class="tech-chips">
                  {#each app.techStack as tech}
                    <span class="tech-chip">{tech}</span>
                  {/each}
                </div>
              </div>
              <div class="card-bot">
                <span class="card-cat">{categoryFromManifest(app.category)}</span>
                <span class="open-hint">GitHub →</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .store {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    opacity: 0;
    transform: translateY(8px);
    transition: all var(--transition-slow) var(--transition-easing);
  }
  .store.visible { opacity: 1; transform: translateY(0); }

  /* Header */
  .header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.12);
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
    flex-shrink: 0;
  }
  .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .title-area { display: flex; flex-direction: column; gap: 2px; }
  .title { margin: 0; font-size: var(--text-xl); font-weight: 600; color: #f1f5f9; }
  .subtitle { margin: 0; font-size: var(--text-sm); color: #64748b; }
  .stats-area { display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .stat-num { font-size: var(--text-lg); font-weight: 700; color: #6366f1; }
  .stat-lbl { font-size: var(--text-xs); color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Search */
  .search-wrap { position: relative; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
  .search-input {
    width: 100%; padding: 8px 32px 8px 36px;
    background: var(--glass-bg-strong); border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-lg); color: #f1f5f9; font-size: var(--text-sm);
    outline: none; box-sizing: border-box;
    transition: border-color var(--transition-normal) var(--transition-easing);
  }
  .search-input::placeholder { color: #64748b; }
  .search-input:focus { border-color: rgba(99, 102, 241, 0.5); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
  .search-clear {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
    background: rgba(99, 102, 241, 0.2); border: none; border-radius: 50%;
    color: #94a3b8; cursor: pointer;
  }
  .search-clear:hover { background: rgba(99, 102, 241, 0.3); color: #f1f5f9; }

  /* Tabs + Category */
  .tab-row {
    display: flex; flex-direction: column; gap: 8px;
    padding: 10px 20px; border-bottom: 1px solid rgba(99, 102, 241, 0.08);
    background: rgba(15, 23, 42, 0.5); flex-shrink: 0;
  }
  .tabs { display: flex; gap: 4px; }
  .tab {
    padding: 6px 16px; background: transparent; border: 1px solid transparent;
    border-radius: var(--radius-md); color: #94a3b8; font-size: var(--text-sm);
    font-weight: 500; cursor: pointer; transition: all var(--transition-normal) var(--transition-easing);
  }
  .tab:hover { color: #e2e8f0; background: rgba(99, 102, 241, 0.08); }
  .tab.active { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #a5b4fc; }

  .cat-chips { display: flex; gap: 6px; overflow-x: auto; }
  .cat-chips::-webkit-scrollbar { height: 0; }
  .chip {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; background: transparent; border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-full); color: #94a3b8; font-size: var(--text-xs);
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: all var(--transition-normal) var(--transition-easing);
  }
  .chip:hover { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.25); color: #e2e8f0; }
  .chip.active { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #a5b4fc; }
  .chip-icon { font-size: 0.75rem; }
  .chip-label { font-size: 0.7rem; }

  /* Content */
  .content { flex: 1; overflow-y: auto; padding: 16px 20px; }
  .content::-webkit-scrollbar { width: var(--scrollbar-width); }
  .content::-webkit-scrollbar-track { background: transparent; }
  .content::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }
  .content::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  @media (max-width: 680px) { .grid { grid-template-columns: repeat(2, 1fr); } }

  /* Card */
  .card {
    display: flex; flex-direction: column; padding: 16px;
    background: var(--glass-bg-default); border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: var(--radius-xl); cursor: pointer; text-align: left;
    transition: all var(--transition-normal) var(--transition-easing);
    animation: fadeUp 0.3s var(--transition-easing) backwards;
    animation-delay: calc(var(--i) * 0.03s);
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 12px rgba(99, 102, 241, 0.08);
  }
  .card.available { border-color: rgba(51, 65, 85, 0.4); }
  .card.available:hover { border-color: rgba(245, 158, 11, 0.3); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .card-icon { font-size: 2rem; line-height: 1; }
  .badge {
    padding: 2px 8px; border-radius: 8px; font-size: 0.6rem;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .badge.free { background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
  .badge.source { border: 1px solid; }

  .card-mid { flex: 1; margin-bottom: 10px; }
  .card-name { margin: 0 0 4px; font-size: 0.9rem; font-weight: 600; color: #f1f5f9; }
  .card-desc {
    margin: 0; font-size: 0.75rem; color: #94a3b8; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .tech-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .tech-chip {
    padding: 1px 6px; font-size: 0.6rem; color: #64748b;
    background: rgba(51, 65, 85, 0.5); border-radius: 4px;
  }

  .card-bot {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 10px; border-top: 1px solid rgba(51, 65, 85, 0.4);
  }
  .card-cat { font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .open-hint { font-size: 0.7rem; color: #64748b; transition: all 0.2s; }
  .card:hover .open-hint { color: #6366f1; }

  /* Empty */
  .empty { display: flex; flex-direction: column; align-items: center; padding: 48px 20px; gap: 8px; }
  .empty-icon { font-size: 2.5rem; opacity: 0.5; }
  .empty-text { font-size: var(--text-sm); color: #64748b; }
</style>
