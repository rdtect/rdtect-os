# Building Solitaire: Step-by-Step

## Phase 1: Foundation (Constants & Data)

### Step 1: Create Constants

Every game needs rules. Start with the data:

```javascript
// src/core/constants.js
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const VALUES = ['A', '2', ..., 'K'];
export const RED_SUITS = ['hearts', 'diamonds'];
```

**Why?** Single source of truth. Change once, updates everywhere.

### Step 2: Define Card Structure

A card is just an object:

```javascript
{
  suit: 'hearts',
  value: 'A',
  numericValue: 1,     // For comparisons
  color: 'red',        // For tableau rules
  faceUp: false        // Visibility
}
```

### Step 3: Create Deck

```javascript
// src/core/Deck.js
export class Deck {
  create() {
    // For each suit, create all values
    this.cards = SUITS.flatMap(suit => 
      VALUES.map((value, index) => ({
        suit,
        value,
        numericValue: index + 1,
        color: RED_SUITS.includes(suit) ? 'red' : 'black',
        faceUp: false
      }))
    );
  }
  
  shuffle() {
    // Fisher-Yates algorithm
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
}
```

**ES6 Features:**
- `flatMap()` - Map and flatten in one step
- Destructuring - `[a, b] = [b, a]` swaps values
- Object shorthand - `{ suit }` vs `{ suit: suit }`

---

## Phase 2: Game Rules (Pure Logic)

### Step 4: Foundation Rules

**Rule:** Build up Ace→King, same suit.

```javascript
// src/core/GameLogic.js
export class GameLogic {
  static isValidFoundationMove(foundation, card) {
    // Empty? Must be Ace
    if (foundation.length === 0) return card.value === 'A';
    
    // Not empty? Same suit, next value
    const top = foundation.at(-1);
    return top.suit === card.suit && 
           top.numericValue + 1 === card.numericValue;
  }
}
```

**Why static?** No instance needed - pure function!

### Step 5: Tableau Rules

**Rule:** Build down King→Ace, alternating colors.

```javascript
static isValidTableauMove(pile, card) {
  // Empty? Must be King
  if (pile.length === 0) return card.value === 'K';
  
  // Not empty? Opposite color, descending
  const top = pile.at(-1);
  return top.color !== card.color &&  // Red↔Black
         top.numericValue - 1 === card.numericValue;
}
```

---

## Phase 3: Display (Rendering)

### Step 6: Create Card Elements

```javascript
// src/ui/Renderer.js
export class Renderer {
  createCardElement(card, faceUp) {
    const el = document.createElement('div');
    el.className = faceUp ? `card ${card.color}` : 'card face-down';
    
    if (faceUp) {
      el.innerHTML = `
        <div class="card-top">
          <span>${card.value}</span>
          <span>${SUIT_SYMBOLS[card.suit]}</span>
        </div>
      `;
    }
    return el;
  }
}
```

**Pattern:** Template literals for HTML.

### Step 7: Render Game State

**Key Rule:** Render = State → DOM (never modify state here!)

```javascript
renderStock(stock) {
  const el = document.getElementById('stock');
  el.innerHTML = '';  // Clear
  if (stock.length > 0) {
    el.appendChild(this.createCardElement(stock.at(-1), false));
  }
}
```

---

## Phase 4: Interaction (Events)

### Step 8: Drag and Drop

**Mental Model:** Pick up → Move → Drop

```javascript
// src/ui/EventHandler.js
export class EventHandler {
  onDragStart(e, card, from, pileIndex, cardIndex) {
    // Remember what we're dragging
    this.game.draggedCard = card;
    this.game.draggedFrom = { from, pileIndex, cardIndex };
    
    // Visual: Show entire stack being dragged
    if (from === 'tableau') {
      const tableauEl = document.getElementById(`tableau-${pileIndex}`);
      const cards = tableauEl.querySelectorAll('.card');
      Array.from(cards).slice(cardIndex).forEach(el => {
        el.classList.add('drag-preview');
      });
    }
    
    e.target.classList.add('dragging');
  }
}
```

### Step 9: Visual Feedback

**Feature:** Show if drop is valid (green) or invalid (red).

```javascript
onDragOver(e, element) {
  e.preventDefault();
  
  // Check if move is valid
  const type = element.id.includes('foundation') ? 'foundation' : 'tableau';
  const index = parseInt(element.id.split('-').at(-1));
  const isValid = this.isValidDrop(type, index);
  
  // Green if valid, red if not
  element.classList.remove('drag-over', 'drag-over-invalid');
  element.classList.add(isValid ? 'drag-over' : 'drag-over-invalid');
}

isValidDrop(type, index) {
  if (!this.game.draggedCard) return false;
  
  if (type === 'foundation') {
    return GameLogic.isValidFoundationMove(
      this.game.foundations[index],
      this.game.draggedCard
    );
  } else {
    return GameLogic.isValidTableauMove(
      this.game.tableau[index],
      this.game.draggedCard
    );
  }
}
```

**CSS:**
```css
.card-pile.drag-over {
  background: rgba(76, 175, 80, 0.3);  /* Green */
  border-color: #4CAF50;
}

.card-pile.drag-over-invalid {
  background: rgba(231, 76, 60, 0.3);  /* Red */
  border-color: #e74c3c;
  animation: shake 0.3s;  /* Shake to show invalid */
}

.card.drag-preview {
  opacity: 0.6;  /* Show stack being dragged */
}
```

