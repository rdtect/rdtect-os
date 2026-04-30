<!--
  MRAX eXperience — Stats footer + clear-completed action.
-->
<script lang="ts">
  import type { TodoStats } from './todo.types';

  let {
    stats,
    onClearCompleted,
  }: {
    stats: TodoStats;
    onClearCompleted: () => void | Promise<void>;
  } = $props();
</script>

<footer class="stats" aria-label="Todo stats">
  <span>
    {stats.active} {stats.active === 1 ? 'item' : 'items'} left
  </span>
  {#if stats.completed > 0}
    <button type="button" class="clear" onclick={onClearCompleted}>
      Clear {stats.completed} completed
    </button>
  {/if}
</footer>

<style>
  .stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0.25rem;
    color: var(--muted, #888);
    font-size: 0.9rem;
  }
  .clear {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  .clear:hover {
    color: var(--danger, #c33);
  }
</style>
