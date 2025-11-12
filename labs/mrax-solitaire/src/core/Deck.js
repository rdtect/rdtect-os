/**
 * @fileoverview Deck creation and shuffling logic
 */

import { SUITS, VALUES, RED_SUITS } from './constants.js';

/**
 * @typedef {Object} Card
 * @property {string} suit - One of: hearts, diamonds, clubs, spades
 * @property {string} value - One of: A, 2-10, J, Q, K
 * @property {number} numericValue - 1-13 for comparisons
 * @property {string} color - 'red' or 'black'
 * @property {boolean} faceUp - Whether card is visible
 */

/**
 * Deck class - Creates and shuffles a standard 52-card deck
 */
export class Deck {
    constructor() {
        /** @type {Card[]} */
        this.cards = [];
    }
    
    /**
     * Creates a standard 52-card deck
     * @returns {Card[]} The created deck
     */
    create() {
        this.cards = SUITS.flatMap(suit => 
            VALUES.map((value, index) => ({
                suit,
                value,
                numericValue: index + 1,
                color: RED_SUITS.includes(suit) ? 'red' : 'black',
                faceUp: false
            }))
        );
        return this.cards;
       
    }
    
    /**
     * Shuffles the deck using Fisher-Yates algorithm (O(n))
     * @returns {Card[]} The shuffled deck
     */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this.cards;
    }
}
