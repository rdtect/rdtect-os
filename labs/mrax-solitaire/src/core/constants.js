/**
 * @fileoverview Game constants - Single source of truth for all magic numbers and strings
 */

/** @type {string[]} Card suits */
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

/** @type {string[]} Card values from Ace to King */
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** @type {Object.<string, string>} Unicode symbols for each suit */
export const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

/** @type {string[]} Red suits for color checking */
export const RED_SUITS = ['hearts', 'diamonds'];

/** @type {number} Pixels between stacked cards in tableau */
export const TABLEAU_CARD_OFFSET = 30;

/** @type {number} Milliseconds delay between dealing each card */
export const ANIMATION_DEAL_DELAY = 30;
