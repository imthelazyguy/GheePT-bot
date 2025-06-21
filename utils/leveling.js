// utils/leveling.js

/**
 * Calculates the total XP required to reach the next level.
 * Formula: 5 * (level^2) + 50 * level + 100
 * @param {number} level - The current level.
 * @returns {number} The total XP needed for the next level.
 */
function getXpForNextLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

module.exports = { getXpForNextLevel };