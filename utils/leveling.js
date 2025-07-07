// utils/leveling.js

// This formula determines how much XP is needed for any given level.
// It's a common formula: 5 * (lvl ^ 2) + 50 * lvl + 100
function getXpForLevel(level) {
    return 5 * (level ** 2) + (50 * level) + 100;
}

module.exports = { getXpForLevel };
