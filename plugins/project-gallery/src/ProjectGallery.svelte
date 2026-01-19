<script lang="ts">
  import { onMount } from 'svelte';
  import ProjectCard from './ProjectCard.svelte';
  import ProjectModal from './ProjectModal.svelte';
  import { projects, getAllTechnologies, getAllCategories, categoryInfo, type Project } from './data';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // State
  let searchQuery = $state('');
  let selectedCategory = $state<Project['category'] | 'all'>('all');
  let selectedTech = $state<string | 'all'>('all');
  let viewMode = $state<'grid' | 'masonry'>('grid');
  let selectedProject = $state<Project | null>(null);

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

  // Animation on mount
  let isVisible = $state(false);
  onMount(() => {
    setTimeout(() => {
      isVisible = true;
    }, 50);
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
  </header>

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
</div>

<style>
  .gallery {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(145deg, #0a0f1a 0%, #111827 50%, #0f172a 100%);
    font-family: 'SF Pro Display', 'Inter', system-ui, sans-serif;
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
    padding: 20px 24px;
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
  .projects-container::-webkit-scrollbar {
    width: 8px;
  }

  .projects-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .projects-container::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 4px;
  }

  .projects-container::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
</style>
