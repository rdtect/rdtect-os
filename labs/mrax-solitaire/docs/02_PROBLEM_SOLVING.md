# Problem-Solving Approach for Game Development

Learn how to approach building any game from scratch.

## Table of Contents
1. [Mental Models](#mental-models)
2. [Problem Decomposition](#decomposition)
3. [From Pseudocode to JavaScript](#pseudocode)
4. [JavaScript APIs We Used](#apis)
5. [Translating to Other Games](#other-games)

---

## Mental Models {#mental-models}

### What is a Mental Model?

A mental model is how you **think about** the problem before coding.

### Solitaire Mental Model

#### Level 1: Physical Reality
```
Imagine playing real Solitaire:
- Cards are in piles on a table
- You pick up a card (or stack)
- You try to place it somewhere
- Rules determine if it's allowed
```

#### Level 2: Data Model
```javascript
// "Piles" = Arrays of cards
// "Cards" = Objects with properties
// "Game" = Current state of all piles

const game = {
    stock: [card1, card2, ...],
    waste: [card3, ...],
    foundations: [[...], [...], [...], [...]],
    tableau: [[...], [...], ...]
};
```

#### Level 3: State Machine
```
State → Action → Validation → New State

Example:
Stock:[52 cards] → Draw → Valid? → Stock:[51] + Waste:[1]
```

### The Key Insight

**Game = Data + Rules + Presentation**

```javascript
// Data
const cards = [...];

// Rules  
function isValidMove(from, to) { }

// Presentation
function render(cards) { }
```

---

## Problem Decomposition {#decomposition}

### Step 1: Break Down the Problem

**Question:** "How do I build Solitaire?"

**Too big!** Break it down:

```
1. How do I represent a card?
   → Object: { suit, value, color, faceUp }

2. How do I create a deck?
   → Loop through suits and values

3. How do I shuffle?
   → Fisher-Yates algorithm

4. How do I deal?
   → Distribute cards to piles

5. How do I show cards?
   → Create DOM elements

6. How do I let users move cards?
   → Drag and drop events

7. How do I check if move is valid?
   → Compare colors, values, suit

8. How do I detect win?
   → Check if all foundations complete
```

### Step 2: Identify Patterns

Notice repeated concepts:
- **Piles** (stock, waste, foundations, tableau) → All are arrays
- **Moves** (draw, drag, drop) → All modify state
- **Validation** (foundation, tableau) → Both check rules

**Insight:** Use the same data structure and patterns!

---

## From Pseudocode to JavaScript {#pseudocode}

### Example: Drawing a Card

#### English Description
```
"When user clicks stock, take the top card,
flip it face-up, and put it in waste pile."
```

#### Pseudocode (Structured English)
```
FUNCTION drawCard:
    IF stock is empty:
        RETURN (do nothing)
    
    card = remove last card from stock
    SET card.faceUp to true
    ADD card to waste
    INCREMENT moves by 1
    UPDATE display
END FUNCTION
```

#### JavaScript Implementation
```javascript
function drawFromStock() {
    if (this.stock.length === 0) return;
    
    const card = this.stock.pop();
    card.faceUp = true;
    this.waste.push(card);
    this.moves++;
    this.render();
}
```

### Example: Validating Tableau Move

#### English
```
"A card can go on tableau if it's opposite color
and one value lower."
```

#### Pseudocode
```
FUNCTION isValidTableauMove(pile, card):
    IF pile is empty:
        RETURN card is King
    
    topCard = last card in pile
    
    IF topCard.color equals card.color:
        RETURN false (same color)
    
    IF topCard.value - 1 equals card.value:
        RETURN true (descending)
    
    RETURN false
END FUNCTION
```

#### JavaScript
```javascript
static isValidTableauMove(pile, card) {
    if (pile.length === 0) {
        return card.value === 'K';
    }
    
    const topCard = pile.at(-1);
    return topCard.color !== card.color &&
           topCard.numericValue - 1 === card.numericValue;
}
```

---

## JavaScript APIs We Used {#apis}

### 1. Array APIs

```javascript
// Creation
const arr = [];
const arr = new Array(7).fill([]);  // 7 empty arrays

// Add/Remove
arr.push(item);      // Add to end
arr.pop();           // Remove from end
arr.splice(2, 1);    // Remove at index 2

// Access
arr[0];              // First
arr[arr.length-1];   // Last (old way)
arr.at(-1);          // Last (modern)

// Transform
arr.map(x => x * 2);        // Transform each
arr.filter(x => x > 5);     // Keep matching
arr.flatMap(x => [x, x]);   // Map + flatten

// Check
arr.every(x => x > 0);      // All match?
arr.some(x => x > 5);       // Any match?
arr.includes(item);         // Contains?
```

### 2. Object APIs

```javascript
// Creation
const obj = {};
const obj = { suit: 'hearts', value: 'A' };

// Spread (copy)
const copy = {...obj};
const merged = {...obj1, ...obj2};

// Assign (merge)
Object.assign(target, source);

// Keys/Values
Object.keys(obj);    // ['suit', 'value']
Object.values(obj);  // ['hearts', 'A']
Object.entries(obj); // [['suit','hearts'], ['value','A']]
```

### 3. DOM APIs

```javascript
// Selection
document.getElementById('stock');
document.querySelector('.card');
document.querySelectorAll('.card');

// Creation
const el = document.createElement('div');
el.className = 'card';
el.innerHTML = '<p>Content</p>';

// Manipulation
parent.appendChild(child);
parent.removeChild(child);
element.replaceChildren();  // Clear all

// Classes
el.classList.add('red');
el.classList.remove('red');
el.classList.toggle('active');

// Events
el.addEventListener('click', handler);
el.removeEventListener('click', handler);
```

### 4. Storage APIs

```javascript
// localStorage (persistent)
localStorage.setItem('key', 'value');
const val = localStorage.getItem('key');
localStorage.removeItem('key');
localStorage.clear();

// sessionStorage (session only)
sessionStorage.setItem('key', 'value');

// JSON (serialize objects)
const str = JSON.stringify(obj);
const obj = JSON.parse(str);
```

### 5. Async APIs

```javascript
// Promises
const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve('done'), 1000);
});

// Async/Await
async function wait() {
    await promise;
    console.log('done');
}

// Common use
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await sleep(1000);  // Wait 1 second
```

---

## Translating to Other Games {#other-games}

### The Universal Pattern

```javascript
// 1. Define game state
const game = { /* data */ };

// 2. Define rules
function isValidMove() { }
function checkWin() { }

// 3. Define actions
function makeMove() {
    if (!isValidMove()) return;
    updateState();
    render();
    checkWin();
}

// 4. Handle events
element.addEventListener('click', makeMove);
```

### Example: Chess

#### Mental Model
```javascript
// State
const chess = {
    board: Array(8).fill(0).map(() => Array(8)),  // 8x8 grid
    currentPlayer: 'white',
    selectedPiece: null
};

// Rules
function isValidMove(from, to, piece) {
    // Different rules per piece type
    switch(piece.type) {
        case 'pawn': return isValidPawnMove(from, to);
        case 'knight': return isValidKnightMove(from, to);
        // ...
    }
}

// Actions
function movePiece(from, to) {
    if (!isValidMove(from, to)) return;
    
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = null;
    currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
    render();
}
```

### Example: Tic-Tac-Toe

```javascript
// State (much simpler!)
const game = {
    board: ['', '', '', '', '', '', '', '', ''],  // 9 cells
    currentPlayer: 'X'
};

// Rules
function checkWin(board) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],  // Rows
        [0,3,6], [1,4,7], [2,5,8],  // Cols
        [0,4,8], [2,4,6]            // Diagonals
    ];
    
    return lines.some(([a,b,c]) => 
        board[a] && board[a] === board[b] && board[a] === board[c]
    );
}

// Actions
function makeMove(index) {
    if (board[index]) return;  // Cell taken
    
    board[index] = currentPlayer;
    
    if (checkWin(board)) {
        alert(`${currentPlayer} wins!`);
    } else {
        currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
    }
    
    render();
}
```

### Example: Tetris

```javascript
// State
const game = {
    board: Array(20).fill(0).map(() => Array(10).fill(0)),
    currentPiece: { shape: [[1,1],[1,1]], x: 4, y: 0 },
    score: 0
};

// Rules
function canMove(piece, dx, dy) {
    // Check each block of piece
    return piece.shape.every((row, y) =>
        row.every((cell, x) => {
            if (!cell) return true;
            const newX = piece.x + x + dx;
            const newY = piece.y + y + dy;
            return isInBounds(newX, newY) && !board[newY][newX];
        })
    );
}

// Actions
function moveDown() {
    if (canMove(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        lockPiece();
        clearLines();
        spawnNewPiece();
    }
    render();
}
```

---

## Common Patterns Across All Games

### Pattern 1: State as Single Object

```javascript
// ✅ All state in one place
const game = {
    board: [],
    score: 0,
    isPlaying: false
};
```

### Pattern 2: Validate Before Modify

```javascript
// Always check first!
function makeMove() {
    if (!isValid()) return;  // Guard clause
    updateState();
    render();
}
```

### Pattern 3: Separate Logic from UI

```javascript
// ✅ Good
function isValidMove() { }  // Pure logic
function renderBoard() { }   // Just UI

// ❌ Bad
function isValidMove() {
    if (valid) {
        element.style.color = 'green';  // Mixed!
    }
}
```

### Pattern 4: Undo System

```javascript
// Works for ANY game
const history = [];

function saveState() {
    history.push(deepCopy(game));
}

function undo() {
    game = history.pop();
    render();
}
```

---

## Step-by-Step Approach

### When Starting ANY Game

#### Step 1: Define the State
```
What data do I need to track?
- Solitaire: piles of cards
- Chess: 8x8 board + pieces
- Tetris: board + current piece
```

#### Step 2: Define the Rules
```
What moves are valid?
- Solitaire: opposite color, descending
- Chess: different per piece type
- Tetris: piece fits in space
```

#### Step 3: Define the Actions
```
What can the user do?
- Solitaire: draw, drag, drop
- Chess: select piece, move piece
- Tetris: move left/right/down, rotate
```

#### Step 4: Define Win/Lose
```
When does the game end?
- Solitaire: all foundations complete
- Chess: king captured
- Tetris: board fills to top
```

---

## Example: Building Minesweeper

Let's apply this approach to a new game!

### Step 1: Mental Model

```
Physical reality:
- Grid of cells
- Some have mines, some are safe
- Click to reveal
- Numbers show adjacent mines
```

### Step 2: Data Model

```javascript
const cell = {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0
};

const game = {
    board: Array(10).fill(0).map(() => 
        Array(10).fill(0).map(() => ({
            hasMine: Math.random() < 0.15,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0
        }))
    ),
    gameOver: false,
    won: false
};
```

### Step 3: Pseudocode

```
FUNCTION revealCell(row, col):
    cell = board[row][col]
    
    IF cell.isFlagged OR cell.isRevealed:
        RETURN
    
    SET cell.isRevealed to true
    
    IF cell.hasMine:
        SET gameOver to true
        CALL showAllMines()
        RETURN
    
    IF cell.adjacentMines is 0:
        FOR EACH neighbor in getNeighbors(row, col):
            CALL revealCell(neighbor.row, neighbor.col)  // Recursive!
    
    CALL render()
END FUNCTION
```

### Step 4: JavaScript

```javascript
function revealCell(row, col) {
    const cell = board[row][col];
    
    if (cell.isFlagged || cell.isRevealed) return;
    
    cell.isRevealed = true;
    
    if (cell.hasMine) {
        gameOver = true;
        showAllMines();
        return;
    }
    
    if (cell.adjacentMines === 0) {
        getNeighbors(row, col).forEach(({r, c}) => {
            revealCell(r, c);  // Recursion!
        });
    }
    
    render();
}
```

---

## Universal Game Architecture

### The Template

```javascript
class Game {
    constructor() {
        this.state = this.getInitialState();
        this.setupEvents();
        this.render();
    }
    
    // 1. Initialize
    getInitialState() {
        return { /* game-specific */ };
    }
    
    // 2. Validate
    isValidMove(move) {
        return /* game-specific rules */;
    }
    
    // 3. Execute
    makeMove(move) {
        if (!this.isValidMove(move)) return;
        this.updateState(move);
        this.checkWinLose();
        this.render();
    }
    
    // 4. Check End
    checkWinLose() {
        if (/* win condition */) this.handleWin();
        if (/* lose condition */) this.handleLose();
    }
    
    // 5. Display
    render() {
        // Update DOM based on state
    }
    
    // 6. Events
    setupEvents() {
        element.addEventListener('click', (e) => {
            this.makeMove(/* parse event */);
        });
    }
}
```

### Apply to ANY Game

1. **Solitaire:** State = piles, Move = card placement
2. **Chess:** State = board, Move = piece movement  
3. **Tetris:** State = board + piece, Move = piece position
4. **Connect4:** State = grid, Move = drop column
5. **Snake:** State = snake array, Move = direction change

---

## Key Concepts

### 1. State Machine

```
Every game is a state machine:

State₀ → Action → State₁ → Action → State₂ → ...
```

### 2. Immutability

```javascript
// For undo/redo to work:
// ❌ Mutate (undo breaks)
state.cards.push(card);

// ✅ Copy (undo works)
state.cards = [...state.cards, card];
```

### 3. Separation of Concerns

```
Data (what) ←→ Logic (rules) ←→ UI (how)
```

Keep these separate = easier to:
- Test
- Modify
- Understand
- Reuse

---

## Problem-Solving Checklist

Before coding ANY game:

- [ ] What is the **physical reality**? (real-world game)
- [ ] What **data** do I need to track?
- [ ] What **rules** govern the game?
- [ ] What **actions** can players take?
- [ ] How do I detect **win/lose**?
- [ ] What **visual feedback** do users need?
- [ ] How do I **persist** state (if needed)?

Then:

- [ ] Write pseudocode first
- [ ] Identify patterns & reusable code
- [ ] Build incrementally (test each piece)
- [ ] Separate concerns (data/logic/UI)

---

## Exercises

### Beginner
1. Build **Tic-Tac-Toe** using the same architecture
2. Add **undo** to Tic-Tac-Toe
3. Add **localStorage** to save game

### Intermediate
1. Build **Connect Four** (similar to Tic-Tac-Toe but vertical)
2. Build **Memory Card Game** (flip matching pairs)
3. Build **Snake** (moving array, collision detection)

### Advanced
1. Build **Minesweeper** (recursive reveal)
2. Build **Chess** (complex piece movement)
3. Build **Tetris** (falling pieces, line clearing)

---

## Key Takeaways

1. **Think before coding** - Mental model first
2. **Break down problems** - Small pieces are manageable
3. **Write pseudocode** - Bridge from idea to code
4. **Use patterns** - Same architecture for all games
5. **Separate concerns** - Data, logic, UI independent
6. **Test incrementally** - Build and test each piece
7. **Learn APIs** - Array, Object, DOM, Storage

---

## Resources

- **[JavaScript.info](https://javascript.info)** - Learn JS deeply
- **[MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)** - All browser APIs
- **[Eloquent JavaScript](https://eloquentjavascript.net)** - Problem-solving focus

**Congratulations!** You now have a mental framework for building ANY game! 🎮
