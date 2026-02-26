<script lang="ts">
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // === Types ===
  type Player = 'X' | 'O';
  type Cell = Player | null;
  type Board = Cell[][];
  type Position = [number, number];
  type WinningLine = Position[];

  type GameMode = 'human' | 'ai';

  const WINNING_LINES: WinningLine[] = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  // === State ===
  let board = $state<Board>([[null, null, null], [null, null, null], [null, null, null]]);
  let currentPlayer = $state<Player>('X');
  let winner = $state<Player | null>(null);
  let winningLine = $state<WinningLine | null>(null);
  let isDraw = $state(false);
  let gameMode = $state<GameMode>('ai');
  let scores = $state<Record<Player | 'draw', number>>({ X: 0, O: 0, draw: 0 });
  let aiThinking = $state(false);

  const isGameOver = $derived(winner !== null || isDraw);

  const statusMessage = $derived(
    winner ? `Player ${winner} wins!` :
    isDraw ? "It's a draw!" :
    aiThinking ? 'AI thinking...' :
    `Player ${currentPlayer}'s turn`
  );

  // === Rules ===
  function checkWinner(b: Board): [Player, WinningLine] | null {
    for (const line of WINNING_LINES) {
      const [[r0, c0], [r1, c1], [r2, c2]] = line;
      const cells = [b[r0][c0], b[r1][c1], b[r2][c2]];
      if (cells[0] !== null && cells[0] === cells[1] && cells[1] === cells[2]) {
        return [cells[0], line];
      }
    }
    return null;
  }

  function isBoardFull(b: Board): boolean {
    return b.every(row => row.every(cell => cell !== null));
  }

  function isWinningCell(row: number, col: number): boolean {
    if (!winningLine) return false;
    return winningLine.some(([r, c]) => r === row && c === col);
  }

  // === AI (Minimax) ===
  function getEmptyCells(b: Board): Position[] {
    const empty: Position[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (b[r][c] === null) empty.push([r, c]);
      }
    }
    return empty;
  }

  function minimax(b: Board, isMaximizing: boolean, depth: number): number {
    const result = checkWinner(b);
    if (result) return result[0] === 'O' ? 10 - depth : depth - 10;
    if (isBoardFull(b)) return 0;

    const cells = getEmptyCells(b);
    if (isMaximizing) {
      let best = -Infinity;
      for (const [r, c] of cells) {
        b[r][c] = 'O';
        best = Math.max(best, minimax(b, false, depth + 1));
        b[r][c] = null;
      }
      return best;
    } else {
      let best = Infinity;
      for (const [r, c] of cells) {
        b[r][c] = 'X';
        best = Math.min(best, minimax(b, true, depth + 1));
        b[r][c] = null;
      }
      return best;
    }
  }

  function getAiMove(b: Board): Position {
    let bestScore = -Infinity;
    let bestMove: Position = [0, 0];
    const cells = getEmptyCells(b);

    for (const [r, c] of cells) {
      b[r][c] = 'O';
      const score = minimax(b, false, 0);
      b[r][c] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = [r, c];
      }
    }
    return bestMove;
  }

  // === Actions ===
  function placeMarker(row: number, col: number) {
    if (isGameOver || board[row][col] !== null || aiThinking) return;

    board[row][col] = currentPlayer;

    const result = checkWinner(board);
    if (result) {
      winner = result[0];
      winningLine = result[1];
      scores[result[0]]++;
      return;
    }

    if (isBoardFull(board)) {
      isDraw = true;
      scores.draw++;
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

    if (gameMode === 'ai' && currentPlayer === 'O') {
      aiThinking = true;
      setTimeout(() => {
        const [r, c] = getAiMove(board);
        board[r][c] = 'O';

        const aiResult = checkWinner(board);
        if (aiResult) {
          winner = aiResult[0];
          winningLine = aiResult[1];
          scores[aiResult[0]]++;
        } else if (isBoardFull(board)) {
          isDraw = true;
          scores.draw++;
        } else {
          currentPlayer = 'X';
        }
        aiThinking = false;
      }, 300);
    }
  }

  function resetGame() {
    board = [[null, null, null], [null, null, null], [null, null, null]];
    currentPlayer = 'X';
    winner = null;
    winningLine = null;
    isDraw = false;
    aiThinking = false;
  }

  function setMode(mode: GameMode) {
    gameMode = mode;
    scores = { X: 0, O: 0, draw: 0 };
    resetGame();
  }
</script>

<div class="ttt">
  <!-- Header -->
  <div class="header">
    <h3>Tic Tac Toe</h3>
    <div class="mode-toggle">
      <button class="mode-btn" class:active={gameMode === 'human'} onclick={() => setMode('human')}>vs Human</button>
      <button class="mode-btn" class:active={gameMode === 'ai'} onclick={() => setMode('ai')}>vs AI</button>
    </div>
  </div>

  <!-- Status -->
  <div class="status" class:win={winner !== null} class:draw={isDraw}>
    {statusMessage}
  </div>

  <!-- Board -->
  <div class="board">
    {#each board as row, ri}
      {#each row as cell, ci}
        <button
          class="cell"
          class:x={cell === 'X'}
          class:o={cell === 'O'}
          class:winning={isWinningCell(ri, ci)}
          class:empty={cell === null && !isGameOver}
          disabled={cell !== null || isGameOver || aiThinking}
          onclick={() => placeMarker(ri, ci)}
        >
          {#if cell}
            <span class="mark">{cell}</span>
          {/if}
        </button>
      {/each}
    {/each}
  </div>

  <!-- Scores -->
  <div class="scores">
    <div class="score-item x">
      <span class="score-label">X</span>
      <span class="score-value">{scores.X}</span>
    </div>
    <div class="score-item draw">
      <span class="score-label">Draw</span>
      <span class="score-value">{scores.draw}</span>
    </div>
    <div class="score-item o">
      <span class="score-label">O</span>
      <span class="score-value">{scores.O}</span>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <button class="reset-btn" onclick={resetGame}>
      {isGameOver ? 'Play Again' : 'Reset'}
    </button>
  </div>
</div>

<style>
  .ttt {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #334155;
    background: #1e293b;
    flex-shrink: 0;
  }
  h3 { margin: 0; font-size: 14px; color: #f1f5f9; font-weight: 600; }
  .mode-toggle { display: flex; gap: 2px; background: rgba(15, 23, 42, 0.5); border-radius: var(--radius-md); padding: 2px; }
  .mode-btn {
    padding: 4px 10px; background: transparent; border: none;
    border-radius: var(--radius-sm); color: #94a3b8; font-size: 11px;
    font-weight: 500; cursor: pointer; transition: all 0.15s;
  }
  .mode-btn:hover { color: #e2e8f0; }
  .mode-btn.active { background: rgba(99, 102, 241, 0.3); color: #a5b4fc; }

  /* Status */
  .status {
    text-align: center;
    padding: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    background: rgba(30, 41, 59, 0.5);
    flex-shrink: 0;
  }
  .status.win { color: #4ade80; background: rgba(34, 197, 94, 0.1); }
  .status.draw { color: #fbbf24; background: rgba(245, 158, 11, 0.1); }

  /* Board */
  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 16px;
    max-width: 300px;
    margin: 0 auto;
    flex-shrink: 0;
  }

  .cell {
    aspect-ratio: 1;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    min-height: 72px;
  }
  .cell.empty:hover { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); }
  .cell:disabled { cursor: default; }
  .cell.winning { background: rgba(34, 197, 94, 0.15); border-color: rgba(34, 197, 94, 0.4); }

  .mark {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    animation: pop 0.2s var(--transition-easing);
  }
  .cell.x .mark { color: #6366f1; }
  .cell.o .mark { color: #f43f5e; }

  @keyframes pop {
    0% { transform: scale(0); opacity: 0; }
    70% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* Scores */
  .scores {
    display: flex;
    justify-content: center;
    gap: 24px;
    padding: 8px;
    flex-shrink: 0;
  }
  .score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .score-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .score-value { font-size: 18px; font-weight: 700; color: #f1f5f9; }
  .score-item.x .score-label { color: #6366f1; }
  .score-item.o .score-label { color: #f43f5e; }
  .score-item.draw .score-label { color: #64748b; }

  /* Controls */
  .controls {
    padding: 8px 16px 12px;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
  }
  .reset-btn {
    padding: 8px 24px;
    background: rgba(99, 102, 241, 0.8);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .reset-btn:hover { background: rgba(99, 102, 241, 1); transform: scale(1.02); }
  .reset-btn:active { transform: scale(0.98); }
</style>
