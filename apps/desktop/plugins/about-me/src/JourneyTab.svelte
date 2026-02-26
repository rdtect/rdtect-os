<script lang="ts">
  import { onMount } from 'svelte';
  import type { Experience } from './data';

  interface Props {
    experiences: Experience[];
  }
  let { experiences }: Props = $props();

  let expandedId = $state<string | null>(null);
  let visibleIds = $state<Set<string>>(new Set());
  let timelineEl: HTMLElement | null = $state(null);

  function toggle(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  // Intersection Observer for scroll-based fade-in
  onMount(() => {
    if (!timelineEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.id;
            if (id) visibleIds = new Set([...visibleIds, id]);
          }
        }
      },
      { threshold: 0.15, root: timelineEl }
    );

    const cards = timelineEl.querySelectorAll('.timeline-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  });

  // Career arc labels
  const arcLabels: Record<string, string> = {
    'exp-rba': 'Architecture',
    'exp-rmc': 'Architecture',
    'exp-arcx': 'Architecture & Design',
    'exp-fpa': 'Academia',
    'exp-foad': 'Academia',
    'exp-quant': 'Web3 & Metaverse',
    'exp-omnicom': 'Global Agency',
    'exp-zyeta': 'Digital Experience',
  };
</script>

<div class="journey" bind:this={timelineEl}>
  <div class="timeline">
    {#each experiences as exp, i (exp.id)}
      {@const isVisible = visibleIds.has(exp.id)}
      {@const isExpanded = expandedId === exp.id}
      <div
        class="timeline-card"
        class:visible={isVisible}
        class:expanded={isExpanded}
        data-id={exp.id}
        style="animation-delay: {i * 60}ms"
      >
        <!-- Timeline dot + line -->
        <div class="timeline-track">
          <div class="timeline-dot" class:current={i === 0}>
            {#if i === 0}
              <span class="dot-pulse"></span>
            {/if}
          </div>
          {#if i < experiences.length - 1}
            <div class="timeline-line"></div>
          {/if}
        </div>

        <!-- Card content -->
        <button class="card-body" onclick={() => toggle(exp.id)}>
          <div class="card-header">
            <div class="card-meta">
              {#if arcLabels[exp.id]}
                <span class="arc-label">{arcLabels[exp.id]}</span>
              {/if}
              <span class="dates">{exp.startDate} &mdash; {exp.endDate}</span>
            </div>
            <h3 class="card-title">{exp.title}</h3>
            <p class="card-company">
              {#if exp.companyUrl}
                <span class="company-name">{exp.company}</span>
              {:else}
                <span class="company-name">{exp.company}</span>
              {/if}
              <span class="card-location">&middot; {exp.location}</span>
            </p>
          </div>

          <svg
            class="chevron"
            class:rotated={isExpanded}
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {#if isExpanded}
          <div class="card-details">
            <p class="description">{exp.description}</p>
            <ul class="highlights">
              {#each exp.highlights as highlight}
                <li>{highlight}</li>
              {/each}
            </ul>
            <div class="tech-chips">
              {#each exp.technologies as tech}
                <span class="chip">{tech}</span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .journey {
    padding: 4px 0 24px;
    overflow-y: auto;
    max-height: 100%;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-left: 8px;
  }

  /* Timeline card */
  .timeline-card {
    display: flex;
    gap: 16px;
    opacity: 0;
    transform: translateX(-12px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .timeline-card.visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* Track (dot + line) */
  .timeline-track {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 20px;
    padding-top: 18px;
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #334155;
    border: 2px solid #6366f1;
    position: relative;
    flex-shrink: 0;
    z-index: 1;
  }

  .timeline-dot.current {
    background: #6366f1;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
  }

  .dot-pulse {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid rgba(99, 102, 241, 0.4);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0; }
  }

  .timeline-line {
    width: 2px;
    flex: 1;
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.3), rgba(99, 102, 241, 0.05));
    min-height: 16px;
  }

  /* Card body */
  .card-body {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-lg);
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
    transition: all var(--transition-normal) var(--transition-easing);
    min-height: 44px;
    margin-bottom: 8px;
  }

  .card-body:hover {
    background: rgba(99, 102, 241, 0.08);
    border-color: rgba(99, 102, 241, 0.25);
  }

  .timeline-card.expanded .card-body {
    border-color: rgba(99, 102, 241, 0.3);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    margin-bottom: 0;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .arc-label {
    font-size: var(--text-xs);
    color: #a5b4fc;
    background: rgba(99, 102, 241, 0.15);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-weight: 600;
  }

  .dates {
    font-size: var(--text-xs);
    color: #64748b;
  }

  .card-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: #e2e8f0;
    margin: 0 0 2px;
  }

  .card-company {
    font-size: var(--text-xs);
    color: #94a3b8;
    margin: 0;
  }

  .company-name {
    color: #a5b4fc;
    font-weight: 500;
  }

  .card-location {
    color: #64748b;
  }

  .chevron {
    color: #64748b;
    flex-shrink: 0;
    margin-top: 4px;
    transition: transform var(--transition-normal) var(--transition-easing);
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  /* Expanded details */
  .card-details {
    margin-left: 36px;
    padding: 16px 18px;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-top: none;
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    margin-bottom: 8px;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from { opacity: 0; max-height: 0; }
    to { opacity: 1; max-height: 600px; }
  }

  .description {
    font-size: var(--text-sm);
    color: #cbd5e1;
    line-height: 1.6;
    margin: 0 0 12px;
  }

  .highlights {
    list-style: none;
    padding: 0;
    margin: 0 0 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .highlights li {
    font-size: var(--text-xs);
    color: #94a3b8;
    padding-left: 16px;
    position: relative;
    line-height: 1.5;
  }

  .highlights li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 7px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.5);
  }

  .tech-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    font-size: 10px;
    padding: 3px 10px;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-full);
    color: #a5b4fc;
    font-weight: 500;
  }

  .card-body:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .timeline-card {
      opacity: 1;
      transform: none;
    }
    .dot-pulse { animation: none; display: none; }
    .card-details { animation: none; }
  }
</style>
