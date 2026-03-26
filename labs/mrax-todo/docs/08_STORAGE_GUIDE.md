# localStorage Guide for Todo App

Learn how to persist data in the browser using localStorage.

## What is localStorage?

localStorage is a browser API that stores key-value pairs permanently (until manually cleared).

```javascript
// Store
localStorage.setItem('key', 'value');

// Retrieve
const value = localStorage.getItem('key');

// Remove
localStorage.removeItem('key');

// Clear all
localStorage.clear();
```

## Storing Objects

localStorage only stores strings, so we use JSON:

```javascript
// Save object
const todos = [{ id: 1, text: 'Learn JS' }];
localStorage.setItem('todos', JSON.stringify(todos));

// Load object
const stored = localStorage.getItem('todos');
const todos = stored ? JSON.parse(stored) : [];
```

## Our Storage Service

```javascript
export class StorageService {
    static STORAGE_KEY = 'todos';
    
    static saveTodos(todos) {
        try {
            const json = JSON.stringify(todos);
            localStorage.setItem(this.STORAGE_KEY, json);
            return true;
        } catch (error) {
            console.error('Failed to save:', error);
            return false;
        }
    }
    
    static loadTodos() {
        try {
            const json = localStorage.getItem(this.STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch (error) {
            console.error('Failed to load:', error);
            return [];
        }
    }
    
    static clearTodos() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
```

## Usage in AppState

```javascript
class AppState {
    async init() {
        // Load on startup
        this.todos = StorageService.loadTodos();
        this.render();
    }
    
    addTodo(text) {
        const todo = { id: Date.now(), text, completed: false };
        this.todos = [...this.todos, todo];
        StorageService.saveTodos(this.todos);  // Save after change
        this.render();
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        StorageService.saveTodos(this.todos);  // Save after change
        this.render();
    }
}
```

## Best Practices

### 1. Error Handling
```javascript
try {
    localStorage.setItem('key', value);
} catch (error) {
    // Handle QuotaExceededError
    console.error('Storage full!', error);
}
```

### 2. Validation
```javascript
static loadTodos() {
    const data = localStorage.getItem('todos');
    if (!data) return [];
    
    try {
        const todos = JSON.parse(data);
        // Validate structure
        return Array.isArray(todos) ? todos : [];
    } catch {
        return [];
    }
}
```

### 3. Constants
```javascript
// ✅ GOOD - Single source of truth
static STORAGE_KEY = 'my-app-todos';

// ❌ BAD - Magic strings everywhere
localStorage.setItem('todos', ...);
localStorage.getItem('todos');
```

## localStorage vs sessionStorage

### localStorage
- Persists forever (until cleared)
- Shared across all tabs
- Use for: user preferences, app data

### sessionStorage  
- Clears when tab closes
- Separate per tab
- Use for: temporary data, session state

```javascript
// Same API
sessionStorage.setItem('temp', 'value');
const temp = sessionStorage.getItem('temp');
```

## Debugging localStorage

### Chrome DevTools
```
F12 → Application → Storage → Local Storage → file://
```

You can:
- View all keys/values
- Edit values manually
- Delete individual items
- Clear all storage

### Console
```javascript
// View all
console.table(localStorage);

// View specific key
console.log(localStorage.getItem('todos'));

// Clear all
localStorage.clear();
```

## Common Gotchas

### 1. Forgetting to JSON.stringify
```javascript
// ❌ BAD - Stores "[object Object]"
localStorage.setItem('todos', todos);

// ✅ GOOD
localStorage.setItem('todos', JSON.stringify(todos));
```

### 2. Not Handling null
```javascript
// ❌ BAD - Crashes if key doesn't exist
const todos = JSON.parse(localStorage.getItem('todos'));

// ✅ GOOD - Provides default
const json = localStorage.getItem('todos');
const todos = json ? JSON.parse(json) : [];
```

### 3. Storage Limits
```javascript
// localStorage has ~5-10MB limit
// For large data, use IndexedDB instead
// See Kanban app for IndexedDB example
```

## Next Steps

- See [Kanban](../../04_kanban-board/docs/08_STORAGE_GUIDE.md) for IndexedDB
- See [CRUD Guide](09_CRUD_GUIDE.md) for full CRUD patterns

---

**localStorage makes your app remember!** 💾