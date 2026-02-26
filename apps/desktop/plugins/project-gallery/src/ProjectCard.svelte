<script lang="ts">
  import type { Project } from './data';
  import { categoryInfo } from './data';

  interface Props {
    project: Project;
    onSelect: (project: Project) => void;
    onOpenDemo: (project: Project) => void;
  }

  let { project, onSelect, onOpenDemo }: Props = $props();

  let isHovered = $state(false);

  function handleOpenDemo(e: MouseEvent) {
    e.stopPropagation();
    onOpenDemo(project);
  }
</script>

<button
  class="card"
  class:hovered={isHovered}
  class:featured={project.featured}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
  onclick={() => onSelect(project)}
>
  <!-- Featured Badge -->
  {#if project.featured}
    <div class="featured-badge">Featured</div>
  {/if}

  <!-- Thumbnail -->
  <div class="thumbnail-container" style="background: {project.gradient}">
    <span class="thumbnail-icon">{project.icon}</span>

    <!-- Hover Overlay -->
    <div class="overlay" class:visible={isHovered}>
      <div class="overlay-content">
        <span class="view-details">View Details</span>
        {#if project.demoUrl}
          <button class="demo-btn" onclick={handleOpenDemo}>
            Open Demo
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Card Content -->
  <div class="content">
    <!-- Header -->
    <div class="header">
      <h3 class="title">{project.title}</h3>
      <span class="category-icon" title={categoryInfo[project.category].name}>
        {categoryInfo[project.category].icon}
      </span>
    </div>

    <!-- Description -->
    <p class="description">{project.description}</p>

    <!-- Tech Stack -->
    <div class="tech-stack">
      {#each project.techStack.slice(0, 4) as tech}
        <span class="tech-badge">{tech}</span>
      {/each}
      {#if project.techStack.length > 4}
        <span class="tech-badge more">+{project.techStack.length - 4}</span>
      {/if}
    </div>

    <!-- Links -->
    <div class="links">
      {#if project.githubUrl}
        <span class="link-indicator" title="GitHub available">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </span>
      {/if}
      {#if project.liveUrl}
        <span class="link-indicator live" title="Live site available">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
        </span>
      {/if}
    </div>
  </div>
</button>

<style>
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--glass-bg-default);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-slow) var(--transition-easing);
    text-align: left;
    width: 100%;
  }

  .card:hover {
    transform: var(--card-hover-transform);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: var(--card-hover-shadow);
  }

  .card.featured {
    border-color: rgba(99, 102, 241, 0.3);
  }

  .featured-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  }

  /* Thumbnail */
  .thumbnail-container {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thumbnail-icon {
    font-size: 3.5rem;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }

  .card:hover .thumbnail-icon {
    transform: scale(1.15);
  }

  /* Overlay */
  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0) 0%,
      rgba(15, 23, 42, 0.7) 50%,
      rgba(15, 23, 42, 0.95) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .overlay.visible {
    opacity: 1;
  }

  .overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .view-details {
    color: #e2e8f0;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  .demo-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: none;
    border-radius: var(--radius-md);
    color: white;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    min-height: 44px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  }

  .demo-btn:hover {
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
  }

  /* Content */
  .content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
    line-height: 1.3;
  }

  .category-icon {
    font-size: 1.1rem;
    opacity: 0.8;
  }

  .description {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Tech Stack */
  .tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: auto;
  }

  .tech-badge {
    padding: 3px 8px;
    background: rgba(var(--desktop-accent-rgb), 0.15);
    border: 1px solid rgba(var(--desktop-accent-rgb), 0.2);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 500;
    color: #a5b4fc;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .tech-badge.more {
    background: rgba(100, 116, 139, 0.2);
    border-color: rgba(100, 116, 139, 0.3);
    color: #94a3b8;
  }

  /* Links */
  .links {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .link-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    opacity: 0.7;
    transition: all 0.2s;
  }

  .link-indicator.live {
    color: #22c55e;
  }

  .card:hover .link-indicator {
    opacity: 1;
  }

  .card:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .thumbnail-icon,
    .overlay {
      transition: none;
    }
  }
</style>
