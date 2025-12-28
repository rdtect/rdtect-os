<script lang="ts">
  import { onMount } from 'svelte';
  import Board from './Board.svelte';
  import Status from './Status.svelte';
  import { createGameStore } from './game.model';
  import { GameEvents, EventParsers } from './game.events';
  import { createGameHandler } from './game.handlers';

  // MODEL - Create the game store (pure logic)
  const gameStore = createGameStore();

  // HANDLER - Bridge between Model and Experience
  const handler = createGameHandler(gameStore);

  // UI References
  let boardComponent: Board;

  // Reactive state
  $: state = $gameStore;

  // Register DOM elements for effects after mount
  onMount(() => {
    // Register board element
    const boardEl = boardComponent?.getBoardElement();
    if (boardEl) {
      handler.registerBoardElement(boardEl);
    }

    // Register cell elements
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cellEl = boardComponent?.getCellElement(r, c);
        if (cellEl) {
          handler.registerCellElement(r, c, cellEl);
        }
      }
    }

    // Setup keyboard handler
    function handleKeydown(event: KeyboardEvent) {
      const domainEvent = EventParsers.fromKeyboard(event);
      if (domainEvent) {
        handler.handleEvent(domainEvent);
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  // Event handlers - translate DOM events to domain events
  function handleCellClick(event: CustomEvent<{ row: number; col: number }>) {
    const { row, col } = event.detail;
    handler.handleEvent(GameEvents.cellClicked(row, col));
  }

  function handleReset() {
    handler.handleEvent(GameEvents.resetRequested());
  }
</script>

<div class="game-container">
  <header class="game-header">
    <h1>Tic Tac Toe</h1>
    <p class="subtitle">MRX Architecture Demo</p>
  </header>

  <Status {state} />

  <Board
    bind:this={boardComponent}
    {state}
    on:cellClick={handleCellClick}
  />

  <div class="controls">
    <button class="reset-button" on:click={handleReset}>
      New Game
    </button>
  </div>

  <footer class="game-footer">
    <p>Press <kbd>1-9</kbd> to select cell, <kbd>R</kbd> to reset</p>
  </footer>
</div>

<style>
  .game-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
    color: #fff;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .game-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .game-header h1 {
    font-size: 2.5rem;
    margin: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: #666;
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }

  .controls {
    margin-top: 1.5rem;
  }

  .reset-button {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  }

  .reset-button:active {
    transform: translateY(0);
  }

  .game-footer {
    margin-top: 2rem;
    color: #555;
    font-size: 0.85rem;
  }

  .game-footer kbd {
    background: #333;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
  }
</style>
