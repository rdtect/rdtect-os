/**
 * MRX EVENTS - DOM Event to Domain Event Translation
 * ===================================================
 * Translates raw DOM events into domain events.
 */

// ============================================================
// DOMAIN EVENTS - What the Model understands
// ============================================================
export type GameEvent =
  | { type: 'CELL_CLICKED'; row: number; col: number }
  | { type: 'RESET_REQUESTED' }
  | { type: 'KEYBOARD_MOVE'; key: string };

// ============================================================
// EVENT FACTORIES - Create domain events
// ============================================================
export const GameEvents = {
  /**
   * Create a cell click event from row/col
   */
  cellClicked(row: number, col: number): GameEvent {
    return { type: 'CELL_CLICKED', row, col };
  },

  /**
   * Create a reset event
   */
  resetRequested(): GameEvent {
    return { type: 'RESET_REQUESTED' };
  },

  /**
   * Create a keyboard move event
   */
  keyboardMove(key: string): GameEvent {
    return { type: 'KEYBOARD_MOVE', key };
  },
};

// ============================================================
// EVENT PARSERS - From DOM events to domain events
// ============================================================
export const EventParsers = {
  /**
   * Parse a click event on a cell element
   */
  fromCellClick(event: MouseEvent, row: number, col: number): GameEvent {
    event.preventDefault();
    return GameEvents.cellClicked(row, col);
  },

  /**
   * Parse keyboard input for moves
   * Supports: 1-9 for cells, r for reset
   */
  fromKeyboard(event: KeyboardEvent): GameEvent | null {
    const key = event.key.toLowerCase();

    // Reset
    if (key === 'r') {
      return GameEvents.resetRequested();
    }

    // Number keys 1-9 for cell selection
    if (/^[1-9]$/.test(key)) {
      const num = parseInt(key);
      const row = Math.floor((num - 1) / 3);
      const col = (num - 1) % 3;
      return GameEvents.cellClicked(row, col);
    }

    return null;
  },

  /**
   * Parse touch event (for mobile)
   */
  fromTouch(event: TouchEvent, row: number, col: number): GameEvent {
    event.preventDefault();
    return GameEvents.cellClicked(row, col);
  },
};
