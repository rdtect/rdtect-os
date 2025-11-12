# Svelte 5 vs Vanilla JS

Compare how Solitaire would be built with Svelte 5 vs vanilla JavaScript.

## Quick Comparison

| Aspect | Vanilla JS | Svelte 5 |
|--------|-----------|----------|
| Code lines | ~500 | ~200 |
| Reactivity | Manual | Automatic |
| DOM updates | Imperative | Declarative |
| Build step | None | Required |

---

## 1. State Management

### Vanilla JS
```javascript
class GameState {
    constructor() {
        this.stock = [];
        this.moves = 0;
    }
    drawCard() {
        this.moves++;
        this.render();  // Manual!
    }
}
```

### Svelte 5
```svelte
<script>
let stock = $state([]);
let moves = $state(0);

function drawCard() {
    moves++;  // Auto-updates UI!
}
</script>
```

---

## 2. Rendering

### Vanilla JS
```javascript
renderStock(stock) {
    const el = document.getElementById('stock');
    el.innerHTML = '';
    if (stock.length > 0) {
        el.appendChild(createCard(stock.at(-1)));
    }
}
```

### Svelte 5
```svelte
<div id="stock">
    {#if stock.length > 0}
        <Card card={stock.at(-1)} />
    {/if}
</div>
```

---

## 3. Full Game Component

### Svelte 5 Version

```svelte
<!-- Game.svelte -->
<script>
import { Deck } from './Deck.js';
import Card from './Card.svelte';

let stock = $state([]);
let waste = $state([]);
let foundations = $state([[], [], [], []]);
let tableau = $state([[], [], [], [], [], [], []]);
let moves = $state(0);

// Computed
let isWon = $derived(
    foundations.every(f => f.length === 13)
);

// Effects
$effect(() => {
    if (isWon) alert('You won!');
});

function init() {
    const deck = new Deck().create().shuffle();
    // Deal cards...
}

function drawCard() {
    if (stock.length > 0) {
        const card = stock.pop();
        waste.push(card);
        moves++;
    }
}
</script>

<div class="game">
    <button onclick={init}>New Game</button>
    <p>Moves: {moves}</p>
    
    <div onclick={drawCard}>
        {#if stock.length > 0}
            <Card card={stock.at(-1)} />
        {/if}
    </div>
    
    {#each tableau as pile, i}
        <Pile cards={pile} index={i} />
    {/each}
</div>
```

Total: ~100 lines vs 500 in vanilla!

---

## Key Takeaways

✅ Svelte is **much shorter** (60% less code)  
✅ **Automatic reactivity** (no manual render)  
✅ **Declarative** (describe UI, not steps)  
❌ **Requires build step** (not pure HTML/JS)  
❌ **Learning curve** (new syntax)

---

---

## 7. Svelte 5 Runes Explained

### The Four Main Runes

```typescript
// 1. $state - Reactive state
let count = $state(0);
let items = $state<Item[]>([]);

// 2. $derived - Computed values (like getters)
let doubled = $derived(count * 2);
let isEmpty = $derived(items.length === 0);

// 3. $effect - Side effects (DOM, logging, etc.)
$effect(() => {
    console.log('Count changed:', count);  // Runs when count changes
    document.title = `Count: ${count}`;    // Side effect!
});

// 4. $props - Component props (in .svelte files)
let { name, age = 18 } = $props();  // With default
```

### When to Use Each

**$state** - Any data that changes:
```typescript
let cards = $state<Card[]>([]);  // ✅ Changes over time
let score = $state(0);           // ✅ Changes over time
```

**$derived** - Computed from other state:
```typescript
// ✅ Automatically recomputes when dependencies change
let total = $derived(items.reduce((sum, item) => sum + item.price, 0));
let isWon = $derived(foundations.every(f => f.length === 13));
```

**$effect** - Side effects only:
```typescript
// ✅ Logging
$effect(() => console.log('Score:', score));

// ✅ DOM manipulation
$effect(() => {
    document.title = `Score: ${score}`;
});

// ✅ localStorage sync
$effect(() => {
    localStorage.setItem('game', JSON.stringify(gameState));
});

// ❌ Don't use for computed values - use $derived instead!
```

**$props** - Component inputs:
```svelte
<!-- Card.svelte -->
<script lang="ts">
let { card, faceUp = false } = $props();
</script>
```

---

## 8. Using Runes in Classes (.svelte.ts)

### Vanilla JS Classes

```javascript
// src/state/GameState.js
export class GameState {
    constructor() {
        this.stock = [];
        this.waste = [];
        this.moves = 0;
    }
    
    drawCard() {
        this.moves++;
        this.render();  // Manual!
    }
}
```

### Svelte 5 with Runes in Classes

