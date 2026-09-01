<script lang="ts">
  /**
   * Card — O1 Design System
   *
   * Theme-aware surface container with multiple visual variants.
   * Supports header, body, and footer sections via snippets.
   */
  import { type CardVariant } from '../types';

  type Content = import('svelte').Snippet | string | number | undefined;

  interface Props {
    /** Visual variant */
    variant?: CardVariant;
    /** Optional padding control */
    padded?: boolean;
    /** Click handler (makes card interactive) */
    onclick?: (e: MouseEvent) => void;
    /** Card header content */
    header?: Content;
    /** Card body content */
    children?: Content;
    /** Card footer content */
    footer?: Content;
    /** Additional CSS classes */
    class?: string;
  }

  let {
    variant = 'default',
    padded = true,
    onclick,
    header,
    children,
    footer,
    class: className = '',
  }: Props = $props();

  // ── Variant class map ───────────────────────────────────────────
  const baseClasses = 'rounded-desktop-lg';

  const variantClasses: Record<CardVariant, string> = {
    default:
      'bg-desktop-surface text-desktop-text border border-desktop-border',
    elevated:
      'bg-desktop-surface text-desktop-text shadow-lg border border-desktop-border/50',
    bordered:
      'bg-transparent text-desktop-text border border-desktop-border',
    ghost:
      'bg-transparent text-desktop-text border border-transparent',
  };

  const interactive = $derived(!!onclick);

  const interactiveClasses = $derived(
    interactive
      ? 'cursor-pointer transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-desktop-accent'
      : ''
  );

  const paddingClasses = $derived(padded ? 'p-3' : '');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -- interactive cards act as buttons -->
<div
  class="{baseClasses} {variantClasses[variant]} {paddingClasses} {interactiveClasses} {className}"
  role={interactive ? 'button' : undefined}
  tabindex={interactive ? 0 : undefined}
  {onclick}
  onkeydown={interactive ? (e) => { if (e.key === 'Enter') onclick?.(e as unknown as MouseEvent); } : undefined}
>
  {#if header}
    <div class="mb-3">
      {#if typeof header === 'function'}
        {@render header()}
      {:else}
        {header}
      {/if}
    </div>
  {/if}

  {#if children}
    {#if typeof children === 'function'}
      {@render children()}
    {:else}
      {children}
    {/if}
  {/if}

  {#if footer}
    <div class="mt-3 pt-3 border-t border-desktop-border">
      {#if typeof footer === 'function'}
        {@render footer()}
      {:else}
        {footer}
      {/if}
    </div>
  {/if}
</div>
