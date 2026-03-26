<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { Cell } from './game.model';

  export let value: Cell;
  export let row: number;
  export let col: number;
  export let isWinning: boolean = false;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    click: { row: number; col: number };
  }>();

  let cellElement: HTMLElement;

  function handleClick() {
    if (!disabled) {
      dispatch('click', { row, col });
    }
  }

  // Expose element for effects registration
  export function getElement(): HTMLElement {
    return cellElement;
  }
</script>

<button
  bind:this={cellElement}
  class="cell"
  class:cell-x={value === 'X'}
  class:cell-o={value === 'O'}
  class:cell-empty={value === null}
  class:cell-winning={isWinning}
  class:cell-disabled={disabled}
  on:click={handleClick}
  aria-label={`Cell ${row * 3 + col + 1}, ${value || 'empty'}`}
>
  {#if value === 'X'}
    <svg class="marker marker-x" viewBox="0 0 100 100">
      <line x1="20" y1="20" x2="80" y2="80" />
      <line x1="80" y1="20" x2="20" y2="80" />
    </svg>
  {:else if value === 'O'}
    <svg class="marker marker-o" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="35" />
    </svg>
  {:else}
    <span class="cell-hint">{row * 3 + col + 1}</span>
  {/if}
</button>

<style>
  .cell {
    aspect-ratio: 1;
    background: var(--cell-bg, #1a1a2e);
    border: 2px solid var(--cell-border, #16213e);
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .cell:hover:not(.cell-disabled) {
    background: var(--cell-hover, #0f3460);
    transform: scale(1.02);
  }

  .cell:active:not(.cell-disabled) {
    transform: scale(0.98);
  }

  .cell-disabled {
    cursor: not-allowed;
  }

  .cell-winning {
    background: var(--win-bg, #00d9ff) !important;
    box-shadow: 0 0 20px var(--win-glow, #00d9ff);
  }

  .marker {
    width: 60%;
    height: 60%;
  }

  .marker-x line {
    stroke: var(--x-color, #ff6b6b);
    stroke-width: 12;
    stroke-linecap: round;
  }

  .marker-o circle {
    fill: none;
    stroke: var(--o-color, #4ecdc4);
    stroke-width: 10;
  }

  .cell-hint {
    color: var(--hint-color, #333);
    font-size: 1.2rem;
    opacity: 0.3;
  }

  /* Animation classes (triggered by effects) */
  :global(.animate-place) {
    animation: place 0.3s ease-out;
  }

  :global(.animate-win) {
    animation: win 0.5s ease-in-out infinite alternate;
  }

  @keyframes place {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes win {
    from {
      box-shadow: 0 0 10px var(--win-glow, #00d9ff);
    }
    to {
      box-shadow: 0 0 30px var(--win-glow, #00d9ff);
    }
  }
</style>
