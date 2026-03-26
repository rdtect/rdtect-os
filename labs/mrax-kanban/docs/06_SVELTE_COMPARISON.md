# Kanban Board: Vanilla JS vs Svelte 5

See how this complex app looks in Svelte 5.

## State Management

### Vanilla JS
```javascript
class BoardState {
    constructor() {
        this.tasks = [];
        this.columns = [];
        this.draggedTask = null;
    }
}
```

### Svelte 5 with Runes
```javascript
<script>
    // Deep reactive state - mutations at any level trigger updates
    let board = $state({
        tasks: [],
        columns: [],
        draggedTask: null
    });
    
    // Or use class with $state properties
    class BoardState {
        tasks = $state([]);
        columns = $state([]);
        draggedTask = $state(null);
    }
    
    let board = new BoardState();
</script>
```

**Key:** Svelte 5's `$state` creates deep proxies - nested property changes automatically trigger reactivity.

## Adding a Task

### Vanilla JS
```javascript
async addTask(data) {
    const validation = TaskLogic.validateTask(data);
    if (!validation.valid) {
        this.renderer.showError(validation.error);
        return;
    }
    
    const newTask = TaskLogic.createTask(data);
    await this.storage.addTask(newTask);
    this.tasks = [...this.tasks, newTask];
    await this.renderer.animateAddTask(newTask);
    this.render();
}
```

### Svelte 5
```javascript
async function addTask(data) {
    const validation = TaskLogic.validateTask(data);
    if (!validation.valid) {
        error = validation.error;
        return;
    }
    
    const newTask = TaskLogic.createTask(data);
    await storage.addTask(newTask);
    
    // Both work with $state deep reactivity:
    board.tasks.push(newTask);           // Mutable - triggers update
    // OR
    board.tasks = [...board.tasks, newTask]; // Immutable - also works
    
    // UI updates automatically, no render() needed!
}
```

**Note:** With `$state`, both mutable (`.push()`) and immutable updates work. Immutable is recommended for clarity.

## Rendering Columns

### Vanilla JS
```javascript
renderBoard(columns, tasks) {
    this.boardContainer.innerHTML = '';
    
    columns.forEach(column => {
        const columnEl = this.createColumnElement(column, tasks);
        this.boardContainer.appendChild(columnEl);
    });
}

createColumnElement(column, tasks) {
    const div = document.createElement('div');
    div.className = 'kanban-column';
    
    const columnTasks = TaskLogic.getTasksByColumn(tasks, column.id);
    
    div.innerHTML = `
        <div class="column-header">
            <h2>${column.name}</h2>
            <span>${columnTasks.length}</span>
        </div>
        <div class="column-body">
            ${columnTasks.map(task => this.createTaskCard(task)).join('')}
        </div>
    `;
    
    return div;
}
```

### Svelte 5
```svelte
<div class="board-container">
    {#each columns as column}
        <div class="kanban-column" style="--column-color: {column.color}">
            <div class="column-header">
                <h2>{column.name}</h2>
                <span>{getTasksByColumn(column.id).length}</span>
            </div>
            <div class="column-body">
                {#each getTasksByColumn(column.id) as task}
                    <TaskCard {task} />
                {/each}
            </div>
        </div>
    {/each}
</div>
```

## Drag & Drop

### Vanilla JS
```javascript
class DragDropHandler {
    onDragStart(e, task) {
        this.board.draggedTask = task;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
    
    onDragOver(e, columnId) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        column.classList.add('drag-over');
    }
    
    async onDrop(e, columnId) {
        e.preventDefault();
        await this.board.moveTask(taskId, columnId);
        this.board.draggedTask = null;
    }
}
```

### Svelte 5
```svelte
<script>
    let dragging = $state(null);
    
    function handleDragStart(task) {
        dragging = task;
    }
    
    async function handleDrop(columnId) {
        if (!dragging) return;
        await moveTask(dragging.id, columnId);
        dragging = null;
    }
</script>

<div 
    draggable="true"
    ondragstart={() => handleDragStart(task)}
    ondrop={() => handleDrop(column.id)}
>
```

## Complete Svelte 5 Example

