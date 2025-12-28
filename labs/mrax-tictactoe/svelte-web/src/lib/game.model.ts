/**
 * MRX MODEL - Tic-Tac-Toe Game Logic
 * ==================================
 * This is PURE business logic - no DOM, no side effects.
 * Identical logic exists in Python version.
 */

// ============================================================
// TYPES - Shared type definitions
// ============================================================
export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = readonly [
  readonly [Cell, Cell, Cell],
  readonly [Cell, Cell, Cell],
  readonly [Cell, Cell, Cell]
];
export type Position = readonly [number, number];
export type WinningLine = readonly [Position, Position, Position];

export enum GameStatus {
  IN_PROGRESS = 'in_progress',
  X_WINS = 'x_wins',
  O_WINS = 'o_wins',
  DRAW = 'draw',
}

// ============================================================
// STATE - Immutable game state
// ============================================================
export interface GameState {
  readonly board: Board;
  readonly currentPlayer: Player;
  readonly winner: Player | null;
  readonly winningLine: WinningLine | null;
  readonly isGameOver: boolean;
  readonly moveCount: number;
}

export const initialState: GameState = {
  board: [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ],
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
  isGameOver: false,
  moveCount: 0,
};

// ============================================================
// RULES - Pure validation functions
// ============================================================
export const WINNING_LINES: readonly WinningLine[] = [
  // Rows
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  // Columns
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  // Diagonals
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
] as const;

export const Rules = {
  /**
   * Check if a move is valid
   */
  canPlace(state: GameState, row: number, col: number): boolean {
    if (state.isGameOver) return false;
    if (row < 0 || row >= 3 || col < 0 || col >= 3) return false;
    return state.board[row][col] === null;
  },

  /**
   * Check for a winner, return [winner, winningLine] or null
   */
  checkWinner(board: Board): [Player, WinningLine] | null {
    for (const line of WINNING_LINES) {
      const [[r0, c0], [r1, c1], [r2, c2]] = line;
      const cells = [board[r0][c0], board[r1][c1], board[r2][c2]];
      if (cells[0] !== null && cells[0] === cells[1] && cells[1] === cells[2]) {
        return [cells[0], line];
      }
    }
    return null;
  },

  /**
   * Check if game is a draw (board full, no winner)
   */
  checkDraw(board: Board): boolean {
    for (const row of board) {
      for (const cell of row) {
        if (cell === null) return false;
      }
    }
    return Rules.checkWinner(board) === null;
  },
};

// ============================================================
// ACTIONS - Pure state transformations
// ============================================================
export const Actions = {
  /**
   * Place a marker and return NEW state.
   * Returns unchanged state if move is invalid.
   */
  placeMarker(state: GameState, row: number, col: number): GameState {
    if (!Rules.canPlace(state, row, col)) {
      return state;
    }

    // Create new board with the move
    const newBoard = state.board.map((rowArr, r) =>
      rowArr.map((cell, c) =>
        r === row && c === col ? state.currentPlayer : cell
      )
    ) as unknown as Board;

    // Check for winner
    const winnerResult = Rules.checkWinner(newBoard);

    if (winnerResult) {
      const [winner, winningLine] = winnerResult;
      return {
        board: newBoard,
        currentPlayer: state.currentPlayer,
        winner,
        winningLine,
        isGameOver: true,
        moveCount: state.moveCount + 1,
      };
    }

    // Check for draw
    if (Rules.checkDraw(newBoard)) {
      return {
        board: newBoard,
        currentPlayer: state.currentPlayer,
        winner: null,
        winningLine: null,
        isGameOver: true,
        moveCount: state.moveCount + 1,
      };
    }

    // Game continues - switch player
    const nextPlayer: Player = state.currentPlayer === 'X' ? 'O' : 'X';
    return {
      board: newBoard,
      currentPlayer: nextPlayer,
      winner: null,
      winningLine: null,
      isGameOver: false,
      moveCount: state.moveCount + 1,
    };
  },

  /**
   * Return fresh game state
   */
  reset(): GameState {
    return { ...initialState };
  },
};

// ============================================================
// SELECTORS - Derived state queries
// ============================================================
export const Selectors = {
  /**
   * Get current game status
   */
  getStatus(state: GameState): GameStatus {
    if (state.winner === 'X') return GameStatus.X_WINS;
    if (state.winner === 'O') return GameStatus.O_WINS;
    if (state.isGameOver) return GameStatus.DRAW;
    return GameStatus.IN_PROGRESS;
  },

  /**
   * Get human-readable status message
   */
  getStatusMessage(state: GameState): string {
    const status = Selectors.getStatus(state);
    switch (status) {
      case GameStatus.X_WINS:
        return 'Player X wins!';
      case GameStatus.O_WINS:
        return 'Player O wins!';
      case GameStatus.DRAW:
        return "It's a draw!";
      default:
        return `Player ${state.currentPlayer}'s turn`;
    }
  },

  /**
   * Get list of empty cell positions
   */
  getEmptyCells(state: GameState): Position[] {
    const empty: Position[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (state.board[r][c] === null) {
          empty.push([r, c]);
        }
      }
    }
    return empty;
  },

  /**
   * Check if a cell is part of the winning line
   */
  isWinningCell(state: GameState, row: number, col: number): boolean {
    if (!state.winningLine) return false;
    return state.winningLine.some(([r, c]) => r === row && c === col);
  },
};

// ============================================================
// MODEL STORE - Svelte-compatible reactive wrapper
// ============================================================
import { writable, derived, type Readable } from 'svelte/store';

export function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(initialState);

  return {
    subscribe,

    // Actions
    placeMarker(row: number, col: number): void {
      update((state) => Actions.placeMarker(state, row, col));
    },

    reset(): void {
      set(Actions.reset());
    },

    // Derived selectors as readable stores
    status: derived({ subscribe }, ($state) => Selectors.getStatus($state)),
    statusMessage: derived({ subscribe }, ($state) => Selectors.getStatusMessage($state)),
  };
}

export type GameStore = ReturnType<typeof createGameStore>;
