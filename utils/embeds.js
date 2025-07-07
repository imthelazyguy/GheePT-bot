// utils/embeds.js
const { EmbedBuilder } = require('discord.js');

const GHEE_GOLD = '#FFD700';

// A simple cache to avoid fetching guild configs repeatedly
const guildConfigCache = new Map();

async function getGuildConfig(guild, db) {
    if (!guild) return {}; // Return empty config if no guild is available
    const guildId = guild.id;

    if (guildConfigCache.has(guildId)) {
        return guildConfigCache.get(guildId);
    }
    const configDoc = await db.collection('guilds').doc(guildId).get();
    const config = configDoc.exists ? configDoc.data() : {};
    guildConfigCache.set(guildId, config);
    setTimeout(() => guildConfigCache.delete(guildId), 5 * 60 * 1000); // Cache for 5 mins
    return config;
}

async function getCustomEmoji(guild, db, purpose, fallback) {
    const config = await getGuildConfig(guild, db);
    return config.customEmojis?.[purpose] || fallback;
}

function createGheeEmbed(title, description, color = GHEE_GOLD) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || '\u200B')
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: "GheePT | The GheeSpot Bot" });
}

// These functions can now accept a 'guild' object instead of a full 'interaction'
async function createSuccessEmbed(context, db, description) {
    const guild = context.guild;
    const successEmoji = await getCustomEmoji(guild, db, 'success', '✅');
    return createGheeEmbed(`${successEmoji} Success`, description, 'Green');
}

async function createErrorEmbed(context, db, description) {
    const guild = context.guild;
    const errorEmoji = await getCustomEmoji(guild, db, 'error', '❌');
    return createGheeEmbed(`${errorEmoji} Error`, description, 'Red');
}

module.exports = { createGheeEmbed, createSuccessEmbed, createErrorEmbed };
