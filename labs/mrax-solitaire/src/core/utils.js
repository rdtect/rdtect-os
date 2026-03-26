/**
 * @fileoverview Utility functions
 * Pure helper functions used across the application
 */

/**
 * Async sleep utility for animations
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Deep clones an array of objects
 * @template T
 * @param {T[]} array - Array to clone
 * @returns {T[]} Deep cloned array
 */
export const deepCloneArray = (array) => array.map(item => ({...item}));

/**
 * Deep clones a 2D array of objects
 * @template T
 * @param {T[][]} array2D - 2D array to clone
 * @returns {T[][]} Deep cloned 2D array
 */
export const deepClone2DArray = (array2D) => 
    array2D.map(arr => arr.map(item => ({...item})));

/**
 * Formats seconds into MM:SS string
 * @param {number} totalSeconds - Total elapsed seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
