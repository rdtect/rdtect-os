/**
 * MRAX HANDLERS — Orchestrators
 * ==============================
 * Functions-for-composing. Each takes a context (store + effects) plus the
 * user input. Composes pure logic + side effects + substrate mutation.
 *
 * No `this`. No identity. Reusable. Testable with mock context.
 *
 * Each handler reads as three sequential steps:
 *   1. pure logic     (from todo.logic)
 *   2. side effect    (from todo.effects — the boundary)
 *   3. substrate move (the store's mutation API)
 */

import { createTodo, toggleStatus, rename, isValidTodoText } from './todo.logic';
import * as effects from './todo.effects';
import type { TodoStore } from './todo.model.svelte';
import type { FilterType, Todo } from './todo.types';

export interface HandlerContext {
  store: TodoStore;
  effects: typeof effects;
}

export const handlers = {
  /**
   * Boot — load todos from storage into the store.
   */
  async load({ store, effects }: HandlerContext): Promise<void> {
    store.setLoading(true);
    store.setError(null);
    try {
      const todos = await effects.loadAll();
      store.setAll(todos);
    } catch (err) {
      store.setError('Failed to load todos.');
      console.error(err);
    } finally {
      store.setLoading(false);
    }
  },

  /**
   * Add — validate, create, persist, mutate.
   */
  async addTodo(ctx: HandlerContext, text: string): Promise<void> {
    const { store, effects } = ctx;
    if (!isValidTodoText(text)) {
      store.setError('Todo text must be 1-500 characters.');
      return;
    }
    store.setError(null);
    const todo = createTodo(text);
    await effects.save(todo);
    store.add(todo);
  },

  /**
   * Toggle — fetch, transition, persist, mutate.
   */
  async toggleTodo(ctx: HandlerContext, id: string): Promise<void> {
    const { store, effects } = ctx;
    const current = store.byId(id);
    if (!current) return;
    const updated = toggleStatus(current);
    await effects.save(updated);
    store.replace(updated);
  },

  /**
   * Rename — validate, transition, persist, mutate.
   */
  async renameTodo(ctx: HandlerContext, id: string, newText: string): Promise<void> {
    const { store, effects } = ctx;
    if (!isValidTodoText(newText)) {
      store.setError('Todo text must be 1-500 characters.');
      return;
    }
    store.setError(null);
    const current = store.byId(id);
    if (!current) return;
    const updated = rename(current, newText);
    await effects.save(updated);
    store.replace(updated);
  },

  /**
   * Delete — persist, mutate.
   */
  async deleteTodo(ctx: HandlerContext, id: string): Promise<void> {
    const { store, effects } = ctx;
    await effects.remove(id);
    store.removeById(id);
  },

  /**
   * Clear completed — fetch ids, persist, mutate.
   */
  async clearCompleted(ctx: HandlerContext): Promise<void> {
    const { store, effects } = ctx;
    const ids = store.completedIds();
    if (ids.length === 0) return;
    await effects.removeMany(ids);
    store.removeManyById(ids);
  },

  /**
   * Set filter — pure substrate mutation, no side effects.
   */
  setFilter({ store }: HandlerContext, filter: FilterType): void {
    store.setFilter(filter);
  },
} as const;

export type Handlers = typeof handlers;