```svelte
<script>
    import { onMount } from 'svelte';
    import { IndexedDBService } from './services/IndexedDBService.js';
    import { TaskLogic } from './core/TaskLogic.js';
    
    let tasks = $state([]);
    let columns = $state([]);
    let dragging = $state(null);
    let showModal = $state(false);
    
    const storage = new IndexedDBService();
    
    onMount(async () => {
        [columns, tasks] = await Promise.all([
            storage.getAllColumns(),
            storage.getAllTasks()
        ]);
    });
    
    async function addTask(data) {
        const newTask = TaskLogic.createTask(data);
        await storage.addTask(newTask);
        tasks = [...tasks, newTask];
    }
    
    async function moveTask(taskId, columnId) {
        const task = tasks.find(t => t.id === taskId);
        const moved = TaskLogic.moveTask(task, columnId);
        await storage.updateTask(moved);
        tasks = tasks.map(t => t.id === taskId ? moved : t);
    }
    
    function getTasksByColumn(columnId) {
        return tasks.filter(t => t.columnId === columnId);
    }
</script>

<div class="board-container">
    {#each columns as column}
        <div 
            class="kanban-column"
            style="--column-color: {column.color}"
            ondragover={(e) => e.preventDefault()}
            ondrop={() => moveTask(dragging.id, column.id)}
        >
            <div class="column-header">
                <h2>{column.name}</h2>
                <span>{getTasksByColumn(column.id).length}</span>
            </div>
            
            <div class="column-body">
                {#each getTasksByColumn(column.id) as task}
                    <div 
                        class="task-card"
                        draggable="true"
                        ondragstart={() => dragging = task}
                        ondragend={() => dragging = null}
                    >
                        <h3>{task.title}</h3>
                        {#if task.description}
                            <p>{task.description}</p>
                        {/if}
                        <div class="task-meta">
                            {#if task.assignee}
                                <span>👤 {task.assignee}</span>
                            {/if}
                            {#if task.dueDate}
                                <span>📅 {task.dueDate}</span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</div>
```

## Key Differences

### Vanilla JS
- ✅ No build step
- ✅ Full control
- ❌ Manual DOM manipulation
- ❌ Manual reactivity
- ❌ More boilerplate

### Svelte 5
- ✅ Automatic reactivity
- ✅ Declarative templates
- ✅ Much less code
- ✅ Better DX
- ❌ Build step required
- ❌ Framework lock-in

## Code Comparison

**Lines of Code:**
- Vanilla JS: ~2000 lines
- Svelte 5: ~800 lines

**Same functionality, less code!**

But vanilla JS teaches you how it actually works. 🧠

---

## Advanced: Deep Reactivity in Svelte 5

### Nested State Mutations

```javascript
// All these trigger re-renders with $state:
board.tasks[0].title = 'Updated';              // Deep property
board.tasks[0].metadata.priority = 'high';     // Very deep
board.columns.find(c => c.id === 'todo').color = 'blue';  // Nested find

// $state creates deep proxies for automatic tracking!
```

### Classes with $state

```javascript
class Task {
    id = $state(Date.now());
    title = $state('');
    metadata = $state({ priority: 'medium' });
}

let task = new Task();
task.title = 'New title';              // Reactive!
task.metadata.priority = 'high';       // Deep reactive!
```

### Using $derived with Nested State

```javascript
let board = $state({ tasks: [...], columns: [...] });

// Computed from nested state
let tasksByColumn = $derived((columnId) =>
    board.tasks.filter(t => t.columnId === columnId)
);

// Memoized - only recalculates when board.tasks changes
```

### Using $effect for Deep Changes

```javascript
// React to any nested change
$effect(() => {
    console.log('Tasks changed:', board.tasks.length);
    localStorage.setItem('tasks', JSON.stringify(board.tasks));
});

// Scoped to specific nested path
$effect(() => {
    const activeTask = board.tasks.find(t => t.id === activeId);
    if (activeTask) {
        console.log('Active task updated:', activeTask.title);
    }
});
```

**Svelte 5's deep reactivity eliminates most manual tracking!**

---

**Frameworks are shortcuts, not magic!** ✨