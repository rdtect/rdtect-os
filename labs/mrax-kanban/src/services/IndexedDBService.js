// IndexedDB service for Kanban board
import { STORAGE_CONFIG, DEFAULT_COLUMNS } from '../core/constants.js';

export class IndexedDBService {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                STORAGE_CONFIG.DB_NAME,
                STORAGE_CONFIG.DB_VERSION
            );

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Tasks store
                if (!db.objectStoreNames.contains(STORAGE_CONFIG.TASKS_STORE)) {
                    const tasksStore = db.createObjectStore(
                        STORAGE_CONFIG.TASKS_STORE,
                        { keyPath: 'id' }
                    );
                    tasksStore.createIndex('columnId', 'columnId', { unique: false });
                    tasksStore.createIndex('priority', 'priority', { unique: false });
                }

                // Columns store
                if (!db.objectStoreNames.contains(STORAGE_CONFIG.COLUMNS_STORE)) {
                    const columnsStore = db.createObjectStore(
                        STORAGE_CONFIG.COLUMNS_STORE,
                        { keyPath: 'id' }
                    );
                    columnsStore.createIndex('order', 'order', { unique: false });

                    // Add default columns
                    const transaction = event.target.transaction;
                    const store = transaction.objectStore(STORAGE_CONFIG.COLUMNS_STORE);
                    DEFAULT_COLUMNS.forEach(col => store.add(col));
                }
            };
        });
    }

    // Tasks CRUD
    async getAllTasks() {
        if (!this.db) await this.init();
        return this.getAll(STORAGE_CONFIG.TASKS_STORE);
    }

    async addTask(task) {
        if (!this.db) await this.init();
        return this.add(STORAGE_CONFIG.TASKS_STORE, task);
    }

    async updateTask(task) {
        if (!this.db) await this.init();
        return this.update(STORAGE_CONFIG.TASKS_STORE, task);
    }

    async deleteTask(id) {
        if (!this.db) await this.init();
        return this.delete(STORAGE_CONFIG.TASKS_STORE, id);
    }

    // Columns CRUD
    async getAllColumns() {
        if (!this.db) await this.init();
        return this.getAll(STORAGE_CONFIG.COLUMNS_STORE);
    }

    async addColumn(column) {
        if (!this.db) await this.init();
        return this.add(STORAGE_CONFIG.COLUMNS_STORE, column);
    }

    async updateColumn(column) {
        if (!this.db) await this.init();
        return this.update(STORAGE_CONFIG.COLUMNS_STORE, column);
    }

    async deleteColumn(id) {
        if (!this.db) await this.init();
        return this.delete(STORAGE_CONFIG.COLUMNS_STORE, id);
    }

    // Generic operations
    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    add(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(item);
        });
    }

    update(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(item);
        });
    }

    delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}