/**
 * MRX HANDLER - Web Game Coordination
 * ====================================
 * Orchestrates the game: connects Model to Experience.
 * This is THE BRIDGE between pure logic and side effects.
 */
import { get } from 'svelte/store';
import {
  type GameStore,
  type GameState,
  Rules,
  Selectors,
  GameStatus,
} from './game.model';
import { type GameEvent } from './game.events';
import { gameEffects } from './game.effects';

// ============================================================
// HANDLER - Bridges Model and Experience
// ============================================================
export class GameHandler {
  private store: GameStore;
  private boardElement: HTMLElement | null = null;
  private cellElements: Map<string, HTMLElement> = new Map();

  constructor(store: GameStore) {
    this.store = store;
  }

  /**
   * Register DOM elements for effects
   */
  registerBoardElement(element: HTMLElement): void {
    this.boardElement = element;
  }

  registerCellElement(row: number, col: number, element: HTMLElement): void {
    this.cellElements.set(`${row}-${col}`, element);
  }

  /**
   * Handle a domain event
   * This is where Experience meets Model
   */
  handleEvent(event: GameEvent): void {
    switch (event.type) {
      case 'CELL_CLICKED':
        this.handleCellClick(event.row, event.col);
        break;
      case 'RESET_REQUESTED':
        this.handleReset();
        break;
      case 'KEYBOARD_MOVE':
        // Keyboard events are already parsed to cell clicks
        break;
    }
  }

  /**
   * Handle cell click
   */
  private handleCellClick(row: number, col: number): void {
    const state = get(this.store);

    // Check via Model if move is valid
    if (!Rules.canPlace(state, row, col)) {
      if (this.boardElement) {
        gameEffects.onInvalidMove(this.boardElement);
      }
      return;
    }

    // Capture pre-move status
    const oldStatus = Selectors.getStatus(state);

    // Execute the move via Model (triggers reactive update)
    this.store.placeMarker(row, col);

    // Trigger placement effect
    const cellElement = this.cellElements.get(`${row}-${col}`);
    if (cellElement) {
      gameEffects.onMarkerPlaced(cellElement);
    }

    // Check for game-ending effects
    const newState = get(this.store);
    const newStatus = Selectors.getStatus(newState);

    if (newStatus !== oldStatus) {
      this.handleGameEnd(newState, newStatus);
    }
  }

  /**
   * Handle game end effects
   */
  private handleGameEnd(state: GameState, status: GameStatus): void {
    if (status === GameStatus.X_WINS || status === GameStatus.O_WINS) {
      // Get winning cell elements
      if (state.winningLine) {
        const winElements = state.winningLine
          .map(([r, c]) => this.cellElements.get(`${r}-${c}`))
          .filter((el): el is HTMLElement => el !== null);
        gameEffects.onVictory(winElements);
      }
    } else if (status === GameStatus.DRAW) {
      gameEffects.onDraw();
    }
  }

  /**
   * Handle game reset
   */
  private handleReset(): void {
    this.store.reset();
    if (this.boardElement) {
      gameEffects.onReset(this.boardElement);
    }
  }
}

// ============================================================
// REACTIVE HANDLER FACTORY - For Svelte components
// ============================================================
export function createGameHandler(store: GameStore): GameHandler {
  return new GameHandler(store);
}
