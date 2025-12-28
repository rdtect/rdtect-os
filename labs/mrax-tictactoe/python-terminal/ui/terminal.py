"""
MRX UI - Terminal Rendering
===========================
Renders game state to the terminal.
"""
from typing import Optional, Tuple
import sys

# Import from parent
sys.path.insert(0, '..')
from game_model import GameState, GameStatus, Selectors
from effects.terminal_fx import (
    TerminalEffects, ASCII_TITLE, ASCII_X, ASCII_O, ASCII_EMPTY
)


class TerminalUI:
    """
    Renders game state to terminal.
    Pure rendering - reads state, produces output.
    """

    def __init__(self, fx: TerminalEffects):
        self.fx = fx

    def render_title(self) -> None:
        """Render the game title"""
        print(self.fx.player_x_style(ASCII_TITLE))

    def render_board(self, state: GameState) -> None:
        """Render the game board with ASCII art"""
        print()

        for row in range(3):
            # Each cell is 4 lines tall
            for line in range(4):
                row_output = []
                for col in range(3):
                    cell = state.board[row][col]
                    cell_num = row * 3 + col + 1

                    # Check if this cell is part of winning line
                    is_winner = Selectors.is_winning_cell(state, row, col)

                    # Get the ASCII art line for this cell
                    cell_str = self._get_cell_line(cell, cell_num, line, is_winner)
                    row_output.append(cell_str)

                # Join cells with vertical separator
                separator = self.fx.dim_style(" | ")
                print(f"  {separator.join(row_output)}")

            # Print horizontal separator between rows
            if row < 2:
                sep_line = self.fx.dim_style("  " + "-" * 24)
                print(sep_line)

        print()

    def _get_cell_line(
        self,
        cell: Optional[str],
        cell_num: int,
        line: int,
        is_winner: bool
    ) -> str:
        """Get one line of ASCII art for a cell"""
        if cell == "X":
            art = ASCII_X[line]
            styled = self.fx.player_x_style(art)
            if is_winner:
                styled = self.fx.highlight_style(art)
            return styled
        elif cell == "O":
            art = ASCII_O[line]
            styled = self.fx.player_o_style(art)
            if is_winner:
                styled = self.fx.highlight_style(art)
            return styled
        else:
            # Empty cell - show number hint on middle line
            art = ASCII_EMPTY[line]
            if line == 1:
                art = art.format(cell_num)
            else:
                art = art.format(" ")
            return self.fx.dim_style(art)

    def render_status(self, state: GameState) -> None:
        """Render the current game status"""
        status = Selectors.get_status(state)
        message = Selectors.get_status_message(state)

        if status == GameStatus.X_WINS:
            print(self.fx.winner_style(f"  {message}"))
        elif status == GameStatus.O_WINS:
            print(self.fx.winner_style(f"  {message}"))
        elif status == GameStatus.DRAW:
            print(self.fx.draw_style(f"  {message}"))
        else:
            # In progress - style current player
            if state.current_player == "X":
                styled_msg = f"  Player {self.fx.player_x_style('X')}'s turn"
            else:
                styled_msg = f"  Player {self.fx.player_o_style('O')}'s turn"
            print(styled_msg)

        print()

    def render_help(self) -> None:
        """Render input instructions"""
        help_text = self.fx.dim_style(
            "  Enter: 1-9 (cell) | r (reset) | q (quit)"
        )
        print(help_text)
        print()

    def render_error(self, message: str) -> None:
        """Render an error message"""
        print(self.fx.error_style(f"  Error: {message}"))
        print()

    def render_goodbye(self) -> None:
        """Render farewell message"""
        print()
        print(self.fx.dim_style("  Thanks for playing! Goodbye."))
        print()

    def get_input(self) -> str:
        """Get input from user"""
        try:
            prompt = self.fx.dim_style("  > ")
            return input(prompt)
        except (EOFError, KeyboardInterrupt):
            return "q"

    def render_full(self, state: GameState) -> None:
        """Render complete game view"""
        self.fx.clear_screen()
        self.render_title()
        self.render_board(state)
        self.render_status(state)
        self.render_help()
