<script lang="ts">
  /**
   * Toggle — O1 Design System
   *
   * Theme-aware switch control built on a <button role="switch"> for
   * native keyboard interaction (Enter/Space) and screen-reader
   * announcements via aria-checked.
   */
  import { TOGGLE_SIZE_MAP, type ToggleSize } from '../types';

  interface Props {
    /** Checked state */
    checked?: boolean;
    /** Accessible label (rendered beside the switch when provided) */
    label?: string;
    /** Helper text below the label */
    description?: string;
    /** Size preset */
    size?: ToggleSize;
    /** Disabled state */
    disabled?: boolean;
    /** Unique ID for the switch (auto-generated from label if not provided) */
    id?: string;
    /** Switch name attribute */
    name?: string;
    /** Change event handler (fires on click/toggle, including Enter/Space) */
    onchange?: (e: Event) => void;
    /** Additional CSS classes for the wrapper */
    class?: string;
  }

  let {
    checked = false,
    label,
    description,
    size = 'md',
    disabled = false,
    id,
    name,
    onchange,
    class: className = '',
  }: Props = $props();

  const sizeClass = $derived(TOGGLE_SIZE_MAP[size]);
  const toggleId = $derived(
    id ?? (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
  );
  const descriptionId = $derived(description && toggleId ? `${toggleId}-description` : undefined);
  const knobTranslate = $derived(checked ? sizeClass.offset : 'translate-x-0');
</script>

<div class="flex items-start gap-2 {className}">
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    aria-describedby={descriptionId}
    id={toggleId}
    {name}
    {disabled}
    onclick={(e) => onchange?.(e)}
    class="relative inline-flex shrink-0 items-center rounded-full
      transition-colors duration-200 focus-visible:outline-none
      focus-visible:ring-2 focus-visible:ring-desktop-accent
      focus-visible:ring-offset-2 focus-visible:ring-offset-desktop-bg
      {sizeClass.track}
      {checked ? 'bg-desktop-accent' : 'bg-desktop-subtle'}
      {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
  >
    <span
      class="inline-block rounded-full bg-white shadow-sm
        transition-transform duration-200 {sizeClass.knob} {knobTranslate}"
      aria-hidden="true"
    ></span>
  </button>

  {#if label || description}
    <div class="flex flex-col gap-0.5">
      {#if label}
        <span class="text-desktop-sm text-desktop-text font-medium">{label}</span>
      {/if}
      {#if description}
        <span id={descriptionId} class="text-desktop-xs text-desktop-muted">
          {description}
        </span>
      {/if}
    </div>
  {/if}
</div>
