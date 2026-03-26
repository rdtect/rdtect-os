# Kanban Board Architecture

## Design Overview

Advanced CRUD app with drag & drop, combining patterns from Solitaire (drag) and Todo (CRUD).

## Core Pattern

```
State (BoardState)
  ↓
Rules (TaskLogic + ColumnLogic)
  ↓
Actions (add, move, delete)
  ↓
UI (Renderer + DragDropHandler)
  ↓
Storage (IndexedDBService)
```

## Module Organization

### `core/` - Business Logic

**TaskLogic.js**
- Validation rules for tasks
- Task creation with defaults
- Task movement logic
- Overdue detection

**ColumnLogic.js**  
- Column validation
- Column sorting
- Column creation

**Why separate?** Tasks and columns have different rules.

### `services/` - External Integration

**IndexedDBService.js**
- Database initialization
- CRUD operations for tasks
- CRUD operations for columns
- Async/await interface

**Why IndexedDB?** 
- Handles complex data
- Queryable indexes
- Better than localStorage for scale

### `state/` - Orchestration

**BoardState.js**
- Main controller
- Coordinates all modules
- Manages tasks and columns arrays
- Handles drag state

### `ui/` - User Interface

**Renderer.js**
- DOM manipulation
- Animations
- Error toasts

**EventHandler.js**
- Modal management
- Form handling
- Button clicks

**DragDropHandler.js**
- Drag start/end
- Drag over states
- Drop handling
- Similar to Solitaire's drag system

## Data Models

### Task Model
```javascript
{
    id: 1234567890.123,           // Unique
    title: "Implement feature",   // Required
    description: "Details...",    // Optional
    assignee: "John Doe",         // Optional
    priority: "high",             // low, medium, high
    columnId: "in-progress",      // Which column
    startDate: "2024-01-01",      // Optional
    dueDate: "2024-01-15",        // Optional
    createdAt: 1234567890000,     // Timestamp
    updatedAt: 1234567890000,     // Timestamp
    order: 0                       // Position in column
}
```

### Column Model
```javascript
{
    id: "todo",           // Unique
    name: "To Do",        // Display name
    color: "#6366f1",     // Header color
    order: 0              // Position
}
```

## Data Flow Examples

### Adding a Task
```
1. User clicks "+ Add Task" in column
2. EventHandler.openTaskModal(null, columnId)
3. User fills form, clicks Save
4. EventHandler.saveTask()
5. BoardState.addTask(data)
6. TaskLogic.validateTask(data)  // Check rules
7. TaskLogic.createTask(data)    // Add defaults
8. IndexedDBService.addTask(task)
9. Update state.tasks array
10. Renderer.animateAddTask(task)
11. Renderer.renderBoard()
```

### Dragging a Task
```
1. User starts dragging task
2. DragDropHandler.onDragStart(e, task)
3. Store draggedTask in state
4. Add .dragging class

5. User drags over column
6. DragDropHandler.onDragOver(e, columnId)
7. Add .drag-over class (visual feedback)

8. User drops in new column
9. DragDropHandler.onDrop(e, columnId)
10. BoardState.moveTask(taskId, newColumnId)
11. TaskLogic.moveTask(task, newColumnId)
12. IndexedDBService.updateTask(movedTask)
13. Reorder other tasks in column
14. Renderer.renderBoard()
```

## Key Patterns

### 1. Separation by Concern
```javascript
// ✅ Each module has ONE job
TaskLogic    - Task business rules
ColumnLogic  - Column business rules
IndexedDB    - Data persistence
BoardState   - Orchestration
Renderer     - DOM updates
EventHandler - User input
DragDrop     - Drag interactions
```

### 2. Async/Await Throughout
```javascript
async addTask(data) {
    const task = TaskLogic.createTask(data);
    await this.storage.addTask(task);      // Wait for DB
    this.tasks = [...this.tasks, task];
    await this.renderer.animateAddTask(task); // Wait for animation
    this.render();
}
```

### 3. Event Delegation
```javascript
// ❌ BAD - Add listener to each card
document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', handler);
});

// ✅ GOOD - One listener on container
this.boardContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if (card) handleTaskClick(card);
});
```

## IndexedDB Structure

### Database: kanban-db

**Object Store: tasks**
- Primary key: `id`
- Indexes: `columnId`, `priority`

**Object Store: columns**
- Primary key: `id`
- Indexes: `order`

## ES6+ Features

- **Async/await** - All database operations
- **Promises** - Parallel operations with Promise.all
- **Spread operator** - Immutable updates
- **Optional chaining** - Safe property access
- **Array methods** - map, filter, find, every
- **Destructuring** - Clean variable extraction
- **Template literals** - Dynamic HTML

## CSS Architecture

- **CSS Variables** - Theming with --column-color
- **Flexbox** - Horizontal column layout
- **Grid** - Within columns
- **Animations** - Smooth transitions
- **Responsive** - Mobile-friendly

---

## Scaling Considerations

### This Architecture Supports:
- ✅ Hundreds of tasks
- ✅ Dozens of columns
- ✅ Complex queries (via IndexedDB indexes)
- ✅ Offline-first (all data local)

### To Scale Further:
- Add backend sync (REST API)
- Add real-time updates (WebSockets)
- Add user authentication
- Add team collaboration

---

**Production-ready architecture!** 🏗️