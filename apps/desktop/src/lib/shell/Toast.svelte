<script lang="ts">
  import { toast, type ToastItem } from '$lib/core/toast.svelte';
  import { eventBus } from '$lib/core/event-bus';
  import { onMount } from 'svelte';

  // Wire eventBus notifications into the toast system
  onMount(() => {
    const unsub = eventBus.on('notification:show', (data) => {
      if (data) {
        const type = data.type ?? 'info';
        toast.show(data.message ?? data.title, type, data.duration);
      }
    });
    return unsub;
  });

  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };
</script>

{#if toast.items.length > 0}
  <div class="toast-stack" aria-live="polite">
    {#each toast.items as item (item.id)}
      <div class="toast-item toast-{item.type}" role="alert">
        <span class="toast-icon">{icons[item.type]}</span>
        <span class="toast-message">{item.message}</span>
        <button class="toast-close" onclick={() => toast.dismiss(item.id)} aria-label="Dismiss">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-stack {
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    font-size: var(--text-sm);
    color: #e2e8f0;
    min-width: 240px;
    max-width: 360px;
    pointer-events: auto;
    animation: toast-in var(--transition-slow) var(--transition-easing) forwards;
  }

  .toast-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .toast-success .toast-icon {
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  .toast-error .toast-icon {
    background: var(--color-error-bg);
    color: var(--color-error-text);
  }

  .toast-info .toast-icon {
    background: rgba(var(--desktop-accent-rgb), 0.15);
    color: var(--desktop-accent);
  }

  .toast-warning .toast-icon {
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }

  .toast-message {
    flex: 1;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition-fast);
    flex-shrink: 0;
  }

  .toast-close:hover {
    color: #94a3b8;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateX(24px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
