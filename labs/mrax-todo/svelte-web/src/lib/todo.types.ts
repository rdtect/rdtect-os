/**
 * MRAX MODEL — Type definitions
 * ==============================
 * Pure types. No runtime, no runes, no side effects.
 * Importable from anywhere — Svelte components, plain TS, tests, CLI.
 */

// ─── Enums (declarative; declarative > imperative) ────────────────────────

export const TodoStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;
export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];

export const FilterType = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;
export type FilterType = (typeof FilterType)[keyof typeof FilterType];

// ─── Core entity ───────────────────────────────────────────────────────────

export interface Todo {
  readonly id: string;
  text: string;
  status: TodoStatus;
  readonly createdAt: number;
  completedAt: number | null;
}

// ─── Stats projection (a lens shape) ───────────────────────────────────────

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
}
