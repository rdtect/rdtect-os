<script lang="ts">
  import type { ProfileData } from './data';

  interface Props {
    data: ProfileData;
  }
  let { data }: Props = $props();

  const stats = [
    { value: '13+', label: 'Years' },
    { value: '6', label: 'Companies' },
    { value: '3', label: 'Continents' },
    { value: 'Global', label: 'Teams' },
  ];
</script>

<div class="overview">
  <!-- Hero -->
  <div class="hero">
    <div class="avatar-ring">
      <div class="avatar">
        <span class="initials">RD</span>
      </div>
    </div>
    <h1 class="name">{data.name}</h1>
    <p class="title">{data.title}</p>
    <p class="subtitle">Emergent Technology &middot; AI Solutions &middot; Future of Work</p>
    <p class="tagline">{data.tagline}</p>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    {#each stats as stat, i}
      <div class="stat" style="animation-delay: {i * 80}ms">
        <span class="stat-value">{stat.value}</span>
        <span class="stat-label">{stat.label}</span>
      </div>
    {/each}
  </div>

  <!-- Bio -->
  <div class="bio-card">
    <p class="bio-text">{data.shortBio}</p>
  </div>

  <!-- Social Links -->
  <div class="social-row">
    {#each data.socials as link}
      <a href={link.url} target="_blank" rel="noopener noreferrer" class="social-btn" title={link.platform}>
        {#if link.icon === 'github'}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        {:else if link.icon === 'linkedin'}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        {/if}
        <span>{link.platform}</span>
      </a>
    {/each}
  </div>
</div>

<style>
  .overview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    padding: 8px 0 24px;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
  }

  .avatar-ring {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    animation: rotate-ring 6s linear infinite;
  }

  @keyframes rotate-ring {
    to { filter: hue-rotate(360deg); }
  }

  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e293b, #334155);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .initials {
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #a5b4fc, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .name {
    font-size: var(--text-2xl);
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .title {
    font-size: var(--text-md);
    color: #a5b4fc;
    font-weight: 600;
    margin: 0;
  }

  .subtitle {
    font-size: var(--text-sm);
    color: #64748b;
    margin: 0;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .tagline {
    font-size: var(--text-sm);
    color: #94a3b8;
    font-style: italic;
    margin: 4px 0 0;
    max-width: 480px;
    text-align: center;
    line-height: 1.5;
  }

  /* Stats Row */
  .stats-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 22px;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: var(--radius-lg);
    animation: fadeUp 0.4s ease backwards;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .stat:hover {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.08);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
  }

  .stat-value {
    font-size: var(--text-lg);
    font-weight: 800;
    color: #a5b4fc;
  }

  .stat-label {
    font-size: var(--text-xs);
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Bio Card */
  .bio-card {
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: var(--radius-xl);
    padding: 20px 24px;
    max-width: 540px;
    width: 100%;
  }

  .bio-text {
    font-size: var(--text-sm);
    color: #cbd5e1;
    line-height: 1.7;
    margin: 0;
  }

  /* Social Row */
  .social-row {
    display: flex;
    gap: 12px;
  }

  .social-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-lg);
    color: #94a3b8;
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: 500;
    min-height: 44px;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .social-btn:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
    color: #a5b4fc;
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    .avatar-ring { animation: none; }
    .stat { animation: none; }
  }
</style>
