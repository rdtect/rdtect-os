<script lang="ts">
  import { onMount } from 'svelte';
  import { profileData, fetchFromPocketBase, type ProfileData } from './data';
  import OverviewTab from './OverviewTab.svelte';
  import JourneyTab from './JourneyTab.svelte';
  import SkillsTab from './SkillsTab.svelte';
  import ProjectsTab from './ProjectsTab.svelte';
  import ContactTab from './ContactTab.svelte';

  interface Props {
    windowId?: string;
    pocketbaseUrl?: string;
    pocketbaseCollection?: string;
    pocketbaseRecord?: string;
  }
  let { windowId, pocketbaseUrl, pocketbaseCollection, pocketbaseRecord }: Props = $props();

  let data = $state<ProfileData>(profileData);
  let isLoading = $state(true);

  type Tab = 'overview' | 'journey' | 'skills' | 'projects' | 'contact';
  let activeTab = $state<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'journey', label: 'Journey', icon: '🗺️' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'contact', label: 'Contact', icon: '✉️' },
  ];

  let indicatorStyle = $state('');
  let tabsEl: HTMLElement | null = $state(null);

  function updateIndicator() {
    if (!tabsEl) return;
    const activeBtn = tabsEl.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement | null;
    if (!activeBtn) return;
    const left = activeBtn.offsetLeft;
    const width = activeBtn.offsetWidth;
    indicatorStyle = `left: ${left}px; width: ${width}px`;
  }

  $effect(() => {
    // Re-run when activeTab changes
    activeTab;
    // Use requestAnimationFrame for accurate measurement after DOM update
    requestAnimationFrame(updateIndicator);
  });

  onMount(async () => {
    // Try loading from PocketBase if configured
    if (pocketbaseUrl && pocketbaseCollection && pocketbaseRecord) {
      const remote = await fetchFromPocketBase({
        url: pocketbaseUrl,
        collectionId: pocketbaseCollection,
        recordId: pocketbaseRecord,
      });
      if (remote) data = remote;
    }
    isLoading = false;
    requestAnimationFrame(updateIndicator);
  });
</script>

<svelte:window onresize={updateIndicator} />

<div class="about-container">
  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
    </div>
  {:else}
    <!-- Tab Navigation -->
    <nav class="tab-nav" bind:this={tabsEl}>
      <div class="tab-indicator" style={indicatorStyle}></div>
      {#each tabs as tab (tab.id)}
        <button
          class="tab-btn"
          class:active={activeTab === tab.id}
          data-tab={tab.id}
          onclick={() => { activeTab = tab.id; }}
        >
          <span class="tab-icon">{tab.icon}</span>
          <span class="tab-label">{tab.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'overview'}
        <OverviewTab {data} />
      {:else if activeTab === 'journey'}
        <JourneyTab experiences={data.experience} />
      {:else if activeTab === 'skills'}
        <SkillsTab skills={data.skills} />
      {:else if activeTab === 'projects'}
        <ProjectsTab projects={data.projects} />
      {:else if activeTab === 'contact'}
        <ContactTab {data} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .about-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    overflow: hidden;
  }

  /* Loading */
  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Tab Navigation */
  .tab-nav {
    display: flex;
    position: relative;
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(99, 102, 241, 0.12);
    padding: 0 8px;
    flex-shrink: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tab-nav::-webkit-scrollbar {
    display: none;
  }

  .tab-indicator {
    position: absolute;
    bottom: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 2px 2px 0 0;
    transition: left var(--transition-normal) var(--transition-easing),
                width var(--transition-normal) var(--transition-easing);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    background: none;
    border: none;
    color: #64748b;
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    min-height: 44px;
    transition: color var(--transition-normal) var(--transition-easing);
    position: relative;
  }

  .tab-btn:hover {
    color: #94a3b8;
  }

  .tab-btn.active {
    color: #e2e8f0;
  }

  .tab-btn.active .tab-icon {
    transform: scale(1.1);
  }

  .tab-icon {
    font-size: var(--text-base);
    transition: transform var(--transition-normal) var(--transition-easing);
  }

  .tab-label {
    font-family: var(--desktop-font-sans);
  }

  /* Tab Content */
  .tab-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px 24px;
  }

  .tab-content::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  .tab-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .tab-content::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);
  }

  .tab-content::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  .tab-btn:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: -2px;
    border-radius: var(--radius-sm);
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner { animation-duration: 2s; }
    .tab-indicator { transition: none; }
  }
</style>
