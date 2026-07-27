<script lang="ts">
  /**
   * Button — O1 Design System
   *
   * Theme-aware button component with multiple variants and sizes.
   * Uses CSS custom properties set by ThemeProvider for dynamic theming.
   */
  import { SIZE_MAP, type ButtonVariant, type ComponentSize } from '../types';

  /**
   * Accept both Snippet functions (normal Svelte usage) and raw content
   * (testing library usage).
   */
  type Children = import('svelte').Snippet | string | number | undefined;

  interface Props {
    /** Visual variant */
    variant?: ButtonVariant;
    /** Size preset */
    size?: ComponentSize;
    /** Disabled state */
    disabled?: boolean;
    /** Full width button */
    fullWidth?: boolean;
    /** Button type attribute */
    type?: 'button' | 'submit' | 'reset';
    /** Click handler */
    onclick?: (e: MouseEvent) => void;
    /** Icon to show before label */
    icon?: string;
    /** Icon to show after label */
    iconRight?: string;
    /** Button content */
    children?: Children;
    /** Additional CSS classes */
    class?: string;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    fullWidth = false,
    type = 'button',
    onclick,
    icon,
    iconRight,
    children,
    class: className = '',
  }: Props = $props();

  // ── Variant class map ───────────────────────────────────────────
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-desktop-accent text-white hover:bg-desktop-accent-hover ' +
      'active:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-desktop-accent ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-desktop-bg ' +
      'shadow-sm',
    secondary:
      'bg-desktop-surface text-desktop-text border border-desktop-border ' +
      'hover:bg-desktop-surface/80 hover:border-desktop-accent/50 ' +
      'active:bg-desktop-subtle focus-visible:ring-2 focus-visible:ring-desktop-accent ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-desktop-bg',
    ghost:
      'text-desktop-text-secondary hover:text-desktop-text ' +
      'hover:bg-desktop-surface active:bg-desktop-subtle ' +
      'focus-visible:ring-2 focus-visible:ring-desktop-accent',
    danger:
      'bg-desktop-error text-white hover:bg-desktop-error-hover ' +
      'active:bg-red-600 focus-visible:ring-2 focus-visible:ring-desktop-error ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-desktop-bg ' +
      'shadow-sm',
    success:
      'bg-green-600 text-white hover:bg-green-500 ' +
      'active:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-desktop-bg ' +
      'shadow-sm',
    warning:
      'bg-amber-500 text-white hover:bg-amber-400 ' +
      'active:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-desktop-bg ' +
      'shadow-sm',
  };

  const sizeClass = $derived(SIZE_MAP[size]);
  const widthClass = $derived(fullWidth ? 'w-full' : '');
  const disabledClass = $derived(
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  );

  const isSnippet = $derived(typeof children === 'function');
</script>

<button
  {type}
  class="inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150
    {variantClasses[variant]}
    {sizeClass.px} {sizeClass.py} {sizeClass.text} {sizeClass.rounding}
    {widthClass}
    {disabledClass}
    {className}"
  {disabled}
  {onclick}
>
  {#if icon}
    <span class="shrink-0 text-current" aria-hidden="true">{icon}</span>
  {/if}
  {#if children}
    {#if isSnippet}
      {@render children()}
    {:else}
      {children}
    {/if}
  {/if}
  {#if iconRight}
    <span class="shrink-0 text-current" aria-hidden="true">{iconRight}</span>
  {/if}
</button>