---

## Phase 5: State Management

### Step 10: Initialize Game

```javascript
// src/state/GameState.js
export class GameState {
  constructor() {
    // Modules
    this.deck = new Deck();
    this.renderer = new Renderer();
    this.eventHandler = new EventHandler(this);
    
    // State - the "truth"
    this.stock = [];
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];
    this.moves = 0;
    this.moveHistory = [];  // For undo
    
    this.eventHandler.setupEventListeners();
    this.initAsync();
  }
}
```

### Step 11: Deal Cards

```javascript
async dealWithAnimation() {
  let cardIndex = 0;
  
  // Deal to 7 tableau piles
  for (let pileIndex = 0; pileIndex < 7; pileIndex++) {
    for (let cardOffset = 0; cardOffset < 7 - pileIndex; cardOffset++) {
      const card = this.deckCards[cardIndex++];
      card.faceUp = (cardOffset === 0);
      this.tableau[pileIndex + cardOffset].push(card);
      
      // Render with delay for animation
      this.renderer.renderTableauPile(/* ... */);
      await this.sleep(ANIMATION_DEAL_DELAY);
    }
  }
  
  this.stock = this.deckCards.slice(cardIndex);
}
```

---

## Phase 6: Polish

### Step 12: Undo System

**Pattern:** Save state snapshots.

```javascript
saveState() {
  // MUST deep copy!
  const state = {
    stock: this.stock.map(c => ({...c})),
    waste: this.waste.map(c => ({...c})),
    foundations: this.foundations.map(f => f.map(c => ({...c}))),
    tableau: this.tableau.map(t => t.map(c => ({...c}))),
    moves: this.moves
  };
  
  // Keep last 50 states
  this.moveHistory = [...this.moveHistory.slice(-49), state];
}

undo() {
  if (!this.moveHistory.length) return;
  const state = this.moveHistory.pop();
  Object.assign(this, state);
  this.render();
}
```

**Critical:** `{...card}` creates new object. Without it, undo won't work!

### Step 13: Keyboard Shortcuts

```javascript
onKeyPress(e) {
  switch(e.key.toLowerCase()) {
    case 'z':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        this.game.undo();
      }
      break;
    case 'n':
      this.game.resetGame();
      break;
  }
}
```

---

## Common Patterns

### Pattern 1: Every Move

```javascript
moveCard() {
  if (!isValid()) return;     // 1. Validate
  this.saveState();           // 2. Save for undo
  this.modifyState();         // 3. Change state
  this.render();              // 4. Update display
}
```

### Pattern 2: Deep Copy

```javascript
// ❌ BAD - Shares reference
const copy = original;

// ✅ GOOD - New object
const copy = {...original};
const deepCopy = array.map(item => ({...item}));
```

### Pattern 3: Async Flow

```javascript
// ❌ BAD
async init() {
  this.deal();        // Not awaited!
  this.startTimer();  // Starts too early
}

// ✅ GOOD
async init() {
  await this.deal();
  this.startTimer();
}
```

---

## Testing Your Code

### Quick Tests

```javascript
// Test deck creation
const deck = new Deck();
deck.create();
console.assert(deck.cards.length === 52);

// Test validation
const foundation = [{ suit: 'hearts', numericValue: 1 }];
const card = { suit: 'hearts', numericValue: 2 };
console.assert(GameLogic.isValidFoundationMove(foundation, card));
```

### Manual Checklist

- [ ] Can draw from stock
- [ ] Can recycle waste
- [ ] Can drag to valid locations
- [ ] Cannot drag to invalid locations
- [ ] Undo works
- [ ] Keyboard shortcuts work
- [ ] Win modal appears when done
- [ ] Green/red feedback shows correctly
- [ ] Entire stack shows when dragging

---

## Bonus: Utility Functions

### Extract Common Code

Notice the repeated deep copy code? Extract it!

```javascript
// src/core/utils.js
export const deepCloneArray = (array) => array.map(item => ({...item}));

export const deepClone2DArray = (array2D) => 
    array2D.map(arr => arr.map(item => ({...item})));

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
```

**Then use:**
```javascript
import { deepCloneArray, deepClone2DArray, formatTime, sleep } from '../core/utils.js';

// Instead of:
this.stock.map(c => ({...c}))
// Use:
deepCloneArray(this.stock)
```

**Benefits:**
- DRY (Don't Repeat Yourself)
- Easier to test
- Consistent behavior
- Single place to optimize

---

## Enhanced main.js

### Add Error Handling

```javascript
// src/main.js
const initGame = () => {
    try {
        console.log('🎮 Initializing Solitaire...');
        const game = new GameState();
        
        // Debug mode
        if (window.location.hostname === 'localhost') {
            window.game = game;
            console.log('💡 window.game available for debugging');
        }
        
        console.log('✅ Game loaded');
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
        // Show user-friendly error
        showErrorScreen(error);
    }
};

// Global error handlers
window.addEventListener('error', handleError);
window.addEventListener('unhandledrejection', handleRejection);

window.addEventListener('DOMContentLoaded', initGame);
```

---

## Next Steps

1. Add sound effects
2. Add analytics tracking
3. Add different difficulty modes
4. Add hint system
5. Add auto-complete feature
6. Add localStorage for save/resume

**Congratulations!** You've built a production-ready game with modern JavaScript! 🎉
