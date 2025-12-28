"""
MRX MODEL - Tic-Tac-Toe Game Logic
==================================
This is PURE business logic - no I/O, no side effects.
Identical logic exists in TypeScript version.
"""
from dataclasses import dataclass, field
from typing import Optional, List, Tuple
from enum import Enum
import copy


class Player(Enum):
    X = "X"
    O = "O"


class GameStatus(Enum):
    IN_PROGRESS = "in_progress"
    X_WINS = "x_wins"
    O_WINS = "o_wins"
    DRAW = "draw"


# ============================================================
# STATE - Immutable game state
# ============================================================
@dataclass(frozen=True)
class GameState:
    """Immutable game state - the single source of truth"""
    board: Tuple[Tuple[Optional[str], ...], ...] = (
        (None, None, None),
        (None, None, None),
        (None, None, None),
    )
    current_player: str = "X"
    winner: Optional[str] = None
    winning_line: Optional[Tuple[Tuple[int, int], ...]] = None
    is_game_over: bool = False
    move_count: int = 0


# ============================================================
# RULES - Pure validation functions
# ============================================================
class Rules:
    """Pure validation - no side effects"""

    WINNING_LINES = [
        # Rows
        ((0, 0), (0, 1), (0, 2)),
        ((1, 0), (1, 1), (1, 2)),
        ((2, 0), (2, 1), (2, 2)),
        # Columns
        ((0, 0), (1, 0), (2, 0)),
        ((0, 1), (1, 1), (2, 1)),
        ((0, 2), (1, 2), (2, 2)),
        # Diagonals
        ((0, 0), (1, 1), (2, 2)),
        ((0, 2), (1, 1), (2, 0)),
    ]

    @staticmethod
    def can_place(state: GameState, row: int, col: int) -> bool:
        """Check if a move is valid"""
        if state.is_game_over:
            return False
        if not (0 <= row < 3 and 0 <= col < 3):
            return False
        return state.board[row][col] is None

    @staticmethod
    def check_winner(board: Tuple[Tuple[Optional[str], ...], ...]) -> Optional[Tuple[str, Tuple[Tuple[int, int], ...]]]:
        """Check for a winner, return (winner, winning_line) or None"""
        for line in Rules.WINNING_LINES:
            cells = [board[r][c] for r, c in line]
            if cells[0] is not None and cells[0] == cells[1] == cells[2]:
                return (cells[0], line)
        return None

    @staticmethod
    def check_draw(board: Tuple[Tuple[Optional[str], ...], ...]) -> bool:
        """Check if game is a draw (board full, no winner)"""
        for row in board:
            for cell in row:
                if cell is None:
                    return False
        return Rules.check_winner(board) is None


# ============================================================
# ACTIONS - Pure state transformations
# ============================================================
class Actions:
    """Pure functions that transform state"""

    @staticmethod
    def place_marker(state: GameState, row: int, col: int) -> GameState:
        """
        Place a marker and return NEW state.
        Returns unchanged state if move is invalid.
        """
        if not Rules.can_place(state, row, col):
            return state

        # Create new board with the move
        new_board = tuple(
            tuple(
                state.current_player if (r, c) == (row, col) else state.board[r][c]
                for c in range(3)
            )
            for r in range(3)
        )

        # Check for winner
        winner_result = Rules.check_winner(new_board)

        if winner_result:
            winner, winning_line = winner_result
            return GameState(
                board=new_board,
                current_player=state.current_player,
                winner=winner,
                winning_line=winning_line,
                is_game_over=True,
                move_count=state.move_count + 1,
            )

        # Check for draw
        if Rules.check_draw(new_board):
            return GameState(
                board=new_board,
                current_player=state.current_player,
                winner=None,
                winning_line=None,
                is_game_over=True,
                move_count=state.move_count + 1,
            )

        # Game continues - switch player
        next_player = "O" if state.current_player == "X" else "X"
        return GameState(
            board=new_board,
            current_player=next_player,
            winner=None,
            winning_line=None,
            is_game_over=False,
            move_count=state.move_count + 1,
        )

    @staticmethod
    def reset() -> GameState:
        """Return fresh game state"""
        return GameState()


# ============================================================
# SELECTORS - Derived state queries
# ============================================================
class Selectors:
    """Pure functions to derive information from state"""

    @staticmethod
    def get_status(state: GameState) -> GameStatus:
        """Get current game status"""
        if state.winner == "X":
            return GameStatus.X_WINS
        if state.winner == "O":
            return GameStatus.O_WINS
        if state.is_game_over:
            return GameStatus.DRAW
        return GameStatus.IN_PROGRESS

    @staticmethod
    def get_status_message(state: GameState) -> str:
        """Get human-readable status"""
        status = Selectors.get_status(state)
        if status == GameStatus.X_WINS:
            return "Player X wins!"
        if status == GameStatus.O_WINS:
            return "Player O wins!"
        if status == GameStatus.DRAW:
            return "It's a draw!"
        return f"Player {state.current_player}'s turn"

    @staticmethod
    def get_empty_cells(state: GameState) -> List[Tuple[int, int]]:
        """Get list of empty cell positions"""
        empty = []
        for r in range(3):
            for c in range(3):
                if state.board[r][c] is None:
                    empty.append((r, c))
        return empty

    @staticmethod
    def is_winning_cell(state: GameState, row: int, col: int) -> bool:
        """Check if a cell is part of the winning line"""
        if state.winning_line is None:
            return False
        return (row, col) in state.winning_line


# ============================================================
# MODEL FACADE - Clean interface for Experience layer
# ============================================================
class GameModel:
    """
    Facade providing clean interface to the model.
    Holds current state and exposes actions/selectors.
    """

    def __init__(self):
        self._state = GameState()
        self._listeners: List[callable] = []

    @property
    def state(self) -> GameState:
        return self._state

    # Actions
    def place_marker(self, row: int, col: int) -> bool:
        """Place marker, return True if state changed"""
        old_state = self._state
        self._state = Actions.place_marker(self._state, row, col)
        changed = self._state is not old_state
        if changed:
            self._notify()
        return changed

    def reset(self) -> None:
        """Reset the game"""
        self._state = Actions.reset()
        self._notify()

    # Rules
    def can_place(self, row: int, col: int) -> bool:
        return Rules.can_place(self._state, row, col)

    # Selectors
    def get_status(self) -> GameStatus:
        return Selectors.get_status(self._state)

    def get_status_message(self) -> str:
        return Selectors.get_status_message(self._state)

    def is_winning_cell(self, row: int, col: int) -> bool:
        return Selectors.is_winning_cell(self._state, row, col)

    # Observer pattern for Experience layer
    def subscribe(self, listener: callable) -> callable:
        """Subscribe to state changes, returns unsubscribe function"""
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)

    def _notify(self):
        """Notify all listeners of state change"""
        for listener in self._listeners:
            listener(self._state)
