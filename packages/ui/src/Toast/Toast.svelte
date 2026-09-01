<script lang="ts">
  /**
   * Toast — O1 Design System
   *
   * Single toast item rendered inside ToastContainer. Announced to
   * screen readers via role="status" (role="alert" for errors).
   */
  import type { Toast } from './toast-store';
  import { toastRole } from './toast-store';

  interface Props {
    /** Toast data */
    toast: Toast;
    /** Dismiss handler */
    ondismiss?: (id: number) => void;
    /** Additional CSS classes */
    class?: string;
  }

  let { toast, ondismiss, class: className = '' }: Props = $props();

  const KIND_CLASS: Record<string, { border: string; icon: string; label: string }> = {
    info: { border: 'border-desktop-border', icon: 'text-desktop-accent', label: 'ℹ' },
    success: { border: 'border-desktop-success', icon: 'text-desktop-success', label: '✓' },
    warning: { border: 'border-yellow-500', icon: 'text-yellow-500', label: '⚠' },
    error: { border: 'border-desktop-error', icon: 'text-desktop-error', label: '✕' },
  };

  const kindClass = $derived(KIND_CLASS[toast.kind] ?? KIND_CLASS.info);
</script>

<li
  role={toastRole(toast.kind)}
  class="pointer-events-auto flex w-full items-start gap-3 rounded-desktop-md
    border bg-desktop-surface px-4 py-3 shadow-lg {kindClass.border} {className}"
>
  <span class="mt-0.5 text-desktop-base leading-none {kindClass.icon}" aria-hidden="true">
    {kindClass.label}
  </span>
  <div class="min-w-0 flex-1">
    {#if toast.title}
      <p class="text-desktop-sm font-semibold text-desktop-text">{toast.title}</p>
    {/if}
    {#if toast.message}
      <p class="text-desktop-sm text-desktop-text-secondary">{toast.message}</p>
    {/if}
  </div>
  <button
    type="button"
    aria-label="Dismiss notification"
    onclick={() => ondismiss?.(toast.id)}
    class="-mr-1 -mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center
      rounded-desktop-sm text-desktop-muted transition-colors hover:bg-desktop-subtle
      hover:text-desktop-text focus-visible:outline-none
      focus-visible:ring-2 focus-visible:ring-desktop-accent"
  >
    <span aria-hidden="true" class="text-desktop-sm leading-none">×</span>
  </button>
</li>

