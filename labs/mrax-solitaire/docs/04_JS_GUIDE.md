# Modern JavaScript Guide (ES6+)

Learn modern JavaScript through building Solitaire.

## Quick Reference

### ES6 Features We Use
- ✅ Modules (import/export)
- ✅ Classes
- ✅ Arrow functions
- ✅ Destructuring
- ✅ Spread operator
- ✅ Template literals
- ✅ Array methods (map, filter, forEach, flatMap, every)
- ✅ Async/await
- ✅ Optional chaining (?.)

---

## 1. Modules

### Before ES6
```javascript
// ❌ Everything in global scope
// script1.js
var game = {};

// script2.js
var game = {};  // Overwrites!
```

### Modern Way
```javascript
// ✅ Explicit dependencies
// Deck.js
export class Deck { }

// main.js
import { Deck } from './Deck.js';
```

**Benefits:** No conflicts, clear dependencies, tree-shaking.

---

## 2. Arrow Functions

### Syntax
```javascript
// Traditional
function double(x) {
    return x * 2;
}

// Arrow (implicit return)
const double = x => x * 2;

// Arrow (explicit return)
const double = x => {
    return x * 2;
};

// Multiple params
const add = (a, b) => a + b;

// No params
const greet = () => 'Hello';
```

### When to Use

```javascript
// ✅ Great for callbacks
array.map(x => x * 2);
array.filter(x => x > 5);

// ✅ Great for short functions
const isRed = suit => ['hearts', 'diamonds'].includes(suit);

// ❌ Avoid for methods needing 'this'
class Game {
    // Don't use arrow here
    start = () => {  // 'this' will be wrong
        this.render();
    }
}
```

---

## 3. Destructuring

### Object Destructuring
```javascript
// ❌ Old way
const from = this.draggedFrom.from;
const pileIndex = this.draggedFrom.pileIndex;

// ✅ Modern
const { from, pileIndex } = this.draggedFrom;

// With renaming
const { from: source, pileIndex: index } = this.draggedFrom;

// With defaults
const { from, pileIndex = 0 } = this.draggedFrom;
```

### Array Destructuring
```javascript
const [first, second] = array;
const [first, ...rest] = array;  // Rest operator

// Swapping values
[a, b] = [b, a];
```

---

## 4. Spread Operator

### Array Spread
```javascript
// Copy array
const copy = [...original];

// Concat arrays
const merged = [...arr1, ...arr2];

// Add to array
const withNew = [...existing, newItem];
```

### Object Spread
```javascript
// Copy object
const copy = {...original};

// Merge objects
const merged = {...obj1, ...obj2};

// Update property
const updated = {...card, faceUp: true};
```

**Critical for Undo System:**
```javascript
// ❌ BAD - Shares reference
this.history.push(this.cards);
this.cards.pop();  // Modifies history too!

// ✅ GOOD - Creates copy
this.history.push([...this.cards]);
this.cards.pop();  // History unchanged
```

---

## 5. Array Methods

### map() - Transform
```javascript
// Transform each element
const doubled = [1, 2, 3].map(x => x * 2);  // [2, 4, 6]

const cards = SUITS.map(suit => ({
    suit,
    color: isRed(suit) ? 'red' : 'black'
}));
```

### filter() - Select
```javascript
// Keep elements that pass test
const evens = [1, 2, 3, 4].filter(x => x % 2 === 0);  // [2, 4]

const redCards = cards.filter(c => c.color === 'red');
```

### forEach() - Side Effects
```javascript
// Do something for each (no return value)
[1, 2, 3].forEach(x => console.log(x));

foundations.forEach((pile, i) => {
    const el = document.getElementById(`foundation-${i}`);
    renderPile(el, pile);
});
```

### flatMap() - Map + Flatten
```javascript
// ❌ Without flatMap
const nested = SUITS.map(suit => 
    VALUES.map(value => ({ suit, value }))
);  // [[{}, {}], [{}, {}]]  // 2D array!

const flat = nested.flat();  // Need extra step

// ✅ With flatMap
const cards = SUITS.flatMap(suit => 
    VALUES.map(value => ({ suit, value }))
);  // [{}, {}, {}]  // Already flat!
```

### every() / some()
```javascript
// All elements pass?
const allPositive = [1, 2, 3].every(x => x > 0);  // true

// At least one passes?
const hasEven = [1, 2, 3].some(x => x % 2 === 0);  // true

// Check win condition
const won = foundations.every(f => f.length === 13);
```

