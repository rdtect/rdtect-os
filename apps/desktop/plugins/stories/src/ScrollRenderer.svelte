<script lang="ts">
  import { onMount } from 'svelte';
  import type { StoryPost, ScrollSection } from './types';

  interface Props {
    story: StoryPost;
    onBack: () => void;
  }

  let { story, onBack }: Props = $props();

  const sections: ScrollSection[] = story.sections ?? [];
  let scrollProgress = $state(0);
  let visibleSections = $state<Set<string>>(new Set());
  let containerEl: HTMLDivElement | undefined = $state();

  function parseContent(content: string): string {
    let html = content;
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*(<h[1-3]>)/g, '$1');
    html = html.replace(/(<\/h[1-3]>)\s*<\/p>/g, '$1');
    return html;
  }

  function handleScroll() {
    if (!containerEl) return;
    const { scrollTop, scrollHeight, clientHeight } = containerEl;
    scrollProgress = scrollHeight > clientHeight
      ? (scrollTop / (scrollHeight - clientHeight)) * 100
      : 100;
  }

  onMount(() => {
    if (!containerEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-section-id');
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleSections = new Set([...visibleSections, id]);
          }
        }
      },
      {
        root: containerEl,
        threshold: 0.2
      }
    );

    const sectionEls = containerEl.querySelectorAll('[data-section-id]');
    for (const el of sectionEls) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  });
</script>

