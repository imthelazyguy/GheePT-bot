// utils/cardGenerator.js
const { createCanvas, loadImage } = require('canvas');

/**
 * Creates a progress bar using emojis.
 * @param {number} percentage - The percentage to fill (0-100).
 * @param {number} totalBlocks - The total number of blocks in the bar.
 * @returns {string} The emoji progress bar string.
 */
function generateProgressBar(percentage, totalBlocks = 10, filledEmoji = '▰', emptyEmoji = '▱') {
    const filledCount = Math.round((percentage / 100) * totalBlocks);
    const emptyCount = totalBlocks - filledCount;
    return filledEmoji.repeat(filledCount) + emptyEmoji.repeat(emptyCount);
}

/**
 * Combines two user avatars side-by-side with a plus icon.
 * @param {string} avatarURL1 - URL of the first user's avatar.
 * @param {string} avatarURL2 - URL of the second user's avatar.
 * @returns {Promise<Buffer>} A buffer containing the final PNG image.
 */
async function generateShipImage(avatarURL1, avatarURL2) {
    const canvas = createCanvas(286, 128); // 128 + 30 + 128
    const ctx = canvas.getContext('2d');

    // Load images
    const img1 = await loadImage(avatarURL1);
    const img2 = await loadImage(avatarURL2);
    
    // Draw avatars
    ctx.drawImage(img1, 0, 0, 128, 128);
    ctx.drawImage(img2, 158, 0, 128, 128);
    
    // Draw the plus sign in the middle
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', 143, 64);

    return canvas.toBuffer('image/png');
}


module.exports = { generateProgressBar, generateShipImage };
