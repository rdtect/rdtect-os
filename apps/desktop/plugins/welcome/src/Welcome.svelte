<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WelcomeStep from './WelcomeStep.svelte';
  import { createParticles, updateParticles, createTypewriter, type Particle } from './animations';

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
      title: 'What is rdtect OS?',
      subtitle: 'Discover the possibilities'
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

  // Featured apps to highlight
  const featuredApps = [
    { icon: '👤', name: 'About Me', description: 'Learn about the developer' },
    { icon: '🚀', name: 'Projects', description: 'View portfolio projects' },
    { icon: '📝', name: 'Blog', description: 'Read articles and thoughts' },
    { icon: '💬', name: 'Contact', description: 'Get in touch' }
  ];

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

      <!-- Step 2: What is rdtect OS? -->
      <WelcomeStep
        step={2}
        title={steps[1].title}
        subtitle={steps[1].subtitle}
        active={currentStep === 1}
        {direction}
      >
        <div class="step-2-content">
          <div class="feature-cards">
            <div class="feature-card">
              <div class="feature-icon">🖥️</div>
              <div class="feature-text">
                <h4>Desktop Experience</h4>
                <p>A fully functional desktop environment in your browser</p>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <div class="feature-text">
                <h4>Portfolio Showcase</h4>
                <p>Explore projects, skills, and creative work interactively</p>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <div class="feature-text">
                <h4>Modern Stack</h4>
                <p>Built with Svelte 5, TypeScript, and cutting-edge tech</p>
              </div>
            </div>
          </div>
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
              <div class="app-card" style="animation-delay: {i * 100}ms">
                <div class="app-icon">{app.icon}</div>
                <div class="app-info">
                  <span class="app-name">{app.name}</span>
                  <span class="app-description">{app.description}</span>
                </div>
              </div>
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
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 16px;
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
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;
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
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
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

  /* Step 2 content */
  .step-2-content {
    width: 100%;
  }

  .feature-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .feature-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    transition: all 0.2s;
    animation: slideIn 0.5s ease-out backwards;
  }

  .feature-card:nth-child(1) { animation-delay: 0.1s; }
  .feature-card:nth-child(2) { animation-delay: 0.2s; }
  .feature-card:nth-child(3) { animation-delay: 0.3s; }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
  }

  .feature-card:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateX(5px);
  }

  .feature-icon {
    font-size: 2rem;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.2);
    border-radius: 12px;
  }

  .feature-text h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .feature-text p {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }

  /* Step 3 content */
  .step-3-content {
    width: 100%;
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .app-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    animation: popIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
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
    background: rgba(99, 102, 241, 0.15);
    border-radius: 10px;
  }

  .app-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .app-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .app-description {
    font-size: 0.75rem;
    color: #64748b;
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

  .dont-show-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 8px;
    transition: all 0.2s;
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
    font-size: 0.9rem;
    color: #94a3b8;
  }
</style>
