/**
 * @rdtect/ui — O1 Design System
 *
 * Shared UI design system for rdtect-os.
 * Components are built with Svelte 5 runes and the desktop theme tokens.
 *
 * Usage:
 *   import { Button, Input, Card, Badge } from '@rdtect/ui';
 *   import type { ButtonVariant, ComponentSize } from '@rdtect/ui';
 */

// ─── Components ─────────────────────────────────────────────────────

export { default as Button } from './Button/Button.svelte';
export { default as Input } from './Input/Input.svelte';
export { default as Card } from './Card/Card.svelte';
export { default as Badge } from './Badge/Badge.svelte';

// ─── Types ──────────────────────────────────────────────────────────

export type {
  ComponentSize,
  ButtonVariant,
  InputVariant,
  BadgeVariant,
  CardVariant,
} from './types';

export { SIZE_MAP } from './types';
