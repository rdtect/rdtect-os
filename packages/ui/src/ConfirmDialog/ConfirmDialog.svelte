<script lang="ts">
  /**
   * ConfirmDialog — O1 Design System
   *
   * Composition pattern built from `Dialog` + `Button` for confirmations.
   * Primary use case is destructive actions (delete, reset, destructive
   * settings) via the `danger` variant.
   *
   * Semantics:
   * - Confirm button  → fires `onconfirm` then `onclose`
   * - Cancel button   → fires `onclose` only (never `onconfirm`)
   * - Escape / backdrop / X → fire `onclose` only (never `onconfirm`)
   *   This guarantees a destructive action can never be triggered by an
   *   accidental dismissal path.
   *
   * Accessibility:
   * - Inherits Dialog's `role="dialog"` / `aria-modal` / labelled-by /
   *   described-by wiring and focus trap.
   * - Focus moves to the **cancel** button on open by default — the safe
   *   choice so Enter cannot accidentally confirm a destructive action.
   * - `confirmDisabled` supports in-flight states (async action pending),
   *   and the disabled confirm button is skipped by the focus trap.
   */
  import Dialog from '../Dialog/Dialog.svelte';
  import Button from '../Button/Button.svelte';
  import type { DialogSize } from '../types';

  type Children = import('svelte').Snippet | string | number | undefined;

  interface Props {
    /** Whether the dialog is open */
    open?: boolean;
    /** Confirmation title (wires aria-labelledby) */
    title?: string;
    /** Explanatory body text (wires aria-describedby) */
    description?: string;
    /** Confirm button label */
    confirmLabel?: string;
    /** Cancel button label */
    cancelLabel?: string;
    /** Style the confirm action as destructive (danger variant) */
    danger?: boolean;
    /** Disable the confirm button (e.g. while an async action runs) */
    confirmDisabled?: boolean;
    /** Width preset (passed to Dialog) */
    size?: DialogSize;
    /** Fired when the user confirms */
    onconfirm?: () => void;
    /** Fired on any dismissal: cancel button, Escape, backdrop, close X */
    onclose?: () => void;
    /** Close on backdrop click */
    closeOnBackdrop?: boolean;
    /** Close on Escape */
    closeOnEscape?: boolean;
    /** Show the X close button */
    closable?: boolean;
    /** Unique ID prefix (auto-derived from title if not provided) */
    id?: string;
    /** Optional extra body content rendered above the actions */
    children?: Children;
  }

  let {
    open = false,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    confirmDisabled = false,
    size = 'md',
    onconfirm,
    onclose,
    closeOnBackdrop = true,
    closeOnEscape = true,
    closable = true,
    id,
    children,
  }: Props = $props();

  const footerId = $derived(
    id ? `${id}-footer` : title ? `dialog-${title.toLowerCase().replace(/\s+/g, '-')}-footer` : 'dialog-footer'
  );

  const isSnippet = $derived(typeof children === 'function');

  function handleConfirm() {
    onconfirm?.();
    onclose?.();
  }

  function handleCancel() {
    onclose?.();
  }

  // Safety default: focus the cancel (least destructive) button on open.
  // Runs after Dialog's own effect (child effects run first in Svelte 5),
  // so this lands as the final focused element inside the trapped dialog.
  $effect(() => {
    if (open) {
      document.getElementById(footerId)?.querySelector('button')?.focus();
    }
  });
</script>

<Dialog
  {open}
  {title}
  {description}
  {size}
  {id}
  {closeOnBackdrop}
  {closeOnEscape}
  {closable}
  {onclose}
>
  <div class="space-y-4">
    {#if children}
      <div>
        {#if isSnippet}
          {@render children()}
        {:else}
          {children}
        {/if}
      </div>
    {/if}

    <div
      id={footerId}
      class="flex items-center justify-end gap-2 pt-1"
      role="group"
      aria-label="Confirmation actions"
    >
      <Button variant="secondary" size="sm" onclick={handleCancel}>
        {cancelLabel}
      </Button>
      <Button
        variant={danger ? 'danger' : 'primary'}
        size="sm"
        disabled={confirmDisabled}
        onclick={handleConfirm}
      >
        {confirmLabel}
      </Button>
    </div>
  </div>
</Dialog>
