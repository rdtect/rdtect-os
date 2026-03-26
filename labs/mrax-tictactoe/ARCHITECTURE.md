# MRX Cross-Platform Architecture: Tic-Tac-Toe

## The Core Insight

**MODEL is IDENTICAL across platforms. Only EXPERIENCE changes.**

```
┌─────────────────────────────────────────────────────────────────┐
│                         MODEL (Pure Logic)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │   STATE     │ │   RULES     │ │  ACTIONS    │ │ SELECTORS  │ │
│  │ GameState   │ │ canPlace()  │ │placeMarker()│ │getStatus() │ │
│  │ board       │ │checkWinner()│ │  reset()    │ │getMessage()│ │
│  │ winner      │ │ checkDraw() │ │             │ │            │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                  │
│         ⬆️ IDENTICAL CODE: Python & TypeScript ⬆️                │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ THE BRIDGE
                              │ (Handler)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPERIENCE (Platform-Specific)                │
│                                                                  │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐  │
│  │    Python Terminal      │   │       Svelte Web            │  │
│  │                         │   │                             │  │
│  │  UI: print(), input()   │   │  UI: .svelte components     │  │
│  │  Events: parse "1,2"    │   │  Events: click handlers     │  │
│  │  Effects: ANSI colors   │   │  Effects: Web Audio, CSS    │  │
│  │  Handler: main loop     │   │  Handler: reactive stores   │  │
│  └─────────────────────────┘   └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Side-by-Side Comparison

### STATE (Identical Structure)

**Python:**
```python
@dataclass(frozen=True)
class GameState:
    board: Tuple[Tuple[Optional[str], ...], ...]
    current_player: str
    winner: Optional[str]
    winning_line: Optional[Tuple[...]]
    is_game_over: bool
    move_count: int
```

**TypeScript:**
```typescript
interface GameState {
  readonly board: Board;
  readonly currentPlayer: Player;
  readonly winner: Player | null;
  readonly winningLine: WinningLine | null;
  readonly isGameOver: boolean;
  readonly moveCount: number;
}
```

### RULES (Identical Logic)

**Python:**
```python
@staticmethod
def can_place(state: GameState, row: int, col: int) -> bool:
    if state.is_game_over:
        return False
    if not (0 <= row < 3 and 0 <= col < 3):
        return False
    return state.board[row][col] is None
```

**TypeScript:**
```typescript
canPlace(state: GameState, row: number, col: number): boolean {
  if (state.isGameOver) return false;
  if (row < 0 || row >= 3 || col < 0 || col >= 3) return false;
  return state.board[row][col] === null;
}
```

### ACTIONS (Identical Transformations)

**Python:**
```python
@staticmethod
def place_marker(state: GameState, row: int, col: int) -> GameState:
    if not Rules.can_place(state, row, col):
        return state
    # Create new board, check winner, return new state
```

**TypeScript:**
```typescript
placeMarker(state: GameState, row: number, col: number): GameState {
  if (!Rules.canPlace(state, row, col)) return state;
  // Create new board, check winner, return new state
}
```

## The Bridge (Handler)

The Handler is where MODEL meets EXPERIENCE:

```
                    EXPERIENCE
                        │
         ┌──────────────┼──────────────┐
         │              ▼              │
         │    ┌─────────────────┐      │
         │    │    HANDLER      │      │
         │    │                 │      │
    UI ──┼───►│ 1. Receive event│      │
         │    │ 2. Call Model   │◄─────┼── EFFECTS
         │    │ 3. Trigger FX   │      │
         │    │ 4. Update UI    │      │
         │    └────────┬────────┘      │
         │             │               │
         └─────────────┼───────────────┘
                       │
                       ▼
                    MODEL
              (Pure Functions)
```

### Python Handler (Imperative Loop)

```python
def run(self) -> None:
    while self.running:
        # 1. Get input from Experience
        raw_input = self.ui.get_input()

        # 2. Parse into domain event
        event = self.parser.parse(raw_input)

        # 3. Handle event (calls Model + Effects)
        self._handle_event(event)

        # 4. Re-render
        self.ui.render_full(self.model.state)
```

### Svelte Handler (Reactive)

```typescript
function handleCellClick(event) {
  const { row, col } = event.detail;

  // 1. Already have domain event from parser
  // 2. Call Model
  if (!Rules.canPlace(state, row, col)) {
    gameEffects.onInvalidMove(boardElement);  // 3. Effect
    return;
  }

  store.placeMarker(row, col);  // Updates Model
  gameEffects.onMarkerPlaced(cellElement);  // 3. Effect
  // 4. UI updates automatically via Svelte reactivity
}
```

## What Changes Per Platform

| Layer | Python Terminal | Svelte Web |
|-------|----------------|------------|
| **UI** | `print()`, `input()`, ASCII art | Svelte components, HTML/CSS |
| **Events** | Parse "1,2" string → CellClicked | DOM click → CellClicked |
| **Effects** | ANSI colors, `\a` beep | Web Audio, CSS animations |
| **Handler** | While loop + render cycle | Reactive stores + event handlers |

## What Stays The Same

| Element | Shared |
|---------|--------|
| `GameState` | Same structure, same fields |
| `Rules.canPlace()` | Same validation logic |
| `Rules.checkWinner()` | Same winning conditions |
| `Actions.placeMarker()` | Same state transformation |
| `Selectors.getStatus()` | Same derived queries |
| Domain Events | Same event types (CellClicked, Reset) |

## Benefits Proven

1. **True Portability**: The game logic compiles/runs anywhere
2. **Testability**: Test MODEL once, works everywhere
3. **Consistency**: Same rules = same behavior
4. **Maintainability**: Fix bug once in MODEL, fixed everywhere
5. **Platform Optimization**: Each EXPERIENCE can be optimized for its platform

## Running the Examples

### Python Terminal
```bash
cd python-terminal
python main.py
```

### Svelte Web
```bash
cd svelte-web
npm install
npm run dev
```

## Conclusion

MRX proves that **business logic is platform-agnostic**. By strictly separating:

- **MODEL**: What the app *does* (pure logic)
- **EXPERIENCE**: How users *interact* (platform I/O)

We achieve true "write once, run anywhere" for the parts that matter most: the rules, state, and actions that define our application.
