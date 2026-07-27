/**
 * O1 Design System — Shared Type Definitions
 *
 * Core types used across all design system components.
 * These follow the desktop theme tokens defined in tailwind.config.js
 * and the CSS custom properties from the Theme system.
 */

// ─── Sizing & Spacing ───────────────────────────────────────────────

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const SIZE_MAP: Record<ComponentSize, {
  px: string;
  py: string;
  text: string;
  rounding: string;
}> = {
  xs: { px: 'px-2', py: 'py-0.5', text: 'text-desktop-xs', rounding: 'rounded-desktop-sm' },
  sm: { px: 'px-2.5', py: 'py-1', text: 'text-desktop-sm', rounding: 'rounded-desktop-sm' },
  md: { px: 'px-3', py: 'py-1.5', text: 'text-desktop-base', rounding: 'rounded-desktop-md' },
  lg: { px: 'px-4', py: 'py-2', text: 'text-desktop-lg', rounding: 'rounded-desktop-md' },
  xl: { px: 'px-5', py: 'py-2.5', text: 'text-desktop-xl', rounding: 'rounded-desktop-lg' },
};

// ─── Component Variants ─────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';

export type InputVariant = 'default' | 'ghost' | 'error';

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info';

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'ghost';
