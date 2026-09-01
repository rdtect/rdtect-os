<script lang="ts">
  /**
   * Select — O1 Design System
   *
   * Theme-aware native select with label, placeholder, description,
   * error state, and size presets. Uses the native <select> element
   * for full keyboard/AT accessibility.
   */
  import {
    SIZE_MAP,
    type ComponentSize,
    type SelectOption,
    type SelectOptionInput,
  } from '../types';

  interface Props {
    /** Field label */
    label?: string;
    /** Options as shorthand strings or { value, label, disabled? } objects */
    options?: SelectOptionInput[];
    /** Selected value (controlled by parent via onchange) */
    value?: string;
    /** Placeholder option shown when no value is selected */
    placeholder?: string;
    /** Error message (shows error styling when set) */
    error?: string;
    /** Description text below select */
    description?: string;
    /** Size preset */
    size?: ComponentSize;
    /** Disabled state */
    disabled?: boolean;
    /** Whether the field is required */
    required?: boolean;
    /** Select name attribute */
    name?: string;
    /** Unique ID for the select (auto-generated from label if not provided) */
    id?: string;
    /** Change event handler */
    onchange?: (e: Event) => void;
    /** Focus event handler */
    onfocus?: (e: FocusEvent) => void;
    /** Blur event handler */
    onblur?: (e: FocusEvent) => void;
    /** Additional CSS classes for the wrapper */
    class?: string;
  }

  let {
    label,
    options = [],
    value = '',
    placeholder,
    error,
    description,
    size = 'md',
    disabled = false,
    required = false,
    name,
    id,
    onchange,
    onfocus,
    onblur,
    class: className = '',
  }: Props = $props();

  const sizeClass = $derived(SIZE_MAP[size]);
  const selectId = $derived(
    id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
  );
  const hasError = $derived(!!error);

  const errorId = $derived(hasError && selectId ? `${selectId}-error` : undefined);
  const descriptionId = $derived(description && selectId ? `${selectId}-description` : undefined);

  const ariaDescribedBy = $derived(
    [errorId, descriptionId].filter(Boolean).join(' ') || undefined
  );

  const normalized = $derived(
    options.map((o): SelectOption =>
      typeof o === 'string' ? { value: o, label: o } : o
    )
  );
</script>

<div class="flex flex-col gap-1 {className}">
  {#if label}
    <label
      for={selectId}
      class="text-desktop-sm text-desktop-text-secondary font-medium"
    >
      {label}
      {#if required}
        <span class="text-desktop-error ml-0.5" aria-hidden="true">*</span>
      {/if}
    </label>
  {/if}

  <div class="relative">
    <select
      {name}
      {value}
      {disabled}
      {required}
      {onchange}
      {onfocus}
      {onblur}
      id={selectId}
      aria-describedby={ariaDescribedBy}
      aria-invalid={hasError || undefined}
      class="w-full appearance-none bg-desktop-surface text-desktop-text
        border border-desktop-border rounded-desktop-md pr-8
        transition-colors duration-150
        {hasError
          ? 'border-desktop-error focus:border-desktop-error focus:ring-1 focus:ring-desktop-error'
          : 'focus:border-desktop-accent focus:ring-1 focus:ring-desktop-accent'
        }
        {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        {sizeClass.px} {sizeClass.py} {sizeClass.text}
      "
    >
      {#if placeholder}
        <option value="" disabled>{placeholder}</option>
      {/if}
      {#each normalized as opt (opt.value)}
        <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
      {/each}
    </select>

    <span
      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
        text-desktop-muted {sizeClass.text}"
      aria-hidden="true"
    >▾</span>
  </div>

  {#if description && !hasError}
    <p id={descriptionId} class="text-desktop-xs text-desktop-muted">
      {description}
    </p>
  {/if}

  {#if hasError}
    <p id={errorId} class="text-desktop-xs text-desktop-error" role="alert">
      {error}
    </p>
  {/if}
</div>
