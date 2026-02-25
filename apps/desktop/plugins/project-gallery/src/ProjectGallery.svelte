<script lang="ts">
  import { onMount } from 'svelte';
  import ProjectCard from './ProjectCard.svelte';
  import ProjectModal from './ProjectModal.svelte';
  import { projects, getAllTechnologies, getAllCategories, categoryInfo, type Project } from './data';
  import { fetchGitHubRepos, languageColors, type GitHubRepo } from './github';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Top-level tab state - GitHub is default for a portfolio
  let activeMainTab = $state<'projects' | 'github'>('github');

  // State
  let searchQuery = $state('');
  let selectedCategory = $state<Project['category'] | 'all'>('all');
  let selectedTech = $state<string | 'all'>('all');
  let viewMode = $state<'grid' | 'masonry'>('grid');
  let selectedProject = $state<Project | null>(null);

  // GitHub state
  let githubRepos = $state<GitHubRepo[]>([]);
  let githubLoading = $state(false);
  let githubError = $state<string | null>(null);
  let githubSort = $state<'updated' | 'stars' | 'name'>('updated');
  let githubSearchQuery = $state('');

  // Derived data
  const technologies = getAllTechnologies();
  const categories = getAllCategories();

  // Filtered projects
  const filteredProjects = $derived(() => {
    return projects.filter(project => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.techStack.some(tech => tech.toLowerCase().includes(searchLower));

      // Category filter
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;

      // Tech filter
      const matchesTech = selectedTech === 'all' || project.techStack.includes(selectedTech);

      return matchesSearch && matchesCategory && matchesTech;
    });
  });

  // Sorted and filtered GitHub repos
  const sortedRepos = $derived(() => {
    let filtered = githubRepos.filter(repo => {
      if (!githubSearchQuery) return true;
      const q = githubSearchQuery.toLowerCase();
      return repo.name.toLowerCase().includes(q) ||
        (repo.description ?? '').toLowerCase().includes(q) ||
        (repo.language ?? '').toLowerCase().includes(q);
    });

    return [...filtered].sort((a, b) => {
      if (githubSort === 'stars') return b.stargazers_count - a.stargazers_count;
      if (githubSort === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  });

  // Stats
  const stats = $derived(() => ({
    total: projects.length,
    filtered: filteredProjects().length,
    featured: projects.filter(p => p.featured).length
  }));

  // Open project in the OS as iframe app
  function openProjectDemo(project: Project) {
    if (!project.demoUrl) return;

    // Dispatch custom event to open as iframe window
    const event = new CustomEvent('desktop:open-iframe', {
      bubbles: true,
      detail: {
        id: `project-${project.id}`,
        title: project.title,
        icon: categoryInfo[project.category].icon,
        url: project.demoUrl,
        width: 900,
        height: 650
      }
    });
    document.dispatchEvent(event);
  }

  function handleSelectProject(project: Project) {
    selectedProject = project;
  }

  function handleCloseModal() {
    selectedProject = null;
  }

  function clearFilters() {
    searchQuery = '';
    selectedCategory = 'all';
    selectedTech = 'all';
  }

  // Load GitHub repos
  async function loadGitHubRepos() {
    githubLoading = true;
    githubError = null;
    try {
      githubRepos = await fetchGitHubRepos();
    } catch (err) {
      githubError = err instanceof Error ? err.message : 'Failed to load repos';
    }
    githubLoading = false;
  }

  // Format relative time
  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  // Animation on mount
  let isVisible = $state(false);
  onMount(() => {
    setTimeout(() => {
      isVisible = true;
    }, 50);
  });

  // Load GitHub repos when the tab is switched
  $effect(() => {
    if (activeMainTab === 'github' && githubRepos.length === 0 && !githubLoading) {
      loadGitHubRepos();
    }
  });
</script>

<div class="gallery" class:visible={isVisible}>
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="title">Project Gallery</h1>
        <p class="subtitle">Explore portfolio projects and open live demos within rdtect OS</p>
      </div>
      <div class="stats">
        <span class="stat">
          <span class="stat-value">{stats().total}</span>
          <span class="stat-label">Projects</span>
        </span>
        <span class="stat">
          <span class="stat-value">{stats().featured}</span>
          <span class="stat-label">Featured</span>
        </span>
      </div>
    </div>

    <!-- Main Tab Switcher -->
    <div class="main-tabs">
      <button
        class="main-tab"
        class:active={activeMainTab === 'github'}
        onclick={() => activeMainTab = 'github'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        GitHub
      </button>
      <button
        class="main-tab"
        class:active={activeMainTab === 'projects'}
        onclick={() => activeMainTab = 'projects'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
        Projects
      </button>
    </div>
  </header>

  {#if activeMainTab === 'projects'}
    <!-- Projects Tab Content -->
    <!-- Filters -->
    <div class="filters">
      <!-- Search -->
      <div class="search-container">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Search projects..."
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

      <!-- Category Filter -->
      <div class="filter-group">
        <label class="filter-label">Category</label>
        <select class="filter-select" bind:value={selectedCategory}>
          <option value="all">All Categories</option>
          {#each categories as category}
            <option value={category}>
              {categoryInfo[category].icon} {categoryInfo[category].name}
            </option>
          {/each}
        </select>
      </div>

      <!-- Tech Filter -->
      <div class="filter-group">
        <label class="filter-label">Technology</label>
        <select class="filter-select" bind:value={selectedTech}>
          <option value="all">All Technologies</option>
          {#each technologies as tech}
            <option value={tech}>{tech}</option>
          {/each}
        </select>
      </div>

      <!-- View Mode Toggle -->
      <div class="view-toggle">
        <button
          class="view-btn"
          class:active={viewMode === 'grid'}
          onclick={() => viewMode = 'grid'}
          title="Grid view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button
          class="view-btn"
          class:active={viewMode === 'masonry'}
          onclick={() => viewMode = 'masonry'}
          title="Masonry view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="10"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="16" width="7" height="5"/>
            <rect x="14" y="13" width="7" height="8"/>
          </svg>
        </button>
      </div>

      <!-- Clear Filters -->
      {#if searchQuery || selectedCategory !== 'all' || selectedTech !== 'all'}
        <button class="clear-filters-btn" onclick={clearFilters}>
          Clear Filters
        </button>
      {/if}
    </div>

    <!-- Results Count -->
    {#if stats().filtered !== stats().total}
      <div class="results-count">
        Showing {stats().filtered} of {stats().total} projects
      </div>
    {/if}

    <!-- Project Grid -->
    <div class="projects-container">
      {#if filteredProjects().length === 0}
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <h3 class="empty-title">No projects found</h3>
          <p class="empty-text">Try adjusting your filters or search query</p>
          <button class="empty-action" onclick={clearFilters}>Clear Filters</button>
        </div>
      {:else}
        <div class="projects-grid" class:masonry={viewMode === 'masonry'}>
          {#each filteredProjects() as project, i}
            <div class="project-item" style="--index: {i}">
              <ProjectCard
                {project}
                onSelect={handleSelectProject}
                onOpenDemo={openProjectDemo}
              />
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Modal -->
    <ProjectModal
      project={selectedProject}
      onClose={handleCloseModal}
      onOpenDemo={openProjectDemo}
    />

  {:else}
    <!-- GitHub Tab Content -->
    <div class="github-header">
      <!-- GitHub Search -->
      <div class="search-container">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Search repositories..."
          bind:value={githubSearchQuery}
        />
        {#if githubSearchQuery}
          <button class="search-clear" onclick={() => githubSearchQuery = ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        {/if}
      </div>

      <!-- Sort Options -->
      <div class="sort-options">
        <label class="filter-label">Sort by</label>
        <div class="sort-buttons">
          <button
            class="sort-btn"
            class:active={githubSort === 'updated'}
            onclick={() => githubSort = 'updated'}
          >Recently Updated</button>
          <button
            class="sort-btn"
            class:active={githubSort === 'stars'}
            onclick={() => githubSort = 'stars'}
          >Stars</button>
          <button
            class="sort-btn"
            class:active={githubSort === 'name'}
            onclick={() => githubSort = 'name'}
          >Name</button>
        </div>
      </div>

      <!-- Refresh -->
      <button class="refresh-btn" onclick={loadGitHubRepos} title="Refresh repos">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class:spinning={githubLoading}>
          <polyline points="23,4 23,10 17,10"/>
          <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>

    <div class="github-container">
      {#if githubLoading && githubRepos.length === 0}
        <!-- Skeleton Loading -->
        <div class="github-grid">
          {#each Array(6) as _, i}
            <div class="repo-card skeleton" style="--index: {i}">
              <div class="skeleton-line title-line"></div>
              <div class="skeleton-line desc-line"></div>
              <div class="skeleton-line desc-line short"></div>
              <div class="skeleton-line meta-line"></div>
            </div>
          {/each}
        </div>
      {:else if githubError}
        <div class="empty-state">
          <span class="empty-icon">⚠️</span>
          <h3 class="empty-title">Failed to load repositories</h3>
          <p class="empty-text">{githubError}</p>
          <button class="empty-action" onclick={loadGitHubRepos}>Retry</button>
        </div>
      {:else if sortedRepos().length === 0}
        <div class="empty-state">
          <span class="empty-icon">📦</span>
          <h3 class="empty-title">No repositories found</h3>
          <p class="empty-text">Try adjusting your search query</p>
        </div>
      {:else}
        <div class="github-grid">
          {#each sortedRepos() as repo, i}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              class="repo-card"
              style="--index: {i}"
            >
              <div class="repo-header">
                <h3 class="repo-name">{repo.name}</h3>
                {#if repo.stargazers_count > 0}
                  <span class="repo-stars">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {repo.stargazers_count}
                  </span>
                {/if}
              </div>

              <p class="repo-description">
                {repo.description ?? 'No description'}
              </p>

              <div class="repo-meta">
                {#if repo.language}
                  <span class="repo-language">
                    <span
                      class="language-dot"
                      style="background-color: {languageColors[repo.language] ?? '#8b949e'}"
                    ></span>
                    {repo.language}
                  </span>
                {/if}
                <span class="repo-updated">{formatRelativeTime(repo.updated_at)}</span>
              </div>

              {#if repo.topics.length > 0}
                <div class="repo-topics">
                  {#each repo.topics.slice(0, 4) as topic}
                    <span class="topic-badge">{topic}</span>
                  {/each}
                  {#if repo.topics.length > 4}
                    <span class="topic-badge more">+{repo.topics.length - 4}</span>
                  {/if}
                </div>
              {/if}

              <span class="repo-link">
                View on GitHub
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .gallery {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .gallery.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .header {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    padding: 20px 24px 0;
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
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
    gap: 24px;
  }

  .stat {
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

  /* Main Tabs */
  .main-tabs {
    display: flex;
    gap: 4px;
    margin-top: 16px;
  }

  .main-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: transparent;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .main-tab:hover {
    color: #94a3b8;
    background: rgba(99, 102, 241, 0.05);
  }

  .main-tab.active {
    color: #a5b4fc;
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.2);
  }

  /* Filters */
  .filters {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    padding: 16px 24px;
    background: rgba(15, 23, 42, 0.5);
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .search-container {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 300px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 10px 36px 10px 40px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    color: #f1f5f9;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s;
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
    width: 20px;
    height: 20px;
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

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-label {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .filter-select {
    padding: 10px 32px 10px 12px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    color: #f1f5f9;
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .filter-select:focus {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .view-toggle {
    display: flex;
    gap: 4px;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 8px;
    padding: 4px;
  }

  .view-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .view-btn:hover {
    color: #94a3b8;
  }

  .view-btn.active {
    background: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
  }

  .clear-filters-btn {
    padding: 10px 16px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 10px;
    color: #fca5a5;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-filters-btn:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.4);
  }

  /* Results Count */
  .results-count {
    padding: 8px 24px;
    font-size: 0.8rem;
    color: #64748b;
    background: rgba(99, 102, 241, 0.05);
    border-bottom: 1px solid rgba(99, 102, 241, 0.08);
    flex-shrink: 0;
  }

  /* Projects Container */
  .projects-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .projects-grid.masonry {
    columns: 3;
    column-gap: 20px;
  }

  @media (max-width: 900px) {
    .projects-grid.masonry {
      columns: 2;
    }
  }

  @media (max-width: 600px) {
    .projects-grid.masonry {
      columns: 1;
    }
  }

  .projects-grid.masonry .project-item {
    break-inside: avoid;
    margin-bottom: 20px;
  }

  .project-item {
    animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    animation-delay: calc(var(--index) * 0.05s);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* GitHub Header */
  .github-header {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    padding: 16px 24px;
    background: rgba(15, 23, 42, 0.5);
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .github-header .search-container {
    max-width: 280px;
  }

  .sort-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sort-buttons {
    display: flex;
    gap: 4px;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 8px;
    padding: 3px;
  }

  .sort-btn {
    padding: 6px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .sort-btn:hover {
    color: #94a3b8;
  }

  .sort-btn.active {
    background: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
  }

  .refresh-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0;
  }

  .refresh-btn:hover {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* GitHub Container */
  .github-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .github-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  @media (max-width: 600px) {
    .github-grid {
      grid-template-columns: 1fr;
    }

    .projects-grid {
      grid-template-columns: 1fr;
    }

    .filters {
      flex-direction: column;
      align-items: stretch;
    }

    .search-container {
      max-width: none;
    }

    .github-header {
      flex-direction: column;
      align-items: stretch;
    }

    .github-header .search-container {
      max-width: none;
    }

    .header-content {
      flex-direction: column;
      gap: 12px;
    }

    .stats {
      justify-content: center;
    }
  }

  /* Repo Card */
  .repo-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    animation-delay: calc(var(--index) * 0.04s);
  }

  .repo-card:hover {
    transform: translateY(-3px);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow:
      0 8px 30px rgba(0, 0, 0, 0.3),
      0 0 15px rgba(99, 102, 241, 0.1);
  }

  .repo-card.skeleton {
    animation: none;
    pointer-events: none;
  }

  .repo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .repo-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #a5b4fc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .repo-card:hover .repo-name {
    color: #c7d2fe;
  }

  .repo-stars {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #fbbf24;
    font-size: 0.8rem;
    font-weight: 500;
    flex-shrink: 0;
  }

  .repo-description {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .repo-meta {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .repo-language {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .language-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .repo-updated {
    font-size: 0.75rem;
    color: #64748b;
  }

  .repo-topics {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .topic-badge {
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    font-size: 0.65rem;
    color: #a5b4fc;
  }

  .topic-badge.more {
    background: rgba(100, 116, 139, 0.15);
    border-color: rgba(100, 116, 139, 0.25);
    color: #94a3b8;
  }

  .repo-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #6366f1;
    font-weight: 500;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
    transition: color 0.2s;
  }

  .repo-card:hover .repo-link {
    color: #a5b4fc;
  }

  /* Skeleton Loading */
  .skeleton-line {
    height: 14px;
    background: linear-gradient(
      90deg,
      rgba(99, 102, 241, 0.08) 0%,
      rgba(99, 102, 241, 0.15) 50%,
      rgba(99, 102, 241, 0.08) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  .title-line {
    width: 60%;
    height: 18px;
    margin-bottom: 4px;
  }

  .desc-line {
    width: 100%;
  }

  .desc-line.short {
    width: 70%;
  }

  .meta-line {
    width: 40%;
    margin-top: 8px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
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

  .empty-action {
    margin-top: 8px;
    padding: 10px 20px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 10px;
    color: #a5b4fc;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .empty-action:hover {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.4);
  }

  /* Scrollbar */
  .projects-container::-webkit-scrollbar,
  .github-container::-webkit-scrollbar {
    width: 8px;
  }

  .projects-container::-webkit-scrollbar-track,
  .github-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .projects-container::-webkit-scrollbar-thumb,
  .github-container::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 4px;
  }

  .projects-container::-webkit-scrollbar-thumb:hover,
  .github-container::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
</style>
