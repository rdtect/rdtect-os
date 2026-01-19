<script lang="ts">
  import { onMount } from 'svelte';
  import {
    profileData,
    fetchFromPocketBase,
    type ProfileData,
    type Skill,
    type Experience,
    type Education,
    type SocialLink
  } from './data';

  // Props from window manager
  interface Props {
    windowId?: string;
    pocketbaseUrl?: string;
    pocketbaseCollection?: string;
    pocketbaseRecord?: string;
  }
  let { windowId, pocketbaseUrl, pocketbaseCollection, pocketbaseRecord }: Props = $props();

  // State
  let data = $state<ProfileData>(profileData);
  let isLoading = $state(true);
  let activeTab = $state<'about' | 'experience' | 'education' | 'skills' | 'projects'>('about');
  let animatedSkills = $state<Set<string>>(new Set());
  let visibleExperiences = $state<Set<string>>(new Set());
  let headerVisible = $state(false);

  // Category labels for skills
  const categoryLabels: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    devops: 'DevOps',
    tools: 'Tools',
    soft: 'Soft Skills'
  };

  // Category colors
  const categoryColors: Record<string, string> = {
    frontend: '#6366f1',
    backend: '#22c55e',
    devops: '#f59e0b',
    tools: '#ec4899',
    soft: '#06b6d4'
  };

  // Group skills by category
  function getSkillsByCategory(): Map<string, Skill[]> {
    const grouped = new Map<string, Skill[]>();
    for (const skill of data.skills) {
      if (!grouped.has(skill.category)) {
        grouped.set(skill.category, []);
      }
      grouped.get(skill.category)!.push(skill);
    }
    return grouped;
  }

  // Format date range
  function formatDateRange(start: string, end: string | 'Present'): string {
    const startDate = new Date(start + '-01');
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (end === 'Present') {
      return `${startFormatted} - Present`;
    }

    const endDate = new Date(end + '-01');
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  }

  // Get availability status styles
  function getAvailabilityStyles(): { bg: string; text: string; dot: string } {
    switch (data.availability) {
      case 'available':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', dot: '#22c55e' };
      case 'busy':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', dot: '#f59e0b' };
      case 'not-looking':
        return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', dot: '#6b7280' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366f1', dot: '#6366f1' };
    }
  }

  // Social icon SVG paths
  function getSocialIcon(icon: string): string {
    const icons: Record<string, string> = {
      github: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
      linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
      devto: 'M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .65-.08.84-.23.21-.16.31-.44.31-.83v-2.23c0-.4-.1-.67-.31-.84zM0 0v24h24V0H0zm8.56 15.8c-.44.58-1.06.77-2.53.77H3.18V7.43h2.81c1.04 0 1.68.15 2.24.54.68.47 1.1 1.36 1.1 2.89v1.53c0 1.58-.29 2.69-.77 3.41zm6.89-5.21c0 .9-.48 1.12-1.12 1.12h-.59v2.47h-2.55V7.43h3.66c.95 0 1.66.59 1.66 1.89v1.27zm5.36 4.28c-.68.99-1.56 1.21-2.38 1.21-.83 0-1.48-.32-1.92-.77-.57-.59-.88-1.5-.88-2.66v-2.28c0-1.36.48-2.34 1.25-2.93.6-.46 1.37-.69 2.25-.69.96 0 1.83.35 2.41 1.04.46.55.68 1.19.68 2.12v1.05h-4.02v.85c0 .79.4 1.21.98 1.21.44 0 .76-.25.9-.72h2.09c-.21 1.02-.64 1.71-1.36 2.57z'
    };
    return icons[icon] || icons.github;
  }

  // Load data on mount
  onMount(async () => {
    // Try to fetch from PocketBase if configured
    if (pocketbaseUrl && pocketbaseCollection && pocketbaseRecord) {
      const pbData = await fetchFromPocketBase({
        url: pocketbaseUrl,
        collectionId: pocketbaseCollection,
        recordId: pocketbaseRecord
      });
      if (pbData) {
        data = pbData;
      }
    }

    isLoading = false;

    // Trigger header animation
    setTimeout(() => {
      headerVisible = true;
    }, 100);

    // Animate skills when tab changes to skills
    if (activeTab === 'skills') {
      animateSkills();
    }

    console.log(`About Me plugin mounted (window: ${windowId})`);
  });

  // Animate skills progressively
  function animateSkills() {
    animatedSkills = new Set();
    let delay = 0;
    for (const skill of data.skills) {
      setTimeout(() => {
        animatedSkills = new Set([...animatedSkills, skill.name]);
      }, delay);
      delay += 50;
    }
  }

  // Handle tab change
  function handleTabChange(tab: typeof activeTab) {
    activeTab = tab;
    if (tab === 'skills') {
      animateSkills();
    }
    if (tab === 'experience') {
      // Animate experiences
      visibleExperiences = new Set();
      let delay = 0;
      for (const exp of data.experience) {
        setTimeout(() => {
          visibleExperiences = new Set([...visibleExperiences, exp.id]);
        }, delay);
        delay += 150;
      }
    }
  }

  // Download resume handler
  function downloadResume() {
    if (data.resumeUrl) {
      window.open(data.resumeUrl, '_blank');
    }
  }
