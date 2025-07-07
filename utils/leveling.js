// utils/leveling.js

/**
 * Calculates the total cumulative XP required to reach the next level.
 * This new cubic formula scales much more aggressively at higher levels.
 * @param {number} level - The current level.
 * @returns {number} The total XP needed for the next level.
 */
function getXpForLevel(level) {
    // New, more aggressive cubic formula
    return 10 * (level ** 3) + 75 * (level ** 2) + 200 * level;
}

module.exports = { getXpForLevel };
