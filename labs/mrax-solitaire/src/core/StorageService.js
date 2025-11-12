/**
 * @fileoverview Browser storage service for game persistence
 * Demonstrates CRUD operations with localStorage
 */

/**
 * @typedef {Object} GameSave
 * @property {import('./Deck.js').Card[]} stock
 * @property {import('./Deck.js').Card[]} waste
 * @property {import('./Deck.js').Card[][]} foundations
 * @property {import('./Deck.js').Card[][]} tableau
 * @property {number} moves
 * @property {number} elapsedSeconds
 * @property {string} savedAt - ISO timestamp
 */

/**
 * @typedef {Object} GameStats
 * @property {number} gamesPlayed
 * @property {number} gamesWon
 * @property {number} bestTime
 * @property {number} bestMoves
 */

/**
 * StorageService - Handles all localStorage operations (CRUD)
 */
export class StorageService {
    static KEYS = {
        CURRENT_GAME: 'solitaire_current_game',
        STATS: 'solitaire_stats'
    };
    
    // ===== CREATE & UPDATE =====
    
    /**
     * Saves current game state (CREATE/UPDATE)
     * @param {GameSave} gameState - Game state to save
     */
    static saveGame(gameState) {
        try {
            const saveData = {
                ...gameState,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(
                this.KEYS.CURRENT_GAME,
                JSON.stringify(saveData)
            );
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    /**
     * Updates game statistics
     * @param {Partial<GameStats>} updates - Stats to update
     */
    static updateStats(updates) {
        const stats = this.getStats();
        const newStats = { ...stats, ...updates };
        
        try {
            localStorage.setItem(
                this.KEYS.STATS,
                JSON.stringify(newStats)
            );
            return true;
        } catch (error) {
            console.error('Failed to update stats:', error);
            return false;
        }
    }
    
    // ===== READ =====
    
    /**
     * Loads saved game (READ)
     * @returns {GameSave|null} Saved game or null
     */
    static loadGame() {
        try {
            const data = localStorage.getItem(this.KEYS.CURRENT_GAME);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }
    
    /**
     * Gets game statistics (READ)
     * @returns {GameStats} Current statistics
     */
    static getStats() {
        try {
            const data = localStorage.getItem(this.KEYS.STATS);
            return data ? JSON.parse(data) : {
                gamesPlayed: 0,
                gamesWon: 0,
                bestTime: Infinity,
                bestMoves: Infinity
            };
        } catch (error) {
            console.error('Failed to load stats:', error);
            return this.getDefaultStats();
        }
    }
    
    /**
     * Checks if a saved game exists
     * @returns {boolean}
     */
    static hasSavedGame() {
        return localStorage.getItem(this.KEYS.CURRENT_GAME) !== null;
    }
    
    // ===== DELETE =====
    
    /**
     * Deletes saved game (DELETE)
     */
    static deleteSave() {
        try {
            localStorage.removeItem(this.KEYS.CURRENT_GAME);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }
    
    /**
     * Resets all statistics
     */
    static resetStats() {
        try {
            localStorage.removeItem(this.KEYS.STATS);
            return true;
        } catch (error) {
            console.error('Failed to reset stats:', error);
            return false;
        }
    }
    
    /**
     * Clears all game data
     */
    static clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }
    
    // ===== HELPERS =====
    
    /**
     * Gets default stats
     * @returns {GameStats}
     */
    static getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            bestTime: Infinity,
            bestMoves: Infinity
        };
    }
}
