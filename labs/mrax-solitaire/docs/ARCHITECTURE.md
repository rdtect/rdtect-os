# Solitaire Architecture Guide

## Overview

This is a **tutorial project** demonstrating modern JavaScript and CSS patterns. The architecture prioritizes **clarity** and **learning** over enterprise-level abstraction.

## Design Principles

### 1. Separation of Concerns
```
Core (Logic)  →  No DOM, pure functions
State         →  Game orchestration  
UI            →  DOM manipulation only
```

### 2. Single Responsibility
Each file has ONE clear purpose - easy to understand and teach.

### 3. Progressive Enhancement
Start with basic features, add complexity gradually.

---

## Folder Structure Explained

### `src/` - JavaScript Modules

#### `core/` - Business Logic (No DOM)
- **`constants.js`** - Single source of truth for all magic numbers
- **`Deck.js`** - Pure card creation and shuffling
- **`GameLogic.js`** - Static validation functions

**Why separate?** These can be tested without a browser!

#### `state/` - State Management
- **`GameState.js`** - Main game orchestrator
- Manages game state (stock, waste, foundations, tableau)
- Coordinates all modules

#### `ui/` - User Interface
- **`Renderer.js`** - All DOM manipulation
- **`EventHandler.js`** - All event listeners

**Why separate?** UI can change without touching game logic.

#### `main.js` - Entry Point
Bootstraps the application.

---

### `styles/` - CSS Modules

#### `core.css` - Design System
- CSS variables (colors, spacing, shadows)
- Reset & base styles
- **Why?** Single place to change design tokens

#### `components.css` - All UI Components
- Header, controls, game board
- Card piles and cards
- Modal dialog
- **Why consolidated?** Easier to see all UI at once for learning

#### `animations.css` - Keyframes
- Shuffle, deal, flip, modal animations
- **Why separate?** Animations are optional polish

#### `main.css` - Imports
```css
@import url('core.css');
@import url('components.css');
@import url('animations.css');
```

---

## Data Flow

```
1. User Action (UI)
      ↓
2. Event Handler captures
      ↓
3. GameState validates with GameLogic
      ↓
4. GameState updates state
      ↓
5. Renderer updates DOM
      ↓
6. User sees result
```

---

## Key Patterns

### Pattern 1: Immutable State Updates
```javascript
// ❌ Bad - Mutates original
this.stock = newCards;

// ✅ Good - Creates copy for undo
this.saveState();
this.stock = [...newCards];
```

### Pattern 2: Validation Before Action
```javascript
if (!GameLogic.isValid(move)) return;
this.saveState();
this.executeMove();
this.render();
```

### Pattern 3: Separation of Concerns
```javascript
// ❌ Bad - Logic mixed with DOM
function moveCard() {
    if (valid) {
        element.style.top = '10px'; // DOM!
    }
}

// ✅ Good - Logic separate
function moveCard() {
    if (valid) {
        this.updateState();
        this.render(); // Renderer handles DOM
    }
}
```

---

## ES6 Features Used

### Modules
```javascript
import { SUITS } from './constants.js';
export class Deck { }
```
**Why?** Code organization, explicit dependencies

### Classes
```javascript
class Deck {
    /** @type {Card[]} */
    cards = [];
}
```
**Why?** Encapsulation, clear structure

### Arrow Functions
```javascript
array.map(item => item * 2);
```
**Why?** Concise, lexical `this`

### Destructuring
```javascript
const { from, pileIndex } = this.draggedFrom;
```
**Why?** Cleaner variable extraction

### Array Methods
```javascript
cards.flatMap(suit => VALUES.map(/* ... */))
```
**Why?** Declarative, composable

### Spread Operator
```javascript
const copy = [...original];
const merged = { ...obj1, ...obj2 };
```
**Why?** Immutable updates

### Template Literals
```javascript
const id = `tableau-${index}`;
```
**Why?** Readable string interpolation

---

## CSS Architecture

### BEM-ish Naming
```css
.card { }              /* Component */
.card-top { }          /* Element */
.card.dragging { }     /* State */
```

### CSS Variables
```css
:root {
    --color-primary: #4CAF50;
}
.btn {
    background: var(--color-primary);
}
```
**Why?** Easy theming, consistency

### Mobile-First
```css
/* Base styles for mobile */
.card { width: 70px; }

/* Desktop overrides */
@media (min-width: 768px) {
    .card { width: 100px; }
}
```

---

## Testing Strategy

### Unit Tests (Easy)
- Test `core/` modules
- Pure functions, no DOM
```javascript
test('isValidFoundationMove', () => {
    const foundation = [{ suit: 'hearts', numericValue: 1 }];
    const card = { suit: 'hearts', numericValue: 2 };
    expect(GameLogic.isValidFoundationMove(foundation, card)).toBe(true);
});
```

### Integration Tests (Medium)
- Test state transitions
- Mock Renderer

### E2E Tests (Hard)
- Full user flows
- Requires browser automation

---

## Performance Considerations

### Batching DOM Updates
```javascript
// ❌ Bad - Multiple reflows
element1.innerHTML = 'A';
element2.innerHTML = 'B';
element3.innerHTML = 'C';

// ✅ Good - Single reflow
const fragment = document.createDocumentFragment();
// ... add all elements
element.appendChild(fragment);
```

### CSS over JS
```css
/* ✅ GPU accelerated */
.card {
    transition: transform 0.3s;
}
.card:hover {
    transform: translateY(-5px);
}
```

---

## Common Gotchas

### 1. Reference vs Copy
```javascript
// ❌ Same reference
const a = [1, 2];
const b = a;
b.push(3); // a is also [1, 2, 3]!

// ✅ New array
const c = [...a];
```

### 2. Async Timing
```javascript
// ❌ startTimer runs before deal finishes
async init() {
    this.deal(); // Not awaited!
    this.startTimer();
}

// ✅ Wait for async
async init() {
    await this.deal();
    this.startTimer();
}
```

### 3. Event Listener Memory Leaks
```javascript
// ❌ Listeners accumulate
render() {
    element.innerHTML = '<button onclick="foo()"></button>';
    element.addEventListener('click', handler);
}

// ✅ Clean before re-render
render() {
    element.replaceChildren(); // Removes old listeners
    // Add new elements
}
```

---

## Extension Ideas

1. **LocalStorage** - Save/load game state
2. **Statistics** - Track wins, best time
3. **Themes** - Dark mode, custom card backs
4. **Hints** - Highlight valid moves
5. **Auto-complete** - When all cards face-up
6. **Sound Effects** - Card flip, shuffle sounds
7. **Multiplayer** - WebRTC or WebSockets
8. **AI Solver** - Monte Carlo tree search

---

## Learning Path

### Beginner
1. Understand `core/` - pure logic
2. Add console.log to trace data flow
3. Modify CSS variables

### Intermediate
1. Add new game rule variations
2. Implement new keyboard shortcuts
3. Add animation timing controls

### Advanced
1. Implement undo/redo with Command pattern
2. Add state machine for game flow
3. Optimize rendering with virtual DOM

---

## Resources

- **MDN** - https://developer.mozilla.org
- **JavaScript.info** - https://javascript.info
- **CSS Tricks** - https://css-tricks.com
- **Eloquent JavaScript** - https://eloquentjavascript.net

---

**Remember:** This is a learning project. Clarity > Cleverness! 🎓
