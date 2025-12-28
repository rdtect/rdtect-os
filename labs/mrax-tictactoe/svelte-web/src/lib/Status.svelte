<script lang="ts">
  import type { GameState } from './game.model';
  import { Selectors, GameStatus } from './game.model';

  export let state: GameState;

  $: status = Selectors.getStatus(state);
  $: message = Selectors.getStatusMessage(state);
  $: isVictory = status === GameStatus.X_WINS || status === GameStatus.O_WINS;
  $: isDraw = status === GameStatus.DRAW;
</script>

<div
  class="status"
  class:status-victory={isVictory}
  class:status-draw={isDraw}
  class:status-x={state.currentPlayer === 'X' && !state.isGameOver}
  class:status-o={state.currentPlayer === 'O' && !state.isGameOver}
>
  <span class="status-text">{message}</span>

  {#if !state.isGameOver}
    <div class="turn-indicator">
      {#if state.currentPlayer === 'X'}
        <svg class="turn-marker marker-x" viewBox="0 0 100 100">
          <line x1="20" y1="20" x2="80" y2="80" />
          <line x1="80" y1="20" x2="20" y2="80" />
        </svg>
      {:else}
        <svg class="turn-marker marker-o" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="35" />
        </svg>
      {/if}
    </div>
  {/if}
</div>

<style>
  .status {
    text-align: center;
    padding: 1rem 2rem;
    border-radius: 12px;
    background: var(--status-bg, #1a1a2e);
    margin: 1rem auto;
    max-width: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    transition: all 0.3s ease;
  }

  .status-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color, #fff);
  }

  .status-victory {
    background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
    animation: victory-pulse 1s ease-in-out infinite alternate;
  }

  .status-victory .status-text {
    color: #000;
  }

  .status-draw {
    background: linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%);
  }

  .status-draw .status-text {
    color: #000;
  }

  .status-x {
    border: 2px solid var(--x-color, #ff6b6b);
  }

  .status-o {
    border: 2px solid var(--o-color, #4ecdc4);
  }

  .turn-indicator {
    width: 30px;
    height: 30px;
  }

  .turn-marker {
    width: 100%;
    height: 100%;
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

  @keyframes victory-pulse {
    from {
      box-shadow: 0 0 10px rgba(0, 217, 255, 0.5);
    }
    to {
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
    }
  }
</style>
