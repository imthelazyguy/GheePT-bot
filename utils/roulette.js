// utils/roulette.js

const ROULETTE_NUMBERS = {
    0: 'green',
    1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red',
    10: 'black', 11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
    19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red',
    28: 'black', 29: 'black', 30: 'red', 31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red',
};

// Payout multipliers
const PAYOUTS = {
    number: 36,
    color: 2,
    parity: 2,
};

/**
 * Simulates a wheel spin and returns the winning number object.
 * @returns {{number: number, color: string}} The winning number and its color.
 */
function spinWheel() {
    const number = Math.floor(Math.random() * 37); // 0-36
    return { number, color: ROULETTE_NUMBERS[number] };
}

/**
 * Calculates the winnings based on the bet type and result.
 * @param {'number'|'color'|'parity'} betType - The type of bet placed.
 * @param {string|number} betValue - The specific value bet on (e.g., 'red', 17).
 * @param {{number: number, color: string}} result - The result of the wheel spin.
 * @param {number} betAmount - The amount of the original bet.
 * @returns {number} The total amount won (payout includes the original bet), or 0 if lost.
 */
function calculatePayout(betType, betValue, result, betAmount) {
    if (betType === 'number') {
        // In roulette, a straight up number bet pays 35:1. The total return is 36x the bet.
        return parseInt(betValue) === result.number ? betAmount * PAYOUTS.number : 0;
    }
    if (betType === 'color') {
        // Color bets pay 1:1. Total return is 2x the bet.
        return betValue === result.color ? betAmount * PAYOUTS.color : 0;
    }
    if (betType === 'parity') {
        if (result.number === 0) return 0; // 0 is not even or odd.
        const isEven = result.number % 2 === 0;
        if ((betValue === 'even' && isEven) || (betValue === 'odd' && !isEven)) {
            return betAmount * PAYOUTS.parity;
        }
        return 0;
    }
    return 0;
}

module.exports = { spinWheel, calculatePayout, ROULETTE_NUMBERS };
