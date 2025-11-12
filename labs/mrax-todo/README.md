# Enhanced Todo App

A modern todo application built with vanilla JavaScript (ES6+) following clean architecture principles, featuring IndexedDB persistence and smooth animations.

## 🎮 Features

- **Clean Architecture** - State → Rules → Actions → UI pattern
- **IndexedDB Persistence** - Todos saved locally and persist across sessions
- **Smooth Animations** - Create/destroy animations for better UX
- **Modern ES6+** - Modules, classes, arrow functions, async/await
- **Filter System** - View all, active, or completed todos
- **Statistics** - Track total, active, and completed todos
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Dark Theme** - Beautiful dark UI with gradient accents

## 🚀 Quick Start

1. Open `index.html` in your browser
2. Start adding todos!
3. Your todos are automatically saved

## 📖 Learning Resources

This project demonstrates modern web development patterns:

- **[Getting Started](docs/01_GETTING_STARTED.md)** - Understand the structure
- **[Architecture](docs/02_ARCHITECTURE.md)** - Learn the design patterns
- **[Building Tutorial](docs/03_BUILDING.md)** - Build it step-by-step
- **[IndexedDB Guide](docs/04_INDEXEDDB_GUIDE.md)** - Learn browser storage
- **[Animations Guide](docs/05_ANIMATIONS_GUIDE.md)** - CSS & JS animations

## 🎯 Architecture

```
State (TodoState)
  ↓
Rules (TodoLogic) → Pure functions, no side effects
  ↓
Actions (add, toggle, delete)
  ↓
UI (Renderer + EventHandler) → DOM updates with animations
  ↓
Storage (IndexedDBService) → Persistent data
```

## 🛠 Project Structure

```
todo-app/
├── index.html
├── src/
│   ├── core/              # Pure logic
│   │   ├── constants.js
│   │   ├── TodoLogic.js
│   │   └── utils.js
│   ├── services/          # External integrations
│   │   └── IndexedDBService.js
│   ├── state/             # Orchestration
│   │   └── TodoState.js
│   ├── ui/                # Rendering & events
│   │   ├── Renderer.js
│   │   └── EventHandler.js
│   └── main.js            # Entry point
├── styles/
│   ├── main.css
│   ├── components.css
│   └── animations.css
└── docs/                  # Tutorials
```

## 🎓 What You'll Learn

### JavaScript (ES6+)
- ✅ Async/await & Promises
- ✅ IndexedDB API
- ✅ Modules (import/export)
- ✅ Classes & static methods
- ✅ Array methods (map, filter, sort)
- ✅ Spread operator
- ✅ Template literals
- ✅ Optional chaining

### CSS
- ✅ CSS Variables
- ✅ Flexbox layout
- ✅ Keyframe animations
- ✅ Transitions
- ✅ Responsive design
- ✅ Custom scrollbars

### Architecture
- ✅ Separation of concerns
- ✅ Pure functions
- ✅ State management
- ✅ Event handling
- ✅ CRUD operations
- ✅ Persistent storage

## 🎮 Features

### Add Todos
- Type in the input field
- Press Enter or click "Add"
- Todo appears with animation

### Manage Todos
- **Check/Uncheck** - Toggle completion status
- **Delete** - Click X button (appears on hover)
- **Filter** - View all, active, or completed
- **Clear Completed** - Remove all completed todos

### Keyboard Shortcuts
- `Enter` - Add new todo
- `Escape` - Clear input (when focused)

## 💡 Key Concepts

### 1. IndexedDB for Persistence
```javascript
// Todos automatically saved to browser database
await storage.addTodo(newTodo);
```

### 2. Smooth Animations
```javascript
// CSS animations triggered by JavaScript
element.classList.add('todo-entering');
```

### 3. Pure Functions
```javascript
static createTodo(text) {
    return { id, text, status, createdAt };
}
```

### 4. Async/Await Pattern
```javascript
async addTodo(text) {
    await this.storage.addTodo(newTodo);
    await this.renderer.animateAddTodo(newTodo);
}
```

## 🚀 Next Steps

### Beginner
1. Add todo categories/tags
2. Add due dates
3. Change color scheme

### Intermediate
1. Add drag-and-drop reordering
2. Add todo editing
3. Add priority levels
4. Export/import todos

### Advanced
1. Add cloud sync (Firebase)
2. Add collaborative features
3. Add recurring todos
4. Rebuild in React/Vue/Svelte

## 📚 Resources

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [JavaScript.info](https://javascript.info)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

---

**Built with ❤️ using vanilla JavaScript and IndexedDB**