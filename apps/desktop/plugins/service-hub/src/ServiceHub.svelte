<script lang="ts">
  import { onMount } from 'svelte';
  import { wm } from '$lib/shell';
  import { services, groupConfig, type VpsService } from './services-data';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Search + filter state
  let searchQuery = $state('');
  let activeGroup = $state<string>('all');
  let isVisible = $state(false);

  // Service status: 'unknown' | 'online' | 'offline'
  let statusMap = $state<Record<string, 'unknown' | 'online' | 'offline'>>({});

  const groups = ['all', ...Object.keys(groupConfig)];

  const filteredServices = $derived(
    services.filter(s => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesGroup = activeGroup === 'all' || s.group === activeGroup;
      return matchesSearch && matchesGroup;
    })
  );

  // Group the filtered services by group
  const groupedServices = $derived(() => {
    const map = new Map<string, VpsService[]>();
    for (const s of filteredServices) {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    }
    return map;
  });

  // Groups that have visible services (in display order)
  const visibleGroups = $derived(
    Object.keys(groupConfig).filter(g => (groupedServices().get(g)?.length ?? 0) > 0)
  );

  async function checkStatus(service: VpsService) {
    try {
      const res = await fetch(service.url, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(4000) });
      // no-cors always returns opaque response — if it resolves, service is reachable
      statusMap = { ...statusMap, [service.id]: 'online' };
    } catch {
      statusMap = { ...statusMap, [service.id]: 'offline' };
    }
  }

  function openInWindow(service: VpsService) {
    const appId = `vps-${service.id}`;

    // Register if not already registered
    if (!wm.getApp(appId)) {
      wm.registerApp({
        id: appId,
        title: service.name,
        icon: service.icon,
        pluginType: 'iframe',
        plugin: {
          manifest: {
            id: appId,
            name: service.name,
            version: '1.0.0',
            type: 'iframe',
            icon: service.icon,
            description: service.description,
            url: service.url,
          },
          type: 'iframe',
          render: { kind: 'iframe', url: service.url, sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups' },
        },
        defaultWidth: 1024,
        defaultHeight: 700,
        minWidth: 600,
        minHeight: 450,
        resizable: true,
        singleton: false,
      });
    }

    wm.openWindow(appId);
  }

  function openExternal(service: VpsService) {
    window.open(service.url, '_blank', 'noopener,noreferrer');
  }

  onMount(() => {
    setTimeout(() => { isVisible = true; }, 50);
    // Check all service statuses in parallel
    services.forEach(s => checkStatus(s));
  });
</script>

<div class="hub" class:visible={isVisible}>
  <!-- Header -->
  <header class="hub-header">
    <div class="header-left">
      <span class="hub-icon">🖧</span>
      <div>
        <h1 class="hub-title">Service Hub</h1>
        <p class="hub-sub">{services.length} self-hosted services</p>
      </div>
    </div>

    <!-- Search -->
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input
        class="search-input"
        type="text"
        placeholder="Search services…"
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="clear-btn" onclick={() => { searchQuery = ''; }}>✕</button>
      {/if}
    </div>
  </header>

  <!-- Group filter chips -->
  <div class="group-chips">
    {#each groups as group}
      {@const cfg = group === 'all' ? { label: 'All', icon: '🌐', color: '#6366f1' } : groupConfig[group]}
      <button
        class="chip"
        class:active={activeGroup === group}
        style="--chip-color: {cfg.color}"
        onclick={() => { activeGroup = group; }}
      >
        <span>{cfg.icon}</span>
        <span>{cfg.label}</span>
      </button>
    {/each}
  </div>

  <!-- Service grid -->
  <div class="content">
    {#if filteredServices.length === 0}
      <div class="empty">
        <span class="empty-icon">🔍</span>
        <p>No services match your search</p>
      </div>
    {:else}
      {#each visibleGroups as group}
        {@const cfg = groupConfig[group]}
        {@const groupServices = groupedServices().get(group) ?? []}
        <section class="group-section">
          <div class="group-header" style="--group-color: {cfg.color}">
            <span class="group-icon">{cfg.icon}</span>
            <span class="group-label">{cfg.label}</span>
            <span class="group-count">{groupServices.length}</span>
          </div>

          <div class="cards-grid">
            {#each groupServices as service}
              {@const status = statusMap[service.id] ?? 'unknown'}
              <div class="card">
                <div class="card-top">
                  <span class="card-icon">{service.icon}</span>
                  <div class="card-meta">
                    <span class="card-name">{service.name}</span>
                    <div class="status-row">
                      <span
                        class="status-dot"
                        class:online={status === 'online'}
                        class:offline={status === 'offline'}
                        title={status === 'online' ? 'Reachable' : status === 'offline' ? 'Unreachable' : 'Checking…'}
                      ></span>
                      <span class="status-label">{status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Unknown'}</span>
                    </div>
                  </div>
                  <!-- External link -->
                  <button
                    class="ext-btn"
                    title="Open in browser tab"
                    onclick={() => openExternal(service)}
                  >
                    ↗
                  </button>
                </div>

                <p class="card-desc">{service.description}</p>

                <div class="card-tags">
                  {#each service.tags as tag}
                    <span class="tag">{tag}</span>
                  {/each}
                </div>

                <button class="open-btn" onclick={() => openInWindow(service)}>
                  Open
                </button>
              </div>
            {/each}
          </div>
        </section>
      {/each}
    {/if}
  </div>
</div>

<style>
  .hub {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--glass-bg-subtle, rgba(15, 23, 42, 0.95));
    color: #e2e8f0;
    font-family: var(--desktop-font-sans);
    opacity: 0;
    transform: translateY(6px);
    transition: opacity var(--transition-slow, 300ms) var(--transition-easing),
                transform var(--transition-slow, 300ms) var(--transition-easing);
    overflow: hidden;
  }

  .hub.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Header ── */
  .hub-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.12);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .hub-icon {
    font-size: 1.6rem;
    line-height: 1;
  }

  .hub-title {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .hub-sub {
    font-size: var(--text-xs, 0.7rem);
    color: #64748b;
    margin: 2px 0 0;
  }

  /* ── Search ── */
  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    max-width: 280px;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    font-size: 0.75rem;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 7px 32px 7px 30px;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-md, 8px);
    color: #e2e8f0;
    font-size: var(--text-sm, 0.8rem);
    outline: none;
    transition: border-color var(--transition-fast, 150ms);
  }

  .search-input:focus {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .search-input::placeholder {
    color: #475569;
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 2px;
    line-height: 1;
  }

  .clear-btn:hover {
    color: #94a3b8;
  }

  /* ── Group filter chips ── */
  .group-chips {
    display: flex;
    gap: 6px;
    padding: 10px 20px;
    overflow-x: auto;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(51, 65, 85, 0.4);
    scrollbar-width: none;
  }

  .group-chips::-webkit-scrollbar {
    display: none;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: var(--radius-full, 9999px);
    border: 1px solid rgba(51, 65, 85, 0.6);
    background: rgba(30, 41, 59, 0.4);
    color: #94a3b8;
    font-size: var(--text-xs, 0.7rem);
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast, 150ms);
  }

  .chip:hover {
    border-color: rgba(99, 102, 241, 0.4);
    color: #e2e8f0;
  }

  .chip.active {
    background: color-mix(in srgb, var(--chip-color) 15%, transparent);
    border-color: color-mix(in srgb, var(--chip-color) 50%, transparent);
    color: #f1f5f9;
  }

  /* ── Content ── */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) transparent;
  }

  .content::-webkit-scrollbar {
    width: var(--scrollbar-width, 6px);
  }

  .content::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }

  /* ── Empty state ── */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px;
    color: #475569;
  }

  .empty-icon {
    font-size: 2.5rem;
    opacity: 0.5;
  }

  .empty p {
    font-size: var(--text-sm, 0.8rem);
  }

  /* ── Group section ── */
  .group-section {
    margin-bottom: 24px;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-left: 10px;
    border-left: 3px solid var(--group-color, #6366f1);
  }

  .group-icon {
    font-size: 0.95rem;
  }

  .group-label {
    font-size: var(--text-sm, 0.8rem);
    font-weight: 600;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .group-count {
    font-size: var(--text-xs, 0.7rem);
    color: #475569;
    background: rgba(51, 65, 85, 0.5);
    padding: 1px 6px;
    border-radius: var(--radius-full, 9999px);
  }

  /* ── Cards grid ── */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }

  /* ── Card ── */
  .card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background: var(--glass-bg-default, rgba(30, 41, 59, 0.6));
    border: var(--glass-border, 1px solid rgba(99, 102, 241, 0.15));
    border-radius: var(--radius-lg, 12px);
    box-shadow: var(--glass-shadow);
    transition: transform var(--transition-fast, 150ms) var(--transition-easing),
                box-shadow var(--transition-fast, 150ms) var(--transition-easing),
                border-color var(--transition-fast, 150ms);
    backdrop-filter: blur(var(--glass-blur, 16px));
    -webkit-backdrop-filter: blur(var(--glass-blur, 16px));
  }

  .card:hover {
    transform: var(--card-hover-transform, translateY(-2px));
    box-shadow: var(--card-hover-shadow);
    border-color: rgba(99, 102, 241, 0.3);
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .card-icon {
    font-size: 1.6rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .card-meta {
    flex: 1;
    min-width: 0;
  }

  .card-name {
    display: block;
    font-size: var(--text-base, 0.875rem);
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 3px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #475569;
    flex-shrink: 0;
    transition: background var(--transition-normal, 200ms);
  }

  .status-dot.online {
    background: var(--color-success, #22c55e);
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  }

  .status-dot.offline {
    background: #ef4444;
  }

  .status-label {
    font-size: var(--text-xs, 0.7rem);
    color: #64748b;
  }

  .ext-btn {
    background: none;
    border: none;
    color: #475569;
    cursor: pointer;
    font-size: 1rem;
    padding: 2px 4px;
    border-radius: var(--radius-sm, 6px);
    line-height: 1;
    transition: color var(--transition-fast, 150ms), background var(--transition-fast, 150ms);
    flex-shrink: 0;
  }

  .ext-btn:hover {
    color: #94a3b8;
    background: rgba(99, 102, 241, 0.1);
  }

  .card-desc {
    font-size: var(--text-sm, 0.8rem);
    color: #64748b;
    line-height: 1.4;
    margin: 0;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag {
    font-size: var(--text-xs, 0.7rem);
    color: #475569;
    background: rgba(51, 65, 85, 0.5);
    padding: 2px 6px;
    border-radius: var(--radius-full, 9999px);
  }

  .open-btn {
    margin-top: auto;
    padding: 7px 0;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: var(--radius-md, 8px);
    color: #818cf8;
    font-size: var(--text-sm, 0.8rem);
    font-weight: 500;
    cursor: pointer;
    transition: background var(--transition-fast, 150ms), color var(--transition-fast, 150ms);
  }

  .open-btn:hover {
    background: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
  }

  .open-btn:active {
    background: rgba(99, 102, 241, 0.35);
  }
</style>
