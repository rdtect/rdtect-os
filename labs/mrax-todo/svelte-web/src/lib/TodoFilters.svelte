<!--
  MRAX eXperience — Filter bar.
  Pure presentation: shows current filter, dispatches filter changes.
-->
<script lang="ts">
  import type { FilterType, TodoStats } from './todo.types';
  import { FilterType as FT } from './todo.types';

  let {
    current,
    stats,
    onFilter,
  }: {
    current: FilterType;
    stats: TodoStats;
    onFilter: (filter: FilterType) => void;
  } = $props();

  const filters: { value: FilterType; label: string; count: keyof TodoStats }[] = [
    { value: FT.ALL,       label: 'All',       count: 'total' },
    { value: FT.ACTIVE,    label: 'Active',    count: 'active' },
    { value: FT.COMPLETED, label: 'Completed', count: 'completed' },
  ];
</script>

<nav class="filters" aria-label="Filter todos">
  {#each filters as f (f.value)}
    <button
      type="button"
      class:active={current === f.value}
      onclick={() => onFilter(f.value)}
    >
      {f.label}
      <span class="count">{stats[f.count]}</span>
    </button>
  {/each}
</nav>

<style>
  .filters {
    display: flex;
    gap: 0.25rem;
    margin: 1rem 0;
  }
  button {
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid var(--border, #ddd);
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
  }
  button.active {
    border-color: var(--accent, #4a90e2);
    background: var(--accent-soft, rgba(74, 144, 226, 0.1));
    color: var(--accent, #4a90e2);
  }
  .count {
    margin-left: 0.25rem;
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }
</style>
