# IndexedDB Guide for Kanban Board

Learn advanced browser storage with IndexedDB.

## Why IndexedDB?

### localStorage Limitations
- Only stores strings
- ~5-10MB limit
- Synchronous (blocks UI)
- No queries or indexes

### IndexedDB Advantages
- Stores any data type
- ~50MB+ limit (or unlimited)
- Asynchronous (non-blocking)
- Queryable with indexes
- Transactions

## Our IndexedDB Structure

### Database: kanban-db (version 1)

**Object Store: tasks**
```javascript
{
    keyPath: 'id',
    indexes: {
        'columnId': { unique: false },
        'priority': { unique: false }
    }
}
```

**Object Store: columns**
```javascript
{
    keyPath: 'id',
    indexes: {
        'order': { unique: false }
    }
}
```

## Implementation

### Database Initialization

```javascript
class IndexedDBService {
    constructor() {
        this.dbName = 'kanban-db';
        this.version = 1;
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // Create tasks store
                if (!db.objectStoreNames.contains('tasks')) {
                    const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
                    taskStore.createIndex('columnId', 'columnId', { unique: false });
                    taskStore.createIndex('priority', 'priority', { unique: false });
                }
                
                // Create columns store
                if (!db.objectStoreNames.contains('columns')) {
                    const colStore = db.createObjectStore('columns', { keyPath: 'id' });
                    colStore.createIndex('order', 'order', { unique: false });
                }
            };
        });
    }
}
```

### CRUD Operations

#### CREATE
```javascript
async addTask(task) {
    const tx = this.db.transaction(['tasks'], 'readwrite');
    const store = tx.objectStore('tasks');
    
    return new Promise((resolve, reject) => {
        const request = store.add(task);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
```

#### READ
```javascript
async getTask(id) {
    const tx = this.db.transaction(['tasks'], 'readonly');
    const store = tx.objectStore('tasks');
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async getAllTasks() {
    const tx = this.db.transaction(['tasks'], 'readonly');
    const store = tx.objectStore('tasks');
    
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
```

#### UPDATE
```javascript
async updateTask(task) {
    const tx = this.db.transaction(['tasks'], 'readwrite');
    const store = tx.objectStore('tasks');
    
    return new Promise((resolve, reject) => {
        const request = store.put(task);  // put = add or update
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
```

#### DELETE
```javascript
async deleteTask(id) {
    const tx = this.db.transaction(['tasks'], 'readwrite');
    const store = tx.objectStore('tasks');
    
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
```

### Query by Index

```javascript
async getTasksByColumn(columnId) {
    const tx = this.db.transaction(['tasks'], 'readonly');
    const store = tx.objectStore('tasks');
    const index = store.index('columnId');
    
    return new Promise((resolve, reject) => {
        const request = index.getAll(columnId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
```

## Best Practices

### 1. Always Use Transactions
```javascript
// ✅ GOOD - Explicit transaction
const tx = db.transaction(['tasks'], 'readwrite');
const store = tx.objectStore('tasks');
```

### 2. Handle Errors
```javascript
try {
    await this.addTask(task);
} catch (error) {
    console.error('Failed to add task:', error);
    this.showError('Failed to save');
}
```

### 3. Use Indexes for Queries
```javascript
// ❌ BAD - Load all then filter
const all = await getAllTasks();
const filtered = all.filter(t => t.columnId === 'todo');

// ✅ GOOD - Query by index
const filtered = await getTasksByColumn('todo');
```

### 4. Batch Operations
```javascript
async addMultipleTasks(tasks) {
    const tx = this.db.transaction(['tasks'], 'readwrite');
    const store = tx.objectStore('tasks');
    
    // Add all in one transaction
    tasks.forEach(task => store.add(task));
    
    // Wait for transaction to complete
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
```

## Debugging IndexedDB

### Chrome DevTools
```
F12 → Application → Storage → IndexedDB → kanban-db
```

You can:
- Browse all data
- View indexes
- Delete entries
- Clear database

### Console
```javascript
// List all databases
indexedDB.databases().then(console.log);

// Delete database
indexedDB.deleteDatabase('kanban-db');
```

## localStorage vs IndexedDB

### Use localStorage when:
- Simple key-value data
- Small datasets (<1MB)
- Don't need queries
- Synchronous OK

**Example:** User preferences, app settings

### Use IndexedDB when:
- Complex objects
- Large datasets (>1MB)
- Need queries/indexes
- Async required

**Example:** Task boards, email clients, offline apps

## Migration Path

### From localStorage to IndexedDB

```javascript
// 1. Export from localStorage
const oldData = JSON.parse(localStorage.getItem('tasks'));

// 2. Initialize IndexedDB
await indexedDBService.init();

// 3. Import to IndexedDB
for (const task of oldData) {
    await indexedDBService.addTask(task);
}

// 4. Clear localStorage
localStorage.removeItem('tasks');
```

## Common Gotchas

### 1. Database Versioning
```javascript
// Increment version to modify schema
const request = indexedDB.open('kanban-db', 2);  // Version 2!

request.onupgradeneeded = (e) => {
    const db = e.target.result;
    
    // Check old version
    if (e.oldVersion < 2) {
        // Add new index
        const store = tx.objectStore('tasks');
        store.createIndex('dueDate', 'dueDate');
    }
};
```

### 2. Async Everywhere
```javascript
// ❌ BAD - Not awaiting
function load() {
    this.tasks = this.storage.getAllTasks();  // Returns Promise!
    this.render();  // Runs before tasks loaded!
}

// ✅ GOOD - Await async
async function load() {
    this.tasks = await this.storage.getAllTasks();
    this.render();
}
```

### 3. Transaction Modes
```javascript
// Read-only (faster)
const tx = db.transaction(['tasks'], 'readonly');

// Read-write (for modifications)
const tx = db.transaction(['tasks'], 'readwrite');
```

---

**IndexedDB = Power & Flexibility!** 💪