<div class="scroll-renderer">
  <!-- Progress bar -->
  <div class="progress-bar">
    <div class="progress-fill" style="width: {scrollProgress}%"></div>
  </div>

  <!-- Header -->
  <header class="scroll-header">
    <button class="back-btn" onclick={onBack} type="button">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
    <span class="scroll-title">{story.title}</span>
    <span class="format-badge">Scroll</span>
  </header>

  <!-- Scroll content -->
  <div
    class="scroll-content"
    bind:this={containerEl}
    onscroll={handleScroll}
  >
    <!-- Hero -->
    <div class="hero" style={story.coverImage ? `background-image: url(${story.coverImage})` : ''}>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>{story.title}</h1>
        <p class="hero-excerpt">{story.excerpt}</p>
        <div class="hero-meta">
          {#if story.author.avatar}
            <img src={story.author.avatar} alt={story.author.name} class="hero-avatar" />
          {/if}
          <span>{story.author.name}</span>
          <span class="hero-dot"></span>
          <span>{story.readTime} min read</span>
        </div>
        <div class="scroll-indicator">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Sections -->
    {#each sections as section, i}
      <section
        class="scroll-section animation-{section.animation ?? 'fade-in'}"
        class:visible={visibleSections.has(section.id)}
        class:sticky-section={section.sticky}
        data-section-id={section.id}
        style={section.background ? `background: ${section.background}` : ''}
      >
        <div class="section-inner">
          <div class="section-number">{String(i + 1).padStart(2, '0')}</div>
          <div class="section-content">
            {@html parseContent(section.content)}
          </div>
        </div>
      </section>
    {/each}

    <!-- End marker -->
    <div class="end-marker">
      <div class="end-line"></div>
      <span>End of story</span>
    </div>
  </div>
</div>

<style>
  .scroll-renderer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    color: #f1f5f9;
    position: relative;
  }

  /* Progress */
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(99, 102, 241, 0.15);
    z-index: 20;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    transition: width 100ms linear;
  }

  /* Header */
  .scroll-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    background: var(--glass-bg-strong);
    border-bottom: 1px solid #334155;
    backdrop-filter: blur(var(--glass-blur));
    position: relative;
    z-index: 15;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: 1px solid #334155;
    border-radius: var(--radius-md);
    color: #94a3b8;
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
  }

  .back-btn:hover {
    background: #334155;
    color: #f1f5f9;
  }

  .scroll-title {
    font-size: var(--text-sm);
    color: #94a3b8;
    font-weight: 500;
  }

  .format-badge {
    padding: 0.25rem 0.75rem;
    background: rgba(var(--desktop-accent-rgb), 0.15);
    border: 1px solid rgba(var(--desktop-accent-rgb), 0.3);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 600;
    color: #a5b4fc;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Scroll content */
  .scroll-content {
    flex: 1;
    overflow-y: auto;
    scroll-behavior: smooth;
  }

  /* Hero */
  .hero {
    position: relative;
    min-height: 400px;
    display: flex;
    align-items: flex-end;
    background-size: cover;
    background-position: center;
    background-color: #1e293b;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.6) 40%, rgba(15, 23, 42, 0.3) 100%);
  }

  .hero-content {
    position: relative;
    padding: 3rem 2.5rem;
    max-width: 700px;
  }

  .hero-content h1 {
    margin: 0 0 1rem 0;
    font-size: var(--text-3xl);
    font-weight: 700;
    line-height: 1.2;
  }

  .hero-excerpt {
    margin: 0 0 1.5rem 0;
    font-size: var(--text-lg);
    color: #cbd5e1;
    line-height: 1.6;
  }

  .hero-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: var(--text-sm);
    color: #94a3b8;
  }

  .hero-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }

  .hero-dot {
    width: 4px;
    height: 4px;
    background: #475569;
    border-radius: 50%;
  }

  .scroll-indicator {
    margin-top: 2rem;
    color: #475569;
    animation: bounce 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  /* Sections */
  .scroll-section {
    padding: 5rem 2.5rem;
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }

  .scroll-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Animation variants */
  .animation-slide-up {
    transform: translateY(60px);
  }

  .animation-slide-up.visible {
    transform: translateY(0);
  }

  .animation-parallax {
    transform: translateY(30px) scale(0.98);
  }

  .animation-parallax.visible {
    transform: translateY(0) scale(1);
  }

  .animation-reveal {
    opacity: 0;
    clip-path: inset(0 0 100% 0);
    transition: opacity 0.8s ease, clip-path 0.8s ease;
    transform: none;
  }

  .animation-reveal.visible {
    opacity: 1;
    clip-path: inset(0);
  }

  .animation-fade-in {
    transform: translateY(20px);
  }

  .animation-fade-in.visible {
    transform: translateY(0);
  }

  .sticky-section {
    position: sticky;
    top: 0;
    z-index: 5;
  }

  .section-inner {
    max-width: 700px;
    width: 100%;
    display: flex;
    gap: 2rem;
  }

  .section-number {
    flex-shrink: 0;
    font-size: var(--text-3xl);
    font-weight: 700;
    color: rgba(99, 102, 241, 0.2);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .section-content {
    flex: 1;
    line-height: 1.8;
    color: #e2e8f0;
  }

  .section-content :global(h1) {
    font-size: var(--text-2xl);
    font-weight: 700;
    margin: 0 0 1.5rem 0;
    color: #f1f5f9;
    line-height: 1.3;
  }

  .section-content :global(h2) {
    font-size: var(--text-xl);
    font-weight: 600;
    margin: 2rem 0 1rem 0;
    color: #f1f5f9;
  }

  .section-content :global(p) {
    margin: 1rem 0;
  }

  .section-content :global(strong) {
    color: #f1f5f9;
    font-weight: 600;
  }

  .section-content :global(em) {
    color: #a5b4fc;
    font-style: italic;
  }

  .section-content :global(code) {
    padding: 0.15rem 0.4rem;
    background: rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-sm);
    font-family: var(--desktop-font-mono);
    font-size: 0.9em;
    color: #f472b6;
  }

  /* End marker */
  .end-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: #475569;
    font-size: var(--text-sm);
  }

  .end-line {
    width: 40px;
    height: 2px;
    background: #334155;
    border-radius: 1px;
  }

  /* Scrollbar */
  .scroll-content::-webkit-scrollbar { width: var(--scrollbar-width); }
  .scroll-content::-webkit-scrollbar-track { background: transparent; }
  .scroll-content::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }
  .scroll-content::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

  .back-btn:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (max-width: 700px) {
    .scroll-section { padding: 3rem 1.5rem; }
    .hero-content { padding: 2rem 1.5rem; }
    .hero-content h1 { font-size: var(--text-2xl); }
    .section-number { display: none; }
  }
</style>
