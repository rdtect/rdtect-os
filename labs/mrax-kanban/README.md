# Kanban Board

A fully-featured Kanban board with drag-and-drop, IndexedDB persistence, and rich task management built with vanilla JavaScript (ES6+).

## 🎯 Features

### Core Functionality
- **Drag & Drop** - Drag tasks between columns (inspired by Solitaire implementation)
- **Custom Columns** - Create, customize colors, and manage columns
- **Rich Tasks** - Title, description, assignee, start/due dates, priority levels
- **IndexedDB Persistence** - All data saved locally and persists across sessions
- **Responsive Design** - Works on desktop, tablet, and mobile

### Task Management
- ✅ Priority levels (Low, Medium, High) with color coding
- ✅ Due dates with overdue detection
- ✅ Task assignees
- ✅ Detailed descriptions
- ✅ Visual priority indicators
- ✅ Days remaining badges

### Architecture
- **Clean separation**: Core → Services → State → UI
- **ES6+ throughout**: Classes, async/await, modules, arrow functions
- **Smooth animations**: Fade in/out, drag states, stagger effects

## 🚀 Quick Start

1. Open `index.html` in your browser
2. Click "+ Task" to add a task
3. Drag tasks between columns
4. Click "+ Column" to customize your workflow

## 📁 Project Structure

```
kanban-board/
├── index.html
├── src/
│   ├── core/              # Pure logic
│   │   ├── constants.js
│   │   ├── TaskLogic.js      # Task operations
│   │   ├── ColumnLogic.js    # Column operations
│   │   └── utils.js
│   ├── services/          # External integrations
│   │   └── IndexedDBService.js
│   ├── state/             # Orchestration
│   │   └── BoardState.js
│   ├── ui/                # DOM & Events
│   │   ├── Renderer.js
│   │   ├── EventHandler.js
│   │   └── DragDropHandler.js
│   └── main.js
└── styles/
    ├── main.css
    ├── components.css
    └── animations.css
```

## 🎓 Architecture Pattern

```
State (BoardState)
  ↓
Rules (TaskLogic + ColumnLogic) → Pure functions
  ↓
Actions (add, move, delete)
  ↓
UI (Renderer + DragDropHandler + EventHandler)
  ↓
Storage (IndexedDBService)
```

## 💡 Key Concepts

### 1. Enhanced Task Model
```javascript
{
  id: 1234567890.123,
  title: "Implement feature",
  description: "Add drag and drop",
  assignee: "John Doe",
  priority: "high",        // low, medium, high
  columnId: "in-progress",
  startDate: "2024-01-01",
  dueDate: "2024-01-15",
  createdAt: 1234567890000,
  updatedAt: 1234567890000,
  order: 0
}
```

### 2. Drag & Drop Flow
```javascript
// Similar to Solitaire drag system
dragStart → store task & column
  ↓
dragOver → visual feedback
  ↓
drop → move task to new column
  ↓
save to IndexedDB → render
```

### 3. Custom Columns
```javascript
{
  id: "custom-123",
  name: "Review",
  color: "#8b5cf6",
  order: 2
}
```

## 🎨 ES6+ Features Used

### Async/Await
```javascript
async addTask(data) {
    await this.storage.addTask(newTask);
    await this.renderer.animateAddTask(newTask);
}
```

### Destructuring
```javascript
const { valid, error } = TaskLogic.validateTask(data);
const [columns, tasks] = await Promise.all([...]);
```

### Spread Operator
```javascript
const movedTask = { ...task, columnId: newId };
this.tasks = [...this.tasks, newTask];
```

### Arrow Functions
```javascript
const columnTasks = tasks.filter(t => t.columnId === id);
columns.forEach(col => this.renderColumn(col));
```

### Optional Chaining
```javascript
const firstColumn = this.columns[0]?.id || 'backlog';
```

### Template Literals
```javascript
`<div class="task-card" data-id="${task.id}">`
```

### Modules
```javascript
import { TaskLogic } from '../core/TaskLogic.js';
export class BoardState { }
```

## 🎯 Drag & Drop Implementation

Based on Solitaire's drag system:

```javascript
// 1. Make cards draggable
<div class="task-card" draggable="true">

// 2. Track drag state
onDragStart(e, task) {
    this.draggedTask = task;
    e.target.classList.add('dragging');
}

// 3. Handle drop zones
onDragOver(e, columnId) {
    e.preventDefault();
    column.classList.add('drag-over');
}

// 4. Complete the move
async onDrop(e, columnId) {
    await this.board.moveTask(taskId, columnId);
}
```

## 🗄️ IndexedDB Structure

**Two Object Stores:**
1. **tasks** - All task data
2. **columns** - Column configurations

**Indexes:**
- Tasks: `columnId`, `priority`
- Columns: `order`

**Default Columns:**
- Backlog (gray)
- To Do (blue)
- In Progress (orange)
- Done (green)

## 🚀 Next Steps

### Beginner
- Add task labels/tags
- Add task search
- Export board to JSON

### Intermediate
- Add subtasks
- Add task comments
- Add file attachments
- Archive completed tasks

### Advanced
- Add team collaboration (Firebase)
- Add activity timeline
- Add analytics dashboard
- Rebuild in React/Vue/Svelte

## 📚 What You'll Learn

### JavaScript
- ✅ Drag & Drop API
- ✅ IndexedDB CRUD operations
- ✅ Async/await patterns
- ✅ ES6 modules
- ✅ Event delegation
- ✅ State management

### CSS
- ✅ CSS Grid
- ✅ Flexbox
- ✅ CSS Variables
- ✅ Animations
- ✅ Drag states

### Architecture
- ✅ Separation of concerns
- ✅ Pure functions
- ✅ Service layer pattern
- ✅ State orchestration

---

**Built with ❤️ using vanilla JavaScript, ES6+, and IndexedDB**