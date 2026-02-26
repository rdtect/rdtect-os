<script lang="ts">
  import type { ProfileData } from './data';

  interface Props {
    data: ProfileData;
  }
  let { data }: Props = $props();

  let copied = $state(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(data.email);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch {
      // Fallback: select + copy
      const el = document.createElement('textarea');
      el.value = data.email;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    }
  }

  const availabilityStyles: Record<string, { color: string; bg: string; label: string }> = {
    available: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', label: 'Available' },
    busy: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'Busy' },
    'not-looking': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Not Looking' },
  };

  const avail = $derived(availabilityStyles[data.availability]);
</script>

<div class="contact-tab">
  <!-- Availability -->
  <div class="availability-card" style="background: {avail.bg}; border-color: {avail.color}20">
    <span class="avail-dot" style="background: {avail.color}"></span>
    <div class="avail-text">
      <span class="avail-label" style="color: {avail.color}">{avail.label}</span>
      {#if data.availabilityMessage}
        <span class="avail-msg">{data.availabilityMessage}</span>
      {/if}
    </div>
  </div>

  <!-- Contact Info Cards -->
  <div class="info-grid">
    <!-- Email -->
    <div class="info-card">
      <div class="info-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </div>
      <div class="info-body">
        <span class="info-label">Email</span>
        <span class="info-value">{data.email}</span>
      </div>
      <button class="copy-btn" onclick={copyEmail} title="Copy email">
        {#if copied}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        {/if}
      </button>
    </div>

    <!-- Phone -->
    {#if data.phone}
      <div class="info-card">
        <div class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
        <div class="info-body">
          <span class="info-label">Phone</span>
          <a href="tel:{data.phone}" class="info-value info-link">{data.phone}</a>
        </div>
      </div>
    {/if}

    <!-- Location -->
    <div class="info-card">
      <div class="info-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="info-body">
        <span class="info-label">Location</span>
        <span class="info-value">{data.location}</span>
      </div>
    </div>

    <!-- Website -->
    {#if data.website}
      <div class="info-card">
        <div class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
        </div>
        <div class="info-body">
          <span class="info-label">Website</span>
          <a href={data.website} target="_blank" rel="noopener noreferrer" class="info-value info-link">
            {data.website.replace('https://', '')}
          </a>
        </div>
      </div>
    {/if}
  </div>

  <!-- Social Links -->
  <div class="social-section">
    <h3 class="section-title">Connect</h3>
    <div class="social-links">
      {#each data.socials as link}
        <a href={link.url} target="_blank" rel="noopener noreferrer" class="social-card" title={link.platform}>
          <div class="social-icon">
            {#if link.icon === 'github'}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            {:else if link.icon === 'linkedin'}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            {/if}
          </div>
          <div class="social-info">
            <span class="social-platform">{link.platform}</span>
            <span class="social-handle">{link.username}</span>
          </div>
        </a>
      {/each}
      <!-- Email as social -->
      <a href="mailto:{data.email}" class="social-card" title="Email">
        <div class="social-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>
        <div class="social-info">
          <span class="social-platform">Email</span>
          <span class="social-handle">{data.email}</span>
        </div>
      </a>
    </div>
  </div>
</div>

<style>
  .contact-tab {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 4px 0 24px;
  }

  /* Availability */
  .availability-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border: 1px solid;
    border-radius: var(--radius-xl);
  }

  .avail-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    animation: blink 2s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .avail-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .avail-label {
    font-size: var(--text-sm);
    font-weight: 700;
  }

  .avail-msg {
    font-size: var(--text-xs);
    color: #94a3b8;
    line-height: 1.4;
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 10px;
  }

  .info-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-lg);
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .info-card:hover {
    border-color: rgba(99, 102, 241, 0.25);
    background: rgba(99, 102, 241, 0.06);
  }

  .info-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-md);
    color: #a5b4fc;
    flex-shrink: 0;
  }

  .info-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .info-label {
    font-size: var(--text-xs);
    color: #64748b;
    font-weight: 500;
  }

  .info-value {
    font-size: var(--text-sm);
    color: #e2e8f0;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .info-link {
    color: #a5b4fc;
    text-decoration: none;
  }

  .info-link:hover {
    text-decoration: underline;
  }

  .copy-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-md);
    color: #94a3b8;
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .copy-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    border-color: rgba(99, 102, 241, 0.3);
  }

  /* Social Section */
  .social-section {
    margin-top: 4px;
  }

  .section-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: #e2e8f0;
    margin: 0 0 12px;
  }

  .social-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }

  .social-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-lg);
    text-decoration: none;
    color: inherit;
    min-height: 44px;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .social-card:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-1px);
  }

  .social-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.12);
    border-radius: var(--radius-md);
    color: #a5b4fc;
    flex-shrink: 0;
  }

  .social-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .social-platform {
    font-size: var(--text-sm);
    font-weight: 600;
    color: #e2e8f0;
  }

  .social-handle {
    font-size: var(--text-xs);
    color: #64748b;
  }

  .copy-btn:focus-visible,
  .social-card:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .avail-dot { animation: none; }
  }
</style>
