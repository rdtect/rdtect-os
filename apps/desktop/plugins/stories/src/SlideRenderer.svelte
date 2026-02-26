<script lang="ts">
  import type { StoryPost, Slide } from './types';

  interface Props {
    story: StoryPost;
    onBack: () => void;
  }

  let { story, onBack }: Props = $props();

  const slides: Slide[] = story.slides ?? [];
  let currentSlide = $state(0);
  let transitioning = $state(false);

  const totalSlides = slides.length;
  const progress = $derived(totalSlides > 1 ? ((currentSlide + 1) / totalSlides) * 100 : 100);
  const slide = $derived(slides[currentSlide]);

  function goTo(index: number) {
    if (index < 0 || index >= totalSlides || index === currentSlide || transitioning) return;
    transitioning = true;
    currentSlide = index;
    setTimeout(() => { transitioning = false; }, 300);
  }

  function next() { goTo(currentSlide + 1); }
  function prev() { goTo(currentSlide - 1); }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
    }
  }

  let touchStartX = $state(0);

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
  }

  function parseSlideContent(content: string): string {
    let html = content;
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');
    html = '<p>' + html + '</p>';
    return html;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="slide-renderer"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  role="presentation"
>
  <!-- Progress bar -->
  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress}%"></div>
  </div>

  <!-- Header -->
  <header class="slide-header">
    <button class="back-btn" onclick={onBack} type="button">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
    <span class="slide-title">{story.title}</span>
    <span class="slide-counter">{currentSlide + 1} / {totalSlides}</span>
  </header>

  <!-- Slide content -->
  {#if slide}
    <div
      class="slide layout-{slide.layout ?? 'center'}"
      class:transitioning
      style={slide.background ? `background: ${slide.background}` : ''}
    >
      <div class="slide-inner">
        {#if slide.title}
          <h1 class="slide-heading">{slide.title}</h1>
        {/if}
        <div class="slide-body">
          {@html parseSlideContent(slide.content)}
        </div>
      </div>
    </div>
  {/if}

  <!-- Navigation -->
  <div class="slide-nav">
    <button
      class="nav-btn"
      onclick={prev}
      disabled={currentSlide === 0}
      type="button"
      aria-label="Previous slide"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>

    <div class="slide-dots">
      {#each slides as _, i}
        <button
          class="dot"
          class:active={i === currentSlide}
          onclick={() => goTo(i)}
          type="button"
          aria-label="Go to slide {i + 1}"
        ></button>
      {/each}
    </div>

    <button
      class="nav-btn"
      onclick={next}
      disabled={currentSlide === totalSlides - 1}
      type="button"
      aria-label="Next slide"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  </div>

  <!-- Keyboard hint -->
  <div class="keyboard-hint">
    <span>Use <kbd>&larr;</kbd> <kbd>&rarr;</kbd> or <kbd>Space</kbd> to navigate &middot; <kbd>Esc</kbd> to exit</span>
  </div>
</div>

<style>
  .slide-renderer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    color: #f1f5f9;
    position: relative;
    overflow: hidden;
    user-select: none;
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
    transition: width var(--transition-normal) var(--transition-easing);
  }

  /* Header */
  .slide-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    position: absolute;
    top: 3px;
    left: 0;
    right: 0;
    z-index: 15;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, transparent 100%);
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-md);
    color: #94a3b8;
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    backdrop-filter: blur(8px);
  }

  .back-btn:hover {
    background: rgba(51, 65, 85, 0.8);
    color: #f1f5f9;
  }

  .slide-title {
    font-size: var(--text-sm);
    color: #64748b;
    font-weight: 500;
  }

  .slide-counter {
    font-size: var(--text-sm);
    color: #64748b;
    font-variant-numeric: tabular-nums;
  }

  /* Slide */
  .slide {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 3rem;
    transition: opacity var(--transition-slow) var(--transition-easing);
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }

  .slide.transitioning {
    opacity: 0.6;
  }

  .slide-inner {
    max-width: 800px;
    width: 100%;
  }

  /* Layouts */
  .layout-center { text-align: center; }
  .layout-center .slide-inner { max-width: 700px; }

  .layout-left { justify-content: flex-start; padding-left: 6rem; }
  .layout-right { justify-content: flex-end; padding-right: 6rem; }

  .layout-split .slide-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    max-width: 900px;
  }

  .layout-code .slide-inner {
    max-width: 900px;
  }

  .slide-heading {
    margin: 0 0 1.5rem 0;
    font-size: var(--text-3xl);
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.2;
  }

  .layout-center .slide-heading {
    font-size: var(--text-4xl);
    margin-bottom: 2rem;
  }

  .slide-body {
    font-size: var(--text-lg);
    line-height: 1.8;
    color: #cbd5e1;
  }

  .slide-body :global(strong) {
    color: #f1f5f9;
    font-weight: 600;
  }

  .slide-body :global(em) {
    color: #a5b4fc;
    font-style: italic;
  }

  .slide-body :global(code) {
    padding: 0.15rem 0.4rem;
    background: rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-sm);
    font-family: var(--desktop-font-mono);
    font-size: 0.9em;
    color: #f472b6;
  }

  .slide-body :global(p) {
    margin: 0.75rem 0;
  }

  /* Navigation */
  .slide-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1rem;
    position: absolute;
    bottom: 1.5rem;
    left: 0;
    right: 0;
    z-index: 15;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-full);
    color: #94a3b8;
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    backdrop-filter: blur(8px);
  }

  .nav-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.3);
    border-color: rgba(99, 102, 241, 0.5);
    color: #f1f5f9;
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .slide-dots {
    display: flex;
    gap: 0.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: rgba(148, 163, 184, 0.3);
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    padding: 0;
  }

  .dot.active {
    background: #6366f1;
    width: 24px;
  }

  .dot:hover:not(.active) {
    background: rgba(148, 163, 184, 0.5);
  }

  /* Keyboard hint */
  .keyboard-hint {
    position: absolute;
    bottom: 0.5rem;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 0.6875rem;
    color: #475569;
    z-index: 10;
  }

  .keyboard-hint kbd {
    padding: 0.1rem 0.35rem;
    background: rgba(51, 65, 85, 0.4);
    border-radius: 3px;
    font-family: var(--desktop-font-mono);
    font-size: 0.625rem;
  }

  .back-btn:focus-visible, .nav-btn:focus-visible, .dot:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (max-width: 700px) {
    .slide { padding: 3rem 1.5rem; }
    .layout-left { padding-left: 1.5rem; }
    .layout-right { padding-right: 1.5rem; }
    .slide-heading { font-size: var(--text-2xl); }
    .layout-center .slide-heading { font-size: var(--text-3xl); }
    .slide-body { font-size: var(--text-base); }
  }
</style>
