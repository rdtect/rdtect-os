# CRUD Operations Guide

Learn the fundamental database operations: Create, Read, Update, Delete.

## What is CRUD?

CRUD = **C**reate, **R**ead, **U**pdate, **D**elete

Every data-driven app needs these four operations.

## The CRUD Pattern in Todo App

### CREATE - Add New Todo

```javascript
addTodo(text) {
    // 1. Validate
    const validation = TodoLogic.validateTodo(text);
    if (!validation.valid) {
        this.renderer.showError(validation.error);
        return;
    }
    
    // 2. Create object
    const newTodo = {
        id: Date.now(),  // Unique ID
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
    };
    
    // 3. Add to state (immutably)
    this.todos = [...this.todos, newTodo];
    
    // 4. Persist
    this.storage.saveTodos(this.todos);
    
    // 5. Update UI with animation
    await this.renderer.animateAddTodo(newTodo);
    this.render();
}
```

### READ - Display Todos

```javascript
// Load on init
async init() {
    this.todos = this.storage.loadTodos();
    this.render();
}

// Filter todos
getActiveTodos() {
    return this.todos.filter(t => !t.completed);
}

getCompletedTodos() {
    return this.todos.filter(t => t.completed);
}

// Find specific todo
getTodoById(id) {
    return this.todos.find(t => t.id === id);
}
```

### UPDATE - Toggle or Edit Todo

```javascript
toggleTodo(id) {
    // Find and update (immutably)
    this.todos = this.todos.map(todo => 
        todo.id === id 
            ? { ...todo, completed: !todo.completed }
            : todo
    );
    
    this.storage.saveTodos(this.todos);
    this.render();
}

editTodo(id, newText) {
    // Validate
    const validation = TodoLogic.validateTodo(newText);
    if (!validation.valid) return;
    
    // Update
    this.todos = this.todos.map(todo =>
        todo.id === id
            ? { ...todo, text: newText.trim() }
            : todo
    );
    
    this.storage.saveTodos(this.todos);
    this.render();
}
```

### DELETE - Remove Todo

```javascript
async deleteTodo(id) {
    // Animate out
    await this.renderer.animateRemoveTodo(id);
    
    // Remove from state
    this.todos = this.todos.filter(t => t.id !== id);
    
    // Persist
    this.storage.saveTodos(this.todos);
    
    // Re-render
    this.render();
}

// Delete all completed
clearCompleted() {
    this.todos = this.todos.filter(t => !t.completed);
    this.storage.saveTodos(this.todos);
    this.render();
}
```

## CRUD Best Practices

### 1. Always Validate
```javascript
// CREATE & UPDATE should validate
if (!isValid(data)) {
    showError('Invalid input');
    return;
}
```

### 2. Use Unique IDs
```javascript
// ✅ GOOD - Unique timestamp
id: Date.now()

// ✅ BETTER - UUID
id: crypto.randomUUID()

// ❌ BAD - Array index (changes on delete)
id: todos.length
```

### 3. Immutable Updates
```javascript
// ❌ BAD - Mutates original
const todo = todos.find(t => t.id === id);
todo.completed = true;

// ✅ GOOD - Creates new object
todos = todos.map(t => 
    t.id === id ? {...t, completed: true} : t
);
```

### 4. Persist After Every Change
```javascript
function anyChange() {
    // Update state
    this.todos = newTodos;
    
    // Always save
    this.storage.save(this.todos);
    
    // Always render
    this.render();
}
```

## Advanced CRUD Patterns

### Batch Operations
```javascript
completeAll() {
    this.todos = this.todos.map(t => ({...t, completed: true}));
    this.save();
    this.render();
}

deleteAll() {
    this.todos = [];
    this.save();
    this.render();
}
```

### Undo/Redo
```javascript
class AppState {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
    }
    
    saveHistory() {
        this.history = [
            ...this.history.slice(0, this.historyIndex + 1),
            [...this.todos]
        ];
        this.historyIndex++;
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.todos = [...this.history[this.historyIndex]];
            this.save();
            this.render();
        }
    }
}
```

### Search/Filter
```javascript
searchTodos(query) {
    return this.todos.filter(t => 
        t.text.toLowerCase().includes(query.toLowerCase())
    );
}

filterByStatus(status) {
    switch(status) {
        case 'active':
            return this.todos.filter(t => !t.completed);
        case 'completed':
            return this.todos.filter(t => t.completed);
        default:
            return this.todos;
    }
}
```

## CRUD in Different Contexts

### In-Memory (No Persistence)
```javascript
const todos = [];
todos.push(newTodo);           // CREATE
const todo = todos.find(...);  // READ
todos[0].text = 'new';         // UPDATE
todos.splice(0, 1);            // DELETE
```

### With localStorage (This App)
```javascript
todos = [...todos, newTodo];   // CREATE
const todo = todos.find(...);  // READ  
todos = todos.map(...);        // UPDATE
todos = todos.filter(...);     // DELETE
localStorage.setItem('todos', JSON.stringify(todos));
```

### With IndexedDB (See Kanban)
```javascript
await db.add('todos', newTodo);      // CREATE
const todo = await db.get('todos', id); // READ
await db.put('todos', updatedTodo);  // UPDATE
await db.delete('todos', id);        // DELETE
```

### With REST API (Future)
```javascript
await fetch('/api/todos', {          // CREATE
    method: 'POST',
    body: JSON.stringify(newTodo)
});

const res = await fetch('/api/todos/1'); // READ
const todo = await res.json();

await fetch('/api/todos/1', {        // UPDATE
    method: 'PUT',
    body: JSON.stringify(updatedTodo)
});

await fetch('/api/todos/1', {        // DELETE
    method: 'DELETE'
});
```

## Key Takeaways

1. **CRUD is universal** - Works everywhere
2. **Validate before CREATE/UPDATE**
3. **Use unique IDs** for all items
4. **Update immutably** for predictability
5. **Persist after every change**
6. **localStorage for simple data** (<5MB)
7. **IndexedDB for complex data** (see Kanban)

---

**CRUD powers every data-driven app!** 💾