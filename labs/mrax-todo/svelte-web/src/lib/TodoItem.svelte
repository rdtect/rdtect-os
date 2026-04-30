<!--
  MRAX eXperience — Single todo row, MRAX-shaped.
  Each TodoItem is its own micro-MRAX:
    Model:   props (todo) + local edit state
    Rules:   derived `canDelete`, `canToggle` (always true here, but the
             pattern stays explicit)
    Actions: handleToggle / handleDelete / handleSubmitEdit
    eXperience: the markup below
-->
<script lang="ts">
  import type { Todo } from './todo.types';
  import { TodoStatus } from './todo.types';
  import { TEXT_MAX } from './todo.logic';

  let {
    todo,
    onToggle,
    onDelete,
    onRename,
  }: {
    todo: Todo;
    onToggle: (id: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    onRename?: (id: string, text: string) => void | Promise<void>;
  } = $props();

  // ─── Model — local row state ─────────────────────────────────────────────
  let editing = $state(false);
  let draft = $state(todo.text);

  // ─── Rules — derived ────────────────────────────────────────────────────
  const isCompleted = $derived(todo.status === TodoStatus.COMPLETED);
  const canRename = $derived(!isCompleted && Boolean(onRename));

  // ─── Actions ────────────────────────────────────────────────────────────
  function startEdit() {
    if (!canRename) return;
    draft = todo.text;
    editing = true;
  }

  function cancelEdit() {
    editing = false;
    draft = todo.text;
  }

  async function commitEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === todo.text) {
      cancelEdit();
      return;
    }
    await onRename?.(todo.id, trimmed);
    editing = false;
  }

  function onEditKey(e: KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  }
</script>

<li class="todo-item" class:completed={isCompleted} class:editing>
  <input
    type="checkbox"
    checked={isCompleted}
    onchange={() => onToggle(todo.id)}
    aria-label={isCompleted ? 'Mark active' : 'Mark complete'}
  />

  {#if editing}
    <input
      class="edit"
      type="text"
      bind:value={draft}
      maxlength={TEXT_MAX}
      onkeydown={onEditKey}
      onblur={commitEdit}
    />
  {:else}
    <span
      class="text"
      ondblclick={startEdit}
      role="button"
      tabindex="0"
    >
      {todo.text}
    </span>
  {/if}

  <button
    type="button"
    class="delete"
    onclick={() => onDelete(todo.id)}
    aria-label="Delete todo"
  >×</button>
</li>

<style>
  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.25rem;
    border-bottom: 1px solid var(--border-soft, #eee);
  }
  .text {
    flex: 1;
    cursor: text;
  }
  .completed .text {
    text-decoration: line-through;
    opacity: 0.6;
  }
  .edit {
    flex: 1;
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    border: 1px solid var(--accent, #4a90e2);
    border-radius: 4px;
  }
  .delete {
    background: none;
    border: none;
    color: var(--muted, #888);
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.25rem;
  }
  .delete:hover {
    color: var(--danger, #c33);
  }
</style>
