<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WelcomeStep from './WelcomeStep.svelte';
  import { createParticles, updateParticles, createTypewriter, type Particle } from './animations';
  import { wm } from '$lib/shell';

  // Props from window manager
  interface Props {
    windowId?: string;
    onClose?: () => void;
  }
  let { windowId, onClose }: Props = $props();

  // State
  let currentStep = $state(0);
  let direction = $state<'forward' | 'backward'>('forward');
  let dontShowAgain = $state(false);
  let particles = $state<Particle[]>([]);
  let containerRef: HTMLElement | null = $state(null);
  let animationFrameId: number | null = null;
  let typedText = $state('');
  let showCursor = $state(true);

  // Storage key for "don't show again"
  const STORAGE_KEY = 'rdtect-os-welcome-dismissed';

  // Steps configuration
  const steps = [
    {
      title: 'Welcome to rdtect OS',
      subtitle: 'A web-based desktop experience'
    },
    {
      title: 'What brings you here?',
      subtitle: 'Choose your path'
    },
    {
      title: 'Explore the Apps',
      subtitle: 'Your toolkit awaits'
    },
    {
      title: 'Ready to Begin',
      subtitle: 'Your journey starts now'
    }
  ];

  const totalSteps = steps.length;

  // Audience paths for step 2
  const audiencePaths = [
    {
      id: 'work',
      icon: '💼',
      title: 'See my work',
      description: 'Portfolio, projects, and career journey',
      apps: ['about-me', 'project-gallery', 'stories']
    },
    {
      id: 'capabilities',
      icon: '🏢',
      title: 'Evaluate capabilities',
      description: 'Skills, experience, and professional background',
      apps: ['about-me', 'project-gallery']
    },
    {
      id: 'tech',
      icon: '⚡',
      title: 'Explore the tech',
      description: '3D experiences, creative tools, and the platform itself',
      apps: ['3d-experience', 'stories', 'app-store']
    }
  ];

  // Featured apps to highlight (appId maps to registered plugin IDs)
  const featuredApps = [
    { appId: 'about-me', icon: '👤', name: 'About Me', description: 'Interactive resume & career timeline' },
    { appId: 'project-gallery', icon: '🚀', name: 'Projects', description: 'Portfolio showcase gallery' },
    { appId: 'stories', icon: '📖', name: 'Stories', description: 'Thought leadership & insights' },
    { appId: '3d-experience', icon: '🌌', name: '3D Experience', description: 'Interactive 3D portfolio scene' },
    { appId: 'ai-chat', icon: '🤖', name: 'AI Chat', description: 'Chat with AI — Claude & Cloudflare' },
    { appId: 'service-hub', icon: '🖧', name: 'Service Hub', description: 'Self-hosted VPS services' }
  ];

  // Launch an app and close the wizard
  function launchApp(appId: string) {
    wm.openWindow(appId);
    handleClose();
  }

  // Launch apps for a specific audience path
  function choosePath(path: typeof audiencePaths[number]) {
    for (const appId of path.apps) {
      wm.openWindow(appId);
    }
    handleClose();
  }

  // Launch featured apps for exploration
  function exploreWork() {
    wm.openWindow('about-me');
    wm.openWindow('project-gallery');
    wm.openWindow('stories');
    handleClose();
  }

  // Typewriter text for step 1
  const welcomeText = "Welcome, explorer. You've discovered something special.";

  // Navigation functions
  function nextStep() {
    if (currentStep < totalSteps - 1) {
      direction = 'forward';
      currentStep++;
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      direction = 'backward';
      currentStep--;
    }
  }

  function skip() {
    handleClose();
  }

  function getStarted() {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    handleClose();
  }

  function handleClose() {
    if (onClose) {
      onClose();
    }
  }

  // Particle animation loop
  function animateParticles() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      particles = updateParticles(particles, rect.width, rect.height);
    }
    animationFrameId = requestAnimationFrame(animateParticles);
  }

  // Cursor blink effect
  let cursorInterval: ReturnType<typeof setInterval>;

  onMount(() => {
    // Initialize particles
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      particles = createParticles(30, rect.width, rect.height);
      animateParticles();
    }

    // Start typewriter effect
    const typewriter = createTypewriter({
      text: welcomeText,
      speed: 40,
      delay: 500
    });

    typewriter.subscribe((text) => {
      typedText = text;
    });

    typewriter.start();

    // Cursor blink
    cursorInterval = setInterval(() => {
      showCursor = !showCursor;
    }, 530);
  });

  onDestroy(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    if (cursorInterval) {
      clearInterval(cursorInterval);
    }
  });

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'Enter') {
      if (currentStep === totalSteps - 1) {
        getStarted();
      } else {
        nextStep();
      }
    } else if (event.key === 'ArrowLeft') {
      prevStep();
    } else if (event.key === 'Escape') {
      skip();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="welcome-container" bind:this={containerRef}>
  <!-- Particle background -->
  <div class="particles-container">
    {#each particles as particle (particle.id)}
      <div
        class="particle"
        style="
          left: {particle.x}px;
          top: {particle.y}px;
          width: {particle.size}px;
          height: {particle.size}px;
          background: {particle.color};
          opacity: {particle.opacity};
        "
      />
    {/each}
  </div>

  <!-- Gradient overlay -->
  <div class="gradient-overlay" />

  <!-- Glass container -->
  <div class="glass-container">
    <!-- Skip button -->
    <button class="skip-button" onclick={skip}>
      Skip
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Progress indicator -->
    <div class="progress-container">
      {#each steps as _, i}
        <button
          class="progress-dot"
          class:active={i === currentStep}
          class:completed={i < currentStep}
          onclick={() => {
            direction = i > currentStep ? 'forward' : 'backward';
            currentStep = i;
          }}
          aria-label="Go to step {i + 1}"
        >
          <span class="dot-inner" />
        </button>
      {/each}
    </div>

    <!-- Steps container -->
    <div class="steps-container">
      <!-- Step 1: Welcome -->
      <WelcomeStep
        step={1}
        title={steps[0].title}
        subtitle={steps[0].subtitle}
        active={currentStep === 0}
        {direction}
      >
        <div class="step-1-content">
          <div class="logo-container">
            <div class="logo-ring" />
            <div class="logo">
              <span class="logo-text">rd</span>
            </div>
          </div>
          <p class="typewriter-text">
            {typedText}<span class="cursor" class:visible={showCursor}>|</span>
          </p>
        </div>
      </WelcomeStep>

      <!-- Step 2: Audience paths -->
      <WelcomeStep
        step={2}
        title={steps[1].title}
        subtitle={steps[1].subtitle}
        active={currentStep === 1}
        {direction}
      >
        <div class="step-2-content">
          <div class="path-cards">
            {#each audiencePaths as path, i}
              <button
                class="path-card"
                style="animation-delay: {i * 100}ms"
                onclick={() => choosePath(path)}
              >
                <div class="path-icon">{path.icon}</div>
                <div class="path-text">
                  <h4>{path.title}</h4>
                  <p>{path.description}</p>
                </div>
                <div class="path-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            {/each}
          </div>
          <p class="or-browse">or browse all apps below →</p>
        </div>
      </WelcomeStep>

      <!-- Step 3: Explore Apps -->
      <WelcomeStep
        step={3}
        title={steps[2].title}
        subtitle={steps[2].subtitle}
        active={currentStep === 2}
        {direction}
      >
        <div class="step-3-content">
          <div class="apps-grid">
            {#each featuredApps as app, i}
              <button class="app-card" style="animation-delay: {i * 80}ms" onclick={() => launchApp(app.appId)}>
                <div class="app-icon">{app.icon}</div>
                <div class="app-info">
                  <span class="app-name">{app.name}</span>
                  <span class="app-description">{app.description}</span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </WelcomeStep>

      <!-- Step 4: Get Started -->
      <WelcomeStep
        step={4}
        title={steps[3].title}
        subtitle={steps[3].subtitle}
        active={currentStep === 3}
        {direction}
      >
        <div class="step-4-content">
          <div class="ready-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          </div>
          <p class="ready-text">
            You're all set! Click anywhere on the desktop to start exploring, or use the taskbar to launch apps.
          </p>
          <button class="explore-button" onclick={exploreWork}>
            Explore My Work
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <label class="dont-show-checkbox">
            <input type="checkbox" bind:checked={dontShowAgain} />
            <span class="checkbox-custom" />
            <span class="checkbox-label">Don't show this again</span>
          </label>
        </div>
      </WelcomeStep>
    </div>

    <!-- Navigation buttons -->
    <div class="navigation">
      <button
        class="nav-button prev"
        onclick={prevStep}
        disabled={currentStep === 0}
        aria-label="Previous step"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <button
        class="nav-button next"
        onclick={currentStep === totalSteps - 1 ? getStarted : nextStep}
        aria-label={currentStep === totalSteps - 1 ? 'Get started' : 'Next step'}
      >
        {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
  .welcome-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #0f172a;
    overflow: hidden;
  }

  /* Particles */
  .particles-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    border-radius: 50%;
    filter: blur(1px);
    transition: opacity 0.3s;
  }

  /* Gradient overlay */
  .gradient-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 0%,
      rgba(10, 15, 26, 0.3) 50%,
      rgba(10, 15, 26, 0.8) 100%
    );
    pointer-events: none;
  }

  /* Glass container */
  .glass-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--glass-bg-default);
    backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  /* Skip button */
  .skip-button {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-md);
    color: #94a3b8;
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    z-index: 10;
    min-height: 44px;
  }

  .skip-button:hover {
    background: rgba(99, 102, 241, 0.15);
    color: #e2e8f0;
    border-color: rgba(99, 102, 241, 0.3);
  }

  /* Progress indicator */
  .progress-container {
    position: absolute;
    top: 1.25rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.75rem;
    z-index: 10;
  }

  .progress-dot {
    width: 32px;
    height: 8px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    padding: 0;
    overflow: hidden;
  }

  .progress-dot .dot-inner {
    display: block;
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-dot.active .dot-inner,
  .progress-dot.completed .dot-inner {
    width: 100%;
  }

  .progress-dot:hover {
    border-color: rgba(99, 102, 241, 0.4);
    transform: scaleY(1.2);
  }

  /* Steps container */
  .steps-container {
    position: relative;
    flex: 1;
    overflow: hidden;
  }

  /* Navigation */
  .navigation {
    display: flex;
    justify-content: space-between;
    padding: 1.25rem 2rem;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
  }

  .nav-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-lg);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    min-height: 44px;
  }

  .nav-button.prev {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #94a3b8;
  }

  .nav-button.prev:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.15);
    color: #e2e8f0;
    border-color: rgba(99, 102, 241, 0.3);
  }

  .nav-button.prev:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .nav-button.next {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  }

  .nav-button.next:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  /* Step 1 content */
  .step-1-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .logo-container {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-ring {
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-top-color: #6366f1;
    border-right-color: #8b5cf6;
    border-radius: 50%;
    animation: spin 3s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .logo {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.4);
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .logo-text {
    font-size: 2rem;
    font-weight: 800;
    color: white;
    letter-spacing: -0.05em;
  }

  .typewriter-text {
    font-size: 1.1rem;
    color: #94a3b8;
    text-align: center;
    min-height: 1.5em;
  }

  .cursor {
    opacity: 0;
    transition: opacity 0.1s;
    color: #6366f1;
  }

  .cursor.visible {
    opacity: 1;
  }

  /* Step 2 content — audience paths */
  .step-2-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .path-cards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .path-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--glass-bg-subtle);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    animation: slideIn 0.5s ease-out backwards;
    text-align: left;
    width: 100%;
    min-height: 44px;
    color: inherit;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
  }

  .path-card:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateX(5px);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
  }

  .path-icon {
    font-size: 1.75rem;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-lg);
    flex-shrink: 0;
  }

  .path-text {
    flex: 1;
  }

  .path-text h4 {
    margin: 0 0 0.2rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .path-text p {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
  }

  .path-arrow {
    color: #475569;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .path-card:hover .path-arrow {
    color: #a5b4fc;
    transform: translateX(4px);
  }

  .or-browse {
    font-size: var(--text-xs);
    color: #475569;
    margin: 0;
  }

  /* Step 3 content */
  .step-3-content {
    width: 100%;
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .app-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 0.5rem;
    background: var(--glass-bg-subtle);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    animation: popIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    text-align: center;
    color: inherit;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  .app-card:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
  }

  .app-icon {
    font-size: 1.75rem;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--desktop-accent-rgb), 0.15);
    border-radius: var(--radius-lg);
  }

  .app-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .app-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .app-description {
    font-size: 0.65rem;
    color: #64748b;
    line-height: 1.3;
  }

  /* Step 4 content */
  .step-4-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
  }

  .ready-icon {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
    border: 2px solid rgba(34, 197, 94, 0.4);
    border-radius: 50%;
    color: #22c55e;
    animation: checkmarkPop 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes checkmarkPop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .ready-text {
    font-size: 1rem;
    color: #94a3b8;
    max-width: 350px;
    line-height: 1.6;
    margin: 0;
  }

  .explore-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    color: white;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    transition: all var(--transition-normal) var(--transition-easing);
    min-height: 44px;
  }

  .explore-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  .explore-button:active {
    transform: translateY(0);
  }

  .dont-show-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.75rem 1rem;
    background: var(--glass-bg-subtle);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .dont-show-checkbox:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.25);
  }

  .dont-show-checkbox input {
    display: none;
  }

  .checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(99, 102, 241, 0.4);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .dont-show-checkbox input:checked + .checkbox-custom {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: #6366f1;
  }

  .dont-show-checkbox input:checked + .checkbox-custom::after {
    content: '';
    width: 6px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    margin-bottom: 2px;
  }

  .checkbox-label {
    font-size: var(--text-sm);
    color: #94a3b8;
  }

  .skip-button:focus-visible,
  .nav-button:focus-visible,
  .progress-dot:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .particle {
      display: none;
    }
    .logo-ring {
      animation: none;
    }
    .logo {
      animation: none;
    }
    .feature-card {
      animation: none;
    }
    .app-card {
      animation: none;
    }
    .ready-icon {
      animation: none;
    }
  }
</style>
