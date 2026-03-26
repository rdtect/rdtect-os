/**
 * @fileoverview Main game state and orchestration
 * Coordinates all modules and manages game flow
 */

import { Deck } from '../core/Deck.js';
import { GameLogic } from '../core/GameLogic.js';
import { ANIMATION_DEAL_DELAY } from '../core/constants.js';
import { sleep, deepCloneArray, deepClone2DArray, formatTime } from '../core/utils.js';
import { StorageService } from '../core/StorageService.js';
import { Renderer } from '../ui/Renderer.js';
import { EventHandler } from '../ui/EventHandler.js';

/**
 * GameState class - Main game orchestrator
 * Manages state and coordinates all modules
 */
export class GameState {
    constructor() {
        // Initialize modules
        this.deck = new Deck();
        this.renderer = new Renderer();
        this.eventHandler = new EventHandler(this);
        
        // Game state
        this.deckCards = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.draggedCard = null;
        this.draggedFrom = null;
        this.isAnimating = false;
        this.moveHistory = [];
        
        this.eventHandler.setupEventListeners();
        this.loadOrInit();
    }
    
    /**
     * Load saved game or start new one
     */
    loadOrInit() {
        const savedGame = StorageService.loadGame();
        if (savedGame) {
            this.loadSavedGame(savedGame);
        } else {
            this.initAsync();
        }
    }
    
    /**
     * Restore saved game state
     * @param {import('../core/StorageService.js').GameSave} savedGame
     */
    loadSavedGame(savedGame) {
        this.stock = savedGame.stock;
        this.waste = savedGame.waste;
        this.foundations = savedGame.foundations;
        this.tableau = savedGame.tableau;
        this.moves = savedGame.moves;
        
        // Resume timer
        this.startTime = Date.now() - (savedGame.elapsedSeconds * 1000);
        this.startTimer();
        this.render();
        
        console.log('📂 Loaded saved game');
    }
    
    // ===== INITIALIZATION =====
    
    /**
     * Initializes game asynchronously with animations
     */
    async initAsync() {
        this.isAnimating = true;
        this.deck.create();
        this.deck.shuffle();
        this.deckCards = this.deck.cards;
        await this.dealWithAnimation();
        this.isAnimating = false;
        this.startTimer();
    }
    
    /**
     * Deals cards to tableau with animation
     */
    async dealWithAnimation() {
        let cardIndex = 0;
        
        // Deal cards to 7 tableau piles
        for (let pileIndex = 0; pileIndex < 7; pileIndex++) {
            for (let cardOffset = 0; cardOffset < 7 - pileIndex; cardOffset++) {
                const card = this.deckCards[cardIndex++];
                card.faceUp = cardOffset === 0;  // Only top card face-up
                this.tableau[pileIndex + cardOffset].push(card);
                
                // Render with animation
                this.renderer.renderTableauPile(
                    this.tableau[pileIndex + cardOffset],
                    pileIndex + cardOffset,
                    (e, card, from, pileIdx, cardIdx) => this.eventHandler.onDragStart(e, card, from, pileIdx, cardIdx),
                    () => {},
                    true
                );
                await sleep(ANIMATION_DEAL_DELAY);
            }
        }
        
        // Remaining cards go to stock
        this.stock = this.deckCards.slice(cardIndex);
        this.render();
    }
    
    // ===== RENDERING =====
    
    /**
     * Renders the entire game state
     */
    render() {
        this.renderer.renderStock(this.stock);
        this.renderer.renderWaste(
            this.waste,
            (e, card, from) => this.eventHandler.onDragStart(e, card, from),
            (card, from, pileIdx) => this.eventHandler.onCardDoubleClick(card, from, pileIdx)
        );
        this.renderer.renderFoundations(this.foundations);
        this.renderer.renderTableau(
            this.tableau,
            (e, card, from, pileIdx, cardIdx) => this.eventHandler.onDragStart(e, card, from, pileIdx, cardIdx),
            (card, from, pileIdx) => this.eventHandler.onCardDoubleClick(card, from, pileIdx)
        );
        this.renderer.updateStats(this.moves);
    }
    
    // ===== GAME ACTIONS =====
    
    /**
     * Draws a card from stock to waste
     */
    drawFromStock() {
        this.saveState();
        const card = this.stock.pop();
        card.faceUp = true;
        this.waste.push(card);
        this.moves++;
        this.render();
    }
    
    /**
     * Recycles waste pile back to stock
     */
    recycleWaste() {
        this.saveState();
        this.stock = [...this.waste].reverse().map(card => ({ ...card, faceUp: false }));
        this.waste = [];
        this.moves++;
        this.render();
    }
    
    /**
     * Moves dragged card to a foundation pile
     * @param {number} foundationIndex - Target foundation index (0-3)
     */
    moveToFoundation(foundationIndex) {
        if (!this.draggedCard) return;
        
        const foundation = this.foundations[foundationIndex];
        
        if (!GameLogic.isValidFoundationMove(foundation, this.draggedCard)) {
            return;
        }
        
        this.saveState();
        this.removeCardFromSource();
        foundation.push(this.draggedCard);
        this.completeMove();
        this.checkWin();
    }
    
