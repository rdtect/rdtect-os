<script lang="ts">
  /**
   * Badge — O1 Design System
   *
   * Small inline label for status, categories, or counts.
   */
  import { type BadgeVariant } from '../types';

  type Children = import('svelte').Snippet | string | number | undefined;

  interface Props {
    /** Visual variant */
    variant?: BadgeVariant;
    /** Whether to show as a dot indicator (no text, just a colored circle) */
    dot?: boolean;
    /** Badge content (ignored if dot is true) */
    children?: Children;
    /** Additional CSS classes */
    class?: string;
  }

  let {
    variant = 'default',
    dot = false,
    children,
    class: className = '',
  }: Props = $props();

  // ── Variant class map ───────────────────────────────────────────
  const variantClasses: Record<BadgeVariant, string> = {
    default:
      'bg-desktop-surface text-desktop-text-secondary border border-desktop-border',
    accent:
      'bg-desktop-accent/15 text-desktop-accent border border-desktop-accent/25',
    success:
      'bg-green-500/15 text-green-400 border border-green-500/25',
    warning:
      'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    error:
      'bg-red-500/15 text-red-400 border border-red-500/25',
    info:
      'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-desktop-text-muted',
    accent: 'bg-desktop-accent',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
  };
</script>

{#if dot}
  <span
    class="inline-block w-2 h-2 rounded-full {dotColors[variant]} {className}"
    aria-hidden="true"
  ></span>
{:else}
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 text-desktop-xs font-medium rounded-desktop-sm
      {variantClasses[variant]} {className}"
  >
    {#if children}
      {#if typeof children === 'function'}
        {@render children()}
      {:else}
        {children}
      {/if}
    {/if}
  </span>
{/if}
