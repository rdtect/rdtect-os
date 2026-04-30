/**
 * MRAX MODEL — Reactive Store (the substrate)
 * ============================================
 * A class-for-behaviour: holds state with identity, exposes a minimal
 * mutation API, derives lens views via $derived.
 *
 * Class fields use $state (write substrate) and $derived (read lens) — CQRS
 * at the class scale. Mutations are explicit named methods; the only place
 * state changes.
 *
 * `.svelte.ts` extension marks this file as runes-using. Cannot be imported
 * into pure-TS contexts (CLI, server-side without Svelte) — use the pure
 * functions in `todo.logic.ts` for those.
 */

import {
  type Todo,
  type FilterType,
  FilterType as FilterTypeEnum,
} from './todo.types';
import { filterTodos, sortTodos, getStats } from './todo.logic';

export class TodoStore {
  // ─── Substrate (write surface) ──────────────────────────────────────────

  todos = $state<Todo[]>([]);
  currentFilter = $state<FilterType>(FilterTypeEnum.ALL);
  loading = $state<boolean>(false);
  error = $state<string | null>(null);

  // ─── Lens (read surface — auto-recomputed) ──────────────────────────────

  visible = $derived(sortTodos(filterTodos(this.todos, this.currentFilter)));
  stats = $derived(getStats(this.todos));
  hasCompleted = $derived(this.stats.completed > 0);
  isEmpty = $derived(this.stats.total === 0);

  // ─── Substrate-mutation API (named transitions only) ────────────────────

  setAll(todos: Todo[]): void {
    this.todos = todos;
  }

  add(todo: Todo): void {
    this.todos = [todo, ...this.todos];
  }

  replace(updated: Todo): void {
    this.todos = this.todos.map((t) => (t.id === updated.id ? updated : t));
  }

  removeById(id: string): void {
    this.todos = this.todos.filter((t) => t.id !== id);
  }

  removeManyById(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const set = new Set(ids);
    this.todos = this.todos.filter((t) => !set.has(t.id));
  }

  setFilter(filter: FilterType): void {
    this.currentFilter = filter;
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
  }

  setError(error: string | null): void {
    this.error = error;
  }

  // ─── Helper for handlers ────────────────────────────────────────────────

  byId(id: string): Todo | undefined {
    return this.todos.find((t) => t.id === id);
  }

  completedIds(): string[] {
    return this.todos
      .filter((t) => t.status === 'completed')
      .map((t) => t.id);
  }
}

// Singleton — the shared substrate for the whole app
export const todoStore = new TodoStore();
