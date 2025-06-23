// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const config = require('../config');

// This function can remain the same
async function handleCasualResponse(message, db) {
    const guildId = message.guild.id;
    const client = message.client;
    if (client.greetingCooldowns.has(message.channel.id)) return; // Simple channel cooldown

    if (!client.greetingKeywords.has(guildId)) {
        const snapshot = await db.collection('guilds').doc(guildId).collection('greetings').get();
        const keywords = new Map();
        snapshot.forEach(doc => { keywords.set(doc.id, doc.data().replies); });
        client.greetingKeywords.set(guildId, keywords);
    }

    const keywordsMap = client.greetingKeywords.get(guildId);
    if (!keywordsMap || keywordsMap.size === 0) return;

    const messageContent = message.content.toLowerCase();
    for (const [keyword, replies] of keywordsMap.entries()) {
        if (messageContent.includes(keyword)) {
            const reply = replies[Math.floor(Math.random() * replies.length)];
            await message.channel.send(reply);
            client.greetingCooldowns.set(message.channel.id, true);
            setTimeout(() => client.greetingCooldowns.delete(message.channel.id), 5 * 60 * 1000); // 5 min cooldown
            return;
        }
    }
}

async function handleXp(message, db) {
    // All of the transaction-based XP and leveling logic goes here now
    // ... (This function's full code is the 'try/catch' block for the transaction from the previous messageCreate.js file)
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;

        // FIX: Run both systems independently.
        await handleCasualResponse(message, db);
        await handleXp(message, db);
    },
};
