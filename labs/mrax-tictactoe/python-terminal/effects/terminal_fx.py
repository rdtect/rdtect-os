"""
MRX EFFECTS - Terminal Side Effects
====================================
All impure operations: colors, sounds, screen manipulation.
"""
import os
import sys
from enum import Enum


class Color(Enum):
    """ANSI color codes"""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"

    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_YELLOW = "\033[43m"
    BG_BLUE = "\033[44m"


class TerminalEffects:
    """
    Side effects for terminal display.
    All methods here are IMPURE - they modify the terminal state.
    """

    def __init__(self, enable_colors: bool = True, enable_sounds: bool = True):
        self.colors_enabled = enable_colors and self._supports_color()
        self.sounds_enabled = enable_sounds

    @staticmethod
    def _supports_color() -> bool:
        """Check if terminal supports colors"""
        if not hasattr(sys.stdout, 'isatty'):
            return False
        if not sys.stdout.isatty():
            return False
        if os.environ.get('NO_COLOR'):
            return False
        return True

    def clear_screen(self) -> None:
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')

    def beep(self) -> None:
        """Play a beep sound"""
        if self.sounds_enabled:
            print('\a', end='', flush=True)

    def victory_sound(self) -> None:
        """Play victory sound (multiple beeps)"""
        if self.sounds_enabled:
            for _ in range(3):
                print('\a', end='', flush=True)

    def colorize(self, text: str, *colors: Color) -> str:
        """Wrap text in color codes"""
        if not self.colors_enabled:
            return text
        color_codes = ''.join(c.value for c in colors)
        return f"{color_codes}{text}{Color.RESET.value}"

    def player_x_style(self, text: str) -> str:
        """Style for player X"""
        return self.colorize(text, Color.BOLD, Color.CYAN)

    def player_o_style(self, text: str) -> str:
        """Style for player O"""
        return self.colorize(text, Color.BOLD, Color.MAGENTA)

    def winner_style(self, text: str) -> str:
        """Style for winning announcement"""
        return self.colorize(text, Color.BOLD, Color.GREEN)

    def draw_style(self, text: str) -> str:
        """Style for draw announcement"""
        return self.colorize(text, Color.BOLD, Color.YELLOW)

    def error_style(self, text: str) -> str:
        """Style for error messages"""
        return self.colorize(text, Color.RED)

    def dim_style(self, text: str) -> str:
        """Style for hints/secondary info"""
        return self.colorize(text, Color.DIM)

    def highlight_style(self, text: str) -> str:
        """Style for highlighted cells (winning line)"""
        return self.colorize(text, Color.BOLD, Color.BG_GREEN, Color.WHITE)


# ASCII Art templates
ASCII_TITLE = r"""
  _____ _        _____            _____
 |_   _(_) ___  |_   _|_ _  ___  |_   _|__   ___
   | | | |/ __|   | |/ _` |/ __|   | |/ _ \ / _ \
   | | | | (__    | | (_| | (__    | | (_) |  __/
   |_| |_|\___|   |_|\__,_|\___|   |_|\___/ \___|

"""

ASCII_X = [
    " \\  / ",
    "  \\/  ",
    "  /\\  ",
    " /  \\ ",
]

ASCII_O = [
    " ╭──╮ ",
    " │  │ ",
    " │  │ ",
    " ╰──╯ ",
]

ASCII_EMPTY = [
    "      ",
    "  {}  ",  # Will show cell number
    "      ",
    "      ",
]
