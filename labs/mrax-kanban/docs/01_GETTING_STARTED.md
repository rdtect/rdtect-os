# Getting Started with Kanban Board

## Quick Start

1. Open `index.html` in browser
2. Default columns will appear
3. Click "+ Add Task" in any column
4. Drag tasks between columns!

## Features

### Task Management
- **Add tasks** - Click + in column footer
- **Edit tasks** - Click on any task card
- **Delete tasks** - Click × button on card
- **Drag tasks** - Drag between columns

### Column Management
- **Add columns** - Click "+ Add Column" button
- **Delete columns** - Click × on column header
- **Custom colors** - Choose color when creating

### Task Properties
- Title & description
- Assignee
- Priority (Low, Medium, High)
- Start & due dates
- Overdue detection

## Project Structure

```
kanban-board/
├── index.html
├── src/
│   ├── core/                  # Business logic
│   │   ├── constants.js
│   │   ├── TaskLogic.js      # Task validation
│   │   ├── ColumnLogic.js    # Column operations
│   │   └── utils.js
│   ├── services/              # External systems
│   │   └── IndexedDBService.js # Database
│   ├── state/                 # State orchestration
│   │   └── BoardState.js
│   ├── ui/                    # User interface
│   │   ├── Renderer.js
│   │   ├── EventHandler.js
│   │   └── DragDropHandler.js # Drag & drop
│   └── main.js
└── styles/
    ├── main.css               # Variables
    ├── components.css         # Components
    └── animations.css         # Keyframes
```

## Key Concepts

### 1. State → Rules → Actions → UI
```
User drags task
  ↓
DragDropHandler
  ↓
BoardState.moveTask()
  ↓
TaskLogic.validateMove()
  ↓
Update state + IndexedDB
  ↓
Render new UI
```

### 2. IndexedDB Persistence
- All tasks and columns saved locally
- Survives browser restart
- Queryable and indexable

### 3. Drag & Drop
- Similar to Solitaire's system
- Visual feedback (drag-over states)
- Validates drop targets

## Debugging

### Chrome DevTools
```
F12 → Application → Storage → IndexedDB → kanban-db
```

View:
- tasks object store
- columns object store
- All indexes

### Console
```javascript
// Access board state (development mode)
window.kanban.tasks
window.kanban.columns
```

## Next Steps

- **[Architecture](02_ARCHITECTURE.md)** - Understand the design
- **[Building](03_BUILDING.md)** - Build it yourself
- **[Storage Guide](08_STORAGE_GUIDE.md)** - Learn IndexedDB

---

**Drag, drop, and organize!** 📋