<!--
  MRAX eXperience — Top-level component.
  Composition root for the Todo lab. Wires the store + handlers + effects
  together, then composes the four sub-components into a coherent UI.
-->
<script lang="ts">
  import { todoStore } from './todo.model.svelte';
  import { handlers, type HandlerContext } from './todo.handlers';
  import * as effects from './todo.effects';

  import TodoForm from './TodoForm.svelte';
  import TodoFilters from './TodoFilters.svelte';
  import TodoItem from './TodoItem.svelte';
  import TodoStats from './TodoStats.svelte';

  // ─── Composition root ───────────────────────────────────────────────────
  // Wire the dependencies once. Pass ctx into every handler call.
  const ctx: HandlerContext = { store: todoStore, effects };

  // Boot on mount
  $effect.root(() => {
    handlers.load(ctx);
  });
</script>

<main class="todo-app">
  <header>
    <h1>todos</h1>
  </header>

  <TodoForm onSubmit={(text) => handlers.addTodo(ctx, text)} />

  {#if todoStore.error}
    <p class="error" role="alert">{todoStore.error}</p>
  {/if}

  <TodoFilters
    current={todoStore.currentFilter}
    stats={todoStore.stats}
    onFilter={(f) => handlers.setFilter(ctx, f)}
  />

  {#if todoStore.loading}
    <p class="loading">Loading…</p>
  {:else if todoStore.isEmpty}
    <p class="empty">No todos yet. Add your first one above.</p>
  {:else}
    <ul class="list" aria-label="Todo list">
      {#each todoStore.visible as todo (todo.id)}
        <TodoItem
          {todo}
          onToggle={(id) => handlers.toggleTodo(ctx, id)}
          onDelete={(id) => handlers.deleteTodo(ctx, id)}
          onRename={(id, text) => handlers.renameTodo(ctx, id, text)}
        />
      {/each}
    </ul>
  {/if}

  <TodoStats
    stats={todoStore.stats}
    onClearCompleted={() => handlers.clearCompleted(ctx)}
  />
</main>

<style>
  .todo-app {
    max-width: 560px;
    margin: 2rem auto;
    padding: 0 1rem;
    font-family: system-ui, -apple-system, sans-serif;
  }
  header h1 {
    text-align: center;
    font-size: 3rem;
    color: var(--accent, #4a90e2);
    margin: 0 0 1rem;
    font-weight: 200;
  }
  .error {
    color: var(--danger, #c33);
    background: var(--danger-soft, rgba(204, 51, 51, 0.08));
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    margin: 0.5rem 0;
  }
  .loading,
  .empty {
    text-align: center;
    color: var(--muted, #888);
    padding: 2rem 0;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--border, #eee);
    border-radius: 4px;
    overflow: hidden;
  }
</style>
