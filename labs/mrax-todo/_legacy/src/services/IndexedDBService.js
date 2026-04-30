// IndexedDB storage service - persistent todo storage
import { STORAGE_CONFIG } from '../core/constants.js';

export class IndexedDBService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                STORAGE_CONFIG.DB_NAME, 
                STORAGE_CONFIG.DB_VERSION
            );

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORE_NAME)) {
                    const objectStore = db.createObjectStore(
                        STORAGE_CONFIG.STORE_NAME, 
                        { keyPath: 'id' }
                    );
                    
                    // Create indexes
                    objectStore.createIndex('status', 'status', { unique: false });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    /**
     * Get all todos
     * @returns {Promise<Array>}
     */
    async getAllTodos() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [STORAGE_CONFIG.STORE_NAME], 
                'readonly'
            );
            const objectStore = transaction.objectStore(STORAGE_CONFIG.STORE_NAME);
            const request = objectStore.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * Add a todo
     * @param {Object} todo - Todo to add
     * @returns {Promise<Object>}
     */
    async addTodo(todo) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [STORAGE_CONFIG.STORE_NAME], 
                'readwrite'
            );
            const objectStore = transaction.objectStore(STORAGE_CONFIG.STORE_NAME);
            const request = objectStore.add(todo);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(todo);
        });
    }

    /**
     * Update a todo
     * @param {Object} todo - Todo to update
     * @returns {Promise<Object>}
     */
    async updateTodo(todo) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [STORAGE_CONFIG.STORE_NAME], 
                'readwrite'
            );
            const objectStore = transaction.objectStore(STORAGE_CONFIG.STORE_NAME);
            const request = objectStore.put(todo);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(todo);
        });
    }

    /**
     * Delete a todo
     * @param {number} id - Todo ID
     * @returns {Promise<void>}
     */
    async deleteTodo(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [STORAGE_CONFIG.STORE_NAME], 
                'readwrite'
            );
            const objectStore = transaction.objectStore(STORAGE_CONFIG.STORE_NAME);
            const request = objectStore.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Clear all todos
     * @returns {Promise<void>}
     */
    async clearAll() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [STORAGE_CONFIG.STORE_NAME], 
                'readwrite'
            );
            const objectStore = transaction.objectStore(STORAGE_CONFIG.STORE_NAME);
            const request = objectStore.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}