### find() / findIndex()
```javascript
// First element that passes
const firstEven = [1, 2, 3, 4].find(x => x % 2 === 0);  // 2

// Index of first match
const index = array.findIndex(x => x.value === 'A');  // 0
```

### at() - Modern Access
```javascript
// ❌ Old way
const last = array[array.length - 1];
const secondLast = array[array.length - 2];

// ✅ Modern (ES2022)
const last = array.at(-1);
const secondLast = array.at(-2);
```

---

## 6. Async/Await

### The Problem
```javascript
// ❌ Callback hell
fetchData(url, function(data) {
    processData(data, function(result) {
        saveResult(result, function() {
            console.log('Done');
        });
    });
});
```

### The Solution
```javascript
// ✅ Clean async/await
async function doWork() {
    const data = await fetchData(url);
    const result = await processData(data);
    await saveResult(result);
    console.log('Done');
}
```

### Our Usage
```javascript
async dealWithAnimation() {
    for (let i = 0; i < cards.length; i++) {
        renderCard(cards[i]);
        await sleep(30);  // Wait 30ms between cards
    }
}

// sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

**Key:** `await` pauses until Promise resolves.

---

## 7. Template Literals

### String Interpolation
```javascript
// ❌ Old
const msg = 'Hello, ' + name + '!';
const id = 'tableau-' + index;

// ✅ Modern
const msg = `Hello, ${name}!`;
const id = `tableau-${index}`;
```

### Multi-line Strings
```javascript
// ❌ Old
const html = '<div>' +
    '<p>Content</p>' +
    '</div>';

// ✅ Modern
const html = `
    <div>
        <p>Content</p>
    </div>
`;
```

### Expression Evaluation
```javascript
const math = `2 + 2 = ${2 + 2}`;  // "2 + 2 = 4"
const className = `card ${isRed(suit) ? 'red' : 'black'}`;
```

---

## 8. Optional Chaining

```javascript
// ❌ Old - Verbose null checks
const value = obj && obj.prop && obj.prop.nested && obj.prop.nested.value;

// ✅ Modern
const value = obj?.prop?.nested?.value;

// With nullish coalescing (??)
const port = config?.server?.port ?? 3000;
```

---

## Common Patterns

### Pattern 1: Immutable Updates
```javascript
// ❌ Mutation
array.push(item);

// ✅ Immutable
const newArray = [...array, item];
```

### Pattern 2: Pure Functions
```javascript
// ✅ Pure - same input = same output, no side effects
const add = (a, b) => a + b;

// ❌ Impure - modifies external state
let total = 0;
const addToTotal = (x) => {
    total += x;  // Side effect!
};
```

### Pattern 3: Functional Composition
```javascript
const double = x => x * 2;
const addOne = x => x + 1;

// Compose functions
const doubleThenAddOne = x => addOne(double(x));

// Or use array methods
[1, 2, 3]
    .map(double)
    .map(addOne);  // [3, 5, 7]
```

---

## Gotchas & Solutions

### 1. Reference vs Copy
```javascript
// ❌ WRONG
const a = [1, 2];
const b = a;
b.push(3);
console.log(a);  // [1, 2, 3] - Modified!

// ✅ RIGHT
const a = [1, 2];
const b = [...a];
b.push(3);
console.log(a);  // [1, 2] - Unchanged
```

### 2. Shallow vs Deep Copy
```javascript
// ❌ Shallow - nested objects still shared
const cards = [{value: 'A'}];
const copy = [...cards];
copy[0].value = 'K';
console.log(cards[0].value);  // 'K' - Modified!

// ✅ Deep
const copy = cards.map(c => ({...c}));
copy[0].value = 'K';
console.log(cards[0].value);  // 'A' - Unchanged
```

### 3. Async Timing
```javascript
// ❌ WRONG
async init() {
    this.deal();        // Returns Promise, not awaited!
    this.startTimer();  // Starts too early
}

// ✅ RIGHT
async init() {
    await this.deal();
    this.startTimer();
}
```

---

## Exercises

### Beginner
1. Convert `for` loops to `forEach`
2. Replace `function` with arrow functions
3. Use template literals for strings

### Intermediate
1. Refactor to use `map` instead of `forEach` + `push`
2. Add error handling to async functions
3. Extract repeated code into utility functions

### Advanced
1. Implement undo/redo with immutable state
2. Add debouncing to event handlers
3. Use generators for card dealing

---

## Resources

- [JavaScript.info](https://javascript.info) - Comprehensive guide
- [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Eloquent JavaScript](https://eloquentjavascript.net) - Free book
- [ES6 Features](https://github.com/lukehoban/es6features)

**Congratulations!** You now understand modern JavaScript! 🚀
