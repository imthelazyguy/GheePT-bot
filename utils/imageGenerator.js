// utils/imageGenerator.js
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Register a font. You might need to provide a .ttf file in your project or rely on system fonts.
// For Railway, it's safer to bundle a font with your project.
// registerFont(path.join(__dirname, '../fonts/YourFont.ttf'), { family: 'YourFont' });

function drawProgressBar(ctx, x, y, width, height, progress) {
    ctx.fillStyle = '#444';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#FFD700'; // Ghee Gold
    ctx.fillRect(x, y, width * (progress / 100), height);
}

async function createPPCard(user, size) {
    const canvas = createCanvas(400, 150);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Avatar
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png' }));
    ctx.drawImage(avatar, 20, 25, 100, 100);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px sans-serif';
    ctx.fillText(`${user.username}'s pp`, 140, 50);

    // Bar
    const progress = (size / 12) * 100; // Assuming max size is 12
    drawProgressBar(ctx, 140, 70, 240, 30, progress);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`${size} inches`, 140, 125);
    
    return canvas.toBuffer('image/png');
}

async function createHornyCard(user, percentage) {
    const canvas = createCanvas(400, 150);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png' }));
    ctx.drawImage(avatar, 20, 25, 100, 100);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px sans-serif';
    ctx.fillText('Arousometer Reading', 140, 50);
    drawProgressBar(ctx, 140, 70, 240, 30, percentage);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`${percentage}% horny`, 140, 125);
    return canvas.toBuffer('image/png');
}

// ... Create similar functions for /gay, etc. ...

module.exports = { createPPCard, createHornyCard };
