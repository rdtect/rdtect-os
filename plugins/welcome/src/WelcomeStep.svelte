<script lang="ts">
  import { onMount } from 'svelte';
  import { getStaggerDelay } from './animations';

  interface Props {
    step: number;
    title: string;
    subtitle?: string;
    active: boolean;
    direction: 'forward' | 'backward';
  }

  let { step, title, subtitle = '', active, direction }: Props = $props();

  let mounted = $state(false);
  let contentElements: HTMLElement[] = $state([]);

  onMount(() => {
    mounted = true;
  });

  // Calculate animation direction classes
  const getAnimationClass = () => {
    if (!active) return 'step-exit';
    return direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward';
  };
</script>

<div
  class="welcome-step"
  class:active
  class:step-enter-forward={active && direction === 'forward' && mounted}
  class:step-enter-backward={active && direction === 'backward' && mounted}
  class:step-exit={!active}
>
  <div class="step-header">
    <div class="step-indicator">
      <span class="step-number">{step}</span>
    </div>
    <h2 class="step-title">{title}</h2>
    {#if subtitle}
      <p class="step-subtitle">{subtitle}</p>
    {/if}
  </div>

  <div class="step-content">
    <slot />
  </div>
</div>

<style>
  .welcome-step {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .welcome-step.active {
    opacity: 1;
    pointer-events: auto;
  }

  /* Forward entry (from right) */
  .welcome-step.step-enter-forward {
    animation: slideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* Backward entry (from left) */
  .welcome-step.step-enter-backward {
    animation: slideInFromLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* Exit animation */
  .welcome-step.step-exit {
    animation: fadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(60px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-60px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }

  .step-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .step-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
    border: 2px solid rgba(99, 102, 241, 0.5);
    border-radius: 50%;
    margin-bottom: 1rem;
    animation: pulseGlow 2s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.2);
    }
  }

  .step-number {
    font-size: 1.1rem;
    font-weight: 700;
    color: #a5b4fc;
    text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  }

  .step-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .step-subtitle {
    font-size: 1rem;
    color: #94a3b8;
    margin: 0;
    max-width: 400px;
    line-height: 1.5;
  }

  .step-content {
    width: 100%;
    max-width: 500px;
    animation: contentFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
  }

  .welcome-step.active .step-content {
    animation: contentFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
  }

  @keyframes contentFadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
