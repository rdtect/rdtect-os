/**
 * MRAX RULES + ACTIONS (pure transitions)
 * ========================================
 * Pure functions. No DOM, no storage, no runes, no this.
 * Same input → same output. Immutable per tick.
 *
 * These compose freely. They have no identity. They are the lens-builders.
 *
 * Importable from anywhere — including non-Svelte contexts (CLI, server, tests).
 */

import { TodoStatus, FilterType, type Todo, type TodoStats } from './todo.types';

// ─── Rules — what counts as valid ─────────────────────────────────────────

export const TEXT_MIN = 1;
export const TEXT_MAX = 500;

export function isValidTodoText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= TEXT_MIN && trimmed.length <= TEXT_MAX;
}

// ─── Actions — pure transitions ────────────────────────────────────────────

export function createTodo(text: string): Todo {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    status: TodoStatus.ACTIVE,
    createdAt: Date.now(),
    completedAt: null,
  };
}

export function toggleStatus(todo: Todo): Todo {
  const isActive = todo.status === TodoStatus.ACTIVE;
  return {
    ...todo,
    status: isActive ? TodoStatus.COMPLETED : TodoStatus.ACTIVE,
    completedAt: isActive ? Date.now() : null,
  };
}

export function rename(todo: Todo, newText: string): Todo {
  return { ...todo, text: newText.trim() };
}

// ─── Lens — derived projections over a list ────────────────────────────────

export function filterTodos(todos: readonly Todo[], filter: FilterType): Todo[] {
  if (filter === FilterType.ACTIVE) {
    return todos.filter((t) => t.status === TodoStatus.ACTIVE);
  }
  if (filter === FilterType.COMPLETED) {
    return todos.filter((t) => t.status === TodoStatus.COMPLETED);
  }
  return [...todos];
}

export function sortTodos(todos: readonly Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    // Active first
    if (a.status !== b.status) {
      return a.status === TodoStatus.ACTIVE ? -1 : 1;
    }
    // Newest first within a status
    return b.createdAt - a.createdAt;
  });
}

export function getStats(todos: readonly Todo[]): TodoStats {
  let active = 0;
  let completed = 0;
  for (const t of todos) {
    if (t.status === TodoStatus.ACTIVE) active++;
    else completed++;
  }
  return { total: todos.length, active, completed };
}
