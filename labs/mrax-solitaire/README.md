# Solitaire Game

A modern, fully-featured Klondike Solitaire built with vanilla JavaScript ES6+ and modular CSS.

## 🎮 Features

- **Classic Gameplay**: Full Klondike Solitaire rules
- **Modern Controls**:
  - Drag & drop cards
  - Double-click to auto-move to foundation
  - Keyboard shortcuts (Ctrl+Z: Undo, N: New Game, Space/D: Draw)
- **Game Features**:
  - Unlimited undo (last 50 moves)
  - Move counter & timer
  - Win detection with celebration modal
  - Smooth animations
- **Responsive Design**: Works on mobile and desktop

## 📁 Project Structure

```
solitaire/
├── index.html
├── README.md
├── TUTORIAL.md           # Step-by-step build guide
├── src/                  # JavaScript modules
│   ├── core/            # Pure logic (no DOM)
│   │   ├── constants.js # Single source of truth
│   │   ├── Deck.js      # Card creation & shuffling
│   │   ├── GameLogic.js # Game rules validation
│   │   └── utils.js     # Reusable helper functions
│   ├── state/           # State management
│   │   └── GameState.js # Main game orchestrator
│   ├── ui/              # User interface
│   │   ├── Renderer.js  # DOM manipulation
│   │   └── EventHandler.js # Event listeners
│   └── main.js          # Entry point
└── styles/              # CSS modules
    ├── main.css         # Imports all CSS
    ├── core.css         # Variables + base styles
    ├── components.css   # All UI components
    └── animations.css   # Keyframe animations
```

## 🚀 Getting Started

1. Open `index.html` in a modern browser
2. Cards will shuffle and deal automatically
3. Start playing!

## 🎯 How to Play

### Goal
Move all cards to the four foundation piles (Ace → King, by suit)

### Rules
- **Foundations**: Build up (A→K), same suit
- **Tableau**: Build down (K→A), alternating colors
- **Stock**: Click to draw cards, unlimited recycling

### Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z`: Undo last move
- `N`: Start new game
- `Space` or `D`: Draw from stock
- `Double-click`: Auto-move card to foundation (if valid)

## 🛠 Technical Details

### ES6+ Features Used
- ES6 Modules (`import`/`export`)
- Classes with JSDoc annotations
- Arrow functions
- Destructuring
- Spread operator
- Template literals
- Array methods (`map`, `forEach`, `flatMap`, `every`, `at`)
- Async/await
- Optional chaining (`?.`)

### Architecture Principles
- **Separation of Concerns**: Core logic, state, and UI are separate
- **Single Responsibility**: Each module has one job
- **DRY**: No code duplication
- **SSOT**: All constants in one place
- **Pure Functions**: Game logic has no side effects

### CSS Organization
- **CSS Variables**: All magic numbers centralized
- **Mobile-First**: Responsive design
- **Modular**: Easy to find and modify styles

## 📚 Documentation

### Getting Started
- **[Quick Start](docs/GETTING_STARTED.md)** - Play the game and understand the project
- **[Building Tutorial](docs/BUILDING.md)** - Build Solitaire step-by-step

### Deep Dives
- **[JavaScript Guide](docs/JS_GUIDE.md)** - Modern ES6+ features explained
- **[CSS Guide](docs/CSS_GUIDE.md)** - Modern CSS techniques
- **[Storage Guide](docs/STORAGE_GUIDE.md)** - localStorage & CRUD operations
- **[Architecture](ARCHITECTURE.md)** - Design principles & patterns

### Comparisons
- **[Svelte 5 Comparison](docs/SVELTE_COMPARISON.md)** - How code differs in Svelte

### What You'll Learn
- ES6+ (modules, classes, arrow functions, async/await)
- CSS (variables, flexbox, animations, responsive)
- Architecture (separation of concerns, state management)
- UX (drag feedback, keyboard shortcuts, undo)

## 🎨 Customization

Edit `styles/core.css` to change:
- Colors (CSS variables)
- Card dimensions
- Animations timing
- Shadows and effects

## 📝 License

MIT - Feel free to use for learning!

---

**Built with vanilla JS** - No frameworks, just modern JavaScript! 🚀