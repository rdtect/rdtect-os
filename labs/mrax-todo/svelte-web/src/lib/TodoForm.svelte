<!--
  MRAX eXperience — Add-todo input form.
  Micro-experience: Notice (input visible) → Engage (type) → Mull (sent?) → Exchange (item appears).
-->
<script lang="ts">
  import { TEXT_MAX } from './todo.logic';

  let { onSubmit }: { onSubmit: (text: string) => void | Promise<void> } = $props();

  let text = $state('');
  let submitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const value = text.trim();
    if (!value || submitting) return;
    submitting = true;
    try {
      await onSubmit(value);
      text = '';
    } finally {
      submitting = false;
    }
  }
</script>

<form onsubmit={handleSubmit} class="todo-form">
  <input
    type="text"
    bind:value={text}
    maxlength={TEXT_MAX}
    placeholder="What needs doing?"
    aria-label="New todo"
    autocomplete="off"
    disabled={submitting}
  />
  <button type="submit" disabled={!text.trim() || submitting}>
    Add
  </button>
</form>

<style>
  .todo-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
  }
  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 1px solid var(--accent, #4a90e2);
    background: var(--accent, #4a90e2);
    color: white;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
