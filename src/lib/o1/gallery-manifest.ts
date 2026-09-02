/**
 * O1 Gallery Manifest — source of truth for the /dev/o1 preview harness.
 *
 * The /dev/o1 route renders every O1 design-system component exported from
 * `@rdtect/ui` so the library can be eyeballed and exercised without pulling
 * Storybook into the repo. This manifest is the single place that records
 * *what* the gallery must cover:
 *
 *   - gallery-manifest.test.ts fails when a component export is added to
 *     `@rdtect/ui` but not to this manifest (and vice-versa), so the preview
 *     canvas can never silently drift out of date with the library.
 *   - The page's smoke test (+page.test.ts) asserts a rendered section per
 *     manifest entry, so the hand-authored demo sections cannot drift from
 *     this manifest either.
 */
export interface O1GalleryEntry {
  /** Export name in @rdtect/ui's index — must match exactly. */
  name: string;
  /** Anchor id used for the section on the page (lower-kebab-case). */
  id: string;
  /** One-line description shown under the section heading. */
  summary: string;
  /** Variant families demonstrated in the section (informational chips). */
  variants: string[];
}

export const O1_GALLERY: O1GalleryEntry[] = [
  {
    name: 'Button',
    id: 'button',
    summary:
      'Action trigger with six visual variants, five size presets, leading/trailing icons, disabled and full-width states.',
    variants: [
      'primary',
      'secondary',
      'ghost',
      'danger',
      'success',
      'warning',
      'xs → xl sizes',
      'icon',
      'disabled',
      'full width',
    ],
  },
  {
    name: 'Input',
    id: 'input',
    summary:
      'Labeled text field with helper text, inline error (aria-invalid + role=alert), icons, required and password/disabled states.',
    variants: ['default', 'error', 'required', 'icon', 'password', 'disabled'],
  },
  {
    name: 'Select',
    id: 'select',
    summary:
      'Theme-aware native select with placeholder, string or object options, error state, sizes and required indicator.',
    variants: ['string options', 'object options', 'placeholder', 'error', 'disabled'],
  },
  {
    name: 'Toggle',
    id: 'toggle',
    summary:
      'Switch built on role="switch" with keyboard activation, three sizes, inline label/description and disabled state.',
    variants: ['sm', 'md', 'lg', 'checked', 'disabled'],
  },
  {
    name: 'Badge',
    id: 'badge',
    summary:
      'Small status label in six variants, optionally rendered as a pure dot indicator.',
    variants: ['default', 'accent', 'success', 'warning', 'error', 'info', 'dot'],
  },
  {
    name: 'Card',
    id: 'card',
    summary:
      'Surface container in four variants with optional header/footer regions and interactive (button-like) mode.',
    variants: ['default', 'elevated', 'bordered', 'ghost', 'header / footer', 'interactive'],
  },
  {
    name: 'Tooltip',
    id: 'tooltip',
    summary:
      'Hover/focus tooltip in four positions with aria-describedby wiring and an interactive-trigger mode for focusable children.',
    variants: ['top', 'bottom', 'left', 'right', 'interactive trigger'],
  },
  {
    name: 'Dialog',
    id: 'dialog',
    summary:
      'Modal panel with focus trap + restore, Escape/backdrop/close-X dismissal, aria-labelledby/describedby and size presets.',
    variants: ['md', 'lg', 'description', 'focus trap', 'Escape / backdrop close'],
  },
  {
    name: 'ConfirmDialog',
    id: 'confirm-dialog',
    summary:
      'Dialog + Button composition. Danger styling for destructive flows; dismissal paths (Escape/backdrop/X/Cancel) can never confirm.',
    variants: ['danger', 'primary', 'cancel-first focus'],
  },
  {
    name: 'Toast',
    id: 'toast',
    summary:
      'Single notification card (info/success/warning/error) for custom stacks, with dismiss affordance and alert/status roles.',
    variants: ['info', 'success', 'warning', 'error'],
  },
  {
    name: 'ToastContainer',
    id: 'toast-container',
    summary:
      'Fixed-corner queue fed by the pushToast store, wrapped in an aria-live region with auto-dismiss and sticky (duration 0) support.',
    variants: ['bottom-right', 'pushToast', 'auto-dismiss', 'sticky', 'clear'],
  },
];

/** Total number of components the gallery must showcase. */
export const O1_GALLERY_COMPONENT_COUNT = O1_GALLERY.length;

/** Total number of variant chips documented across all sections. */
export const O1_GALLERY_VARIANT_COUNT = O1_GALLERY.reduce(
  (total, entry) => total + entry.variants.length,
  0
);

/** Lookup by export name for tests and the page header. */
export function galleryEntry(name: string): O1GalleryEntry | undefined {
  return O1_GALLERY.find((entry) => entry.name === name);
}
