/**
 * @rdtect/ui — O1 Design System
 *
 * Shared UI design system for rdtect-os.
 * Components are built with Svelte 5 runes and the desktop theme tokens.
 *
 * Usage:
 *   import { Button, Input, Card, Badge, Select, Toggle, Tooltip, Dialog, ToastContainer, ConfirmDialog } from '@rdtect/ui';
 *   import { pushToast } from '@rdtect/ui';
 *   import type { ButtonVariant, ComponentSize, ToggleSize, ToastKind } from '@rdtect/ui';
 */

// ─── Components ─────────────────────────────────────────────────────

export { default as Button } from './Button/Button.svelte';
export { default as Input } from './Input/Input.svelte';
export { default as Card } from './Card/Card.svelte';
export { default as Badge } from './Badge/Badge.svelte';
export { default as Select } from './Select/Select.svelte';
export { default as Toggle } from './Toggle/Toggle.svelte';
export { default as Tooltip } from './Tooltip/Tooltip.svelte';
export { default as Dialog } from './Dialog/Dialog.svelte';
export { default as Toast } from './Toast/Toast.svelte';
export { default as ToastContainer } from './Toast/ToastContainer.svelte';
export { default as ConfirmDialog } from './ConfirmDialog/ConfirmDialog.svelte';

// ─── Toast store ────────────────────────────────────────────────────

export { toasts, pushToast, dismissToast, clearToasts } from './Toast/toast-store';

// ─── Types ──────────────────────────────────────────────────────────

export type {
  ComponentSize,
  ButtonVariant,
  InputVariant,
  BadgeVariant,
  CardVariant,
  SelectOption,
  SelectOptionInput,
  ToggleSize,
  TooltipPosition,
  DialogSize,
  ToastKind,
  ToastPosition,
  ToastOptions,
} from './types';

export { SIZE_MAP, TOGGLE_SIZE_MAP } from './types';
