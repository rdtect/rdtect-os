<script lang="ts">
  /**
   * Input — O1 Design System
   *
   * Theme-aware text input with label, description, error state,
   * and icon support.
   */
  import { SIZE_MAP, type ComponentSize } from '../types';

  interface Props {
    /** Input value */
    value?: string;
    /** Input label */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Description text below input */
    description?: string;
    /** Error message (shows error styling when set) */
    error?: string;
    /** Size preset */
    size?: ComponentSize;
    /** Disabled state */
    disabled?: boolean;
    /** Read-only state */
    readonly?: boolean;
    /** Input name attribute */
    name?: string;
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';
    /** Icon to show inside input (left side) */
    icon?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Input event handler */
    oninput?: (e: Event) => void;
    /** Change event handler */
    onchange?: (e: Event) => void;
    /** Focus event handler */
    onfocus?: (e: FocusEvent) => void;
    /** Blur event handler */
    onblur?: (e: FocusEvent) => void;
    /** Additional CSS classes for the wrapper */
    class?: string;
    /** Unique ID for the input (auto-generated if not provided) */
    id?: string;
  }

  let {
    value = '',
    label,
    placeholder,
    description,
    error,
    size = 'md',
    disabled = false,
    readonly = false,
    name,
    type = 'text',
    icon,
    required = false,
    oninput,
    onchange,
    onfocus,
    onblur,
    class: className = '',
    id,
  }: Props = $props();

  const sizeClass = $derived(SIZE_MAP[size]);
  const inputId = $derived(id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined));
  const hasError = $derived(!!error);

  const errorId = $derived(hasError && inputId ? `${inputId}-error` : undefined);
  const descriptionId = $derived(description && inputId ? `${inputId}-description` : undefined);

  const ariaDescribedBy = $derived(
    [errorId, descriptionId].filter(Boolean).join(' ') || undefined
  );
</script>

<div class="flex flex-col gap-1 {className}">
  {#if label}
    <label
      for={inputId}
      class="text-desktop-sm text-desktop-text-secondary font-medium"
    >
      {label}
      {#if required}
        <span class="text-desktop-error ml-0.5" aria-hidden="true">*</span>
      {/if}
    </label>
  {/if}

  <div class="relative">
    {#if icon}
      <span
        class="absolute left-3 top-1/2 -translate-y-1/2 text-desktop-muted pointer-events-none {sizeClass.text}"
        aria-hidden="true"
      >{icon}</span>
    {/if}

    <input
      {type}
      {name}
      {value}
      {placeholder}
      {disabled}
      {readonly}
      {required}
      {oninput}
      {onchange}
      {onfocus}
      {onblur}
      id={inputId}
      aria-describedby={ariaDescribedBy}
      aria-invalid={hasError || undefined}
      class="w-full bg-desktop-surface text-desktop-text placeholder:text-desktop-muted
        border border-desktop-border rounded-desktop-md
        transition-colors duration-150
        {hasError
          ? 'border-desktop-error focus:border-desktop-error focus:ring-1 focus:ring-desktop-error'
          : 'focus:border-desktop-accent focus:ring-1 focus:ring-desktop-accent'
        }
        {disabled ? 'opacity-50 cursor-not-allowed' : ''}
        {readonly ? 'cursor-default' : ''}
        {icon ? 'pl-9' : sizeClass.px}
        {sizeClass.py} {sizeClass.text}
      "
    />
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
