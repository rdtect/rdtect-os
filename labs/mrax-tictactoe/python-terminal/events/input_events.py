"""
MRX EVENTS - Terminal Input Event Parsing
=========================================
Translates raw terminal input into domain events.
"""
from dataclasses import dataclass
from typing import Union, Optional
from enum import Enum, auto


class EventType(Enum):
    CELL_CLICKED = auto()
    RESET_REQUESTED = auto()
    QUIT_REQUESTED = auto()
    INVALID_INPUT = auto()


@dataclass
class CellClicked:
    """User selected a cell"""
    type: EventType = EventType.CELL_CLICKED
    row: int = 0
    col: int = 0


@dataclass
class ResetRequested:
    """User wants to restart"""
    type: EventType = EventType.RESET_REQUESTED


@dataclass
class QuitRequested:
    """User wants to exit"""
    type: EventType = EventType.QUIT_REQUESTED


@dataclass
class InvalidInput:
    """Couldn't parse input"""
    type: EventType = EventType.INVALID_INPUT
    raw_input: str = ""
    reason: str = ""


GameEvent = Union[CellClicked, ResetRequested, QuitRequested, InvalidInput]


class InputParser:
    """
    Parse terminal input into domain events.

    Supported formats:
    - "1,2" or "1 2" or "12" -> CellClicked(row=1, col=2)
    - "r" or "reset" -> ResetRequested
    - "q" or "quit" or "exit" -> QuitRequested
    """

    @staticmethod
    def parse(raw: str) -> GameEvent:
        """Convert raw input string to GameEvent"""
        text = raw.strip().lower()

        # Check for quit
        if text in ('q', 'quit', 'exit'):
            return QuitRequested()

        # Check for reset
        if text in ('r', 'reset', 'restart', 'new'):
            return ResetRequested()

        # Try to parse as cell coordinates
        return InputParser._parse_cell(text, raw)

    @staticmethod
    def _parse_cell(text: str, raw: str) -> GameEvent:
        """Parse cell coordinates in various formats"""

        # Try "row,col" format
        if ',' in text:
            parts = text.split(',')
            if len(parts) == 2:
                return InputParser._make_cell_event(parts[0], parts[1], raw)

        # Try "row col" format (space separated)
        if ' ' in text:
            parts = text.split()
            if len(parts) == 2:
                return InputParser._make_cell_event(parts[0], parts[1], raw)

        # Try "rowcol" format (two digits together)
        if len(text) == 2 and text.isdigit():
            return InputParser._make_cell_event(text[0], text[1], raw)

        # Try single number as cell index (1-9)
        if len(text) == 1 and text.isdigit():
            num = int(text)
            if 1 <= num <= 9:
                # Convert 1-9 to row,col (1=0,0  2=0,1  3=0,2  4=1,0 ...)
                row = (num - 1) // 3
                col = (num - 1) % 3
                return CellClicked(row=row, col=col)

        return InvalidInput(
            raw_input=raw,
            reason="Enter cell as '1-9', 'row,col', or 'r' to reset"
        )

    @staticmethod
    def _make_cell_event(row_str: str, col_str: str, raw: str) -> GameEvent:
        """Create CellClicked or InvalidInput from string parts"""
        try:
            row = int(row_str.strip())
            col = int(col_str.strip())

            if 0 <= row <= 2 and 0 <= col <= 2:
                return CellClicked(row=row, col=col)
            else:
                return InvalidInput(
                    raw_input=raw,
                    reason="Row and column must be 0-2"
                )
        except ValueError:
            return InvalidInput(
                raw_input=raw,
                reason="Could not parse numbers"
            )
