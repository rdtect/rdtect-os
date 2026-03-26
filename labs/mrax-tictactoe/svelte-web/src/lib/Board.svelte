<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Cell from './Cell.svelte';
  import type { GameState } from './game.model';
  import { Selectors } from './game.model';

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    cellClick: { row: number; col: number };
  }>();

  let boardElement: HTMLElement;
  let cellComponents: Map<string, Cell> = new Map();

  function handleCellClick(event: CustomEvent<{ row: number; col: number }>) {
    dispatch('cellClick', event.detail);
  }

  // Expose for effects
  export function getBoardElement(): HTMLElement {
    return boardElement;
  }

  export function getCellElement(row: number, col: number): HTMLElement | null {
    const cell = cellComponents.get(`${row}-${col}`);
    return cell?.getElement() ?? null;
  }
</script>

<div class="board-container">
  <div
    bind:this={boardElement}
    class="board"
    class:game-over={state.isGameOver}
  >
    {#each state.board as row, rowIndex}
      {#each row as cell, colIndex}
        <Cell
          bind:this={cellComponents[`${rowIndex}-${colIndex}`]}
          value={cell}
          row={rowIndex}
          col={colIndex}
          isWinning={Selectors.isWinningCell(state, rowIndex, colIndex)}
          disabled={state.isGameOver || cell !== null}
          on:click={handleCellClick}
        />
      {/each}
    {/each}
  </div>
</div>

<style>
  .board-container {
    display: flex;
    justify-content: center;
    padding: 1rem;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: min(400px, 90vw);
    padding: 15px;
    background: var(--board-bg, #0f0f23);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .game-over {
    opacity: 0.9;
  }

  /* Animation classes (triggered by effects) */
  :global(.animate-shake) {
    animation: shake 0.4s ease-in-out;
  }

  :global(.animate-reset) {
    animation: reset 0.3s ease-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-10px); }
    40% { transform: translateX(10px); }
    60% { transform: translateX(-10px); }
    80% { transform: translateX(10px); }
  }

  @keyframes reset {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(0.95);
      opacity: 0.5;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