</script>

<div class="about-me">
  <!-- Glass overlay effect -->
  <div class="glass-overlay"></div>

  {#if isLoading}
    <!-- Loading State -->
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading profile...</span>
    </div>
  {:else}
    <!-- Scrollable Content -->
    <div class="content-wrapper">
      <!-- Hero Section -->
      <header class="hero" class:visible={headerVisible}>
        <div class="hero-bg">
          <div class="hero-gradient"></div>
          <div class="hero-pattern"></div>
        </div>

        <div class="hero-content">
          <!-- Avatar -->
          <div class="avatar-container">
            <div class="avatar-ring"></div>
            <img src={data.avatar} alt={data.name} class="avatar" />
            <div class="availability-indicator" style="background: {getAvailabilityStyles().dot}"></div>
          </div>

          <!-- Name & Title -->
          <div class="hero-info">
            <h1 class="name">{data.name}</h1>
            <p class="title">{data.title}</p>
            <p class="tagline">{data.tagline}</p>

            <!-- Location & Contact -->
            <div class="contact-row">
              <span class="contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {data.location}
              </span>
              <span class="contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {data.email}
              </span>
            </div>

            <!-- Availability Badge -->
            <div class="availability-badge" style="background: {getAvailabilityStyles().bg}; color: {getAvailabilityStyles().text}">
              <span class="availability-dot" style="background: {getAvailabilityStyles().dot}"></span>
              {data.availabilityMessage || (data.availability === 'available' ? 'Available for work' : data.availability === 'busy' ? 'Currently busy' : 'Not looking')}
            </div>
          </div>

          <!-- Social Links -->
          <div class="social-links">
            {#each data.socials as social}
              <a href={social.url} target="_blank" rel="noopener noreferrer" class="social-link" title={social.platform}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d={getSocialIcon(social.icon)} />
                </svg>
              </a>
            {/each}
          </div>

          <!-- Resume Button -->
          {#if data.resumeUrl}
            <button class="resume-btn" onclick={downloadResume}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Resume
            </button>
          {/if}
        </div>
      </header>

      <!-- Navigation Tabs -->
      <nav class="tabs">
        <button
          class="tab"
          class:active={activeTab === 'about'}
          onclick={() => handleTabChange('about')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          About
        </button>
        <button
          class="tab"
          class:active={activeTab === 'skills'}
          onclick={() => handleTabChange('skills')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
          </svg>
          Skills
        </button>
        <button
          class="tab"
          class:active={activeTab === 'experience'}
          onclick={() => handleTabChange('experience')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
          </svg>
          Experience
        </button>
        <button
          class="tab"
          class:active={activeTab === 'education'}
          onclick={() => handleTabChange('education')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>
          </svg>
          Education
        </button>
        <button
          class="tab"
          class:active={activeTab === 'projects'}
          onclick={() => handleTabChange('projects')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          Projects
        </button>
      </nav>

      <!-- Tab Content -->
      <main class="tab-content">
        <!-- About Tab -->
        {#if activeTab === 'about'}
          <section class="section about-section fade-in">
            <h2 class="section-title">About Me</h2>
            <div class="bio">
              {#each data.bio.split('\n\n') as paragraph}
                <p>{paragraph}</p>
              {/each}
            </div>

            <!-- Languages -->
            <div class="subsection">
              <h3 class="subsection-title">Languages</h3>
              <div class="language-list">
                {#each data.languages as lang}
                  <div class="language-item">
                    <span class="language-name">{lang.name}</span>
                    <span class="language-level">{lang.level}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Interests -->
            <div class="subsection">
              <h3 class="subsection-title">Interests</h3>
              <div class="interests-grid">
                {#each data.interests as interest}
                  <span class="interest-tag">{interest}</span>
                {/each}
              </div>
            </div>
          </section>
        {/if}

        <!-- Skills Tab -->
        {#if activeTab === 'skills'}
          <section class="section skills-section fade-in">
            <h2 class="section-title">Technical Skills</h2>

            {#each [...getSkillsByCategory()] as [category, skills]}
              <div class="skill-category">
                <h3 class="category-title" style="color: {categoryColors[category] || '#6366f1'}">
                  <span class="category-dot" style="background: {categoryColors[category] || '#6366f1'}"></span>
                  {categoryLabels[category] || category}
                </h3>
                <div class="skills-grid">
                  {#each skills as skill}
                    <div class="skill-item" class:animated={animatedSkills.has(skill.name)}>
                      <div class="skill-header">
                        <span class="skill-name">{skill.name}</span>
                        <span class="skill-percent">{skill.level}%</span>
                      </div>
                      <div class="skill-bar">
                        <div
                          class="skill-progress"
                          style="width: {animatedSkills.has(skill.name) ? skill.level : 0}%; background: {skill.color || categoryColors[skill.category] || '#6366f1'}"
                        ></div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </section>
        {/if}

        <!-- Experience Tab -->
        {#if activeTab === 'experience'}
          <section class="section experience-section fade-in">
            <h2 class="section-title">Work Experience</h2>

            <div class="timeline">
              {#each data.experience as exp, i}
                <div class="timeline-item" class:visible={visibleExperiences.has(exp.id)}>
                  <div class="timeline-marker">
                    <div class="timeline-dot"></div>
                    {#if i < data.experience.length - 1}
                      <div class="timeline-line"></div>
                    {/if}
                  </div>

                  <div class="timeline-content">
                    <div class="exp-header">
                      <h3 class="exp-title">{exp.title}</h3>
                      <span class="exp-date">{formatDateRange(exp.startDate, exp.endDate)}</span>
                    </div>

                    <div class="exp-company">
                      {#if exp.companyUrl}
                        <a href={exp.companyUrl} target="_blank" rel="noopener noreferrer">{exp.company}</a>
                      {:else}
                        {exp.company}
                      {/if}
                      <span class="exp-location">| {exp.location}</span>
                    </div>

                    <p class="exp-description">{exp.description}</p>

                    <ul class="exp-highlights">
                      {#each exp.highlights as highlight}
                        <li>{highlight}</li>
                      {/each}
                    </ul>

                    <div class="exp-tech">
                      {#each exp.technologies as tech}
                        <span class="tech-tag">{tech}</span>
                      {/each}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Education Tab -->
        {#if activeTab === 'education'}
          <section class="section education-section fade-in">
            <h2 class="section-title">Education</h2>

            <div class="education-list">
              {#each data.education as edu}
                <div class="education-item">
                  <div class="edu-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>
                    </svg>
                  </div>

                  <div class="edu-content">
                    <h3 class="edu-degree">{edu.degree} in {edu.field}</h3>
                    <div class="edu-institution">
                      {#if edu.institutionUrl}
                        <a href={edu.institutionUrl} target="_blank" rel="noopener noreferrer">{edu.institution}</a>
                      {:else}
                        {edu.institution}
                      {/if}
                    </div>
                    <div class="edu-meta">
                      <span>{edu.location}</span>
                      <span class="edu-dates">{edu.startDate} - {edu.endDate}</span>
                    </div>
                    {#if edu.gpa}
                      <div class="edu-gpa">GPA: {edu.gpa}</div>
                    {/if}
                    {#if edu.honors && edu.honors.length > 0}
                      <div class="edu-honors">
                        {#each edu.honors as honor}
                          <span class="honor-tag">{honor}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Projects Tab -->
        {#if activeTab === 'projects'}
          <section class="section projects-section fade-in">
            <h2 class="section-title">Featured Projects</h2>

            <div class="projects-grid">
              {#each data.projects.filter(p => p.featured) as project}
                <div class="project-card">
                  <div class="project-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    </svg>
                    <h3 class="project-name">{project.name}</h3>
                    <div class="project-links">
                      {#if project.github}
                        <a href={project.github} target="_blank" rel="noopener noreferrer" title="View on GitHub">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d={getSocialIcon('github')} />
                          </svg>
                        </a>
                      {/if}
                      {#if project.url}
                        <a href={project.url} target="_blank" rel="noopener noreferrer" title="View Live">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                            <polyline points="15,3 21,3 21,9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      {/if}
                    </div>
                  </div>

                  <p class="project-description">{project.description}</p>

                  <div class="project-tech">
                    {#each project.technologies as tech}
                      <span class="tech-tag">{tech}</span>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </main>

      <!-- Footer -->
      <footer class="footer">
        <span class="footer-text">Built with rdtect OS</span>
      </footer>
    </div>
  {/if}
</div>

<style>
  /* ============================================
     Base Styles
     ============================================ */
  .about-me {
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #0a0f1a 0%, #111827 50%, #0f172a 100%);
    font-family: 'SF Pro Display', 'Inter', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
    color: #e2e8f0;
  }

  .glass-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.03) 0%,
      rgba(99, 102, 241, 0.01) 50%,
      rgba(99, 102, 241, 0.05) 100%
    );
    pointer-events: none;
  }

  .content-wrapper {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    z-index: 1;
  }

  .content-wrapper::-webkit-scrollbar {
    width: 8px;
  }

  .content-wrapper::-webkit-scrollbar-track {
    background: transparent;
  }

  .content-wrapper::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 4px;
  }

  .content-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }

  /* ============================================
     Loading State
     ============================================ */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    color: #64748b;
    font-size: 0.9rem;
  }

  /* ============================================
     Hero Section
     ============================================ */
  .hero {
    position: relative;
    padding: 2.5rem 2rem 2rem;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hero.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .hero-gradient {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%);
  }

  .hero-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.5;
  }

  .hero-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  /* Avatar */
  .avatar-container {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .avatar-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #6366f1 100%);
    animation: ring-rotate 3s linear infinite;
  }

  @keyframes ring-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .avatar {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 4px solid #0f172a;
    object-fit: cover;
    background: #1e293b;
  }

  .availability-indicator {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid #0f172a;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }

  /* Hero Info */
  .hero-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .name {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .title {
    font-size: 1.1rem;
    color: #6366f1;
    font-weight: 500;
    margin: 0;
  }

  .tagline {
    font-size: 0.9rem;
    color: #64748b;
    margin: 0;
    font-style: italic;
  }

  .contact-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .contact-item svg {
    color: #6366f1;
  }

  .availability-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 0.5rem;
  }

  .availability-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  /* Social Links */
  .social-links {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #94a3b8;
    transition: all 0.2s ease;
  }

  .social-link:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    color: #6366f1;
    transform: translateY(-2px);
  }

  /* Resume Button */
  .resume-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 0.5rem;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  }

  .resume-btn:hover {
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  /* ============================================
     Navigation Tabs
     ============================================ */
  .tabs {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 1rem 1.25rem;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .tab::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #6366f1;
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }

  .tab:hover {
    color: #94a3b8;
  }

  .tab.active {
    color: #6366f1;
  }

  .tab.active::after {
    transform: scaleX(1);
  }

  /* ============================================
     Tab Content
     ============================================ */
  .tab-content {
    padding: 1.5rem 2rem;
  }

  .section {
    max-width: 800px;
    margin: 0 auto;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 1.5rem;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .section-title::before {
    content: '';
    width: 4px;
    height: 24px;
    background: linear-gradient(180deg, #6366f1 0%, #a855f7 100%);
    border-radius: 2px;
  }

  /* Fade in animation */
  .fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ============================================
     About Section
     ============================================ */
  .bio {
    font-size: 0.95rem;
    line-height: 1.8;
    color: #94a3b8;
  }

  .bio p {
    margin: 0 0 1rem;
  }

  .bio p:last-child {
    margin-bottom: 0;
  }

  .subsection {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
  }

  .subsection-title {
    font-size: 1rem;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 1rem;
  }

  .language-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .language-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 8px;
  }

  .language-name {
    font-weight: 500;
    color: #e2e8f0;
  }

  .language-level {
    font-size: 0.8rem;
    color: #64748b;
  }

  .interests-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .interest-tag {
    padding: 0.4rem 0.8rem;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 6px;
    font-size: 0.85rem;
    color: #a5b4fc;
  }

  /* ============================================
     Skills Section
     ============================================ */
  .skill-category {
    margin-bottom: 2rem;
  }

  .skill-category:last-child {
    margin-bottom: 0;
  }

  .category-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .skill-item {
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .skill-item:hover {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(30, 41, 59, 0.7);
  }

  .skill-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .skill-name {
    font-weight: 500;
    color: #e2e8f0;
    font-size: 0.9rem;
  }

  .skill-percent {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
  }

  .skill-bar {
    height: 6px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 3px;
    overflow: hidden;
  }

  .skill-progress {
    height: 100%;
    border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px currentColor;
  }

  /* ============================================
     Experience Section
     ============================================ */
  .timeline {
    position: relative;
  }

  .timeline-item {
    display: flex;
    gap: 1.5rem;
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.4s ease;
  }

  .timeline-item.visible {
    opacity: 1;
    transform: translateX(0);
  }

  .timeline-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .timeline-dot {
    width: 14px;
    height: 14px;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    border-radius: 50%;
    border: 3px solid #0f172a;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    z-index: 1;
  }

  .timeline-line {
    width: 2px;
    flex: 1;
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0.1) 100%);
    margin: 0.5rem 0;
  }

  .timeline-content {
    flex: 1;
    padding-bottom: 2rem;
  }

  .exp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .exp-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .exp-date {
    font-size: 0.8rem;
    color: #6366f1;
    font-weight: 500;
    padding: 0.25rem 0.75rem;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 4px;
  }

  .exp-company {
    font-size: 0.95rem;
    color: #94a3b8;
    margin-bottom: 0.75rem;
  }

  .exp-company a {
    color: #6366f1;
    text-decoration: none;
  }

  .exp-company a:hover {
    text-decoration: underline;
  }

  .exp-location {
    color: #64748b;
  }

  .exp-description {
    font-size: 0.9rem;
    color: #94a3b8;
    margin: 0 0 0.75rem;
    line-height: 1.6;
  }

  .exp-highlights {
    margin: 0 0 1rem;
    padding-left: 1.25rem;
  }

  .exp-highlights li {
    font-size: 0.85rem;
    color: #94a3b8;
    margin-bottom: 0.4rem;
    line-height: 1.5;
  }

  .exp-highlights li::marker {
    color: #6366f1;
  }

  .exp-tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .tech-tag {
    padding: 0.25rem 0.6rem;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 4px;
    font-size: 0.75rem;
    color: #a5b4fc;
    font-weight: 500;
  }

  /* ============================================
     Education Section
     ============================================ */
  .education-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .education-item {
    display: flex;
    gap: 1.25rem;
    padding: 1.5rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .education-item:hover {
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }

  .edu-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
    border-radius: 12px;
    color: #6366f1;
  }

  .edu-content {
    flex: 1;
  }

  .edu-degree {
    font-size: 1.1rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0 0 0.25rem;
  }

  .edu-institution {
    font-size: 0.95rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .edu-institution a {
    color: #6366f1;
    text-decoration: none;
  }

  .edu-institution a:hover {
    text-decoration: underline;
  }

  .edu-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .edu-dates {
    color: #6366f1;
  }

  .edu-gpa {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .edu-honors {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .honor-tag {
    padding: 0.25rem 0.6rem;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 4px;
    font-size: 0.75rem;
    color: #22c55e;
    font-weight: 500;
  }

  /* ============================================
     Projects Section
     ============================================ */
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .project-card {
    padding: 1.25rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .project-card:hover {
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .project-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .project-header svg {
    color: #6366f1;
    flex-shrink: 0;
  }

  .project-name {
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
    flex: 1;
  }

  .project-links {
    display: flex;
    gap: 0.5rem;
  }

  .project-links a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.1);
    color: #94a3b8;
    transition: all 0.2s ease;
  }

  .project-links a:hover {
    background: rgba(99, 102, 241, 0.2);
    color: #6366f1;
  }

  .project-description {
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0 0 1rem;
  }

  .project-tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  /* ============================================
     Footer
     ============================================ */
  .footer {
    text-align: center;
    padding: 1.5rem;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
  }

  .footer-text {
    font-size: 0.75rem;
    color: rgba(99, 102, 241, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  /* ============================================
     Responsive Design
     ============================================ */
  @media (max-width: 640px) {
    .hero {
      padding: 2rem 1rem 1.5rem;
    }

    .avatar-container {
      width: 100px;
      height: 100px;
    }

    .name {
      font-size: 1.5rem;
    }

    .title {
      font-size: 1rem;
    }

    .tabs {
      overflow-x: auto;
      justify-content: flex-start;
      padding: 0 0.5rem;
    }

    .tab {
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .tab svg {
      display: none;
    }

    .tab-content {
      padding: 1rem;
    }

    .section-title {
      font-size: 1.25rem;
    }

    .skills-grid {
      grid-template-columns: 1fr;
    }

    .timeline-item {
      gap: 1rem;
    }

    .exp-header {
      flex-direction: column;
    }

    .education-item {
      flex-direction: column;
      gap: 1rem;
    }

    .edu-icon {
      width: 40px;
      height: 40px;
    }

    .projects-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
