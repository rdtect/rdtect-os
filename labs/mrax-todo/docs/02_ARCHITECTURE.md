# Todo App Architecture

## Overview

Simple CRUD app demonstrating state management and localStorage with clean separation of concerns.

## Design Pattern

```
State → Rules → Actions → UI
  ↓
localStorage (persistence)
```

## Folder Structure

```
03_todo-app/
├── src/
│   ├── core/              # Pure logic
│   │   ├── constants.js   # Magic numbers
│   │   ├── TodoLogic.js   # Validation rules
│   │   └── utils.js       # Helpers
│   ├── services/          # External integrations
│   │   └── StorageService.js  # localStorage wrapper
│   ├── state/             # Orchestration
│   │   └── AppState.js    # Main controller
│   ├── ui/                # DOM & Events
│   │   ├── Renderer.js    # DOM manipulation
│   │   └── EventHandler.js # Event listeners
│   └── main.js            # Entry point
└── styles/
    ├── main.css           # Variables & base
    ├── components.css     # UI components
    └── animations.css     # Keyframes
```

## Data Flow

```
1. User types todo → EventHandler
2. EventHandler → AppState.addTodo()
3. AppState → TodoLogic.validateTodo()
4. Valid? → Update state → StorageService.save()
5. AppState → Renderer.render()
6. User sees new todo
```

## Key Patterns

### 1. CRUD Pattern
```javascript
class AppState {
    // CREATE
    addTodo(text) {
        const todo = { id: Date.now(), text, completed: false };
        this.todos = [...this.todos, todo];
        this.save();
        this.render();
    }
    
    // READ (implicit in render)
    
    // UPDATE
    toggleTodo(id) {
        this.todos = this.todos.map(t => 
            t.id === id ? {...t, completed: !t.completed} : t
        );
        this.save();
        this.render();
    }
    
    // DELETE
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.save();
        this.render();
    }
}
```

### 2. Storage Service Pattern
```javascript
class StorageService {
    static KEY = 'todos';
    
    static save(todos) {
        localStorage.setItem(this.KEY, JSON.stringify(todos));
    }
    
    static load() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
    }
}
```

### 3. Immutable Updates
```javascript
// ❌ BAD - Mutates array
this.todos.push(newTodo);

// ✅ GOOD - Creates new array
this.todos = [...this.todos, newTodo];
```

## ES6+ Features

- **Classes** - AppState, Renderer, EventHandler
- **Arrow functions** - Event handlers, array methods
- **Spread operator** - Immutable updates
- **Array methods** - map, filter, find
- **Template literals** - Dynamic HTML
- **Destructuring** - Clean code

## CSS Architecture

- **CSS Variables** - Easy theming
- **Flexbox** - Layout
- **Animations** - Enter/exit effects
- **Transitions** - Smooth interactions

---

**Clean, scalable, and easy to understand!** 🚀