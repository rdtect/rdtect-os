/**
 * @rdtect/ui — O1 Design System
 *
 * Shared UI design system for rdtect-os.
 * Components are built with Svelte 5 runes and the desktop theme tokens.
 *
 * Usage:
 *   import { Button, Input, Card, Badge, Select, Toggle, Tooltip } from '@rdtect/ui';
 *   import type { ButtonVariant, ComponentSize, ToggleSize } from '@rdtect/ui';
 */

// ─── Components ─────────────────────────────────────────────────────

export { default as Button } from './Button/Button.svelte';
export { default as Input } from './Input/Input.svelte';
export { default as Card } from './Card/Card.svelte';
export { default as Badge } from './Badge/Badge.svelte';
export { default as Select } from './Select/Select.svelte';
export { default as Toggle } from './Toggle/Toggle.svelte';
export { default as Tooltip } from './Tooltip/Tooltip.svelte';

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
} from './types';

export { SIZE_MAP, TOGGLE_SIZE_MAP } from './types';
