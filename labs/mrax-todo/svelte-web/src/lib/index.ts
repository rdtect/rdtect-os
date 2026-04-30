/**
 * MRAX TODO — Public API
 * =======================
 * Re-exports for consumers. The main app imports from this index.
 */

// Types
export type { Todo, TodoStats, FilterType, TodoStatus } from './todo.types';
export { FilterType as FilterTypeEnum, TodoStatus as TodoStatusEnum } from './todo.types';

// Pure logic (importable from any TS context)
export {
  isValidTodoText,
  createTodo,
  toggleStatus,
  rename,
  filterTodos,
  sortTodos,
  getStats,
  TEXT_MIN,
  TEXT_MAX,
} from './todo.logic';

// Reactive store (Svelte-only — uses runes)
export { TodoStore, todoStore } from './todo.model.svelte';

// Handlers (orchestrators)
export { handlers, type HandlerContext, type Handlers } from './todo.handlers';

// Effects (boundary; expose for testing or alternative storage)
export * as effects from './todo.effects';

// Components
export { default as TodoApp } from './TodoApp.svelte';
export { default as TodoItem } from './TodoItem.svelte';
export { default as TodoForm } from './TodoForm.svelte';
export { default as TodoFilters } from './TodoFilters.svelte';
export { default as TodoStats } from './TodoStats.svelte';
