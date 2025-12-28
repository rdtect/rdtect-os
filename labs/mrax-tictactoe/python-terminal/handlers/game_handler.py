"""
MRX HANDLER - Terminal Game Loop
================================
Orchestrates the game: connects Model to Experience.
This is THE BRIDGE between pure logic and side effects.
"""
import sys
sys.path.insert(0, '..')

from game_model import GameModel, GameStatus
from events.input_events import (
    InputParser, EventType, CellClicked, ResetRequested,
    QuitRequested, InvalidInput
)
from effects.terminal_fx import TerminalEffects
from ui.terminal import TerminalUI


class GameHandler:
    """
    The Handler bridges Model and Experience.

    Responsibilities:
    1. Receive Experience events (user input)
    2. Call Model actions (pure state changes)
    3. Trigger Experience effects (sounds, colors)
    4. Request Experience to re-render
    """

    def __init__(self):
        # MODEL - pure business logic
        self.model = GameModel()

        # EXPERIENCE - platform-specific I/O
        self.fx = TerminalEffects(enable_colors=True, enable_sounds=True)
        self.ui = TerminalUI(self.fx)
        self.parser = InputParser()

        # Track if we should exit
        self.running = True

    def run(self) -> None:
        """Main game loop"""
        # Initial render
        self.ui.render_full(self.model.state)

        while self.running:
            # 1. Get input from Experience
            raw_input = self.ui.get_input()

            # 2. Parse into domain event
            event = self.parser.parse(raw_input)

            # 3. Handle event (calls Model + Effects)
            self._handle_event(event)

            # 4. Re-render
            if self.running:
                self.ui.render_full(self.model.state)

        # Goodbye
        self.ui.render_goodbye()

    def _handle_event(self, event) -> None:
        """
        Handle a domain event.
        This is where Experience meets Model.
        """
        if event.type == EventType.QUIT_REQUESTED:
            self.running = False

        elif event.type == EventType.RESET_REQUESTED:
            self.model.reset()
            self.fx.beep()

        elif event.type == EventType.CELL_CLICKED:
            self._handle_cell_click(event)

        elif event.type == EventType.INVALID_INPUT:
            self.ui.render_error(event.reason)

    def _handle_cell_click(self, event: CellClicked) -> None:
        """Handle a cell click event"""
        row, col = event.row, event.col

        # Check via Model if move is valid
        if not self.model.can_place(row, col):
            if self.model.state.is_game_over:
                self.ui.render_error("Game over! Press 'r' to restart.")
            else:
                self.ui.render_error("Cell already occupied!")
            self.fx.beep()
            return

        # Execute the move via Model
        old_status = self.model.get_status()
        self.model.place_marker(row, col)
        new_status = self.model.get_status()

        # Trigger effects based on state change
        if new_status != old_status:
            if new_status in (GameStatus.X_WINS, GameStatus.O_WINS):
                self.fx.victory_sound()
            elif new_status == GameStatus.DRAW:
                self.fx.beep()


def main():
    """Entry point"""
    handler = GameHandler()
    handler.run()


if __name__ == "__main__":
    main()
