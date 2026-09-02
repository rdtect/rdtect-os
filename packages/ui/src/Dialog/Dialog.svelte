<script lang="ts">
  /**
   * Dialog — O1 Design System
   *
   * Theme-aware modal dialog with backdrop, Escape-to-close, focus trap,
   * and focus restore. Built on the desktop theme tokens.
   *
   * Accessibility:
   * - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (from title)
   * - Focus moves into the dialog on open and is restored on close
   * - Tab is trapped inside the dialog while open
   * - Escape closes (unless `closeOnEscape={false}`)
   */
  import type { DialogSize } from '../types';

  type Children = import('svelte').Snippet | string | number | undefined;

  interface Props {
    /** Whether the dialog is open */
    open?: boolean;
    /** Dialog title (also wires aria-labelledby) */
    title?: string;
    /** Optional description text (wires aria-describedby) */
    description?: string;
    /** Close handler — fires on Escape, backdrop click, and close button */
    onclose?: () => void;
    /** Close when the backdrop is clicked */
    closeOnBackdrop?: boolean;
    /** Close when Escape is pressed */
    closeOnEscape?: boolean;
    /** Show the X close button */
    closable?: boolean;
    /** Width preset */
    size?: DialogSize;
    /** Unique ID prefix (auto-derived from title if not provided) */
    id?: string;
    /** Custom aria-labelledby (overrides auto title id) */
    labelledBy?: string;
    /** Custom aria-describedby (overrides auto description id) */
    describedBy?: string;
    /** Dialog body content */
    children?: Children;
    /** Additional CSS classes for the panel */
    class?: string;
    /** Tailwind z-index class for the backdrop layer (default `z-50`) */
    zIndex?: string;
  }

  let {
    open = false,
    title,
    description,
    onclose,
    closeOnBackdrop = true,
    closeOnEscape = true,
    closable = true,
    size = 'md',
    id,
    labelledBy,
    describedBy,
    children,
    class: className = '',
    zIndex = 'z-50',
  }: Props = $props();

  const dialogId = $derived(
    id ?? (title ? `dialog-${title.toLowerCase().replace(/\s+/g, '-')}` : 'dialog')
  );
  const titleId = $derived(labelledBy ?? `${dialogId}-title`);
  const descriptionId = $derived(
    describedBy ?? (description ? `${dialogId}-description` : undefined)
  );

  const SIZE_CLASS: Record<DialogSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  let panelEl: HTMLElement | undefined = $state();

  // Focus management + keyboard handling while open
  $effect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog (effect runs after DOM update, so the
    // panel element is already in the tree).
    panelEl?.focus();

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (closeOnEscape) {
          e.stopPropagation();
          onclose?.();
        }
        return;
      }
      if (e.key !== 'Tab') return;

      // Own the Tab key entirely: cycle focus among the dialog's focusables.
      e.preventDefault();
      const focusables = Array.from(
        panelEl?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
      );
      if (focusables.length === 0) {
        panelEl?.focus();
        return;
      }
      const current = document.activeElement as HTMLElement | null;
      const currentIndex = current ? focusables.indexOf(current) : -1;
      let nextIndex: number;
      if (e.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= focusables.length - 1 ? 0 : currentIndex + 1;
      }
      focusables[nextIndex].focus();
    };

    document.addEventListener('keydown', onKeydown, true);

    return () => {
      document.removeEventListener('keydown', onKeydown, true);
      // Restore focus to the previously focused element on close
      previouslyFocused?.focus();
    };
  });
</script>

{#if open}
  <!-- Backdrop (click target = backdrop only, not the panel) -->
  <div
    class="fixed inset-0 {zIndex} flex items-center justify-center overflow-y-auto
      bg-black/60 p-4"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget && closeOnBackdrop) onclose?.();
    }}
  >
    <div
      bind:this={panelEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title || labelledBy ? titleId : undefined}
      aria-describedby={descriptionId}
      tabindex="-1"
      class="relative w-full outline-none {SIZE_CLASS[size]} {className}"
    >
      <div
        class="rounded-desktop-lg border border-desktop-border bg-desktop-surface
          shadow-2xl"
      >
        {#if title}
          <header
            id={titleId}
            class="flex items-start justify-between gap-4 border-b border-desktop-border
              px-5 py-4"
          >
            <h2 class="text-desktop-lg font-semibold text-desktop-text">{title}</h2>
            {#if closable}
              <button
                type="button"
                aria-label="Close dialog"
                onclick={() => onclose?.()}
                class="-mr-1 inline-flex h-7 w-7 items-center justify-center rounded-desktop-sm
                  text-desktop-muted transition-colors hover:bg-desktop-subtle
                  hover:text-desktop-text focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-desktop-accent"
              >
                <span aria-hidden="true" class="text-desktop-base leading-none">×</span>
              </button>
            {/if}
          </header>
        {/if}

        <div class="px-5 py-4">
          {#if description}
            <p id={descriptionId} class="mb-3 text-desktop-sm text-desktop-text-secondary">
              {description}
            </p>
          {/if}
          {#if children}
            {#if typeof children === 'function'}
              {@render children()}
            {:else}
              {children}
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

