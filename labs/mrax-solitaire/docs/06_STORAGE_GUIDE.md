# Browser Storage Guide - CRUD Operations

Learn Create, Read, Update, Delete operations with localStorage.

## What is localStorage?

**localStorage** is a browser API that stores key-value pairs:
- Data persists even after closing the browser
- ~5-10MB storage limit per domain
- Synchronous API (blocking)
- Only stores strings (must serialize objects)

---

## CRUD Operations

### CREATE - Save Data

```javascript
// Save a string
localStorage.setItem('username', 'Alice');

// Save an object (must stringify)
const game = { moves: 10, time: 120 };
localStorage.setItem('game', JSON.stringify(game));
```

### READ - Load Data

```javascript
// Load a string
const username = localStorage.getItem('username');  // 'Alice'

// Load an object (must parse)
const gameStr = localStorage.getItem('game');
const game = gameStr ? JSON.parse(gameStr) : null;
```

### UPDATE - Modify Data

```javascript
// Load, modify, save
const game = JSON.parse(localStorage.getItem('game'));
game.moves++;
localStorage.setItem('game', JSON.stringify(game));
```

### DELETE - Remove Data

```javascript
// Delete one item
localStorage.removeItem('game');

// Delete everything
localStorage.clear();
```

---

## Our Implementation

### StorageService Class

```javascript
// src/core/StorageService.js
export class StorageService {
    static KEYS = {
        CURRENT_GAME: 'solitaire_current_game',
        STATS: 'solitaire_stats'
    };
    
    // CREATE - Save game
    static saveGame(gameState) {
        try {
            const saveData = {
                ...gameState,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(
                this.KEYS.CURRENT_GAME,
                JSON.stringify(saveData)
            );
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }
    
    // READ - Load game
    static loadGame() {
        try {
            const data = localStorage.getItem(this.KEYS.CURRENT_GAME);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Load failed:', error);
            return null;
        }
    }
    
    // UPDATE - Update stats
    static updateStats(updates) {
        const stats = this.getStats();
        const newStats = { ...stats, ...updates };
        localStorage.setItem(
            this.KEYS.STATS,
            JSON.stringify(newStats)
        );
    }
    
    // DELETE - Remove save
    static deleteSave() {
        localStorage.removeItem(this.KEYS.CURRENT_GAME);
    }
}
```

### Integration with Game

```javascript
// In GameState class:

loadOrInit() {
    const savedGame = StorageService.loadGame();
    if (savedGame) {
        this.loadSavedGame(savedGame);  // Resume
    } else {
        this.initAsync();  // New game
    }
}

completeMove() {
    this.moves++;
    this.render();
    this.autoSave();  // Save after every move
}

autoSave() {
    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    StorageService.saveGame({
        stock: this.stock,
        waste: this.waste,
        foundations: this.foundations,
        tableau: this.tableau,
        moves: this.moves,
        elapsedSeconds
    });
}
```

---

## Error Handling

### Why Errors Happen

1. **Storage full** - 5-10MB limit exceeded
2. **Private browsing** - localStorage disabled
3. **Corrupted data** - Invalid JSON

### Handling Gracefully

```javascript
static saveGame(gameState) {
    try {
        localStorage.setItem(key, JSON.stringify(gameState));
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('Storage full!');
            // Maybe clear old data
        }
        return false;
    }
}
```

---

## Best Practices

### 1. Always Use try/catch

```javascript
// ❌ BAD - Can crash app
const data = JSON.parse(localStorage.getItem('game'));

// ✅ GOOD - Safe
try {
    const data = JSON.parse(localStorage.getItem('game'));
} catch (error) {
    console.error('Parse failed:', error);
    return null;
}
```

### 2. Provide Defaults

```javascript
// ✅ Always have fallback
const stats = loadStats() || {
    gamesPlayed: 0,
    gamesWon: 0
};
```

### 3. Version Your Data

```javascript
const saveData = {
    version: '1.0',  // Track schema version
    ...gameState
};

// When loading:
if (data.version !== '1.0') {
    return null;  // Incompatible version
}
```

### 4. Validate Loaded Data

```javascript
static loadGame() {
    const data = JSON.parse(localStorage.getItem('game'));
    
    // Validate structure
    if (!data.stock || !data.waste || !data.tableau) {
        return null;  // Invalid data
    }
    
    return data;
}
```

---

## Advanced: IndexedDB

For larger data or complex queries, use IndexedDB:

```javascript
// Not used in our game, but here's how:
const request = indexedDB.open('SolitaireDB', 1);

request.onsuccess = (event) => {
    const db = event.target.result;
    // Perform operations
};
```

**When to use:**
- localStorage: Simple key-value, small data (<5MB)
- IndexedDB: Complex data, queries, large storage

---

## Testing Storage

### DevTools

1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Local Storage"
4. See your data!

### Console Commands

```javascript
// Check what's saved
console.log(localStorage.getItem('solitaire_current_game'));

// Manually save
StorageService.saveGame({ moves: 5 });

// Clear everything
StorageService.clearAll();
```

---

## Common Patterns

### Pattern 1: Auto-save

```javascript
// Save after every action
completeMove() {
    this.updateState();
    this.autoSave();  // Persist immediately
}
```

### Pattern 2: Load on Start

```javascript
init() {
    const saved = StorageService.loadGame();
    if (saved) {
        this.restore(saved);
    } else {
        this.startNew();
    }
}
```

### Pattern 3: Statistics Tracking

```javascript
winGame() {
    const stats = StorageService.getStats();
    StorageService.updateStats({
        gamesWon: stats.gamesWon + 1,
        bestTime: Math.min(stats.bestTime, this.time)
    });
}
```

---

## Exercises

1. **Add save/load buttons** - Let user manually save
2. **Show statistics screen** - Display wins, best time
3. **Multiple save slots** - Save different games
4. **Export/import** - Download save file
5. **Cloud sync** - Use Firebase or similar

---

## Resources

- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

**Congratulations!** You now understand browser storage and CRUD operations! 💾
