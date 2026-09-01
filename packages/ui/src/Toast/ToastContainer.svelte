<script lang="ts">
  /**
   * ToastContainer — O1 Design System
   *
   * Renders the active toast queue from the toast store in a fixed
   * region with aria-live announcements.
   */
  import { toasts } from './toast-store';
  import { dismissToast } from './toast-store';
  import Toast from './Toast.svelte';
  import type { ToastPosition } from '../types';

  interface Props {
    /** Screen corner the stack is anchored to */
    position?: ToastPosition;
    /** Additional CSS classes for the container */
    class?: string;
  }

  let { position = 'bottom-right', class: className = '' }: Props = $props();

  const POSITION_CLASS: Record<ToastPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
</script>

{#if $toasts.length > 0}
  <div
    class="pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-2
      p-4 {POSITION_CLASS[position]} {className}"
    role="region"
    aria-label="Notifications"
  >
    <ul class="flex flex-col gap-2">
      {#each $toasts as toast (toast.id)}
        <Toast {toast} ondismiss={dismissToast} />
      {/each}
    </ul>
  </div>
{/if}

