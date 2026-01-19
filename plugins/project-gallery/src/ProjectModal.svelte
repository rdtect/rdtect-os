<script lang="ts">
  import type { Project } from './data';
  import { categoryInfo } from './data';

  interface Props {
    project: Project | null;
    onClose: () => void;
    onOpenDemo: (project: Project) => void;
  }

  let { project, onClose, onOpenDemo }: Props = $props();

  let currentScreenshotIndex = $state(0);
  let isClosing = $state(false);

  // Reset screenshot index when project changes
  $effect(() => {
    if (project) {
      currentScreenshotIndex = 0;
    }
  });

  function handleClose() {
    isClosing = true;
    setTimeout(() => {
      isClosing = false;
      onClose();
    }, 200);
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'ArrowLeft') {
      prevScreenshot();
    } else if (e.key === 'ArrowRight') {
      nextScreenshot();
    }
  }

  function prevScreenshot() {
    if (!project) return;
    currentScreenshotIndex = currentScreenshotIndex === 0
      ? project.screenshots.length - 1
      : currentScreenshotIndex - 1;
  }

  function nextScreenshot() {
    if (!project) return;
    currentScreenshotIndex = currentScreenshotIndex === project.screenshots.length - 1
      ? 0
      : currentScreenshotIndex + 1;
  }

  function handleOpenDemo() {
    if (project) {
      onOpenDemo(project);
      handleClose();
    }
  }

  function openLink(url: string | undefined) {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if project}
  <div
    class="modal-backdrop"
    class:closing={isClosing}
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="modal" class:closing={isClosing}>
      <!-- Close Button -->
      <button class="close-btn" onclick={handleClose} aria-label="Close modal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- Screenshot Carousel -->
      <div class="carousel">
        <div class="carousel-inner">
          <img
            src={project.screenshots[currentScreenshotIndex]}
            alt="{project.title} screenshot {currentScreenshotIndex + 1}"
            class="screenshot"
          />
        </div>

        {#if project.screenshots.length > 1}
          <button class="carousel-btn prev" onclick={prevScreenshot} aria-label="Previous screenshot">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <button class="carousel-btn next" onclick={nextScreenshot} aria-label="Next screenshot">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>

          <!-- Dots -->
          <div class="carousel-dots">
            {#each project.screenshots as _, i}
              <button
                class="dot"
                class:active={i === currentScreenshotIndex}
                onclick={() => currentScreenshotIndex = i}
                aria-label="Go to screenshot {i + 1}"
              />
            {/each}
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="content">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <span class="category-badge">
              {categoryInfo[project.category].icon}
              {categoryInfo[project.category].name}
            </span>
            {#if project.featured}
              <span class="featured-badge">Featured</span>
            {/if}
          </div>
          <span class="date">Added {new Date(project.dateAdded).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>

        <h2 id="modal-title" class="title">{project.title}</h2>
        <p class="description">{project.longDescription}</p>

        <!-- Tech Stack -->
        <div class="section">
          <h3 class="section-title">Technologies</h3>
          <div class="tech-stack">
            {#each project.techStack as tech}
              <span class="tech-badge">{tech}</span>
            {/each}
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          {#if project.demoUrl}
            <button class="action-btn primary" onclick={handleOpenDemo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Open in Desktop
            </button>
          {/if}

          {#if project.liveUrl}
            <button class="action-btn secondary" onclick={() => openLink(project.liveUrl)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
              Visit Live Site
            </button>
          {/if}

          {#if project.githubUrl}
            <button class="action-btn secondary" onclick={() => openLink(project.githubUrl)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View Source
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
    animation: backdropIn 0.2s ease-out;
  }

  .modal-backdrop.closing {
    animation: backdropOut 0.2s ease-out forwards;
  }

  @keyframes backdropIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes backdropOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .modal {
    position: relative;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow:
      0 25px 80px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(99, 102, 241, 0.1);
    animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .modal.closing {
    animation: modalOut 0.2s ease-out forwards;
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes modalOut {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.95) translateY(20px);
    }
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #f1f5f9;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;
    backdrop-filter: blur(8px);
  }

  .close-btn:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }

  /* Carousel */
  .carousel {
    position: relative;
    width: 100%;
    height: 280px;
    background: rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
  }

  .carousel-inner {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .screenshot {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #f1f5f9;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(8px);
  }

  .carousel-btn:hover {
    background: rgba(99, 102, 241, 0.4);
    border-color: rgba(99, 102, 241, 0.5);
  }

  .carousel-btn.prev {
    left: 16px;
  }

  .carousel-btn.next {
    right: 16px;
  }

  .carousel-dots {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dot:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .dot.active {
    background: #6366f1;
    transform: scale(1.2);
  }

  /* Content */
  .content {
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #a5b4fc;
  }

  .featured-badge {
    padding: 4px 12px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .date {
    font-size: 0.75rem;
    color: #64748b;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #f1f5f9;
    line-height: 1.3;
  }

  .description {
    margin: 0;
    font-size: 0.9rem;
    color: #94a3b8;
    line-height: 1.7;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tech-badge {
    padding: 6px 12px;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #a5b4fc;
  }

  /* Actions */
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .action-btn.primary:hover {
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  .action-btn.secondary {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
  }

  .action-btn.secondary:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.35);
    transform: translateY(-2px);
  }

  /* Scrollbar */
  .content::-webkit-scrollbar {
    width: 6px;
  }

  .content::-webkit-scrollbar-track {
    background: transparent;
  }

  .content::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 3px;
  }

  .content::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
</style>