    /**
     * Moves dragged card(s) to a tableau pile
     * @param {number} tableauIndex - Target tableau index (0-6)
     */
    moveToTableau(tableauIndex) {
        if (!this.draggedCard) return;
        
        const pile = this.tableau[tableauIndex];
        
        if (!GameLogic.isValidTableauMove(pile, this.draggedCard)) {
            return;
        }
        
        this.saveState();
        const cards = this.removeCardFromSource();
        pile.push(...cards);
        this.completeMove();
    }
    
    /**
     * Removes card(s) from source location
     * @returns {import('../core/Deck.js').Card[]} Removed cards
     */
    removeCardFromSource() {
        const { from, pileIndex, cardIndex } = this.draggedFrom;
        
        if (from === 'waste') {
            return [this.waste.pop()];
        } else if (from === 'tableau') {
            return this.tableau[pileIndex].splice(cardIndex);
        }
        
        return [];
    }
    
    /**
     * Completes a move (increment, clear drag, flip, render)
     */
    completeMove() {
        this.moves++;
        this.draggedCard = null;
        this.flipTopCardIfNeeded();
        this.render();
        this.autoSave();
    }
    
    /**
     * Auto-saves game state
     */
    autoSave() {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        StorageService.saveGame({
            stock: this.stock,
            waste: this.waste,
            foundations: this.foundations,
            tableau: this.tableau,
            moves: this.moves,
            elapsedSeconds
        });
    }
    
    /**
     * Flips top card of source pile if it's face-down
     */
    flipTopCardIfNeeded() {
        if (this.draggedFrom.from === 'tableau') {
            const sourcePile = this.tableau[this.draggedFrom.pileIndex];
            if (sourcePile.length > 0 && !sourcePile.at(-1).faceUp) {
                sourcePile.at(-1).faceUp = true;
                // Add flip animation class
                setTimeout(() => this.render(), 0);
            }
        }
    }
    
    // ===== UNDO SYSTEM =====
    
    /**
     * Saves current state for undo (deep copy)
     */
    saveState() {
        const state = {
            stock: deepCloneArray(this.stock),
            waste: deepCloneArray(this.waste),
            foundations: deepClone2DArray(this.foundations),
            tableau: deepClone2DArray(this.tableau),
            moves: this.moves
        };
        // Keep last 50 states
        this.moveHistory = [...this.moveHistory.slice(-49), state];
    }
    
    /**
     * Undoes the last move
     */
    undo() {
        if (this.moveHistory.length === 0) return;
        
        const state = this.moveHistory.pop();
        this.stock = state.stock;
        this.waste = state.waste;
        this.foundations = state.foundations;
        this.tableau = state.tableau;
        this.moves = state.moves;
        this.render();
    }
    
    /**
     * Finds a foundation that can accept the card
     * @param {import('../core/Deck.js').Card} card - Card to check
     * @returns {number} Foundation index or -1 if none valid
     */
    autoMoveToFoundation(card) {
        for (let i = 0; i < 4; i++) {
            if (GameLogic.isValidFoundationMove(this.foundations[i], card)) {
                return i;
            }
        }
        return -1;
    }
    
    // ===== WIN CONDITION =====
    
    /**
     * Checks if game is won and shows modal
     */
    checkWin() {
        if (GameLogic.checkWin(this.foundations)) {
            this.showWinModal();
        }
    }
    
    /**
     * Displays the win modal
     */
    showWinModal() {
        clearInterval(this.timerInterval);
        const timeText = document.getElementById('time').textContent;
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        
        document.getElementById('final-moves').textContent = this.moves;
        document.getElementById('final-time').textContent = timeText;
        document.getElementById('win-modal').classList.remove('hidden');
        
        // Update statistics
        const stats = StorageService.getStats();
        StorageService.updateStats({
            gamesPlayed: stats.gamesPlayed + 1,
            gamesWon: stats.gamesWon + 1,
            bestTime: Math.min(stats.bestTime, elapsedSeconds),
            bestMoves: Math.min(stats.bestMoves, this.moves)
        });
        
        // Clear saved game
        StorageService.deleteSave();
    }
    
    // ===== TIMER =====
    
    /**
     * Starts the game timer
     */
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('time').textContent = formatTime(elapsed);
        }, 1000);
    }
    
    // ===== GAME MANAGEMENT =====
    
    /**
     * Resets the game to initial state
     */
    resetGame() {
        clearInterval(this.timerInterval);
        this.deckCards = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.moves = 0;
        this.draggedCard = null;
        this.draggedFrom = null;
        this.moveHistory = [];
        
        // Clear saved game
        StorageService.deleteSave();
        
        // Update stats
        const stats = StorageService.getStats();
        StorageService.updateStats({
            gamesPlayed: stats.gamesPlayed + 1
        });
        
        this.initAsync();
    }
}
