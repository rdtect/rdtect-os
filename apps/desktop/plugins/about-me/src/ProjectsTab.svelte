<script lang="ts">
  import type { Project } from './data';
  import { wm } from '$lib/shell';

  interface Props {
    projects: Project[];
  }
  let { projects }: Props = $props();

  const featured = $derived(projects.filter((p) => p.featured));

  // Gradient backgrounds for project cards
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #7c3aed 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #92400e 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #4c1d95 100%)',
    'linear-gradient(135deg, #ec4899 0%, #db2777 40%, #9d174d 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 40%, #065f46 100%)',
    'linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #15803d 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #0e7490 100%)',
  ];

  function openGallery() {
    wm.openWindow('project-gallery');
  }
</script>

<div class="projects-container">
  <div class="projects-grid">
    {#each featured as project, i (project.id)}
      <div class="project-card" style="animation-delay: {i * 80}ms">
        <div class="card-gradient" style="background: {gradients[i % gradients.length]}">
          <span class="card-icon">
            {#if project.id === 'proj-rdtect-os'}🖥️
            {:else if project.id === 'proj-ilm'}🎬
            {:else if project.id === 'proj-versez'}🌐
            {:else if project.id === 'proj-fikka'}🖼️
            {:else if project.id === 'proj-maple'}🌱
            {:else if project.id === 'proj-omnicom-ai'}🤖
            {:else if project.id === 'proj-zyeta-dx'}⚡
            {:else}🚀
            {/if}
          </span>
        </div>
        <div class="card-content">
          <h3 class="card-title">{project.name}</h3>
          <p class="card-desc">{project.description}</p>
          <div class="card-chips">
            {#each project.technologies.slice(0, 4) as tech}
              <span class="chip">{tech}</span>
            {/each}
            {#if project.technologies.length > 4}
              <span class="chip chip-more">+{project.technologies.length - 4}</span>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <button class="view-all-btn" onclick={openGallery}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
    View All in Project Gallery
  </button>
</div>

<style>
  .projects-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 4px 0 24px;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .project-card {
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-xl);
    overflow: hidden;
    transition: all var(--transition-normal) var(--transition-easing);
    animation: fadeUp 0.4s ease backwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
  }

  .project-card:hover {
    transform: var(--card-hover-transform);
    box-shadow: var(--card-hover-shadow);
    border-color: rgba(99, 102, 241, 0.25);
  }

  .card-gradient {
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .card-content {
    padding: 14px 16px 16px;
  }

  .card-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: #e2e8f0;
    margin: 0 0 6px;
  }

  .card-desc {
    font-size: var(--text-xs);
    color: #94a3b8;
    line-height: 1.5;
    margin: 0 0 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .chip {
    font-size: 10px;
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-full);
    color: #a5b4fc;
    font-weight: 500;
  }

  .chip-more {
    color: #64748b;
    border-color: rgba(100, 116, 139, 0.2);
    background: rgba(100, 116, 139, 0.1);
  }

  /* View All Button */
  .view-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-lg);
    color: #a5b4fc;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .view-all-btn:hover {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
  }

  .view-all-btn:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .project-card { animation: none; }
  }
</style>
