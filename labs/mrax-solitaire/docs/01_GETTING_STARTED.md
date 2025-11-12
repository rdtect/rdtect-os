# Getting Started with Solitaire

## Quick Start

1. Open `index.html` in your browser
2. Cards will shuffle and deal automatically
3. Start playing!

## Game Controls

### Mouse
- **Click stock** - Draw a card
- **Drag & drop** - Move cards
- **Double-click card** - Auto-move to foundation (if valid)

### Keyboard
- `Ctrl/Cmd + Z` - Undo last move
- `N` - New game
- `Space` or `D` - Draw from stock

## Project Structure

```
solitaire/
├── index.html           # Game UI
├── src/                 # JavaScript
│   ├── core/           # Game logic (no DOM)
│   │   ├── constants.js
│   │   ├── Deck.js
│   │   ├── GameLogic.js
│   │   └── utils.js    # Helper functions
│   ├── state/          # State management
│   │   └── GameState.js
│   ├── ui/             # Rendering & events
│   │   ├── Renderer.js
│   │   └── EventHandler.js
│   └── main.js         # Entry point with error handling
└── styles/             # CSS
    ├── main.css        # Variables & base
    ├── components.css  # UI components
    └── animations.css  # Keyframes
```

## Key Concepts

### 1. Separation of Concerns

```
Core (Logic) → No browser, pure functions
State        → Orchestrates everything
UI           → DOM manipulation only
```

### 2. Data Flow

```
User Action → Event Handler → Game State → Validation → Render
```

### 3. The Five Piles

- **Stock** - Cards to draw (face-down)
- **Waste** - Drawn cards (face-up)
- **Foundations** - 4 piles to build Ace→King (win condition)
- **Tableau** - 7 play piles to build King→Ace

## Next Steps

### Learn by Building
1. **[Building Tutorial](BUILDING.md)** - Step-by-step implementation
2. **[JavaScript Guide](JS_GUIDE.md)** - ES6+ features explained
3. **[CSS Guide](CSS_GUIDE.md)** - Modern CSS techniques

### Understand the Design
- **[Architecture](../ARCHITECTURE.md)** - Design principles & patterns
- **[README](../README.md)** - Project overview