```typescript
// GameState.svelte.ts
import type { Card } from './types';

export class GameState {
    stock = $state<Card[]>([]);
    waste = $state<Card[]>([]);
    moves = $state(0);
    
    // Computed value
    get canDraw() {
        return this.stock.length > 0;
    }
    
    drawCard() {
        if (!this.canDraw) return;
        
        const card = this.stock.pop()!;
        this.waste.push(card);
        this.moves++;
        // UI updates automatically!
    }
}
```

**Usage in Component:**

```svelte
<!-- Game.svelte -->
<script lang="ts">
import { GameState } from './GameState.svelte.ts';

const game = new GameState();
</script>

<button onclick={() => game.drawCard()} disabled={!game.canDraw}>
    Draw Card
</button>

<p>Moves: {game.moves}</p>
```

**Benefits:**
- ✅ Encapsulation (class methods)
- ✅ Automatic reactivity (runes)
- ✅ Type safety (TypeScript)
- ✅ Computed properties (getters)
- ✅ Reusable across components

---

## 9. Complete Svelte 5 Version

### Merging State + Logic

```typescript
// GameState.svelte.ts - Everything in one class!
import { Deck } from './Deck';
import { GameLogic } from './GameLogic';
import type { Card } from './types';

export class GameState {
    // State (reactive)
    stock = $state<Card[]>([]);
    waste = $state<Card[]>([]);
    foundations = $state<Card[][]>([[], [], [], []]);
    tableau = $state<Card[][]>(Array(7).fill([]));
    moves = $state(0);
    draggedCard = $state<Card | null>(null);
    
    // Derived values (computed automatically)
    isWon = $derived(
        this.foundations.every(f => f.length === 13)
    );
    
    canDraw = $derived(this.stock.length > 0);
    
    constructor() {
        this.init();
    }
    
    // Actions
    init() {
        const deck = new Deck().create().shuffle();
        // Deal cards...
    }
    
    drawCard() {
        if (!this.canDraw) return;
        const card = this.stock.pop()!;
        card.faceUp = true;
        this.waste.push(card);
        this.moves++;
    }
    
    moveToFoundation(index: number) {
        if (!this.draggedCard) return;
        
        if (!GameLogic.isValidFoundationMove(
            this.foundations[index],
            this.draggedCard
        )) return;
        
        this.foundations[index].push(this.draggedCard);
        this.draggedCard = null;
        this.moves++;
        
        // Check win after move
        if (this.isWon) {
            this.handleWin();
        }
    }
    
    handleWin() {
        alert(`You won in ${this.moves} moves!`);
    }
}
```

### Component Usage

```svelte
<!-- Game.svelte -->
<script lang="ts">
import { GameState } from './GameState.svelte.ts';
import Card from './Card.svelte';
import Pile from './Pile.svelte';

const game = new GameState();
</script>

<div class="game">
    <header>
        <button onclick={() => game.init()}>New Game</button>
        <p>Moves: {game.moves}</p>
    </header>
    
    <!-- Stock pile -->
    <div class="stock" onclick={() => game.drawCard()}>
        {#if game.canDraw}
            <Card card={game.stock.at(-1)} faceUp={false} />
        {/if}
    </div>
    
    <!-- Waste pile -->
    <div class="waste">
        {#if game.waste.length > 0}
            <Card 
                card={game.waste.at(-1)} 
                faceUp={true}
                ondblclick={() => game.autoMove()}
            />
        {/if}
    </div>
    
    <!-- Foundations -->
    {#each game.foundations as foundation, i}
        <Pile 
            cards={foundation}
            ondrop={() => game.moveToFoundation(i)}
        />
    {/each}
    
    <!-- Tableau -->
    {#each game.tableau as pile, i}
        <Pile 
            cards={pile} 
            ondrop={() => game.moveToTableau(i)}
        />
    {/each}
</div>

<style>
    .game {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
</style>
```

**Total:** ~150 lines vs 500 in vanilla!

---

## Code Comparison Summary

### Vanilla JS (Our Implementation)
```
├── src/core/          ← Separate files
├── src/state/         ← Separate files
├── src/ui/            ← Separate files
└── Manual rendering

Total: ~500 lines
```

### Svelte 5 with Runes
```
├── GameState.svelte.ts  ← All logic in one class!
├── Game.svelte          ← Just UI template
└── Auto rendering

Total: ~150 lines (70% less!)
```

---

## When to Use Which?

### Use Vanilla JS When:
- ✅ Learning fundamentals
- ✅ No build step wanted
- ✅ Simple projects
- ✅ Maximum control needed

### Use Svelte 5 When:
- ✅ Building real apps
- ✅ Complex state management
- ✅ Need automatic reactivity
- ✅ Want less boilerplate

---

## Resources

- [Svelte 5 Docs](https://svelte.dev/docs/svelte/overview)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [SvelteKit](https://kit.svelte.dev) - Full-stack framework
- [Svelte Tutorial](https://learn.svelte.dev)

**Both approaches work!** Choose based on your needs. 🚀
