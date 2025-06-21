// utils/embeds.js
const { EmbedBuilder } = require('discord.js');

const GHEE_GOLD = '#FFD700';

function createGheeEmbed(title, description, color = GHEE_GOLD) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || '\u200B') // Use a zero-width space if description is empty
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: "GheePT | The GheeSpot Bot" });
}

function createSuccessEmbed(description) {
    return createGheeEmbed("✅ Success", description, 'Green');
}

function createErrorEmbed(description) {
    return createGheeEmbed("❌ Error", description, 'Red');
}

module.exports = { createGheeEmbed, createSuccessEmbed, createErrorEmbed };