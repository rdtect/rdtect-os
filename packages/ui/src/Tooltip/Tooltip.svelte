<script lang="ts">
  /**
   * Tooltip — O1 Design System
   *
   * Accessible tooltip that appears on hover (mouse) or focus (keyboard)
   * via CSS group-hover / group-focus-within. The trigger wrapper is
   * focusable and wired to the tooltip through aria-describedby.
   */
  import { type TooltipPosition } from '../types';

  type Children = import('svelte').Snippet | string | number | undefined;

  interface Props {
    /** Tooltip text content */
    text: string;
    /** Position relative to the trigger */
    position?: TooltipPosition;
    /** Disable the tooltip entirely */
    disabled?: boolean;
    /**
     * Set to true when the trigger child is itself focusable
     * (Button, Input, etc.) so it manages its own focus; otherwise the
     * wrapper span becomes the focusable trigger.
     */
    interactive?: boolean;
    /** Trigger element */
    children?: Children;
    /** Explicit id (auto-generated from text if omitted) */
    id?: string;
    /** Additional CSS classes for the trigger wrapper */
    class?: string;
  }

  let {
    text,
    position = 'top',
    disabled = false,
    interactive = false,
    children,
    id,
    class: className = '',
  }: Props = $props();

  const tooltipId = $derived(
    id ??
      `tooltip-${text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`
  );

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -- wrapper is an intentional focusable tooltip trigger -->
<span
  class="group relative inline-flex {className}"
  tabindex={interactive ? undefined : 0}
  aria-describedby={disabled ? undefined : tooltipId}
>
  {#if children}
    {#if typeof children === 'function'}
      {@render children()}
    {:else}
      {children}
    {/if}
  {/if}

  {#if !disabled}
    <span
      id={tooltipId}
      role="tooltip"
      class="pointer-events-none absolute z-50 whitespace-nowrap
        rounded-desktop-sm bg-desktop-subtle px-2 py-1
        text-desktop-xs text-desktop-text shadow-lg
        opacity-0 transition-opacity duration-150
        group-hover:opacity-100 group-focus-within:opacity-100
        {positionClasses[position]}"
    >
      {text}
    </span>
  {/if}
</span>
