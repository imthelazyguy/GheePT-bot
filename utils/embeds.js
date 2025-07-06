// utils/embeds.js
const { EmbedBuilder } = require('discord.js');

const GHEE_GOLD = '#FFD700';

// A simple cache to avoid fetching the config for every embed
const guildConfigCache = new Map();

async function getGuildConfig(interaction, db) {
    const guildId = interaction.guild.id;
    if (guildConfigCache.has(guildId)) {
        return guildConfigCache.get(guildId);
    }
    const configDoc = await db.collection('guilds').doc(guildId).get();
    const config = configDoc.exists ? configDoc.data() : {};
    guildConfigCache.set(guildId, config);
    // Set a timeout to clear the cache after 5 minutes to get fresh data later
    setTimeout(() => guildConfigCache.delete(guildId), 5 * 60 * 1000);
    return config;
}

async function getCustomEmoji(interaction, db, purpose, fallback) {
    const config = await getGuildConfig(interaction, db);
    return config.customEmojis?.[purpose] || fallback;
}

function createGheeEmbed(title, description, color = GHEE_GOLD) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || '\u200B') // Use a zero-width space if description is empty
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: "GheePT | The GheeSpot Bot" });
}

// SUCCESS and ERROR embeds now need the interaction and db to find custom emojis
async function createSuccessEmbed(interaction, db, description) {
    const successEmoji = await getCustomEmoji(interaction, db, 'success', '✅');
    return createGheeEmbed(`${successEmoji} Success`, description, 'Green');
}

async function createErrorEmbed(interaction, db, description) {
    const errorEmoji = await getCustomEmoji(interaction, db, 'error', '❌');
    return createGheeEmbed(`${errorEmoji} Error`, description, 'Red');
}

module.exports = { createGheeEmbed, createSuccessEmbed, createErrorEmbed };
